<template>
  <el-card class="detail-board glass-card" shadow="never" v-loading="loading">
    <div class="detail-header">
      <h2>任务详情 <span class="badge">单元分析 (GU)</span></h2>
      <div class="actions">
        <span v-if="selectedGUs.length > 0" class="selection-tip">已选中 {{ selectedGUs.length }} 个单元</span>
        <el-button type="warning" plain icon="RefreshLeft" @click="selectedGUs = []" v-if="selectedGUs.length > 0">清空选择</el-button>
        <el-button color="#10b981" :loading="merging" @click="handleMergeAll" style="color: white; font-weight: bold; padding: 10px 20px;">
            <el-icon style="margin-right: 6px;"><Check /></el-icon>
            合成全片最终视频
        </el-button>
        <el-button type="primary" plain icon="MagicStick" @click="handleBatchWash">一键批量洗图</el-button>
        <el-button type="success" plain icon="VideoCamera" @click="handleBatchGenerate('api')">全量生成 (API收费)</el-button>
        <el-button type="success" plain icon="VideoCamera" @click="handleBatchGenerate('local')">全量生成 (本地免费)</el-button>
        <el-button type="info" plain icon="Refresh" @click="emit('refresh')">刷新详情</el-button>
      </div>
    </div>

    <!-- 步骤进度 -->
    <div class="workflow-steps">
      <el-steps :active="getStepActive(task.status)" finish-status="success" align-center>
        <el-step title="视频分析" description="Gemini 多轮理解" />
        <el-step title="自动截帧" description="关键帧精准提取" />
        <el-step title="AI 洗图" description="Nano Banana 增强" />
        <el-step title="就绪" description="提示词已优化" />
      </el-steps>
    </div>

    <!-- 全局锁展示 -->
    <div v-if="globalLocks" class="locks-section">
      <h3>全片统一锁 (Global Locks)</h3>
      <div class="lock-grid">
        <div v-for="(val, key) in globalLocks" :key="key" class="lock-item">
          <span class="lock-key">{{ formatKey(key) }}</span>
          <p class="lock-val">{{ val }}</p>
        </div>
      </div>
    </div>

    <!-- 最终合成结果 -->
    <div v-if="task.combinedVideoUrl" class="final-video-section glass-card">
      <div class="section-header">
        <h3><el-icon style="margin-right:8px;color:#10b981"><Film /></el-icon>全片合成结果 (Final Combined Video)</h3>
        <el-button type="success" icon="Download" @click="downloadUrl(task.combinedVideoUrl)">下载全片</el-button>
      </div>
      <div class="video-container">
        <video :src="task.combinedVideoUrl" controls class="final-video" preload="metadata"></video>
      </div>
    </div>

    <!-- 制作单元详情 (GUs) -->
    <div class="frames-section">
      <h3>制作单元详情 (GUs)</h3>
      <div class="frame-list">
        <div 
          v-for="frame in task.frames" 
          :key="getFrameId(frame)" 
          class="frame-card glass-card" 
          :class="{ 'is-selected': selectedGUs.includes(String(getFrameId(frame))) }" 
          @click="toggleSelection(getFrameId(frame))"
        >
          <div class="frame-header">
            <div style="display: flex; align-items: center; gap: 10px;">
               <el-checkbox
                 :model-value="selectedGUs.includes(String(getFrameId(frame)))"
                 @change="toggleSelection(getFrameId(frame))"
                 @click.stop
               />
               <div v-if="selectedGUs.includes(String(getFrameId(frame)))" class="selection-order">{{ selectedGUs.indexOf(String(getFrameId(frame))) + 1 }}</div>
               <strong>制作单元 {{ frame.frameIndex + 1 }} <small style="color: #94a3b8; font-weight: normal; margin-left: 5px;">(GU_{{ frame.guId }})</small></strong>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
               <span class="timestamp">原始时间点: {{ frame.timestampSec }}s</span>
               <el-button link type="danger" icon="Delete" @click.stop="handleDelFrame(getFrameId(frame))">删除单元</el-button>
            </div>
          </div>

          <div class="comparison-view">
            <div class="img-box" @click.stop>
              <span class="label">原始截帧</span>
              <el-button
                class="add-material-btn"
                icon="Plus"
                circle
                size="small"
                type="primary"
                @click.stop="handleAddToMaterial(frame.originalImageUrl, `原帧_${task.id}_${frame.frameIndex + 1}`)"
                title="加入素材库"
              />
               <el-image
                 :src="frame.originalImageUrl"
                 fit="cover"
                 :preview-src-list="[frame.originalImageUrl]"
                 preview-teleported
               />
            </div>
            <div class="arrow-icon">
              <el-icon><Right /></el-icon>
            </div>
            <div class="img-box polished" @click.stop>
              <span class="label">AI 洗图 (就绪)</span>
              <el-button
                v-if="frame.polishedImageUrl"
                class="add-material-btn"
                icon="Plus"
                circle
                size="small"
                type="success"
                @click.stop="handleAddToMaterial(frame.polishedImageUrl, `洗图_${task.id}_${frame.frameIndex + 1}`)"
                title="加入素材库"
              />
              <el-image
                :src="frame.polishedImageUrl || frame.originalImageUrl"
                fit="cover"
                :class="{ pulse: !frame.polishedImageUrl && task.status === '3' }"
                :preview-src-list="[frame.polishedImageUrl || frame.originalImageUrl]"
                preview-teleported
              />
            </div>
          </div>

          <div class="frame-actions" @click.stop>
              <el-button size="small" type="primary" plain icon="MagicStick" @click="handleWashSingle(frame)">洗图</el-button>
              <el-button size="small" type="info" plain icon="Crop" @click="handleRecapture(frame)">捕捉重取</el-button>
              <el-button v-if="frame.polishedImageUrl" size="small" type="warning" plain icon="RefreshLeft" @click="handleUndoWash(frame)">撤销洗图</el-button>
              <el-button size="small" type="success" plain icon="VideoCamera" @click="handleGenerateVideo(frame, 'api')">生视频(API)</el-button>
              <el-button size="small" type="success" plain icon="VideoCamera" @click="handleGenerateVideo(frame, 'local')">生视频(本地)</el-button>
              <el-button v-if="frame.generatedVideoUrl" size="small" type="warning" plain icon="RefreshLeft" @click="handleUndoVideo(frame)">撤销视频</el-button>
              <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="(file) => handleOriginalImageUpload(frame, file)" accept="image/*">
                 <el-button size="small" type="primary" plain icon="Upload">上传图片</el-button>
              </el-upload>
          </div>

          <div class="video-result" @click.stop>
              <div class="result-header">
                 <span class="label" :class="{ active: frame.generatedVideoUrl }">
                   {{ frame.generatedVideoUrl ? 'Veo 3.1 生成结果' : '等待视频生成 / 手动上传' }}
                 </span>
                 <div class="actions">
                    <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="(file) => handleGeneratedVideoUpload(frame, file)" accept="video/*">
                       <el-button size="small" :type="frame.generatedVideoUrl ? 'primary' : 'success'" plain icon="Upload">
                         {{ frame.generatedVideoUrl ? '手动替换' : '上传视频' }}
                       </el-button>
                    </el-upload>
                    <el-button v-if="frame.generatedVideoUrl" size="small" type="primary" plain icon="Download" @click="handleDownloadAudio(frame)">提取并下载音频</el-button>
                     <el-button v-if="frame.generatedVideoUrl" size="small" type="danger" plain icon="Scissors" @click="handleClip(frame)">剪辑</el-button>
                 </div>
              </div>
              <video v-if="frame.generatedVideoUrl" :src="frame.generatedVideoUrl" controls class="result-video" preload="metadata"></video>
              <div v-else class="video-placeholder-empty">
                 <el-icon class="icon"><Film /></el-icon>
                 <span>暂无视频结果</span>
              </div>
          </div>

          <div class="prompt-section prompt-en" @click.stop>
            <div class="prompt-header">
               <span>模型提示词 (EN)</span>
               <div class="actions">
                  <el-button link type="primary" @click="frame.editing = !frame.editing">{{ frame.editing ? '取消' : '编辑' }}</el-button>
                  <el-button v-if="frame.editing" link type="success" @click="handleUpdatePrompts(frame)">保存修改</el-button>
                  <el-button link type="primary" @click="copyText(frame.i2vPromptEn)">复制提示词</el-button>
               </div>
            </div>
            <div v-if="!frame.editing" class="prompt-text">{{ frame.i2vPromptEn }}</div>
            <el-input v-else v-model="frame.i2vPromptEn" type="textarea" :rows="6" class="prompt-edit-area" />
          </div>

          <div v-if="frame.i2vPromptZh || frame.editing" class="prompt-section prompt-zh" @click.stop>
            <div class="prompt-header">
               <span>中文对照</span>
               <el-button v-if="!frame.editing" link type="primary" @click="copyText(frame.i2vPromptZh)">复制中文</el-button>
            </div>
            <div v-if="!frame.editing" class="prompt-text zh-text">{{ frame.i2vPromptZh }}</div>
            <el-input v-else v-model="frame.i2vPromptZh" type="textarea" :rows="3" class="prompt-edit-area" />
          </div>

          <!-- 音频管理模块 -->
          <div class="audio-management glass-card" @click.stop>
             <div class="section-header">
                <span class="label"><el-icon><Microphone /></el-icon> 音频 & 口型同步</span>
                <el-button v-if="frame.audioUrl" type="primary" link @click="handleManualTrim(frame)">手动裁剪</el-button>
             </div>
             
             <div v-if="!frame.audioUrl" class="audio-upload-placeholder">
                <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="(file) => handleAudioUpload(frame, file)" accept="audio/*">
                  <el-button size="small" type="primary" plain icon="Upload">上传同步音频</el-button>
                </el-upload>
                <span class="tip">配合对准口型 (支持 .mp3, .wav)</span>
             </div>

             <div v-else class="audio-active-zone">
                <audio :src="frame.audioUrl" controls class="mini-audio-player"></audio>
                <div class="audio-actions">
                   <el-button size="small" type="success" plain icon="Scissors" @click="handleAutoTrim(frame)" :loading="trimming">自动去噪</el-button>
                   <el-button size="small" type="warning" plain icon="Connection" @click="handleSyncAudio(frame)" :loading="syncing">同步视频口型</el-button>
                   <el-upload action="#" :auto-upload="false" :show-file-list="false" :on-change="(file) => handleAudioUpload(frame, file)" style="display:inline-block; margin-left:8px;">
                      <el-button size="small" link type="primary">重新上传</el-button>
                   </el-upload>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <WashImageDialog ref="washDialogRef" @success="emit('refresh')" />
    <ClipVideoDialog ref="clipDialogRef" @success="emit('refresh')" />
    <RecaptureFrameDialog ref="captureDialogRef" @success="emit('refresh')" />
    <AudioTrimDialog ref="audioTrimDialogRef" @success="emit('refresh')" />
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Right, Crop, MagicStick, Plus, Microphone, Upload,
  VideoCamera, Check, Refresh, Film, Download, Delete, RefreshLeft, Scissors, Connection
} from '@element-plus/icons-vue'
import { 
  delVideoReproduce, updatePrompts, bindAudio, undoWash, undoVideo, 
  generateVideo, autoTrimAudio, syncAudioToVideo, generateAllVideos, mergeVideos,
  delFrame, uploadOriginalImage, uploadGeneratedVideo, downloadAudio
} from '@/api/business/videoReproduce'
import { addMaterial } from '@/api/business/material'
import WashImageDialog from './WashImageDialog.vue'
import ClipVideoDialog from './ClipVideoDialog.vue'
import RecaptureFrameDialog from './RecaptureFrameDialog.vue'
import AudioTrimDialog from './AudioTrimDialog.vue'

