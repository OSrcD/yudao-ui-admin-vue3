import request from '@/config/axios'

export interface XhsCommentRecordVO {
  id: number
  appAccountId: number
  appMobile: string
  xhsUserId: string
  xhsUserName: string
  shareLink: string
  shareContent?: string
  noteId?: string
  noteTitle?: string
  commentContent: string
  commentStatus: number
  checkStatus: number
  checkTime?: Date
  remark?: string
  createTime?: Date
}

export interface XhsCommentRecordPageReqVO extends PageParam {
  appAccountId?: number
  appMobile?: string
  xhsUserId?: string
  xhsUserName?: string
  shareLink?: string
  noteId?: string
  noteTitle?: string
  commentContent?: string
  commentStatus?: number
  checkStatus?: number
  createTime?: string[]
}

export interface XhsCommentAnalysisVO {
  totalCount: number
  normalCount: number
  swallowedCount: number
  foldedCount: number
  pendingCheckCount: number
  unknownCount?: number
  normalRate: number
  swallowedRate: number
  foldedRate: number
}

// 查询小红书评论记录分页列表
export const getXhsCommentRecordPage = async (params: XhsCommentRecordPageReqVO) => {
  return await request.get({ url: `/business/xhs-comment-record/page`, params })
}

// 查询小红书评论记录详情
export const getXhsCommentRecord = async (id: number) => {
  return await request.get({ url: `/business/xhs-comment-record/get?id=` + id })
}

// 创建小红书评论记录
export const createXhsCommentRecord = async (data: Partial<XhsCommentRecordVO>) => {
  return await request.post({ url: `/business/xhs-comment-record/create`, data })
}

// 更新小红书评论记录
export const updateXhsCommentRecord = async (data: Partial<XhsCommentRecordVO>) => {
  return await request.put({ url: `/business/xhs-comment-record/update`, data })
}

// 删除小红书评论记录
export const deleteXhsCommentRecord = async (id: number) => {
  return await request.delete({ url: `/business/xhs-comment-record/delete?id=` + id })
}

// 获得评论数据分析统计预览 (吞评/折叠/正常率统计)
export const getXhsCommentAnalysisPreview = async (): Promise<XhsCommentAnalysisVO> => {
  return await request.get({ url: `/business/xhs-comment-record/analysis-preview` })
}
