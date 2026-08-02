import request from '@/config/axios'

export interface XhsNoteCollectVO {
  id: number
  noteId: string
  keyword?: string
  noteType?: number
  title?: string
  noteDesc?: string
  noteUrl?: string
  shellCmd?: string
  publishTime?: string
  userName?: string
  userId?: string
  redId?: string
  likedCount?: number
  collectedCount?: number
  commentsCount?: number
  rawJson?: string
  pcShareLink?: string
  lastPcShareCollectTime?: string
  lastCommentCollectTime?: string
  isLinkInvalid?: boolean
  linkInvalidTime?: Date
  createTime?: Date
  isMonitored?: boolean
}

export interface XhsNoteCollectPageReqVO extends PageParam {
  noteId?: string
  keyword?: string
  noteType?: number
  title?: string
  userName?: string
  userId?: string
  redId?: string
  publishTimeAsc?: boolean
  sortField?: string
  sortOrder?: string
  sortFields?: string
  isLinkInvalid?: boolean
  createTime?: string[]
}

// 查询小红书笔记采集列表
export const getXhsNoteCollectPage = async (params: XhsNoteCollectPageReqVO) => {
  return await request.get({ url: `/business/xhs-note-collect/page`, params })
}

// 获得小红书笔记采集详情
export const getXhsNoteCollect = async (id: number) => {
  return await request.get({ url: `/business/xhs-note-collect/get?id=` + id })
}

// 删除小红书笔记采集
export const deleteXhsNoteCollect = async (id: number) => {
  return await request.delete({ url: `/business/xhs-note-collect/delete?id=` + id })
}

// 批量删除小红书笔记采集
export const deleteXhsNoteCollectBatch = async (ids: number[]) => {
  return await request.delete({ url: `/business/xhs-note-collect/delete-batch?ids=` + ids.join(',') })
}

// 将全部笔记改为有效链接
export const updateAllNotesValid = async () => {
  return await request.post({ url: `/business/xhs-note-collect/update-all-valid` })
}

// 更新笔记监控状态（批量）
export const updateNoteMonitorStatus = async (ids: number[], isMonitored: boolean) => {
  return await request.post({ url: `/business/xhs-note-collect/update-monitor`, data: { ids, isMonitored } })
}

// 查询监控笔记分页
export const getXhsNoteMonitorPage = async (params: XhsNoteCollectPageReqVO) => {
  return await request.get({ url: `/business/xhs-note-collect/monitor-page`, params })
}
