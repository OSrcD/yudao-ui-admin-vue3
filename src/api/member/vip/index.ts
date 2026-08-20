import request from '@/config/axios'

export interface VipPackageVO {
  id?: number
  name: string
  price: number
  durationDays: number
  status: number
  sort?: number
  createTime?: string
}

export interface VipOrderVO {
  id: number
  userId: number
  userNickname?: string
  userMobile?: string
  packageId: number
  packageName: string
  price: number
  durationDays: number
  payStatus: boolean
  payOrderId?: number
  payTime?: string
  payChannelCode?: string
  createTime?: string
}

// ========== 套餐 ==========
export const getVipPackagePage = async (params) => {
  return await request.get({ url: '/member/vip-package/page', params })
}

export const getVipPackage = async (id: number) => {
  return await request.get({ url: '/member/vip-package/get?id=' + id })
}

export const createVipPackage = async (data: VipPackageVO) => {
  return await request.post({ url: '/member/vip-package/create', data })
}

export const updateVipPackage = async (data: VipPackageVO) => {
  return await request.put({ url: '/member/vip-package/update', data })
}

export const deleteVipPackage = async (id: number) => {
  return await request.delete({ url: '/member/vip-package/delete?id=' + id })
}

// ========== 订单 ==========
export const getVipOrderPage = async (params) => {
  return await request.get({ url: '/member/vip-order/page', params })
}
