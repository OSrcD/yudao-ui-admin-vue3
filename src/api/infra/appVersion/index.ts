import request from '@/config/axios'

export interface AppVersionVO {
  id?: number
  appCode: string
  platform: string
  versionName: string
  versionCode: number
  minVersionCode: number
  downloadUrl: string
  browserDownloadUrl?: string
  fileSize?: string
  fileSha256?: string
  description?: string
  forceUpdate: boolean
  status: number
  createTime?: Date
}

// 查询 App 版本列表
export const getAppVersionPage = (params: PageParam) => {
  return request.get({ url: '/infra/app-version/page', params })
}

// 查询 App 版本详情
export const getAppVersion = (id: number) => {
  return request.get({ url: '/infra/app-version/get?id=' + id })
}

// 新增 App 版本
export const createAppVersion = (data: AppVersionVO) => {
  return request.post({ url: '/infra/app-version/create', data })
}

// 修改 App 版本
export const updateAppVersion = (data: AppVersionVO) => {
  return request.put({ url: '/infra/app-version/update', data })
}

// 删除 App 版本
export const deleteAppVersion = (id: number) => {
  return request.delete({ url: '/infra/app-version/delete?id=' + id })
}
