<template>
  <Dialog v-model="dialogVisible" :title="dialogTitle" width="700px">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="应用标识" prop="appCode">
            <el-input v-model="formData.appCode" placeholder="如 autoft" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="平台类型" prop="platform">
            <el-select v-model="formData.platform" placeholder="请选择平台">
              <el-option label="Android" value="android" />
              <el-option label="iOS" value="ios" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="版本名称" prop="versionName">
            <el-input v-model="formData.versionName" placeholder="例如 2.1.2" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="构建版本号" prop="versionCode">
            <el-input-number v-model="formData.versionCode" :min="1" placeholder="数字，如 2" class="!w-full" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="最低兼容版本" prop="minVersionCode">
            <el-input-number v-model="formData.minVersionCode" :min="1" placeholder="低于此版本将强制更新" class="!w-full" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="强制更新" prop="forceUpdate">
            <el-switch v-model="formData.forceUpdate" active-text="强制更新" inactive-text="软更新" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="上传 APK 包">
        <el-upload
          ref="apkUploadRef"
          :action="uploadUrl"
          :http-request="handleApkHttpRequest"
          :before-upload="handleApkBeforeUpload"
          :show-file-list="false"
          :accept="'.apk'"
          :disabled="formLoading || isCalculatingHash"
        >
          <div class="flex items-center gap-10px">
            <el-button type="primary" :loading="isUploadingApk || isCalculatingHash">
              <Icon icon="ep:upload-filled" class="mr-5px" />
              {{ isCalculatingHash ? '正在计算 SHA256...' : (isUploadingApk ? `上传中 (${uploadPercent}%)` : '选取并上传 APK') }}
            </el-button>
            <span v-if="formData.downloadUrl" class="text-13px text-green-600 flex items-center">
              <Icon icon="ep:circle-check-filled" class="mr-3px" /> 已就绪
            </span>
          </div>
          <template #tip>
            <div class="text-12px text-gray-400 mt-4px leading-relaxed">
              选取 APK 后，系统将<b>自动计算 SHA-256 校验码</b>并<b>填入安装包大小</b>
            </div>
          </template>
        </el-upload>
      </el-form-item>

      <el-form-item label="应用内升级链接" prop="downloadUrl">
        <el-input v-model="formData.downloadUrl" placeholder="http://.../app-release.apk（对应弹窗【立即升级】使用的安装包直链）" clearable />
      </el-form-item>

      <el-form-item label="浏览器下载链接" prop="browserDownloadUrl">
        <el-input
          v-model="formData.browserDownloadUrl"
          placeholder="对应弹窗【通过浏览器下载】；留空则直接使用上方直链，也可配置第三方网盘或分发链接"
          clearable
        >
          <template #append>
            <el-button
              type="primary"
              link
              :disabled="!formData.downloadUrl"
              @click="formData.browserDownloadUrl = formData.downloadUrl"
            >
              <Icon icon="ep:copy-document" class="mr-3px" /> 一键设为本包直链
            </el-button>
          </template>
        </el-input>
        <div class="text-12px text-gray-400 mt-4px leading-relaxed">
          💡 对应客户端弹窗中提供的两个选择：<b>【立即升级】</b>使用上方安装包直链在应用内下载；<b>【通过浏览器下载】</b>可直接设置为本应用下载链接（点击右侧一键设为本包直链），或自定义第三方网盘/分发链接。
        </div>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="安装包大小" prop="fileSize">
            <el-input v-model="formData.fileSize" placeholder="如 127MB" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-radio-group v-model="formData.status">
              <el-radio :value="0">开启</el-radio>
              <el-radio :value="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="SHA256 校验" prop="fileSha256">
        <el-input
          v-model="formData.fileSha256"
          placeholder="用于 OTA 升级校验完整性（64位十六进制）"
          clearable
        >
          <template #append>
            <div class="flex items-center">
              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                :on-change="handleQuickApkSha256"
                :accept="'.apk'"
                class="inline-block"
              >
                <el-button type="primary" link :loading="isCalculatingHash">
                  <Icon icon="ep:lightning" class="mr-3px" /> 选本地 APK 算
                </el-button>
              </el-upload>
              <el-divider direction="vertical" class="mx-6px" />
              <el-upload
                :show-file-list="false"
                :auto-upload="false"
                :on-change="handleHashFileImport"
                :accept="'.sha1,.sha256,.txt'"
                class="inline-block"
              >
                <el-button type="primary" link>
                  <Icon icon="ep:document" class="mr-3px" /> 选哈希文件
                </el-button>
              </el-upload>
            </div>
          </template>
        </el-input>
        <div class="text-12px text-gray-400 mt-4px leading-relaxed">
          💡 <b>提示</b>：<code>ota_update</code> 插件严格要求 <b>64 位 SHA-256</b>。如果本地只有 Flutter 生成的 40 位 <code>.sha1</code> 文件，请直接点击【选本地 APK 算】，浏览器本地毫秒级算出真实的 SHA-256！
        </div>
      </el-form-item>

      <el-form-item label="更新说明" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="4"
          placeholder="1. 修复已知异常&#10;2. 优化保活服务&#10;3. 支持 OTA 全量升级"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading || isUploadingApk || isCalculatingHash" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { useMessage } from '@/hooks/web/useMessage'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import * as AppVersionApi from '@/api/infra/appVersion'

