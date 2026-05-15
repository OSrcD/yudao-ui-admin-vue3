import request from '@/config/axios'

export interface MediaAccountVO {
  id: number
  accountId: string | number
  accountName: string
  accountPlatform: number
  accountType: number
  accountUrl: string
  phoneNumber: string
  followerCount: number
  status: number
  remark: string
  createTime?: Date
}

export interface MediaAccountPageReqVO extends PageParam {
  accountId?: string | number
  accountName?: string
  accountPlatform?: number
  accountType?: number
  status?: number
}

// 查询自媒体账号列表
export const getMediaAccountPage = async (params: MediaAccountPageReqVO) => {
  return await request.get({ url: `/business/media-account/page`, params }).then(res => ({ rows: res.list, total: res.total }))
}

// 查询自媒体账号详情
export const getMediaAccount = async (id: number) => {
  return await request.get({ url: `/business/media-account/get?id=` + id })
}

// 新增自媒体账号
export const createMediaAccount = async (data: any) => {
  return await request.post({ url: `/business/media-account/create`, data })
}

// 修改自媒体账号
export const updateMediaAccount = async (data: any) => {
  return await request.put({ url: `/business/media-account/update`, data })
}

// 删除自媒体账号
export const deleteMediaAccount = async (id: number) => {
  return await request.delete({ url: `/business/media-account/delete?id=` + id })
}

// 导出自媒体账号 Excel
export const exportMediaAccount = async (params: MediaAccountPageReqVO) => {
  return await request.download({ url: `/business/media-account/export-excel`, params })
}
