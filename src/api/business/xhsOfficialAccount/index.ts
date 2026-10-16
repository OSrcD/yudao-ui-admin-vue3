import request from '@/config/axios'

export interface XhsOfficialAccountVO {
  id?: number
  userId?: number
  mobile?: string
  accountId: string
  nickname?: string
  remark?: string
  status?: number
  createTime?: Date
}

export interface XhsOfficialAccountPageReqVO extends PageParam {
  userId?: number
  mobile?: string
  accountId?: string
  nickname?: string
  remark?: string
  status?: number
  createTime?: string[]
}

// 查询小红书官方号名单分页列表
export const getXhsOfficialAccountPage = async (params: XhsOfficialAccountPageReqVO) => {
  return await request.get({ url: `/business/xhs-official-account/page`, params })
}

// 查询小红书官方号详情
export const getXhsOfficialAccount = async (id: number) => {
  return await request.get({ url: `/business/xhs-official-account/get?id=` + id })
}

// 创建小红书官方号
export const createXhsOfficialAccount = async (data: Partial<XhsOfficialAccountVO>) => {
  return await request.post({ url: `/business/xhs-official-account/create`, data })
}

// 批量创建/导入小红书官方号
export const batchCreateXhsOfficialAccount = async (data: Partial<XhsOfficialAccountVO>[]) => {
  return await request.post({ url: `/business/xhs-official-account/batch-create`, data })
}

// 更新小红书官方号
export const updateXhsOfficialAccount = async (data: Partial<XhsOfficialAccountVO>) => {
  return await request.put({ url: `/business/xhs-official-account/update`, data })
}

// 删除小红书官方号
export const deleteXhsOfficialAccount = async (id: number) => {
  return await request.delete({ url: `/business/xhs-official-account/delete?id=` + id })
}

// 清空全部小红书官方号
export const clearXhsOfficialAccounts = async () => {
  return await request.delete({ url: `/business/xhs-official-account/clear` })
}

// 导出小红书官方号名单 Excel
export const exportXhsOfficialAccountExcel = async (params: XhsOfficialAccountPageReqVO) => {
  return await request.download({ url: `/business/xhs-official-account/export-excel`, params })
}
