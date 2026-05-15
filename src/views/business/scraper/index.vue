<template>
  <div class="app-container power-grid-container">
    <el-card class="glass-panel main-card">
      <template #header>
        <div class="header-content">
          <div class="title-group">
            <el-icon class="logo-icon"><Icon icon="ep:film" /></el-icon>
            <div class="text">
              <h2>全员复刻工作台 (Pro Studio)</h2>
              <p>文案、多图、视频全链条复刻。一个原贴，针对运营人员的资产管理大板。</p>
            </div>
          </div>
          <div class="filter-group">
            <el-input
              v-model="queryParams.keyword"
              placeholder="搜原素材..."
              clearable
              @keyup.enter="handleQuery"
              style="width: 200px; margin-right: 10px"
            />
            <el-button type="primary" @click="handleQuery">
              <Icon icon="ep:refresh" class="mr-5px" /> 刷新大板
            </el-button>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <div v-for="post in postList" :key="post.id" class="post-group">
          <!-- 1. 原素材参照行 (灰色背景) -->
          <div class="table-row original-row">
            <div class="cell-version-label">
              <span class="ref-tag">原贴参考</span>
              <el-button 
                type="success" 
                size="small" 
                @click="createNewVersion(post)"
                v-hasPermi="['business:scraper-post:update']"
              >
                <Icon icon="ep:circle-plus" class="mr-2px" /> 建新版
              </el-button>
              <el-button type="warning" size="small" @click="handleAutoRestyle(post)">
                <Icon icon="ep:magic-stick" class="mr-2px" /> 一键AI复刻
              </el-button>
            </div>
            <div class="cell-text">
              <div class="original-title line-clamp-1" :title="post.title">
                <dict-tag :type="DICT_TYPE.BIZ_ACCOUNT_PLATFORM" :value="post.platform" class="mr-5px" />
                {{ post.title || '无标题' }}
              </div>
              <div class="original-body line-clamp-2" :title="post.content">
                {{ post.content || '无正文' }}
              </div>
              <div class="cell-actions">
                <el-button size="small" type="primary" plain @click="copy(post.title + '\n' + post.content)">
                  复制文案
                </el-button>
                <el-button size="small" link @click="openLink(post.sourceUrl)">去原文看</el-button>
              </div>
            </div>

            <div class="media-column-wrapper">
              <!-- 原素材图片 -->
              <div
                v-for="(img, idx) in getOriginalImgList(post)"
                :key="idx"
                class="media-cell img-cell original-img-cell"
              >
                <div class="media-preview" @click="handlePreviewImg(img, getOriginalImgList(post))">
                  <el-image :src="img" fit="cover" class="img-thumb" />
                </div>
                <div class="media-actions">
                  <el-button
                    size="small"
                    type="success"
                    circle
                    title="下载原图"
                    @click.stop="handleDownload(img, `original_${post.postId}_${idx + 1}.png`)"
                  >
                    <Icon icon="ep:download" />
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    circle
                    title="移除原图"
                    @click.stop="removeOriginalImage(post, idx)"
                    v-hasPermi="['business:scraper-post:update']"
                  >
                    <Icon icon="ep:delete" />
                  </el-button>
                </div>
                <div class="img-label">原图 {{ idx + 1 }}</div>
              </div>
              <!-- 原素材视频封面 -->
              <div v-if="getOriginalVideos(post).length > 0" class="media-cell video-cell">
                <div class="video-placeholder" @click="playOriginalVideo(post)">
                  <el-icon><Icon icon="ep:video-play" /></el-icon><span>原视频</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 复刻版本行 (每一个 Version 是一整包) -->
          <div v-for="(ver, vidx) in getVersions(post)" :key="vidx" class="table-row version-row">
            <div class="cell-version-label">
              <span class="ver-badge">Ver.{{ vidx + 1 }}</span>
              <el-tag :type="ver.isUsed ? 'success' : 'info'" size="small">
                {{ ver.isUsed ? '已发' : '未使用' }}
              </el-tag>
              <el-button 
                link 
                type="danger" 
                @click="removeVersion(post, vidx)"
                v-hasPermi="['business:scraper:update']"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>

            <div class="cell-text">
              <div class="ver-title-row" @click="editVerProp(post, vidx, 'title')">
                <span class="v-title line-clamp-1">{{ ver.title }}</span>
                <div class="text-row-actions">
                  <el-button
                    size="small"
                    circle
                    type="primary"
                    plain
                    title="AI重写文案(全文)"
                    @click.stop="handleIndividualRestyle(post, 'text', vidx)"
                  >
                    <Icon icon="ep:magic-stick" />
                  </el-button>
                  <el-button size="small" circle @click.stop="copy(ver.title)">
                    <Icon icon="ep:copy-document" />
                  </el-button>
                </div>
              </div>
              <div class="ver-content-row" @click="editVerProp(post, vidx, 'content')">
                <span class="v-body line-clamp-2">{{ ver.content }}</span>
                <el-button size="small" circle @click.stop="copy(ver.content)">
                  <Icon icon="ep:copy-document" />
                </el-button>
              </div>
            </div>

            <div class="media-column-wrapper">
              <!-- 复刻图片列 -->
              <div
                v-for="(_, iidx) in getOriginalImgList(post)"
                :key="iidx"
                class="media-cell img-cell"
              >
                <div
                  v-if="!ver.images || !ver.images[iidx] || !ver.images[iidx].url"
                  class="empty-restyle-container"
                >
                  <div class="media-preview empty-box" @click="editImageRestyle(post, vidx, iidx)">
                    <el-icon><Icon icon="ep:picture" /></el-icon><span>未复刻</span>
                  </div>
                  <div class="media-actions">
                    <el-button
                      type="primary"
                      size="small"
                      circle
                      title="独立AI复刻"
                      @click.stop="handleIndividualRestyle(post, 'image', vidx, iidx)"
                    >
                      <Icon icon="ep:magic-stick" />
                    </el-button>
                    <el-button
                      type="warning"
                      size="small"
                      circle
                      title="手动登记地址"
                      @click.stop="editImageRestyle(post, vidx, iidx)"
                    >
                      <Icon icon="ep:edit" />
                    </el-button>
                  </div>
                </div>
                <div v-else class="restyle-img-container">
                  <div
                    class="media-preview"
                    @click="handlePreviewImg(ver.images[iidx].url, ver.images.map((i) => i.url))"
                  >
                    <el-image :src="ver.images[iidx].url" fit="cover" class="img-thumb ver-border" />
                  </div>
                  <div class="media-actions">
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      circle
                      title="重新复刻"
                      @click.stop="handleIndividualRestyle(post, 'image', vidx, iidx)"
                    >
                      <Icon icon="ep:magic-stick" />
                    </el-button>
                    <el-button
                      size="small"
                      type="warning"
                      plain
                      circle
                      title="手动登记"
                      @click.stop="editImageRestyle(post, vidx, iidx)"
                    >
                      <Icon icon="ep:edit" />
                    </el-button>
                    <el-button
                      size="small"
                      type="success"
                      plain
                      circle
                      title="下载此图"
                      @click.stop.prevent="
                        handleDownload(ver.images[iidx].url, `img_${post.postId}_${iidx + 1}.png`)
                      "
                    >
                      <Icon icon="ep:download" />
                    </el-button>
                    <el-button
                      size="small"
                      type="info"
                      plain
                      circle
                      title="复制链接"
                      @click.stop="copy(ver.images[iidx].url)"
                    >
                      <Icon icon="ep:copy-document" />
                    </el-button>
                  </div>
                </div>
                <div class="img-label">对应原图 {{ iidx + 1 }}</div>
              </div>

              <!-- 复刻视频成果 -->
              <div class="media-cell video-cell restyle-video">
                <div v-if="!ver.videoUrl" class="empty-video-container">
                  <div class="media-preview empty-box" @click="editVersionVideo(post, vidx)">
                    <el-icon><Icon icon="ep:film" /></el-icon><span>上传视频</span>
                  </div>
                  <div class="media-actions">
                    <el-button
                      type="primary"
                      size="small"
                      circle
                      title="独立AI复刻视频"
                      @click.stop="handleIndividualRestyle(post, 'video', vidx)"
                    >
                      <Icon icon="ep:magic-stick" />
                    </el-button>
                    <el-button
                      type="warning"
                      size="small"
                      circle
                      title="手动登记地址"
                      @click.stop="editVersionVideo(post, vidx)"
                    >
                      <Icon icon="ep:edit" />
                    </el-button>
                  </div>
                </div>
                <div v-else class="preview-video-container">
                  <div class="media-preview video-box">
                    <video :src="ver.videoUrl" class="v-thumb-player" muted></video>
                  </div>
                  <div class="media-actions">
                    <el-button
                      size="small"
                      type="primary"
                      plain
                      circle
                      title="重新复刻视频"
                      @click="handleIndividualRestyle(post, 'video', vidx)"
                    >
                      <Icon icon="ep:magic-stick" />
                    </el-button>
                    <el-button
                      size="small"
                      type="warning"
                      plain
                      circle
                      title="手动更新视频"
                      @click="editVersionVideo(post, vidx)"
                    >
                      <Icon icon="ep:refresh" />
                    </el-button>
                    <el-button
                      size="small"
                      type="success"
                      plain
                      circle
                      title="下载视频"
                      @click="handleDownload(ver.videoUrl, `video_${post.postId}.mp4`)"
                    >
                      <Icon icon="ep:download" />
                    </el-button>
                  </div>
                  <div class="v-label">复刻成果视频</div>
                </div>
              </div>
            </div>
          </div>

          <el-divider v-if="postList.indexOf(post) !== postList.length - 1" />
        </div>

        <Pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNo"
          v-model:limit="queryParams.pageSize"
          @pagination="handleQuery"
        />
      </div>
    </el-card>

    <!-- 各类对话框 -->
    <el-dialog v-model="textEdit.visible" title="极速修正文案" width="500px">
      <el-form label-position="top">
        <el-form-item :label="textEdit.prop === 'title' ? '当前版标题' : '当前版正文'">
          <el-input
            v-model="textEdit.value"
            :type="textEdit.prop === 'title' ? 'text' : 'textarea'"
            :rows="8"
          />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-switch v-model="textEdit.isUsed" active-text="已发" inactive-text="未发" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="textEdit.visible = false">取消</el-button>
        <el-button type="primary" @click="saveTextEdit">提交更新</el-button>
      </template>
    </el-dialog>

    <!-- URL 登记对话框 -->
    <el-dialog v-model="urlDialog.visible" :title="urlDialog.title" width="500px">
      <el-input
        v-model="urlDialog.url"
        placeholder="请贴入 AI 复刻后的新 URL 地址..."
        type="textarea"
        :rows="3"
      />
      <template #footer>
        <el-button @click="urlDialog.visible = false">放弃</el-button>
        <el-button type="primary" @click="saveUrlEdit">确认入库</el-button>
      </template>
    </el-dialog>

    <!-- 预览器 -->
    <el-image-viewer
      v-if="pv.visible"
      :url-list="pv.list"
      :initial-index="pv.index"
      teleported
      @close="pv.visible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { getScraperPostPage, updateScraperMedia, updateScraperRestyle } from '@/api/business/scraper'