const props = defineProps({
  task: { type: Object, default: null }
})

const emit = defineEmits(['refresh', 'deleted'])
const message = useMessage()
const loading = ref(false)
const trimming = ref(false)
const syncing = ref(false)
const merging = ref(false)

const selectedGUs = ref<string[]>([])

const globalLocks = computed(() => {
  if (!props.task?.globalLocks) return null
  try {
    return typeof props.task.globalLocks === 'string' 
      ? JSON.parse(props.task.globalLocks) 
      : props.task.globalLocks
  } catch (e) {
    return null
  }
})

const formatKey = (key: string) => {
  const map: Record<string, string> = {
    'character_lock': '人物统一锁 (Character)',
    'product_lock': '商品属性锁 (Product)',
    'visual_consistency_lock': '画面一致性锁 (Visual)',
    'voice_lock': '语音一致性锁 (Voice)',
    'no_packaging_lock': '禁止包装锁 (No Packaging)',
    'audio_visual_mode_lock': '音画对齐锁 (AV Mode)',
    'no_subtitles_lock': '禁止字幕锁 (No Subtitles)',
    'tail_lock': '尾段固定锁 (Tail)'
  }
  return map[key] || key.replace(/_/g, ' ').toUpperCase()
}

const getFrameId = (frame: any) => frame?.id ?? frame?.frameId ?? null

