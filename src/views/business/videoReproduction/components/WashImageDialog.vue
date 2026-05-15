<template>
  <el-dialog v-model="visible" title="洗图工作台 (Nano Banana)" width="90%" style="max-width: 650px;" append-to-body>
    <el-form :model="washForm" label-position="top" class="custom-form" @submit.prevent>
      <el-form-item label="任务执行模式">
        <el-radio-group v-model="washForm.execMode">
          <el-radio label="api">API 模式 (扣费极速)</el-radio>
          <el-radio label="local">本地机器模式 (排队免费)</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="创作模式">
        <el-radio-group v-model="washForm.washMode" style="display: flex; flex-direction: column; align-items: flex-start; gap: 10px;">
          <el-radio label="original">原图 - 智能融合</el-radio>
          <el-radio label="restyled">复刻图 - 二次加工</el-radio>
          <el-radio label="original_pure">原图 - 纯文生图</el-radio>
          <el-radio label="restyled_pure">复刻图 - 纯文生图</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="自定义提示词 (从模板加载或手动输入)">
        <div v-if="washPromptTemplates.length > 0" class="prompt-tag-list">
          <el-tag
            v-for="tag in washPromptTemplates"
            :key="tag.promptId ?? tag.id"
            class="p-tag"
            @click="washForm.customPrompt = tag.template"
            effect="plain"
            closable
            @close="handleDeleteWashPrompt(tag)"
          >
            {{ tag.template.slice(0, 15) }}{{ tag.template.length > 15 ? '...' : '' }}
          </el-tag>
        </div>
        <el-input
          v-model="washForm.customPrompt"
          type="textarea"
          :rows="3"
          placeholder="追加特定的洗图要求，例如改变风格、修改服装等..."
        />
        <div style="margin-top: 8px; display: flex; justify-content: flex-end;">
          <el-button type="success" size="small" link icon="Plus" @click="handleSaveWashPrompt" :disabled="!washForm.customPrompt">将其保存为提示词模板</el-button>
        </div>
      </el-form-item>

      <el-form-item label="素材库参考图 (可选，点击选择，可多选)">
        <div class="material-picker-list" v-loading="loadingMaterials">
          <div
            v-for="item in materialList"
            :key="item.id"
            class="material-picker-item"
            :class="{ selected: materialSelection.includes(item.materialUrl) }"
            @click="toggleMaterialSelection(item.materialUrl)"
          >
            <el-image :src="item.materialUrl" fit="cover" class="mp-img"/>
            <div class="selected-overlay" v-if="materialSelection.includes(item.materialUrl)">
              <el-icon><Check /></el-icon>
            </div>
          </div>
          <el-empty v-if="materialList.length === 0" description="暂无素材" />
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="washing" @click="submitWash">开始生成</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Check } from '@element-plus/icons-vue'
import { washImage, washAllImages } from '@/api/business/videoReproduce'
import { listMaterial } from '@/api/business/material'
import { getPromptTemplatePage, createPromptTemplate, deletePromptTemplate } from '@/api/business/promptTemplate'
import { ElMessageBox } from 'element-plus'

const message = useMessage()

const visible = ref(false)
const washing = ref(false)
const washType = ref('single') // single or all
const washTargetFrameId = ref<number | null>(null)
const washTaskId = ref<number | null>(null)

const DEFAULT_WASH_FORM = {
  execMode: 'api',
  washMode: 'original',
  customPrompt: ''
}

const washForm = ref({ ...DEFAULT_WASH_FORM })

const washPromptTemplates = ref<any[]>([])
const materialList = ref<any[]>([])
const loadingMaterials = ref(false)
const materialSelection = ref<string[]>([])

const emit = defineEmits(['success'])

const resetWashForm = () => {
  washForm.value = { ...DEFAULT_WASH_FORM }
  materialSelection.value = []
}

const open = (type: string, id: number) => {
  washType.value = type
  if (type === 'single') {
    washTargetFrameId.value = id
  } else {
    washTaskId.value = id
  }

  resetWashForm()
  visible.value = true

  fetchMaterials()
  fetchWashPrompts()
}

defineExpose({ open })

const fetchWashPrompts = async () => {
  const res = await getPromptTemplatePage({ templateType: 11, pageNo: 1, pageSize: 50 })
  washPromptTemplates.value = res.rows
}

const handleSaveWashPrompt = async () => {
  if (!washForm.value.customPrompt) return
  try {
    await createPromptTemplate({
      template: washForm.value.customPrompt,
      templateType: 11,
      status: 1,
      remark: '洗图工作台保存'
    })
    message.success('已保存到提示词模板')
    fetchWashPrompts()
  } catch (e) {}
}

const handleDeleteWashPrompt = async (tag: any) => {
  try {
    await ElMessageBox.confirm('确定要删除此提示词模板吗？', '警告', { type: 'warning' })
    await deletePromptTemplate(tag.promptId ?? tag.id)
    message.success('已删除')
    fetchWashPrompts()
  } catch (e) {}
}

const fetchMaterials = async () => {
  loadingMaterials.value = true
  try {
    const res = await listMaterial({ pageNo: 1, pageSize: 50 })
    materialList.value = res.rows
  } catch(e) {
    message.error('获取素材库失败')
  } finally {
    loadingMaterials.value = false
  }
}

const toggleMaterialSelection = (url: string) => {
  const idx = materialSelection.value.indexOf(url)
  if (idx > -1) {
    materialSelection.value.splice(idx, 1)
  } else {
    materialSelection.value.push(url)
  }
}

const submitWash = async () => {
  const params = {
    execMode: washForm.value.execMode,
    washMode: washForm.value.washMode,
    customPrompt: washForm.value.customPrompt,
    refImages: materialSelection.value
  }

  washing.value = true
  try {
    if (washType.value === 'single' && washTargetFrameId.value) {
      await washImage(washTargetFrameId.value, params)
      message.success('洗图请求已受理')
    } else if (washTaskId.value) {
      await washAllImages(washTaskId.value, params)
      message.success('一键批量洗图已受理')
    }
    visible.value = false
    emit('success')
  } finally {
    washing.value = false
  }
}

</script>

<style scoped>
.prompt-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.p-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.p-tag:hover {
  background-color: var(--el-color-primary-light-8);
  border-color: var(--el-color-primary);
}

.material-picker-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  max-height: 260px;
  overflow-y: auto;
  padding: 8px 4px;
}

.material-picker-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.material-picker-item.selected {
  border-color: var(--el-color-primary);
}

.mp-img {
  width: 100%;
  height: 100%;
  display: block;
}

.selected-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(64, 158, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 32px;
}
</style>
