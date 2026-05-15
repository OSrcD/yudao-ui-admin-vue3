<template>
  <div class="app-container">
    <el-card class="banner-card" shadow="never">
      <div class="banner-content">
        <h2 class="title">
          <Icon icon="ep:setting" class="mr-8px" style="color:#8b5cf6" />复刻预设管理
        </h2>
        <p class="subtitle">管理您的产品背景、人物素材及品牌配置，在发起视频复刻时快速加载。</p>
      </div>
      <div class="banner-actions">
        <el-button 
          type="primary" 
          @click="handleAdd"
          v-hasPermi="['business:reproduce-config:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新建预设
        </el-button>
        <el-button type="info" plain @click="getList">
          <Icon icon="ep:refresh" class="mr-5px" /> 刷新
        </el-button>
      </div>
    </el-card>

    <div v-loading="loading" class="preset-grid">
      <el-card v-for="item in configList" :key="item.id" class="preset-card animate__animated animate__fadeIn" shadow="hover">
        <div class="card-header">
          <span class="preset-name">{{ item.configName }}</span>
          <div class="actions">
            <el-button 
              type="primary" 
              link 
              @click="handleUpdate(item)"
              v-hasPermi="['business:reproduce-config:update']"
            >
              <Icon icon="ep:edit" />
            </el-button>
            <el-button 
              type="danger" 
              link 
              @click="handleDelete(item)"
              v-hasPermi="['business:reproduce-config:delete']"
            >
              <Icon icon="ep:delete" />
            </el-button>
          </div>
        </div>
        
        <div class="card-body">
          <div class="config-summary">
            <div class="summary-item">
              <span class="label">品牌/名称:</span>
              <span class="value">{{ parseConfig(item.productConfigJson).brandName || '未指定' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">卖点:</span>
              <span class="value truncate">{{ parseConfig(item.productConfigJson).sellingPoints || '未填写' }}</span>
            </div>
          </div>
          
          <div class="image-preview">
            <div class="img-group">
              <span class="g-label">人物参考</span>
              <div class="img-list">
                <el-image v-for="(img, index) in parseImages(item.charImages).slice(0, 3)" :key="index" :src="img" fit="cover" class="preview-img" :preview-src-list="parseImages(item.charImages)"/>
                <div v-if="parseImages(item.charImages).length > 3" class="more-count">+{{ parseImages(item.charImages).length - 3 }}</div>
                <div v-if="parseImages(item.charImages).length === 0" class="no-img">无</div>
              </div>
            </div>
            <div class="img-group">
              <span class="g-label">商品参考</span>
              <div class="img-list">
                <el-image v-for="(img, index) in parseImages(item.productImages).slice(0, 3)" :key="index" :src="img" fit="cover" class="preview-img" :preview-src-list="parseImages(item.productImages)"/>
                <div v-if="parseImages(item.productImages).length > 3" class="more-count">+{{ parseImages(item.productImages).length - 3 }}</div>
                <div v-if="parseImages(item.productImages).length === 0" class="no-img">无</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-footer">
          <span class="time">
            <Icon icon="ep:calendar" class="mr-4px" /> {{ formatDate(item.createTime) }}
          </span>
          <el-button type="primary" size="small" plain round @click="usePreset(item)">去复刻</el-button>
        </div>
      </el-card>
      
      <el-empty v-if="configList.length === 0" description="暂无预设配置" />
    </div>

    <!-- 添加或修改对话框 -->
    <el-dialog v-model="open" :title="title" width="650px" append-to-body>
      <el-form ref="configRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="预设名称" prop="configName">
          <el-input v-model="form.configName" placeholder="如：小米20w充电头-旗舰店预设" />
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="品牌/产品名称">
              <el-input v-model="form.brandName" placeholder="[填写]" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标用户群体">
              <el-input v-model="form.targetAudience" placeholder="[填写]" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="产品核心卖点">
          <el-input v-model="form.sellingPoints" type="textarea" :rows="2" placeholder="[填写，最多3条]" />
        </el-form-item>
        
        <el-form-item label="要解决的痛点" style="margin-bottom: 0px;" />
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item>
              <el-input v-model="form.painPoint1" placeholder="痛点一" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-input v-model="form.painPoint2" placeholder="痛点二" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-input v-model="form.painPoint3" placeholder="痛点三" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="人物参考图">
              <el-upload
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                multiple
                v-model:file-list="charFileList"
                :on-preview="handleImagePreview"
              >
                <Icon icon="ep:plus" />
              </el-upload>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品参考图">
              <el-upload
                action="#"
                list-type="picture-card"
                :auto-upload="false"
                multiple
                v-model:file-list="prodFileList"
                :on-preview="handleImagePreview"
              >
                <Icon icon="ep:plus" />
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button :loading="buttonLoading" type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="imagePreviewVisible">
      <img :src="imagePreviewUrl" alt="Preview Image" style="width: 100%"/>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listReproduceConfig, getReproduceConfig, delReproduceConfig, addReproduceConfig, updateReproduceConfig } from "@/api/business/reproduceConfig"
import request from '@/config/axios'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'ReproduceConfig' })

const router = useRouter()
const message = useMessage()
const { t } = useI18n()

