<template>
  <div class="puppeteer-node-config">
    <el-form label-position="top" size="small" class="compact-form">
      <div class="form-row">
        <el-form-item label="大模型" class="flex-1">
          <el-select v-model="formData.modelType" placeholder="选择模型" @change="handleChange">
            <el-option label="Gemini" value="gemini" />
            <el-option label="ChatGPT" value="chatgpt" />
            <el-option label="Claude" value="claude" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="执行动作" class="flex-1">
          <el-select v-model="formData.actionType" placeholder="选择动作" @change="handleChange">
            <el-option label="多模态视觉" value="vision" />
            <el-option label="生成图片" value="image" />
            <el-option label="生成视频" value="video" />
          </el-select>
        </el-form-item>
      </div>

      <div class="form-row">
        <el-form-item label="执行模式" class="flex-1">
          <el-select v-model="formData.executionMode" placeholder="选择模式" @change="handleChange">
            <el-option label="Fast 模式" value="fast" />
            <el-option label="Pro 模式" value="pro" />
            <el-option label="Thinking 模式" value="thinking" />
          </el-select>
        </el-form-item>

        <el-form-item label="开启新对话" class="flex-1">
          <div class="switch-container">
            <el-switch v-model="formData.newChat" @change="handleChange" />
            <span class="switch-tip">清空上下文</span>
          </div>
        </el-form-item>
      </div>

      <el-divider border-style="dashed" />

      <el-form-item label="提示词 (Prompt)">
        <el-input 
          v-model="formData.prompt" 
          type="textarea" 
          placeholder="请输入提示词，支持 {{变量}} 引用" 
          :rows="4"
          @change="handleChange"
        />
      </el-form-item>

      <el-form-item label="图片参考素材">
        <UploadImgs v-model="formData.imageUrls" @update:modelValue="handleChange" />
        <div class="item-tip">支持手动上传或通过 {{变量}} 传入图片 URL。</div>
      </el-form-item>

      <el-form-item label="音视频/文档素材">
        <UploadFile 
          v-model="formData.videoUrls" 
          :fileType="['mp3', 'wav', 'aac', 'mp4', 'avi', 'mov', 'webm', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'pdf']"
          :fileSize="500"
          :limit="5"
          @update:modelValue="handleChange" 
        />
        <div class="item-tip">支持音视频及各类文档，支持 {{变量}} 传入。</div>
        
        <!-- 预览区域 -->
        <div v-if="fileUrlList.length > 0" class="file-preview-container">
          <div v-for="(url, index) in fileUrlList" :key="index" class="preview-item">
            <template v-if="!url.includes('{{')">
              <div v-if="isVideo(url)" class="video-preview-box">
                <div class="preview-label">视频预览:</div>
                <video :src="url" controls class="media-element"></video>
              </div>
              <div v-else-if="isAudio(url)" class="audio-preview-box">
                <div class="preview-label">音频预览:</div>
                <audio :src="url" controls class="media-element"></audio>
              </div>
            </template>
          </div>
        </div>
      </el-form-item>
    </el-form>
  </div>
</template>


<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import UploadImgs from '@/components/UploadFile/src/UploadImgs.vue'
import UploadFile from '@/components/UploadFile/src/UploadFile.vue'


const props = defineProps<{
  node: any
  onUpdate: (data: any) => void
}>()

const formData = ref({
  modelType: 'gemini',
  actionType: 'vision',
  executionMode: 'fast',
  prompt: '',
  imageUrls: '', // 可以是逗号分隔的字符串或数组
  videoUrls: '',
  newChat: false
})

onMounted(() => {
  if (props.node?.data) {
    formData.value = {
      modelType: props.node.data.modelType || 'gemini',
      actionType: props.node.data.actionType || 'vision',
      executionMode: props.node.data.executionMode || 'fast',
      prompt: props.node.data.prompt || '',
      imageUrls: props.node.data.imageUrls || '',
      videoUrls: props.node.data.videoUrls || '',
      newChat: props.node.data.newChat || false
    }
  }
})

// 监听 formData 变化并回传给工作流引擎
const handleChange = () => {
  props.onUpdate(formData.value)
}

// 深度监听以防 UploadImgs 内部更新未触发 @change
watch(formData, () => {
  handleChange()
}, { deep: true })

/** 预览相关的逻辑 */
const fileUrlList = computed(() => {
  if (!formData.value.videoUrls) return []
  if (Array.isArray(formData.value.videoUrls)) return formData.value.videoUrls
  return formData.value.videoUrls.split(',').filter(url => !!url)
})

const isVideo = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext)
}

const isAudio = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase() || ''
  return ['mp3', 'wav', 'aac', 'ogg', 'm4a'].includes(ext)
}

</script>

<style scoped>
.puppeteer-node-config {
  padding: 12px;
  background-color: #fff;
}

.compact-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.compact-form :deep(.el-form-item__label) {
  font-weight: 600;
  padding-bottom: 4px !important;
  color: #333;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.flex-1 {
  flex: 1;
}

.switch-container {
  display: flex;
  align-items: center;
  height: 32px;
  gap: 8px;
}

.switch-tip {
  font-size: 12px;
  color: #666;
}

.item-tip {
  font-size: 11px;
  color: #999;
  line-height: 1.4;
  margin-top: 4px;
}

.file-preview-container {
  margin-top: 12px;
  border: 1px solid #ebeef5;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.preview-item {
  margin-bottom: 12px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-size: 11px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 6px;
}

.media-element {
  width: 100%;
  max-height: 220px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  background: #000;
}

.audio-preview-box .media-element {
  background: transparent;
  box-shadow: none;
}

:deep(.el-divider--horizontal) {
  margin: 16px 0;
}
</style>


