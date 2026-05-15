import request from '@/config/axios'

export interface PromptCommentVO {
  id: number
  promptId: number
  userId: number
  commentContent: string
  status: number
  remark: string
  createTime?: Date
}

export interface PromptCommentPageReqVO extends PageParam {
  promptId?: number
  userId?: number
  content?: string
  status?: number
}

// 查询提示词评论列表
export const getPromptCommentPage = async (params: PromptCommentPageReqVO) => {
  return await request.get({ url: `/business/prompt-comment/page`, params }).then(res => ({ rows: res.list, total: res.total }))
}

// 查询提示词评论详情
export const getPromptComment = async (id: number) => {
  return await request.get({ url: `/business/prompt-comment/get?id=` + id })
}

// 新增提示词评论
export const createPromptComment = async (data: any) => {
  return await request.post({ url: `/business/prompt-comment/create`, data })
}

// 修改提示词评论
export const updatePromptComment = async (data: any) => {
  return await request.put({ url: `/business/prompt-comment/update`, data })
}

// 删除提示词评论
export const deletePromptComment = async (id: number) => {
  return await request.delete({ url: `/business/prompt-comment/delete?id=` + id })
}
