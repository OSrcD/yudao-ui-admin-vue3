<template>
  <el-dialog v-model="visible" title="发起新的视频复刻流水线" width="90%" style="max-width: 600px;" append-to-body>
    <el-form :model="uploadForm" label-position="top" class="custom-form" @submit.prevent>
      <el-form-item label="加载配置预设">
        <el-select v-model="selectedPresetId" placeholder="选择已有预设进行加载" clearable @change="onPresetChange" style="width: 100%">
          <el-option v-for="item in presetList" :key="item.id" :label="item.configName" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="原始对标视频" required>
         <el-upload
          class="video-uploader"
          action="#"
          :auto-upload="false"
          :limit="1"
          :on-change="handleVideoChange"
        >
          <el-icon class="uploader-icon"><VideoCamera /></el-icon>
          <div class="el-upload__text">点击或将视频文件拖拽到此处</div>
        </el-upload>
      </el-form-item>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item label="人物参考图">
             <el-upload action="#" list-type="picture-card" :auto-upload="false" multiple :on-change="handleCharChange">
                <el-icon><Plus /></el-icon>
             </el-upload>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="商品参考图">
             <el-upload action="#" list-type="picture-card" :auto-upload="false" multiple :on-change="handleProdChange">
                <el-icon><Plus /></el-icon>
             </el-upload>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">产品背景配置 (选填)</el-divider>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12">
          <el-form-item label="品牌/产品名称">
            <el-input v-model="uploadForm.brandOrProductName" placeholder="[填写]" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="目标用户群体">
            <el-input v-model="uploadForm.targetAudience" placeholder="[填写]" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="产品核心卖点">
        <el-input v-model="uploadForm.coreSellingPoints" type="textarea" :rows="2" placeholder="[填写，最多3条]" />
      </el-form-item>
      
      <el-form-item label="要解决的痛点" style="margin-bottom: 0px;" />
      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item>
            <el-input v-model="uploadForm.painPoint1" placeholder="痛点一: [填写]" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item>
            <el-input v-model="uploadForm.painPoint2" placeholder="痛点二: [填写]" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item>
            <el-input v-model="uploadForm.painPoint3" placeholder="痛点三: [填写]" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-divider content-position="left">运行偏好设置</el-divider>
      <el-form-item label="任务首发执行引擎 (分析原视频)">
        <el-radio-group v-model="uploadForm.execMode">
          <el-radio-button label="api">调用平台大模型API (全自动处理)</el-radio-button>
          <el-radio-button label="local">本地全自动监听队列 (免费，依赖客户端节点)</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-divider content-position="left">保存为新预设 (可选)</el-divider>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="是否保存">
            <el-switch v-model="saveAsPreset" active-text="是" inactive-text="否" />
          </el-form-item>
        </el-col>
        <el-col :span="18">
          <el-form-item v-if="saveAsPreset" label="预设名称" required>
            <el-input v-model="presetName" placeholder="输入预设名称便于下次查找" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="info" plain :loading="savingPreset" @click="handleSavePresetOnly">仅保存当前配置为预设</el-button>
        <el-button type="primary" :loading="uploading" @click="submitTask">开启流水线</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoCamera, Plus } from '@element-plus/icons-vue'
import { createVideoReproduce } from '@/api/business/videoReproduce'
import { listReproduceConfig, addReproduceConfig } from '@/api/business/reproduceConfig'
import request from '@/config/axios'

const message = useMessage()

const visible = ref(false)
const uploading = ref(false)
const savingPreset = ref(false)

const uploadForm = ref({
  videoFile: null,
  charImages: [],
  productImages: [],
  brandOrProductName: '',
  targetAudience: '',
  coreSellingPoints: '',
  painPoint1: '',
  painPoint2: '',
  painPoint3: '',
  productConfigJson: '',
  execMode: 'api'
})

const presetList = ref([])
const selectedPresetId = ref(null)
const saveAsPreset = ref(false)
const presetName = ref('')

const emit = defineEmits(['success'])

const resetForm = () => {
  uploadForm.value = {
    videoFile: null,
    charImages: [],
    productImages: [],
    brandOrProductName: '',
    targetAudience: '',
    coreSellingPoints: '',
    painPoint1: '',
    painPoint2: '',
    painPoint3: '',
    productConfigJson: '',
    execMode: 'api'
  }
  selectedPresetId.value = null
  saveAsPreset.value = false
  presetName.value = ''
}

const open = () => {
  visible.value = true
  resetForm()
  fetchPresets()
}

defineExpose({ open })

const fetchPresets = async () => {
  const res = await listReproduceConfig({ pageNo: 1, pageSize: 100 })
  presetList.value = res.rows || []
}

