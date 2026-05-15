import request from '@/config/axios'

export interface PromptTemplateVO {
  id: number
  template: string
  templateType: number
  status: number
  remark: string
  createTime?: Date
}

export interface PromptTemplatePageReqVO extends PageParam {
  template?: string
  templateType?: number
  status?: number
}

// 查询提示词模板列表
export const getPromptTemplatePage = async (params: PromptTemplatePageReqVO) => {
  return await request.get({ url: `/business/prompt-template/page`, params }).then(res => ({ rows: res.list, total: res.total }))
}

// 查询提示词模板详情
export const getPromptTemplate = async (id: number) => {
  return await request.get({ url: `/business/prompt-template/get?id=` + id })
}

// 新增提示词模板
export const createPromptTemplate = async (data: any) => {
  return await request.post({ url: `/business/prompt-template/create`, data })
}

// 修改提示词模板
export const updatePromptTemplate = async (data: any) => {
  return await request.put({ url: `/business/prompt-template/update`, data })
}

// 删除提示词模板
export const deletePromptTemplate = async (id: number) => {
  return await request.delete({ url: `/business/prompt-template/delete?id=` + id })
}

// 导出提示词模板 Excel
export const exportPromptTemplate = async (params: PromptTemplatePageReqVO) => {
  return await request.download({ url: `/business/prompt-template/export-excel`, params })
}
