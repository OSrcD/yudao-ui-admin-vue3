<template>
  <el-dialog v-model="visible" title="音频精准裁剪" width="90%" style="max-width: 600px;" append-to-body destroy-on-close>
     <div v-if="trimAudioUrl" style="text-align: center; margin-bottom: 20px;">
        <audio ref="audioRef" :src="trimAudioUrl" controls style="width: 100%;" @loadedmetadata="onAudioLoaded"></audio>
     </div>
     <div style="margin-bottom: 10px; font-size: 13px; color: #666;">
        请拖动滑块选择需要<b>保留</b>的音频区间：
     </div>
     <el-slider v-model="audioTrimRange" range :max="audioDuration" :step="0.01" @input="onSliderInput" />
     <div style="display:flex; justify-content:space-between; font-size: 12px; color: #999; margin-top:5px;">
        <span>起始点: {{ audioTrimRange[0].toFixed(2) }}s</span>
        <span>结束点: {{ audioTrimRange[1].toFixed(2) }}s</span>
        <span>裁剪后总长: {{ (audioTrimRange[1] - audioTrimRange[0]).toFixed(2) }}s</span>
     </div>
     <template #footer>
        <span class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">执行裁剪</el-button>
        </span>
     </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { manualTrimAudio } from '@/api/business/videoReproduce'

const visible = ref(false)
const frame = ref<any>(null)
const audioRef = ref<HTMLAudioElement>()
const audioDuration = ref(0)
const audioTrimRange = ref([0, 0])
const trimAudioUrl = ref('')
const submitting = ref(false)

const emit = defineEmits(['success'])
const message = useMessage()

let timer: any = null

const open = (f: any) => {
  frame.value = f
  trimAudioUrl.value = f.audioUrl
  visible.value = true
  audioTrimRange.value = [0, 1]
}

const onAudioLoaded = (e: any) => {
  audioDuration.value = e.target.duration
  audioTrimRange.value = [0, e.target.duration]
}

const onSliderInput = (val: number[]) => {
  if (audioRef.value) {
    audioRef.value.currentTime = val[0]
  }
}

const handleSubmit = async () => {
  if (!frame.value) return
  submitting.value = true
  try {
    await manualTrimAudio(frame.value.id, audioTrimRange.value[0], audioTrimRange.value[1])
    message.success('手动裁剪应用成功')
    visible.value = false
    emit('success')
  } catch (e) {
  } finally {
    submitting.value = false
  }
}

onUnmounted(() => {})

defineExpose({ open })
</script>

<style scoped>
.trim-container {
  padding: 10px;
}
.audio-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.player-wrapper {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}
.current-time {
  font-family: monospace;
  font-weight: bold;
  color: #409eff;
}
.slider-wrapper {
  padding: 0 15px;
  margin-bottom: 20px;
}
.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-top: 10px;
}
.diff {
  color: #f56c6c;
  font-weight: bold;
}
.tips {
  margin-top: 20px;
}
</style>
