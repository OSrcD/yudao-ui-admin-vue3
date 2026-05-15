<template>
  <div class="app-container video-reproduce-container">
    <el-card class="banner-card" shadow="never">
      <div class="banner-content">
        <h2 class="title"><el-icon style="margin-right:8px;color:#3b82f6"><VideoCamera /></el-icon>视频复刻工作台</h2>
        <p class="subtitle">AI 视频分析、自动截帧、洗图、视频复刻</p>
      </div>
      <div class="banner-actions">
        <el-button type="primary" icon="Plus" @click="handleOpenUpload">新建视频复刻任务</el-button>
      </div>
    </el-card>

    <div class="mobile-tabs">
      <el-segmented v-model="mobileTab" :options="mobileTabOptions" />
    </div>

    <div class="main-content">
      <div 
        v-show="!isMobile || mobileTab === 'tasks'" 
        class="task-grid" 
        v-loading="loading"
        ref="taskGridRef"
        @scroll="handleListScroll"
        id="taskGrid"
      >
        <div
          v-for="task in taskList"
          :key="getTaskId(task)"
          class="task-card"
          :class="{ active: currentTaskId === getTaskId(task) }"
          @click="selectTask(task); mobileTab = 'detail'"
        >
          <div class="card-header">
            <span class="task-id">任务号: {{ getTaskId(task).toString().slice(-6) }}</span>
            <div>
              <el-tag :type="getStatusType(task.status)" size="small">{{ getStatusLabel(task.status) }}</el-tag>
              <el-button type="danger" link icon="Delete" @click.stop="handleDeleteTask(task)" style="margin-left: 8px;" />
            </div>
          </div>
          <div class="task-preview">
            <video v-if="task.originalVideoUrl" :src="task.originalVideoUrl + '#t=0.1'" class="mini-video" muted preload="metadata" @mouseover="playVideo" @mouseleave="pauseVideo"></video>
            <div class="play-overlay" v-if="task.originalVideoUrl"><el-icon><VideoPlay /></el-icon></div>
            <div v-else class="video-placeholder">无预览</div>
          </div>
          <div class="card-footer">
            <div class="time-info"><el-icon><Clock /></el-icon>{{ formatDate(task.createTime) }}</div>
          </div>
        </div>

        <el-empty v-if="taskList.length === 0" description="暂无复刻任务" />

        <div class="pagination-mini">
          <el-pagination
            v-model:current-page="queryParams.pageNo"
            v-model:page-size="queryParams.pageSize"
            small
            layout="prev, pager, next"
            :total="total"
            @current-change="getList"
          />
        </div>
      </div>

      <div 
        v-show="!isMobile || mobileTab === 'detail'" 
        class="detail-wrapper"
        ref="detailWrapperRef"
        @scroll="handleDetailScroll"
      >
        <div ref="detailContentRef">
          <TaskDetailBoard
            v-if="currentTask"
            :task="currentTask"
            @refresh="getTaskDetail(currentTaskId)"
            @deleted="onTaskDeleted"
          />
        </div>
        <div v-if="!currentTask" class="empty-state">
          <div class="empty-content">
            <el-icon class="huge-icon"><Monitor /></el-icon>
            <h3>请选择一个复刻任务以查看详情</h3>
            <p>在这里您可以管理视频的关键帧、AI洗图素材以及最终的合成作品。</p>
            <el-button type="primary" plain @click="handleOpenUpload">发起新任务</el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="currentTaskId" class="floating-refresh-btn" @click="getTaskDetail(currentTaskId)" title="手动刷新当前任务详情">
      <el-icon :class="{ 'is-loading': loadingFrames }"><Refresh /></el-icon>
      <span class="btn-text">刷新</span>
    </div>

    <UploadTaskDialog ref="uploadDialogRef" @success="getList" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, VideoPlay, Clock, Monitor, Refresh, VideoCamera, Delete } from '@element-plus/icons-vue'
import { listVideoReproduce, getVideoReproduce, getFrames, delVideoReproduce } from '@/api/business/videoReproduce'
import { formatDate } from '@/utils/formatTime'
import TaskDetailBoard from './components/TaskDetailBoard.vue'
import UploadTaskDialog from './components/UploadTaskDialog.vue'

defineOptions({ name: 'VideoReproduction' })

