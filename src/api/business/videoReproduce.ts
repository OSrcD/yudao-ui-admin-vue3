import request from '@/config/axios'

export interface VideoReproduceVO {
  id: number
  status: string
  originalVideoUrl: string
  combinedVideoUrl: string
  createTime: Date
}

export interface FrameVO {
  id: number
  guId: number
  taskId: number
  timestampSec: number
  originalImageUrl: string
  polishedImageUrl: string
  generatedVideoUrl: string
  audioUrl: string
  i2vPromptEn: string
  i2vPromptZh: string
  prevPolishedUrl: string
  prevVideoUrl: string
}

// 查询视频复刻任务列表
export const listVideoReproduce = (params: any) => {
  return request.get({ url: '/business/video-reproduce/page', params }).then(res => ({
    rows: res.list,
    total: res.total
  }))
}

// 获取视频复刻任务详情
export const getVideoReproduce = (id: number) => {
  return request.get({ url: '/business/video-reproduce/get?id=' + id })
}

// 创建并开始复刻任务
export const createVideoReproduce = (data: any) => {
  return request.upload({ url: '/business/video-reproduce/create', data })
}

// 获取截帧列表
export const getFrames = (taskId: number) => {
  return request.get({ url: '/business/video-reproduce/frames/' + taskId })
}

// 单帧洗图
export const washImage = (frameId: number, params: any) => {
  return request.post({ 
    url: '/business/video-reproduce/wash-image/' + frameId, 
    params: { 
      washMode: params.washMode, 
      customPrompt: params.customPrompt, 
      execMode: params.execMode || 'api' 
    },
    data: params.refImages
  })
}

// 单帧生成视频
export const generateVideo = (frameId: number, execMode = 'api') => {
  return request.post({ 
    url: '/business/video-reproduce/generate-video/' + frameId,
    params: { execMode }
  })
}

// 为单帧绑定音频
export const bindAudio = (frameId: number, audioFile: File) => {
  const formData = new FormData()
  formData.append('audio', audioFile)
  return request.upload({ 
    url: '/business/video-reproduce/bind-audio/' + frameId,
    data: formData
  })
}

// 将音频同步到视频
export const syncAudioToVideo = (frameId: number) => {
  return request.post({ url: '/business/video-reproduce/sync-audio/' + frameId })
}

// 下载生成视频的音频
export const downloadAudio = (frameId: number) => {
  return request.download({ url: '/business/video-reproduce/download-audio/' + frameId })
}

// 以下为补充方法，如果后端没有实现可能会 404，但前端代码中引用了
export const retryVideoReproduce = (taskId: number) => {
  return request.post({ url: '/business/video-reproduce/retry/' + taskId })
}

export const generateAllVideos = (taskId: number, execMode = 'api') => {
  return request.post({ 
    url: '/business/video-reproduce/generate-all/' + taskId,
    params: { execMode }
  })
}

export const washAllImages = (taskId: number, params: any) => {
  return request.post({ 
    url: '/business/video-reproduce/wash-all-images/' + taskId,
    params: { 
      washMode: params.washMode, 
      customPrompt: params.customPrompt, 
      execMode: params.execMode || 'api' 
    },
    data: params.refImages
  })
}

export const undoWash = (frameId: number) => {
  return request.post({ url: '/business/video-reproduce/undo-wash/' + frameId })
}

export const undoVideo = (frameId: number) => {
  return request.post({ url: '/business/video-reproduce/undo-video/' + frameId })
}

export const delVideoReproduce = (taskId: number) => {
  return request.delete({ url: '/business/video-reproduce/delete?id=' + taskId })
}

export const clipVideo = (frameId: number, removeRanges: any) => {
  return request.post({ 
    url: '/business/video-reproduce/clip-video/' + frameId,
    data: removeRanges
  })
}

export const mergeVideos = (taskId: number, frameIds: number[]) => {
  return request.post({ 
    url: '/business/video-reproduce/merge-videos/' + taskId,
    data: { frameIds }
  })
}

export const delFrame = (frameId: number) => {
  return request.delete({ url: '/business/video-reproduce/frame/' + frameId })
}

export const delGeneratedVideo = (frameId: number) => {
  return request.delete({ url: '/business/video-reproduce/frame/video/' + frameId })
}

export const delPolishedImage = (frameId: number) => {
  return request.delete({ url: '/business/video-reproduce/frame/wash/' + frameId })
}

export const delOriginalImage = (frameId: number) => {
  return request.delete({ url: '/business/video-reproduce/frame/image/' + frameId })
}

export const autoTrimAudio = (frameId: number) => {
  return request.post({ url: '/business/video-reproduce/auto-trim-audio/' + frameId })
}

export const manualTrimAudio = (frameId: number, start: number, end: number) => {
  return request.post({ 
    url: '/business/video-reproduce/manual-trim-audio/' + frameId,
    params: { start, end }
  })
}

export const updatePrompts = (frameId: number, promptEn: string, promptZh: string) => {
  return request.post({ 
    url: '/business/video-reproduce/update-prompts/' + frameId,
    data: { promptEn, promptZh }
  })
}

export const recaptureFrame = (frameId: number, timestamp: number) => {
  return request.post({ 
    url: '/business/video-reproduce/recapture-frame/' + frameId,
    params: { timestamp }
  })
}

export const uploadGeneratedVideo = (frameId: number, videoFile: File) => {
  const formData = new FormData()
  formData.append('video', videoFile)
  return request.upload({ 
    url: '/business/video-reproduce/upload-video/' + frameId,
    data: formData
  })
}

export const uploadOriginalImage = (frameId: number, imageFile: File) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  return request.upload({ 
    url: '/business/video-reproduce/upload-image/' + frameId,
    data: formData
  })
}