const toggleSelection = (id: number) => {
  const frameId = String(id)
  const index = selectedGUs.value.indexOf(frameId)
  if (index > -1) {
    selectedGUs.value.splice(index, 1)
  } else {
    selectedGUs.value.push(frameId)
  }
}

const getStepActive = (status: any) => {
  if (status === '4' || status === '5' || status === 'COMPLETED' || status === 'SUCCESS') return 4
  if (status === '3' || status === '10') return 3
  if (status === '2' || status === 'RUNNING') return 2
  if (status === '1') return 1
  return 0
}

const washDialogRef = ref()
const clipDialogRef = ref()
const captureDialogRef = ref()
const audioTrimDialogRef = ref()

const handleWashSingle = (frame: any) => washDialogRef.value.open('single', getFrameId(frame))
const handleBatchWash = () => washDialogRef.value.open('all', props.task.id)
const handleBatchGenerate = async (execMode: string = 'api') => {
  try {
    const tip = execMode === 'api' 
      ? '确定要调用 API 批量生成视频吗？(全量接口触发)' 
      : '确定要调用本地队列批量生成视频吗？(免费排队中)'
    await message.confirm(tip)
    await generateAllVideos(props.task.id, execMode)
    message.success('已提交批量生成请求')
    emit('refresh')
  } catch (e) {}
}