const configList = ref<any[]>([])
const loading = ref(true)
const buttonLoading = ref(false)
const open = ref(false)
const title = ref("")

const charFileList = ref<any[]>([])
const prodFileList = ref<any[]>([])

const imagePreviewVisible = ref(false)
const imagePreviewUrl = ref('')

const form = ref({
  configId: undefined,
  configName: undefined,
  brandName: '',
  targetAudience: '',
  sellingPoints: '',
  painPoint1: '',
  painPoint2: '',
  painPoint3: '',
  charImages: undefined,
  productImages: undefined,
  remark: undefined
})

const configRef = ref()

const rules = {
  configName: [{ required: true, message: "预设名称不能为空", trigger: "blur" }]
}

const getList = async () => {
  loading.value = true
  try {
    const res = await listReproduceConfig({ pageNo: 1, pageSize: 100 })
    configList.value = res.rows
  } finally {
    loading.value = false
  }
}

const parseConfig = (config: any) => {
  if (!config) return {}
  if (typeof config === 'object') return config
  try {
    return JSON.parse(config)
  } catch (e) {
    return {}
  }
}

const parseImages = (images: any) => {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    return JSON.parse(images)
  } catch (e) {
    return []
  }
}

const handleAdd = () => {
  reset()
  open.value = true
  title.value = "新建视频复刻预设"
}

const handleUpdate = async (row: any) => {
  reset()
  const res = await getReproduceConfig(row.id)
  const data = res
  const config = parseConfig(data.productConfigJson)
  
  form.value = {
    ...data,
    brandName: config.brandName || '',
    targetAudience: config.targetAudience || '',
    sellingPoints: config.sellingPoints || '',
    painPoint1: config.painPoints ? config.painPoints[0] : '',
    painPoint2: config.painPoints ? config.painPoints[1] : '',
    painPoint3: config.painPoints ? config.painPoints[2] : ''
  }
  
  // 处理图片回显
  charFileList.value = parseImages(data.charImages).map((url: string) => ({ url }))
  prodFileList.value = parseImages(data.productImages).map((url: string) => ({ url }))
  
  open.value = true
  title.value = "修改视频复刻预设"
}

const reset = () => {
  form.value = {
    id: undefined,
    configName: undefined,
    brandName: '',
    targetAudience: '',
    sellingPoints: '',
    painPoint1: '',
    painPoint2: '',
    painPoint3: '',
    charImages: undefined,
    productImages: undefined,
    remark: undefined
  }
  charFileList.value = []
  prodFileList.value = []
}

const handleImagePreview = (file: any) => {
  imagePreviewUrl.value = file.url
  imagePreviewVisible.value = true
}

const uploadFilesHelper = async (fileList: any[]) => {
  const urls = []
  for (const file of fileList) {
    if (file.raw) {
      const formData = new FormData()
      formData.append('file', file.raw)
      const res = await request.upload({
        url: '/infra/file/upload',
        data: formData
      })
      urls.push(res.url)
    } else if (file.url) {
      urls.push(file.url)
    }
  }
  return urls
}

const submitForm = async () => {
  if (!form.value.configName) return message.warning('预设名称不能为空')
  
  buttonLoading.value = true
  try {
    // 1. 上传图片
    const charUrls = await uploadFilesHelper(charFileList.value)
    const prodUrls = await uploadFilesHelper(prodFileList.value)
    
    // 2. 组装配置
    const configObj = {
      brandName: form.value.brandName,
      targetAudience: form.value.targetAudience,
      sellingPoints: form.value.sellingPoints,
      painPoints: [form.value.painPoint1, form.value.painPoint2, form.value.painPoint3]
    }
    
    const data = {
      id: form.value.id,
      configName: form.value.configName,
      productConfigJson: configObj,
      charImages: charUrls,
      productImages: prodUrls,
      remark: form.value.remark
    }
    
    if (form.value.id !== undefined) {
      await updateReproduceConfig(data)
      message.success("修改成功")
    } else {
      await addReproduceConfig(data)
      message.success("新增成功")
    }
    open.value = false
    getList()
  } finally {
    buttonLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  try {
    await message.confirm('确定要删除 "' + row.configName + '" 吗？')
    await delReproduceConfig(row.id)
    message.success('删除成功')
    getList()
  } catch (e) {}
}

const usePreset = (row: any) => {
  router.push({
    path: '/business/videoReproduction',
    query: { presetId: row.id }
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.banner-card {
  margin-bottom: 24px;
  background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
  border: none;
}

.banner-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-content .title {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #4c1d95;
  display: flex;
  align-items: center;
}

.banner-content .subtitle {
  margin: 0;
  color: #6b21a8;
  opacity: 0.8;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.preset-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(139, 92, 246, 0.1);
}

.preset-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.3);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preset-name {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
}

.config-summary {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 13px;
}

.summary-item .label {
  color: #6b7280;
  white-space: nowrap;
}

.summary-item .value {
  color: #111827;
  font-weight: 500;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.img-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.g-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.img-list {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-img {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.more-count {
  width: 32px;
  height: 32px;
  background: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6b7280;
  font-weight: bold;
}

.no-img {
  font-size: 12px;
  color: #d1d5db;
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.time {
  font-size: 12px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
}

.truncate {
  max-width: 200px;
}
</style>
