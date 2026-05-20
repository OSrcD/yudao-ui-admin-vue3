import request from '@/config/axios'

// AI 视频 VO
export interface VideoVO {
  id: number // 编号
  userId: number // 用户编号
  prompt: string // 提示词
  platform: string // 平台
  modelId: number // 模型编号
  model: string // 模型
  width: number // 宽度
  height: number // 高度
  duration: number // 时长（秒）
  status: number // 状态
  finishTime: Date // 完成时间
  errorMessage: string // 错误信息
  videoUrl: string // 视频地址
  previewUrl: string // 预览图地址
  options: any // 配置选项
  taskId: string // 任务编号
  createTime: Date // 创建时间
}

export interface VideoSubmitReqVO {
  prompt: string // 提示词
  modelId: number // 模型编号
  size: string // 分辨率
  seconds: number // 时长（秒）
  inputReferences: string[] // 参考图 URL 列表
}

// AI 视频 API
export const VideoApi = {
  // 提交视频生成任务 (GeekAi)
  submitGeekAiVeo: async (data: any) => {
    return await request.post({ url: `/ai/video/submitGeekAiVeo`, data })
  },
  // 同步视频生成进展 (GeekAi)
  syncGeekAiVeoVideo: async (id?: number) => {
    return await request.get({ url: `/ai/video/syncGeekAiVeoVideo`, params: { id } })
  },
  // 提交视频生成任务 (Aihubmix)
  submitAihubmix: async (data: any) => {
    return await request.post({ url: `/ai/video/submitAihubmix`, data })
  },
  // 同步视频生成进展 (Aihubmix)
  syncAihubmixVideo: async (id?: number) => {
    return await request.get({ url: `/ai/video/syncAihubmixVideo`, params: { id } })
  },
  // 获得视频分页
  getVideoPage: async (params: any) => {
    return await request.get({ url: `/ai/video/page`, params })
  },
  // 删除视频
  deleteVideo: async (id: number) => {
    return await request.delete({ url: `/ai/video/delete?id=${id}` })
  }
}