const handleClip = (frame: any) => clipDialogRef.value.open(frame)
const handleRecapture = (frame: any) => captureDialogRef.value.open(frame, props.task.originalVideoUrl)

const handleMergeAll = async () => {
  try {
    const tip = selectedGUs.value.length > 0 
      ? `确定按照您选择的顺序（共 ${selectedGUs.value.length} 个单元）合成视频吗？`
      : '确定要按照单元默认顺序合成全片视频吗？'
    
    await message.confirm(tip)
    merging.value = true
    await mergeVideos(props.task.id, selectedGUs.value.length > 0 ? selectedGUs.value : null)
    message.success('合成任务已提交')
    setTimeout(() => emit('refresh'), 3000)
  } catch (e) {} finally {
    merging.value = false
  }
}

const handleUndoWash = async (frame: any) => {
  try {
    await undoWash(getFrameId(frame))
    message.success('已撤销最新洗图')
    emit('refresh')
  } catch (e) {}
}

const handleGenerateVideo = async (frame: any, execMode: string) => {
  try {
    const tip = execMode === 'api' 
      ? '确定要使用 API 模式对此单帧生成视频吗？(将会产生费用)' 
      : '确定要下发到本地队列生成视频吗？(免费)'
    await message.confirm(tip)
    await generateVideo(getFrameId(frame), execMode)
    message.success('生成任务已提交')
    emit('refresh')
  } catch (e) {}
}