const route = useRoute()
const router = useRouter()
const message = useMessage()
const loading = ref(false)
const loadingFrames = ref(false)
const total = ref(0)
const taskList = ref<any[]>([])
const currentTaskId = ref<number | null>(null)
const currentTask = ref<any>(null)
const mobileTab = ref<'tasks' | 'detail'>('tasks')
const isMobile = ref(false)
const taskGridRef = ref<HTMLElement | null>(null)
const detailWrapperRef = ref<HTMLElement | null>(null)
const detailContentRef = ref<HTMLElement | null>(null)
const isRestoringScroll = ref(false)
let detailResizeObserver: ResizeObserver | null = null
let scrollRestorationTimer: any = null
const mobileTabOptions = [
  { label: '任务列表', value: 'tasks' },
  { label: '任务详情', value: 'detail' }
]

const getTaskId = (task: any) => task?.id ?? task?.taskId ?? null

const STORAGE_KEY_PAGE = 'video_reproduce_page'
const savedPage = localStorage.getItem(STORAGE_KEY_PAGE)
const queryParams = reactive({ 
  pageNo: savedPage ? Number(savedPage) : 1, 
  pageSize: 10 
})

const getList = async () => {
  loading.value = true
  try {
    const res = await listVideoReproduce(queryParams)
    taskList.value = res.rows
    total.value = res.total
    
    // 优先从 URL 恢复当前任务
    const urlTaskId = route.query.taskId ? Number(route.query.taskId) : null
    
    // 恢复列表滚动位置 (延时确保 DOM 渲染完成)
    isRestoringScroll.value = true
    console.log('[Scroll] 启动列表滚动恢复')
    setTimeout(() => {
      if (taskGridRef.value) {
        const savedPos = localStorage.getItem('video_reproduce_list_scroll')
        console.log('[Scroll] 列表保存位置:', savedPos)
        if (savedPos) taskGridRef.value.scrollTop = Number(savedPos)
      }
      setTimeout(() => { 
        isRestoringScroll.value = false 
        console.log('[Scroll] 列表恢复锁定解除')
      }, 100)
    }, 150)

    if (urlTaskId) {
      const found = taskList.value.find(t => getTaskId(t) === urlTaskId)
      if (found) {
        if (currentTaskId.value !== urlTaskId) {
          selectTask(found, false) // 恢复时不更新 URL
        }
        return
      }
    }

    if (!currentTaskId.value && taskList.value.length > 0) selectTask(taskList.value[0])
    else if (currentTaskId.value && !taskList.value.some(t => getTaskId(t) === currentTaskId.value) && taskList.value.length > 0) selectTask(taskList.value[0])
  } finally {
    loading.value = false
  }
}

const selectTask = (item: any, updateUrl = true) => {
  const taskId = getTaskId(item)
  currentTaskId.value = taskId
  if (updateUrl) {
    router.replace({ query: { ...route.query, taskId } })
  }
  if (isMobile.value) mobileTab.value = 'detail'
  getTaskDetail(taskId)
}

const getTaskDetail = async (id: number | null) => {
  if (!id) return
  loadingFrames.value = true
  try {
    const task = await getVideoReproduce(id)
    const frames = await getFrames(id)
    task.frames = frames
    currentTask.value = task
    // 滚动恢复逻辑已移至 watch(currentTask) 中，通过 ResizeObserver 智能处理
  } catch (e) {
    console.error('获取详情失败', e)
  } finally {
    loadingFrames.value = false
  }
}