import { DICT_TYPE } from '@/utils/dict'
import axios from 'axios'

defineOptions({ name: 'ScraperLibrary' })

const message = useMessage()
const loading = ref(false)
const total = ref(0)
const postList = ref([])
const queryParams = reactive({ pageNo: 1, pageSize: 12, platform: undefined, keyword: undefined })

// 对话框数据
const textEdit = reactive({ visible: false, post: null as any, vidx: 0, prop: '', value: '', isUsed: false })
const urlDialog = reactive({ visible: false, post: null as any, vidx: 0, type: '', iidx: 0, url: '', title: '' })
const pv = reactive({ visible: false, list: [] as string[], index: 0 })

const getVersions = (p: any) => {
  if (!p.restyleInfo) return []
  if (typeof p.restyleInfo === 'string') {
    try { return JSON.parse(p.restyleInfo) } catch (e) { return [] }
  }
  return p.restyleInfo
}
const getOriginalImgList = (p: any) => {
  let images = p.images
  if (!images) return []
  if (typeof images === 'string') {
    try { images = JSON.parse(images) } catch (e) { return [] }
  }
  if (!Array.isArray(images)) return []
  return images.map((i: any) => i.urlDefault || i)
}
const getOriginalVideos = (p: any) => {
  let videos = p.videos
  if (!videos) return []
  if (typeof videos === 'string') {
    try { videos = JSON.parse(videos) } catch (e) { return [] }
  }
  return Array.isArray(videos) ? videos : []
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getScraperPostPage(queryParams)
    postList.value = res.rows
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => fetchList()

const handlePreviewImg = (url: string, list: string[]) => {
  if (!url) return
  pv.list = list.filter((u) => u && u.startsWith('http'))
  pv.index = pv.list.indexOf(url)
  if (pv.index === -1) {
    pv.list = [url]
    pv.index = 0
  }
  pv.visible = true
}

const removeOriginalImage = (post: any, idx: number) => {
  message.confirm('确定移除这张原图吗？').then(async () => {
    try {
      let images = JSON.parse(post.images || '[]')
      images.splice(idx, 1)
      const imagesJson = JSON.stringify(images)

      let versions = getVersions(post)
      versions.forEach((ver: any) => {
        if (ver.images) {
          ver.images = ver.images.filter((img: any) => img.originalIndex !== idx)
          ver.images.forEach((img: any) => {
            if (img.originalIndex > idx) img.originalIndex -= 1
          })
        }
      })
      const restyleInfoJson = JSON.stringify(versions)

      await updateScraperMedia({ id: post.id, images: imagesJson, videos: post.videos })
      await updateScraperRestyle({ id: post.id, restyleInfo: restyleInfoJson })

      post.images = imagesJson
      post.restyleInfo = restyleInfoJson
      message.success('已同步库数据')
    } catch (e) {}
  })
}

const createNewVersion = async (post: any) => {
  const versions = getVersions(post)
  const imgList = getOriginalImgList(post)
  versions.push({
    title: post.title,
    content: post.content,
    isUsed: false,
    videoUrl: '',
    images: imgList.map((_: any, i: number) => ({ originalIndex: i, url: '' })),
    createTime: new Date().toISOString()
  })
  updateDB(post, versions)
}

const handleAutoRestyle = (_post: any) => {
  message.warning('请在 AI 助手专用版中发起自动化任务，此网页仅供大板管理。')
}

const handleIndividualRestyle = (_post: any, _mode: string, _vidx = 0, _iidx?: number) => {
  message.warning('请在 AI 助手专用版中发起独立任务，此网页仅供大板管理。')
}

const removeVersion = (post: any, vidx: number) => {
  message.confirm('确定废弃这个版本吗？').then(() => {
    const versions = getVersions(post)
    versions.splice(vidx, 1)
    updateDB(post, versions)
  })
}

const editVerProp = (post: any, vidx: number, prop: string) => {
  const versions = getVersions(post)
  textEdit.post = post
  textEdit.vidx = vidx
  textEdit.prop = prop
  textEdit.value = versions[vidx][prop]
  textEdit.isUsed = versions[vidx].isUsed
  textEdit.visible = true
}

const saveTextEdit = () => {
  const versions = getVersions(textEdit.post)
  versions[textEdit.vidx][textEdit.prop] = textEdit.value
  versions[textEdit.vidx].isUsed = textEdit.isUsed
  updateDB(textEdit.post, versions, () => { textEdit.visible = false })
}

const editImageRestyle = (post: any, vidx: number, iidx: number) => {
  const versions = getVersions(post)
  urlDialog.post = post
  urlDialog.vidx = vidx
  urlDialog.iidx = iidx
  urlDialog.type = 'image'
  urlDialog.url = (versions[vidx].images[iidx] || {}).url || ''
  urlDialog.title = '登记复刻图 URL'
  urlDialog.visible = true
}

const editVersionVideo = (post: any, vidx: number) => {
  const versions = getVersions(post)
  urlDialog.post = post
  urlDialog.vidx = vidx
  urlDialog.type = 'video'
  urlDialog.url = versions[vidx].videoUrl || ''
  urlDialog.title = '登记复刻视频 URL'
  urlDialog.visible = true
}

const saveUrlEdit = () => {
  const versions = getVersions(urlDialog.post)
  if (urlDialog.type === 'video') {
    versions[urlDialog.vidx].videoUrl = urlDialog.url
  } else {
    if (!versions[urlDialog.vidx].images[urlDialog.iidx]) {
      versions[urlDialog.vidx].images[urlDialog.iidx] = { originalIndex: urlDialog.iidx }
    }
    versions[urlDialog.vidx].images[urlDialog.iidx].url = urlDialog.url
  }
  updateDB(urlDialog.post, versions, () => { urlDialog.visible = false })
}

const updateDB = async (post: any, versions: any, callback?: Function) => {
  const jsonStr = JSON.stringify(versions)
  try {
    await updateScraperRestyle({ id: post.id, restyleInfo: jsonStr })
    post.restyleInfo = jsonStr
    if (callback) callback()
    message.success('操作成功')
  } catch (e) {}
}

const copy = (text: string) => {
  if (!text) return
  const handleSuccess = () => message.success('已成功复制到剪贴板')
  const handleFail = () => message.error('复制失败，请手动选择复制')

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(handleSuccess).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }

  function fallbackCopy(val: string) {
    const textArea = document.createElement('textarea')
    textArea.value = val
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      const successful = document.execCommand('copy')
      if (successful) handleSuccess()
      else handleFail()
    } catch (err) { handleFail() }
    document.body.removeChild(textArea)
  }
}