const handleUndoVideo = async (frame: any) => {
  try {
    await undoVideo(getFrameId(frame))
    message.success('已撤销最新视频')
    emit('refresh')
  } catch (e) {}
}

const handleDownloadAudio = async (frame: any) => {
  try {
    await downloadAudio(getFrameId(frame))
    message.success('音频提取任务已提交，请稍后刷新下载')
    emit('refresh')
  } catch (e) {}
}

const handleAutoTrim = async (frame: any) => {
  try {
    trimming.value = true
    await autoTrimAudio(getFrameId(frame))
    message.success('自动裁剪完成')
    emit('refresh')
  } catch (e) {} finally {
    trimming.value = false
  }
}

const handleSyncAudio = async (frame: any) => {
  try {
    syncing.value = true
    await syncAudioToVideo(getFrameId(frame))
    message.success('音画同步合成完成')
    emit('refresh')
  } catch (e) {} finally {
    syncing.value = false
  }
}

const handleManualTrim = (frame: any) => {
  audioTrimDialogRef.value.open(frame)
}

const handleDeleteTask = async () => {
  try {
    await message.confirm('确定要彻底删除该任务及其所有关键帧数据吗？')
    await delVideoReproduce(props.task.id)
    message.success('任务已删除')
    emit('deleted')
  } catch (e) {}
}

const handleDelFrame = async (id: number) => {
  try {
    await message.confirm('确定要删除这个制作单元吗？此操作不可恢复。')
    await delFrame(id)
    message.success('已删除')
    emit('refresh')
  } catch (e) {}
}

const handleAddToMaterial = async (url: string, name: string) => {
  if (!url) return
  try {
    await addMaterial({ materialName: name, materialUrl: url, fileType: '0' })
    message.success('已添加到素材库')
  } catch (e) {}
}

const handleOriginalImageUpload = async (frame: any, file: any) => {
  if (!file?.raw) return
  try {
    await uploadOriginalImage(frame.id, file.raw)
    message.success('上传成功')
    emit('refresh')
  } catch (e) {}
}

const handleGeneratedVideoUpload = async (frame: any, file: any) => {
  if (!file?.raw) return
  try {
    await uploadGeneratedVideo(frame.id, file.raw)
    message.success('上传成功')
    emit('refresh')
  } catch (e) {}
}

const handleUpdatePrompts = async (frame: any) => {
  try {
    await updatePrompts(
      frame.id,
      frame.i2vPromptEn,
      frame.i2vPromptZh
    )
    message.success('保存成功')
    frame.editing = false
    emit('refresh')
  } catch (e) {}
}

const downloadUrl = (url: string) => {
  window.open(url, '_blank')
}

const copyText = (text: string) => {
  if (!text) return
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板')
    }).catch(() => {
      copyFallback(text)
    })
  } else {
    copyFallback(text)
  }
}

const copyFallback = (text: string) => {
  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  textArea.setAttribute('readonly', '')
  document.body.appendChild(textArea)
  textArea.select()
  try {
    document.execCommand('copy')
    message.success('已复制到剪贴板')
  } catch (err) {
    message.error('复制失败')
  }
  document.body.removeChild(textArea)
}
</script>