// 智能滚动恢复逻辑：监听内容高度变化，直到能够滚动到目标位置
watch(() => currentTask.value, (newTask) => {
  if (!newTask) {
    console.log('[Scroll] currentTask 为空，跳过恢复')
    return 
  }

  const id = getTaskId(newTask)
  const savedPos = localStorage.getItem(`video_reproduce_detail_scroll_${id}`)
  const targetPos = savedPos ? Number(savedPos) : 0
  
  console.log(`[Scroll] 准备恢复任务 ${id} 的详情位置:`, targetPos)

  // 清除之前的观察和定时器
  if (detailResizeObserver) detailResizeObserver.disconnect()
  if (scrollRestorationTimer) clearTimeout(scrollRestorationTimer)

  if (targetPos <= 0) {
    console.log('[Scroll] 目标位置为 0，直接重置')
    nextTick(() => {
      if (detailWrapperRef.value) detailWrapperRef.value.scrollTop = 0
    })
    return
  }

  isRestoringScroll.value = true
  console.log('[Scroll] 开启详情恢复锁定')
  
  const attemptScroll = () => {
    if (detailWrapperRef.value) {
      const el = detailWrapperRef.value
      // 使用立即跳转，避免平滑滚动带来的位置偏差
      el.scrollTop = targetPos
      
      const isReached = Math.abs(el.scrollTop - targetPos) < 1
      
      if (isReached) {
        // 只有真正精准到达了目标位置，才断开观察
        console.log('[Scroll] 详情精准恢复完成')
        detailResizeObserver?.disconnect()
        detailResizeObserver = null
        clearTimeout(scrollRestorationTimer)
        setTimeout(() => { isRestoringScroll.value = false }, 200)
      } else {
        // 如果还没到达目标位置（可能是图片还没加载出来导致高度不够），
        // 我们不执行 disconnect，ResizeObserver 会在内容高度变化时再次触发此函数
        console.log(`[Scroll] 尝试中... 当前: ${el.scrollTop}, 目标: ${targetPos}, 内容总高: ${el.scrollHeight} (高度不足，等待内容撑开...)`)
      }
    }
  }

  detailResizeObserver = new ResizeObserver(() => {
    attemptScroll()
  })

  nextTick(() => {
    if (detailContentRef.value) {
      console.log('[Scroll] 启动内容容器 ResizeObserver')
      detailResizeObserver?.observe(detailContentRef.value)
      
      // 立即尝试一次
      attemptScroll()

      scrollRestorationTimer = setTimeout(() => {
        if (detailResizeObserver) {
          console.warn('[Scroll] 详情恢复超时（8秒），强制停止')
          detailResizeObserver.disconnect()
          detailResizeObserver = null
          isRestoringScroll.value = false
        }
      }, 8000) // 弱网环境下给更多时间
    } else {
      console.error('[Scroll] 找不到 detailContentRef')
    }
  })
})

const onTaskDeleted = () => {
  currentTaskId.value = null
  currentTask.value = null
  mobileTab.value = 'tasks'
  getList()
}

const handleDeleteTask = async (task: any) => {
  const taskId = getTaskId(task)
  try {
    await message.confirm(`确定删除任务号为 [${taskId.toString().slice(-6)}] 的任务吗？`)
    await delVideoReproduce(taskId)
    message.success('删除成功')
    if (currentTaskId.value === taskId) {
      currentTaskId.value = null
      currentTask.value = null
      router.replace({ query: { ...route.query, taskId: undefined } })
    }
    getList()
  } catch {}
}

const playVideo = (e: any) => e.target.play()
const pauseVideo = (e: any) => e.target.pause()

const handleListScroll = () => {
  if (isRestoringScroll.value) return
  if (taskGridRef.value) {
    const pos = taskGridRef.value.scrollTop
    console.log('[Scroll] 列表滚动保存:', pos)
    localStorage.setItem('video_reproduce_list_scroll', pos.toString())
  }
}

const handleDetailScroll = () => {
  if (isRestoringScroll.value) {
    console.log('[Scroll] 正在恢复中，忽略滚动事件保存')
    return
  }
  if (detailWrapperRef.value && currentTaskId.value) {
    const pos = detailWrapperRef.value.scrollTop
    if (pos > 0) {
      console.log(`[Scroll] 任务 ${currentTaskId.value} 详情滚动保存:`, pos)
      localStorage.setItem(`video_reproduce_detail_scroll_${currentTaskId.value}`, pos.toString())
    }
  }
}

const getStatusType = (status: any) => ({ '0': 'info', '1': 'primary', '2': 'primary', '3': 'success', '4': 'warning', '5': 'success', '9': 'danger', '10': 'success', RUNNING: 'primary', COMPLETED: 'success', FAILED: 'danger' }[status] || 'info')
const getStatusLabel = (status: any) => ({ '0': '待处理', '1': '视频分析中', '2': '截帧中', '3': '分析完成', '4': '生成视频中', '5': '已完成', '9': '失败', '10': '分析完成', RUNNING: '分析中', COMPLETED: '分析完成', FAILED: '失败' }[status] || status || '未知')