const openLink = (u: string) => window.open(u)

const handleDownload = async (url: string, filename: string) => {
  if (!url) return
  message.loading('正在下载素材...')
  try {
    const response = await axios({ url, method: 'GET', responseType: 'blob' })
    const blob = new Blob([response.data])
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = filename || 'material_' + Date.now()
    link.click()
    message.success('下载成功')
  } catch (e) {
    message.error('下载失败')
  } finally {
    message.closeLoading()
  }
}

const playOriginalVideo = (p: any) => { const v = getOriginalVideos(p); if (v.length > 0) window.open(v[0].url) }

onMounted(() => fetchList())
</script>

<style scoped>
.power-grid-container { min-height: calc(100vh - 84px); background: #fcfdfe; }
.main-card { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.header-content { display: flex; justify-content: space-between; align-items: center; }
.title-group { display: flex; align-items: center; gap: 15px; }
.logo-icon { font-size: 30px; color: #f59e0b; padding: 10px; background: rgba(245, 158, 11, 0.08); border-radius: 14px; }
.text h2 { margin: 0; font-size: 18px; font-weight: 800; color: #1e293b; }
.text p { margin: 2px 0 0; font-size: 12px; color: #64748b; }

.post-group { margin-top: 10px; }
.table-row { display: flex; border: 1px solid transparent; min-height: 140px; border-radius: 12px; }
.table-row:hover { background: #fff; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); }

.cell-version-label { width: 110px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: #f8fafc; border-radius: 12px 0 0 12px; border-right: 1px dashed #e2e8f0; }
.ref-tag { font-weight: 800; color: #94a3b8; font-size: 11px; }
.ver-badge { font-weight: 900; color: #f59e0b; font-size: 16px; }

.cell-text { width: 320px; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; border-right: 1px dashed #e2e8f0; }
.original-title { font-weight: 700; color: #334155; margin-bottom: 6px; font-size: 14px; }
.original-body { font-size: 12px; color: #64748b; line-height: 1.6; }

.ver-title-row, .ver-content-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; cursor: pointer; padding: 6px 8px; border-radius: 8px; border: 1px solid transparent; position: relative; }
.ver-title-row:hover, .ver-content-row:hover { background: #f1f5f9; border-color: #cbd5e1; }
.v-title { font-weight: 700; color: #1e293b; flex: 1; }
.text-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
.v-body { font-size: 12px; color: #475569; line-height: 1.6; }

.media-column-wrapper { flex: 1; display: flex; overflow-x: auto; padding: 15px; gap: 20px; }
.media-cell { width: 115px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 5px 0; }

.media-preview { position: relative; width: 90px; height: 90px; cursor: pointer; border-radius: 12px; overflow: hidden; }
.img-thumb, .v-thumb-player, .video-placeholder, .empty-box { width: 90px; height: 90px; border-radius: 10px; transition: transform 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
.img-thumb:hover { transform: scale(1.04); }

.media-actions { display: flex; justify-content: center; gap: 6px; width: 100%; min-height: 32px; align-items: center; }
.media-actions .el-button { margin: 0 !important; transform: scale(0.9); transition: transform 0.2s; }
.media-actions .el-button:active { transform: scale(0.8); }

.empty-video-container { display: flex; flex-direction: column; align-items: center; gap: 10px; }

.empty-box { background: #f8fafc; border: 2px dashed #cbd5e1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #94a3b8; font-size: 11px; gap: 4px; }
.empty-box:hover { border-color: #f59e0b; color: #f59e0b; background: rgba(245, 158, 11, 0.02); }

.ver-border { border: 2px solid #f59e0b; }
.img-label { font-size: 11px; color: #94a3b8; margin-top: 0; text-align: center; font-weight: 500; }

.video-cell { border-left: 2px solid #f59e0b; padding-left: 15px !important; }
.video-placeholder { background: #1e293b; color: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; gap: 5px; }

.original-row { background: #f8fafc; border-top: 4px solid #94a3b8; border-bottom: 2px solid #e2e8f0; margin-top: 15px; }
.version-row { border-left: 6px solid #f59e0b; background: #fff; margin-top: 30px; padding-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

.line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
