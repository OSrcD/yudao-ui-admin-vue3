import request from '@/config/axios'

export interface PromptCommentCompleteVO {
  id: number
  promptId: number
  userId: number
  status: number
  remark: string
  createTime?: Date
}

export interface PromptCommentCompletePageReqVO extends PageParam {
  promptId?: number
  userId?: number
  status?: number
}

// 查询已评论列表
export const getPromptCommentCompletePage = async (params: PromptCommentCompletePageReqVO) => {
  return await request.get({ url: `/business/prompt-comment-complete/page`, params }).then(res => ({ rows: res.list, total: res.total }))
}

// 查询已评论详情
export const getPromptCommentComplete = async (id: number) => {
  return await request.get({ url: `/business/prompt-comment-complete/get?id=` + id })
}

// 新增已评论
export const createPromptCommentComplete = async (data: any) => {
  return await request.post({ url: `/business/prompt-comment-complete/create`, data })
}

// 修改已评论
export const updatePromptCommentComplete = async (data: any) => {
  return await request.put({ url: `/business/prompt-comment-complete/update`, data })
}

// 删除已评论
export const deletePromptCommentComplete = async (id: number) => {
  return await request.delete({ url: `/business/prompt-comment-complete/delete?id=` + id })
}
