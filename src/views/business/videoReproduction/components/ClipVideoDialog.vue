<template>
  <el-dialog v-model="visible" title="视频高级可视剪辑" width="90%" style="max-width: 850px;" append-to-body destroy-on-close>
    <div v-if="clipVideoUrl" style="margin-bottom: 20px; text-align: center;">
      <video ref="videoRef" :src="clipVideoUrl" style="width: 100%; max-height: 450px; border-radius: 8px; background: #000; cursor: pointer;" @loadedmetadata="onVideoLoaded" @click="togglePlay"></video>
      <div style="margin-top: 10px;">
        <el-button @click="togglePlay" size="small" type="primary" plain round>
          <el-icon style="margin-right: 4px"><VideoPlay /></el-icon> 播放 / 暂停
        </el-button>
      </div>
    </div>

    <div style="margin-bottom: 10px; color: #666; font-size: 13px;">
      请拖动下方滑块指定<b style="color:#f56c6c;">需要剪除（不要的部分）</b>的时间区间。拖动滑块时上方画面会自动定位到对应帧，方便您精准定位瑕疵位置。
    </div>

    <div v-for="(range, idx) in clipRanges" :key="idx" class="range-item">
      <div class="range-header">
         <span style="font-size: 14px; font-weight: bold;">剪除区间 {{ idx + 1 }}</span>
         <el-button type="danger" link @click="clipRanges.splice(idx, 1)" v-if="clipRanges.length > 1">移除本段</el-button>
      </div>
      <el-slider
         v-model="range.val"
         range
         :max="videoDuration"
         :step="0.05"
         @input="(val) => seekToSlider(val, idx)"
      />
      <div class="range-footer">
         <span>{{ range.val[0].toFixed(2) }}s</span>
         <span>{{ range.val[1].toFixed(2) }}s</span>
      </div>
    </div>

    <el-button type="primary" plain @click="clipRanges.push({val: [0, videoDuration * 0.2 || 1], _prev: [0, 0]})" icon="Plus" style="width: 100%;">新增剪除区间</el-button>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="danger" :loading="clipping" @click="submitClip">确认剪切合成</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { VideoPlay, Plus } from '@element-plus/icons-vue'
import { clipVideo } from '@/api/business/videoReproduce'

const visible = ref(false)
const clipping = ref(false)
const clipVideoUrl = ref('')
const frame = ref<any>(null)
const videoRef = ref<HTMLVideoElement>()
const videoDuration = ref(0)
const playing = ref(false)
const clipRanges = ref<any[]>([{ val: [0, 0], _prev: [0, 0] }])

const emit = defineEmits(['success'])
const message = useMessage()

const open = (f: any) => {
  frame.value = f
  clipVideoUrl.value = f.generatedVideoUrl
  clipRanges.value = [{ val: [0, 1.0], _prev: [0, 1.0] }]
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
  if (clipRanges.value.length === 1 && clipRanges.value[0].val[1] === 1.0) {
    clipRanges.value[0].val[1] = Math.min(1.0, e.target.duration)
  }
}

const seekToSlider = (val: number[], idx: number) => {
  const prev = clipRanges.value[idx]._prev || [0, 0]
  if (videoRef.value) {
    if (val[0] !== prev[0]) {
      videoRef.value.currentTime = val[0]
    } else if (val[1] !== prev[1]) {
      videoRef.value.currentTime = val[1]
    }
  }
  clipRanges.value[idx]._prev = [...val]
}

const submitClip = async () => {
  const validRanges = clipRanges.value
    .filter(r => r.val[1] > r.val[0])
    .map(r => ({ start: r.val[0], end: r.val[1] }))
  
  if (validRanges.length === 0) {
    message.warning('请配置至少一个有效的待剪截除区间！')
    return
  }

  clipping.value = true
  try {
    await clipVideo((frame as any).value.id, validRanges)
    message.success('剪切合成已完成！')
    visible.value = false
    emit('success')
  } catch (e) {
  } finally {
    clipping.value = false
  }
}
</script>

<style scoped>
.range-item {
  margin-bottom: 15px;
  background: #f8fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.range-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
  font-size: 14px;
}
.range-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}
</style>