<style scoped>
.detail-board {
  flex: 1;
  height: 100%;
  min-width: 0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-board :deep(.el-card__body) {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 12px;
}

.detail-header h2 {
  margin: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  color: #1e293b;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.badge {
  background: #ecf5ff;
  color: #409eff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 12px;
  font-weight: normal;
}

.selection-tip {
  font-size: 14px;
  color: #409eff;
  font-weight: bold;
  margin-right: 15px;
  background: #ecf5ff;
  padding: 4px 12px;
  border-radius: 4px;
}

.workflow-steps {
  margin: 30px 0;
}

.locks-section {
  margin-top: 20px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.lock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.lock-item {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #edf2f7;
}

.lock-key {
  color: #409eff;
  font-size: 13px;
  font-weight: bold;
}

.lock-val {
  margin: 8px 0 0;
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
}

.final-video-section {
  margin: 30px 0;
  padding: 24px;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
}

.final-video-section .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex-wrap: wrap;
}

.video-container {
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.final-video {
  width: 100%;
  max-height: 500px;
  display: block;
}

.frames-section {
  margin-top: 40px;
}

.frame-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.frame-card {
  padding: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background-color: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.frame-card:hover {
  border-color: #cbd5e1;
}

.frame-card.is-selected {
  border-color: #409eff;
  background-color: #f0f9ff;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
}

.selection-order {
  width: 20px;
  height: 20px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.frame-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.timestamp {
  font-size: 13px;
  color: #94a3b8;
}

.comparison-view {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 20px 0;
}

.img-box {
  flex: 1;
  position: relative;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 8px;
  border: 1px solid #e2e8f0;
}

.img-box .label {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
}

.img-box .el-image {
  border-radius: 6px;
  width: 100%;
  aspect-ratio: 16 / 9;
  display: block;
}

.add-material-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 11;
  opacity: 0;
  transition: all 0.3s ease;
}

.img-box:hover .add-material-btn {
  opacity: 1;
}

.arrow-icon {
  font-size: 24px;
  color: #94a3b8;
}

.frame-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.video-result {
  margin-bottom: 20px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
  flex-wrap: wrap;
}

.result-header .label {
  font-size: 14px;
  color: #94a3b8;
  font-weight: bold;
}

.result-header .label.active {
  color: #10b981;
}

.result-video {
  width: 100%;
  max-height: 240px;
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.1);
}

.video-placeholder-empty {
  height: 240px;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  gap: 10px;
}

.prompt-section {
  background: #f1f5f9;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
  gap: 12px;
  flex-wrap: wrap;
}

.prompt-text {
  font-family: monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #475569;
  white-space: pre-wrap;
  word-break: break-word;
}

.prompt-zh {
  border-left: 4px solid #409eff;
  background: #f0f9ff;
}

.zh-text {
  font-family: sans-serif;
  color: #1e293b;
}

.audio-management {
  margin-top: 16px;
  padding: 16px;
  background: #f0f9ff;
  border: 1px dashed #7dd3fc;
  border-radius: 8px;
}

.audio-management .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
  flex-wrap: wrap;
}

.audio-management .label {
  font-size: 14px;
  font-weight: bold;
  color: #0284c7;
  display: flex;
  align-items: center;
  gap: 6px;
}

.audio-upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 10px 0;
}

.audio-upload-placeholder .tip {
  font-size: 12px;
  color: #64748b;
}

.mini-audio-player {
  width: 100%;
  height: 32px;
  margin-bottom: 12px;
}

.audio-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pulse {
  animation: pulse-animation 2s infinite;
}

@keyframes pulse-animation {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

@media (max-width: 768px) {
  .detail-board :deep(.el-card__body) {
    padding: 14px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .workflow-steps {
    margin: 18px 0;
  }

  .locks-section,
  .final-video-section,
  .frame-card {
    padding: 14px;
  }

  .lock-grid {
    grid-template-columns: 1fr;
  }

  .comparison-view {
    flex-direction: column;
    gap: 12px;
  }

  .arrow-icon {
    transform: rotate(90deg);
  }

  .frame-actions {
    gap: 8px;
  }

  .frame-actions :deep(.el-button),
  .audio-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0 !important;
  }

  .result-header,
  .final-video-section .section-header {
    align-items: flex-start;
  }

  .img-box .el-image,
  .result-video,
  .video-placeholder-empty {
    width: 100%;
  }
}
</style>
