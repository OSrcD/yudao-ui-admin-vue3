import request from '@/config/axios'

export interface MaterialVO {
  materialId: number
  materialName: string
  materialUrl: string
  fileType: string
  createTime: Date
}

// 查询素材库列表
export const getMaterialPage = (params: any) => {
  return request.get({ url: '/business/material/page', params })
}

// 兼容 plus-ui 的 list 方法名
export const listMaterial = (params: any) => {
  return getMaterialPage(params).then(res => ({ rows: res.list, total: res.total }))
}

// 查询素材库详细
export const getMaterial = (id: number) => {
  return request.get({ url: '/business/material/get?id=' + id })
}

// 新增素材库
export const createMaterial = (data: any) => {
  return request.post({ url: '/business/material/create', data })
}

// 兼容 plus-ui 的 add 方法名
export const addMaterial = createMaterial

// 修改素材库
export const updateMaterial = (data: any) => {
  return request.put({ url: '/business/material/update', data })
}

// 删除素材库
export const deleteMaterial = (id: number) => {
  return request.delete({ url: '/business/material/delete?id=' + id })
}

// 兼容 plus-ui 的 del 方法名
export const delMaterial = deleteMaterial
