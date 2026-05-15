import request from '@/config/axios'

export interface ReproduceConfigVO {
  id: number
  configName: string
  configData: string
  createTime: Date
}

// 查询视频复刻配置预设列表
export const getReproduceConfigPage = (params: any) => {
  return request.get({ url: '/business/reproduce-config/page', params })
}

// 兼容 plus-ui 的 list 方法名
export const listReproduceConfig = (params: any) => {
  return getReproduceConfigPage(params).then(res => ({ rows: res.list, total: res.total }))
}

// 获取视频复刻配置预设详细信息
export const getReproduceConfig = (id: number) => {
  return request.get({ url: '/business/reproduce-config/get?id=' + id })
}

// 新增视频复刻配置预设
export const createReproduceConfig = (data: any) => {
  return request.post({ url: '/business/reproduce-config/create', data })
}

// 兼容 plus-ui 的 add 方法名
export const addReproduceConfig = createReproduceConfig

// 修改视频复刻配置预设
export const updateReproduceConfig = (data: any) => {
  return request.put({ url: '/business/reproduce-config/update', data })
}

// 删除视频复刻配置预设
export const deleteReproduceConfig = (id: number) => {
  return request.delete({ url: '/business/reproduce-config/delete?id=' + id })
}

// 兼容 plus-ui 的 del 方法名
export const delReproduceConfig = deleteReproduceConfig
