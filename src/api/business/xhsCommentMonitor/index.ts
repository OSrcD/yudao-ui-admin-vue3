import request from '@/config/axios'

export interface CommentMonitorKeywordVO {
  id: number
  keyword: string
  createTime?: Date
}

export interface CommentMonitorNotifyConfigVO {
  enabled: boolean
  type: string // webhook / wecom / feishu
  url: string
  secret?: string
}

export interface CommentMonitorPageReqVO extends PageParam {
  keyword?: string
  nickname?: string
  noteId?: string
  sortFields?: string
}

// 获取评论监控分页
export const getCommentMonitorPage = async (params: CommentMonitorPageReqVO) => {
  return await request.get({ url: `/business/xhs-comment-monitor/page`, params })
}

// 获取所有监控关键词
export const getMonitorKeywords = async (): Promise<CommentMonitorKeywordVO[]> => {
  return await request.get({ url: `/business/xhs-comment-monitor/keywords` })
}

// 新增监控关键词
export const addMonitorKeyword = async (keyword: string) => {
  return await request.post({ url: `/business/xhs-comment-monitor/keyword`, data: { keyword } })
}

// 删除监控关键词
export const deleteMonitorKeyword = async (id: number) => {
  return await request.delete({ url: `/business/xhs-comment-monitor/keyword?id=` + id })
}

// 获取推送配置
export const getNotifyConfig = async (): Promise<CommentMonitorNotifyConfigVO> => {
  return await request.get({ url: `/business/xhs-comment-monitor/notify-config` })
}

// 保存推送配置
export const saveNotifyConfig = async (config: CommentMonitorNotifyConfigVO) => {
  return await request.put({ url: `/business/xhs-comment-monitor/notify-config`, data: config })
}

// 发送测试推送
export const sendNotifyTest = async (config: CommentMonitorNotifyConfigVO): Promise<boolean> => {
  return await request.post({ url: `/business/xhs-comment-monitor/notify-test`, data: config })
}