defineOptions({ name: 'AppVersionForm' })

const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const isCalculatingHash = ref(false)
const isUploadingApk = ref(false)
const uploadPercent = ref(0)

const { uploadUrl, httpRequest } = useUpload()

const formData = ref<AppVersionApi.AppVersionVO>({
  id: undefined,
  appCode: 'autoft',
  platform: 'android',
  versionName: '',
  versionCode: 1,
  minVersionCode: 1,
  downloadUrl: '',
  browserDownloadUrl: '',
  fileSize: '',
  fileSha256: '',
  description: '',
  forceUpdate: false,
  status: 0
})

const formRules = reactive({
  appCode: [{ required: true, message: '应用标识不能为空', trigger: 'blur' }],
  platform: [{ required: true, message: '平台类型不能为空', trigger: 'change' }],
  versionName: [{ required: true, message: '版本名称不能为空', trigger: 'blur' }],
  versionCode: [{ required: true, message: '构建版本号不能为空', trigger: 'blur' }],
  minVersionCode: [{ required: true, message: '最低兼容版本号不能为空', trigger: 'blur' }],
  downloadUrl: [{ required: true, message: '下载直链不能为空', trigger: 'blur' }]
})

const formRef = ref()

/**
 * 利用浏览器原生 Web Crypto API 计算文件的 SHA-256
 */
const computeSha256 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * APK 上传前拦截：提取大小并自动计算 SHA-256
 */
const handleApkBeforeUpload = async (file: File) => {
  if (!file.name.toLowerCase().endsWith('.apk')) {
    message.error('请选择 .apk 文件')
    return false
  }
  // 1. 自动填包体大小
  formData.value.fileSize = (file.size / (1024 * 1024)).toFixed(1) + 'MB'
  // 2. 本地计算 SHA-256
  isCalculatingHash.value = true
  try {
    const sha256 = await computeSha256(file)
    formData.value.fileSha256 = sha256
  } catch (e) {
    console.error('计算 SHA-256 异常', e)
  } finally {
    isCalculatingHash.value = false
  }
  return true
}

/**
 * APK 上传请求
 */
const handleApkHttpRequest = async (options: any) => {
  isUploadingApk.value = true
  uploadPercent.value = 0
  const originalOnProgress = options.onProgress
  options.onProgress = (evt: any) => {
    uploadPercent.value = Math.floor(evt.percent || 0)
    if (originalOnProgress) originalOnProgress(evt)
  }

  try {
    const res: any = await httpRequest(options)
    formData.value.downloadUrl = res.data
    message.success('APK 上传成功，大小与 SHA-256 已自动就绪！')
  } catch (e: any) {
    message.error('APK 上传失败: ' + (e.message || e))
  } finally {
    isUploadingApk.value = false
  }
}

/**
 * 用户纯计算本地 APK 的 SHA-256（不上传文件，适合已填好链接只需补哈希值的场景）
 */
const handleQuickApkSha256 = async (uploadFile: any) => {
  const file = uploadFile.raw as File
  if (!file) return
  formData.value.fileSize = (file.size / (1024 * 1024)).toFixed(1) + 'MB'
  isCalculatingHash.value = true
  try {
    const sha256 = await computeSha256(file)
    formData.value.fileSha256 = sha256
    message.success('已自动根据所选 APK 提取大小并计算出 SHA-256！')
  } catch (e) {
    message.error('计算失败: ' + e)
  } finally {
    isCalculatingHash.value = false
  }
}

/**
 * 导入哈希文件（如用户文件夹下的 .sha1 或 .sha256 文本文件）
 */
const handleHashFileImport = async (uploadFile: any) => {
  const file = uploadFile.raw as File
  if (!file) return
  try {
    const content = (await file.text()).trim()
    const match = content.match(/[a-fA-F0-9]{40,64}/)
    if (!match) {
      message.error('未在所选文件中找到有效的十六进制哈希值')
      return
    }
    const hash = match[0].toLowerCase()
    if (hash.length === 40) {
      formData.value.fileSha256 = hash
      message.warning(
        '已填入哈希值。注意：此文件是 SHA-1（40位），ota_update 插件要求 64 位 SHA-256。若升级报校验错误，建议点击【选本地 APK 算】秒算真实的 SHA-256！'
      )
    } else if (hash.length === 64) {
      formData.value.fileSha256 = hash
      message.success('已成功填入 64 位 SHA-256 校验码！')
    } else {
      formData.value.fileSha256 = hash
    }
  } catch (e) {
    message.error('解析哈希文件失败: ' + e)
  }
}

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = type === 'create' ? '发布新版本' : '修改版本'
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      formData.value = await AppVersionApi.getAppVersion(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = { ...formData.value }
    if (formType.value === 'create') {
      await AppVersionApi.createAppVersion(data)
      message.success('版本发布成功')
    } else {
      await AppVersionApi.updateAppVersion(data)
      message.success('版本更新成功')
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    appCode: 'autoft',
    platform: 'android',
    versionName: '',
    versionCode: 1,
    minVersionCode: 1,
    downloadUrl: '',
    browserDownloadUrl: '',
    fileSize: '',
    fileSha256: '',
    description: '',
    forceUpdate: false,
    status: 0
  }
  formRef.value?.resetFields()
}
</script>
