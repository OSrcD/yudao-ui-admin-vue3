<template>
  <el-dialog v-model="visible" title="手动捕捉关键帧" width="90%" style="max-width: 800px;" append-to-body destroy-on-close>
    <div v-if="captureVideoUrl" style="margin-bottom: 20px; text-align: center;">
      <video ref="videoRef" :src="captureVideoUrl" style="width: 100%; max-height: 450px; border-radius: 8px; background: #000; cursor: pointer;" @loadedmetadata="onVideoLoaded" @click="togglePlay" @timeupdate="onTimeUpdate"></video>
      <div style="margin-top: 10px; display: flex; justify-content: center; align-items: center; gap: 15px;">
        <el-button @click="togglePlay" size="small" type="primary" plain round>
          <el-icon style="margin-right: 4px"><VideoPlay /></el-icon> 播放 / 暂停
        </el-button>
        <div class="current-pos">
          当前位置: {{ captureTime.toFixed(3) }}s
        </div>
      </div>
    </div>
    <div style="padding: 0 20px;">
      <el-slider v-model="captureTime" :max="videoDuration" :step="0.001" @input="seekToTime" />
      <div class="tip">
        请拖动上方滑块，或直接点击视频画面定位到您认为最准确的一帧作为素材。
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">确认截取并替换</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoPlay } from '@element-plus/icons-vue'
import { recaptureFrame } from '@/api/business/videoReproduce'

const visible = ref(false)
const submitting = ref(false)
const frame = ref<any>(null)
const captureVideoUrl = ref('')
const videoRef = ref<HTMLVideoElement>()
const videoDuration = ref(0)
const captureTime = ref(0)
const playing = ref(false)

const emit = defineEmits(['success'])
const message = useMessage()

const open = (f: any, originalVideoUrl: string) => {
  frame.value = f
  captureVideoUrl.value = originalVideoUrl
  captureTime.value = parseFloat(f.timestampSec) || 0
  visible.value = true
}

defineExpose({ open })

const togglePlay = () => {
  if (!videoRef.value) return
  if (videoRef.value.paused) {
    videoRef.value.play()
    playing.value = true
  } else {
    videoRef.value.pause()
    playing.value = false
  }
}

const onVideoLoaded = (e: any) => {
  videoDuration.value = e.target.duration
  if (videoRef.value) {
    videoRef.value.currentTime = captureTime.value
  }
}

const onTimeUpdate = (e: any) => {
  if (playing.value) {
    captureTime.value = e.target.currentTime
  }
}

const seekToTime = (val: number) => {
  if (videoRef.value) {
    videoRef.value.currentTime = val
    captureTime.value = val
  }
}

const submit = async () => {
  if (!frame.value) return
  submitting.value = true
  try {
    await recaptureFrame(frame.value.id, captureTime.value)
    message.success('关键帧已成功重捕获')
    visible.value = false
    emit('success')
  } catch (e) {
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.current-pos {
  font-weight: bold;
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  color: #409eff;
}
.tip {
  margin-top: 10px;
  color: #64748b;
  font-size: 13px;
}
</style>