const onPresetChange = (configId) => {
  if (!configId) return
  const preset = presetList.value.find(p => String(p.id ?? p.configId) === String(configId))
  if (!preset) return

  try {
    const rawConfig = preset.configData ?? preset.productConfigJson ?? preset.configJson ?? '{}'
    const config = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig
    console.log('[video reproduction preset loaded]', preset, config)

    Object.assign(uploadForm.value, {
      brandOrProductName: config.brandName || config.brandOrProductName || '',
      coreSellingPoints: config.sellingPoints || config.coreSellingPoints || '',
      targetAudience: config.targetAudience || '',
      painPoint1: Array.isArray(config.painPoints) ? (config.painPoints[0] || '') : (config.painPoint1 || ''),
      painPoint2: Array.isArray(config.painPoints) ? (config.painPoints[1] || '') : (config.painPoint2 || ''),
      painPoint3: Array.isArray(config.painPoints) ? (config.painPoints[2] || '') : (config.painPoint3 || '')
    })

    selectedPresetId.value = preset.id ?? preset.configId ?? configId

    if (preset.charImages?.length || preset.productImages?.length) {
      message.info('已加载预设文字配置，参考图片需要根据当前任务重新确认')
    }
  } catch (e) {
    console.error('解析预设配置失败', e)
    message.error('预设配置解析失败，请检查预设数据格式')
  }
}

const handleVideoChange = (file) => { uploadForm.value.videoFile = file.raw }
const handleCharChange = (file, list) => { uploadForm.value.charImages = list.map(i => i.raw) }
const handleProdChange = (file, list) => { uploadForm.value.productImages = list.map(i => i.raw) }

const uploadFilesHelper = async (files) => {
  if (!files || files.length === 0) return []
  const urls = []
  for (const file of files) {
    if (typeof file === 'string') {
      urls.push(file)
      continue
    }
    const formData = new FormData()
    formData.append('file', file)
    // Yudao project likely has an upload endpoint, using infra/file/upload
    const res = await request.upload({
      url: '/infra/file/upload',
      data: formData
    })
    urls.push((res as any).data?.url || (res as any).url)
  }
  return urls
}

const handleSavePresetOnly = async () => {
  if (!presetName.value) {
    if (uploadForm.value.brandOrProductName) {
      presetName.value = uploadForm.value.brandOrProductName + ' - 复刻预设'
    } else {
      return message.warning('请输入预设名称或填写品牌名称以便自动命名')
    }
  }

  savingPreset.value = true
  try {
    const charUrls = await uploadFilesHelper(uploadForm.value.charImages)
    const prodUrls = await uploadFilesHelper(uploadForm.value.productImages)

    const configObj = {
      brandName: uploadForm.value.brandOrProductName,
      sellingPoints: uploadForm.value.coreSellingPoints,
      targetAudience: uploadForm.value.targetAudience,
      painPoints: [uploadForm.value.painPoint1, uploadForm.value.painPoint2, uploadForm.value.painPoint3]
    }

    await addReproduceConfig({
      configName: presetName.value,
      configData: JSON.stringify(configObj),
      charImages: charUrls,
      productImages: prodUrls,
      remark: '手动独立保存的预设'
    })

    message.success('配置预设已独立保存成功')
    await fetchPresets()
    saveAsPreset.value = false
  } finally {
    savingPreset.value = false
  }
}

const submitTask = async () => {
  if (!uploadForm.value.videoFile) return message.warning('请选择对标视频')
  
  const configObj = {
    brandName: uploadForm.value.brandOrProductName,
    sellingPoints: uploadForm.value.coreSellingPoints,
    targetAudience: uploadForm.value.targetAudience,
    painPoints: [uploadForm.value.painPoint1, uploadForm.value.painPoint2, uploadForm.value.painPoint3]
  }
  uploadForm.value.productConfigJson = JSON.stringify(configObj)

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('videoFile', uploadForm.value.videoFile)
    formData.append('productConfigJson', uploadForm.value.productConfigJson)
    formData.append('execMode', uploadForm.value.execMode)
    uploadForm.value.charImages.forEach(i => formData.append('charImages', i))
    uploadForm.value.productImages.forEach(i => formData.append('productImages', i))
    
    const task = await createVideoReproduce(formData)
    
    if (saveAsPreset.value && presetName.value) {
      try {
        await addReproduceConfig({
          configName: presetName.value,
          configData: JSON.stringify(configObj),
          charImages: task.charImages,
          productImages: task.productImages,
          remark: '从任务 ' + (task.taskId || '').toString().slice(-6) + ' 导出'
        })
        message.success('完整配置已保存为预设')
      } catch (e) {
        console.error('保存预设失败', e)
      }
    }

    message.success('任务启动成功')
    visible.value = false
    emit('success')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.video-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  padding: 40px;
  text-align: center;
}

.video-uploader:hover {
  border-color: var(--el-color-primary);
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
  margin-bottom: 10px;
}
</style>