const uploadDialogRef = ref()
const handleOpenUpload = () => uploadDialogRef.value.open()

const updateMobileState = () => {
  const wasMobile = isMobile.value
  isMobile.value = window.innerWidth <= 768
  
  // 仅当从非移动端切换到移动端，且没有选中任务时，才重置为 tasks 列表
  if (!wasMobile && isMobile.value && !currentTask.value) {
    mobileTab.value = 'tasks'
  }
  // 如果当前有任务，且在移动端，确保是在详情页
  if (isMobile.value && currentTask.value && mobileTab.value === 'tasks' && !wasMobile) {
    mobileTab.value = 'detail'
  }
}

watch(() => queryParams.pageNo, (val) => {
  localStorage.setItem(STORAGE_KEY_PAGE, val.toString())
})

onMounted(() => {
  console.log('[Mode] 切换为纯手动刷新模式，已禁用自动轮询')
  updateMobileState()
  window.addEventListener('resize', updateMobileState)
  getList()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
  if (detailResizeObserver) detailResizeObserver.disconnect()
  if (scrollRestorationTimer) clearTimeout(scrollRestorationTimer)
})
</script>

<style scoped>
.video-reproduce-container { padding: 20px; background-color: #f0f2f5; min-height: calc(100vh - 84px); }
.banner-card { margin-bottom: 20px; border-radius: 8px; }
.banner-content .title { margin: 0 0 8px 0; font-size: 24px; font-weight: bold; display: flex; align-items: center; }
.banner-content .subtitle { margin: 0; color: #909399; font-size: 14px; }
.banner-card :deep(.el-card__body) { display: flex; justify-content: space-between; align-items: center; }
.mobile-tabs { display: none; margin-bottom: 12px; }
.main-content { display: flex; gap: 20px; height: calc(100vh - 200px); }
.task-grid { width: 320px; display: flex; flex-direction: column; gap: 16px; padding-right: 8px; flex-shrink: 0; overflow-y: auto; }
.detail-wrapper { flex: 1; min-width: 0; overflow-y: auto; }
.task-card { border: 1px solid #ebeef5; background-color: #fff; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); }
.task-card.active { border-color: #409eff; background-color: #ecf5ff; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.task-id { font-weight: bold; }
.task-preview { height: 140px; border-radius: 6px; overflow: hidden; background: #f5f7fa; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; position: relative; }
.play-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 40px; color: rgba(255,255,255,0.8); opacity: 0; transition: opacity .3s; }
.task-preview:hover .play-overlay { opacity: 1; }
.mini-video { width: 100%; height: 100%; object-fit: cover; }
.video-placeholder { color: #909399; font-size: 14px; }
.time-info { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 4px; }
.empty-state { flex: 1; background: #fff; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: #909399; text-align: center; min-height: 320px; }
.huge-icon { font-size: 80px; margin-bottom: 20px; opacity: 0.2; }
.floating-refresh-btn { position: fixed; right: 30px; bottom: 40px; width: 56px; height: 56px; background: linear-gradient(135deg, #6366f1 0%, #3b82f6 100%); color: white; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(59,130,246,0.4); z-index: 2000; }
.btn-text { font-size: 10px; margin-top: 2px; font-weight: bold; }
.is-loading { animation: rotating 2s linear infinite; }
@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.pagination-mini { margin-top: auto; display: flex; justify-content: center; padding-top: 10px; }
@media (max-width: 768px) {
  .video-reproduce-container { padding: 12px; }
  .banner-card :deep(.el-card__body) { flex-direction: column; align-items: flex-start; gap: 12px; }
  .mobile-tabs { display: block; }
  /* 关键：修复移动端滚动监听失效。必须给容器固定高度，使其内部产生滚动条，而不是整个页面滚动 */
  .main-content { 
    display: block; 
    height: calc(100vh - 160px) !important; 
    overflow: hidden; 
  }
  .task-grid, .detail-wrapper { 
    width: 100%; 
    height: 100%; 
    overflow-y: auto !important; 
    -webkit-overflow-scrolling: touch; 
  }
  .task-grid { padding-right: 0; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .task-preview { height: 180px; }
  .empty-state { min-height: 260px; padding: 24px 12px; }
  .floating-refresh-btn { right: 14px; bottom: 14px; width: 52px; height: 52px; }
  .btn-text { display: none; }
}
</style>