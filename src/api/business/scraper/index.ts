import request from '@/config/axios'

export interface ScraperPostVO {
  id: number
  platform: string
  postId: string
  title: string
  content: string
  authorName: string
  authorId: string
  publishTime: Date
  mediaUrls: string
  restyleUrls: string
  status: number
  createTime?: Date
}

export interface ScraperPostPageReqVO extends PageParam {
  platform?: string
  title?: string
  authorName?: string
  status?: number
}

// 查询素材采集列表
export const getScraperPostPage = async (params: ScraperPostPageReqVO) => {
  return await request.get({ url: `/business/scraper-post/page`, params }).then(res => ({ rows: res.list, total: res.total }))
}

// 更新媒体链接（图片+视频）
export const updateScraperMedia = async (data: any) => {
  return await request.put({ url: `/business/scraper-post/update-media?id=` + data.id, data })
}

// 更新复刻素材结果
export const updateScraperRestyle = async (data: any) => {
  return await request.put({ url: `/business/scraper-post/update-restyle?id=` + data.id, data: data.restyleInfo })
}
