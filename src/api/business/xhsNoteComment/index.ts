import request from '@/config/axios'

export interface XhsNoteCommentVO {
  id: number
  noteId: string
  commentId: string
  parentCommentId?: string
  targetCommentId?: string
  userId?: string
  nickname?: string
  redId?: string
  avatar?: string
  content?: string
  ipLocation?: string
  likeCount?: number
  subCommentCount?: number
  isAuthor?: number
  pictures?: string
  commentTime?: string
  interceptStatus?: number
  remark?: string
  rawJson?: string
  createTime?: Date
  noteTitle?: string
  noteDesc?: string
  notePublishTime?: string
  noteIsMonitored?: boolean
  noteCollectId?: number
  noteUrl?: string
  notePcShareLink?: string
}

export interface XhsNoteCommentPageReqVO extends PageParam {
  noteId?: string
  commentId?: string
  userId?: string
  nickname?: string
  redId?: string
  content?: string
  ipLocation?: string
  interceptStatus?: number
  isAuthor?: number
  sortFields?: string
}

export interface XhsNoteCommentUpdateStatusReqVO {
  id: number
  interceptStatus: number
  remark?: string
}

// 查询小红书评论分页列表
export const getXhsNoteCommentPage = async (params: XhsNoteCommentPageReqVO) => {
  return await request.get({ url: `/business/xhs-note-comment/page`, params })
}

// 更新小红书评论私信截流跟进状态
export const updateXhsNoteCommentStatus = async (data: XhsNoteCommentUpdateStatusReqVO) => {
  return await request.put({ url: `/business/xhs-note-comment/update-status`, data })
}

// 删除小红书评论
export const deleteXhsNoteComment = async (id: number) => {
  return await request.delete({ url: `/business/xhs-note-comment/delete?id=` + id })
}
