<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="90px"
    >
      <el-form-item label="笔记ID" prop="noteId">
        <el-input
          v-model="queryParams.noteId"
          placeholder="请输入笔记ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="用户昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入评论者昵称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="小红书号" prop="redId">
        <el-input
          v-model="queryParams.redId"
          placeholder="小红书号/微信号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="评论关键词" prop="content">
        <el-input
          v-model="queryParams.content"
          placeholder="评论正文搜索"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="截流状态" prop="interceptStatus">
        <el-select
          v-model="queryParams.interceptStatus"
          placeholder="全部分组"
          clearable
          class="!w-160px"
        >
          <el-option label="未触达" :value="0" />
          <el-option label="已发私信" :value="1" />
          <el-option label="已加微信" :value="2" />
          <el-option label="意向偏低/无效" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="danger" plain @click="handleBatchDelete" :disabled="selectedIds.length === 0" v-hasPermi="['business:xhs-note-comment:delete']">
          <Icon icon="ep:delete" class="mr-5px" /> 批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      :default-sort="{ prop: 'commentTime', order: 'descending' }"
      @sort-change="handleSortChange"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="ID" align="center" prop="id" width="80" />
      <el-table-column label="评论用户" align="left" min-width="180">
        <template #default="scope">
          <div class="flex items-center gap-2">
            <el-avatar :src="scope.row.avatar" :size="36" class="shrink-0">
              {{ scope.row.nickname ? scope.row.nickname.substring(0, 1) : 'U' }}
            </el-avatar>
            <div class="flex flex-col min-w-0">
              <div class="font-bold text-gray-800 flex items-center gap-1">
                <span class="truncate">{{ scope.row.nickname || '匿名用户' }}</span>
                <el-tag v-if="scope.row.isAuthor === 1" type="danger" size="small">作者</el-tag>
              </div>
              <div class="text-xs text-gray-400" v-if="scope.row.redId">小红书号: {{ scope.row.redId }}</div>
              <div class="text-xs text-gray-400">ID: {{ scope.row.userId }}</div>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="评论正文" align="left" min-width="260">
        <template #default="scope">
          <div class="text-gray-800 text-sm font-medium whitespace-pre-wrap">{{ scope.row.content }}</div>
          <div class="flex items-center gap-3 text-xs text-gray-400 mt-1">
            <span>📍 {{ scope.row.ipLocation || '未知属地' }}</span>
            <span>❤️ 点赞 {{ scope.row.likeCount || 0 }}</span>
            <span v-if="scope.row.subCommentCount > 0">💬 回复 {{ scope.row.subCommentCount }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="评论时间" align="center" prop="commentTime" width="180" sortable="custom">
        <template #default="scope">
          <div class="font-medium text-gray-800">{{ scope.row.commentTime || '-' }}</div>
          <div class="text-xs text-gray-400 font-normal" v-if="scope.row.commentTime && formatRelativeTime(scope.row.commentTime)">
            ({{ formatRelativeTime(scope.row.commentTime) }})
          </div>
        </template>
      </el-table-column>

      <el-table-column label="创建时间" align="center" prop="createTime" width="180" sortable="custom">
        <template #default="scope">
          <div class="font-medium text-gray-800">{{ formatCreateTime(scope.row.createTime) }}</div>
          <div class="text-xs text-gray-400 font-normal" v-if="scope.row.createTime && formatRelativeTime(scope.row.createTime)">
            ({{ formatRelativeTime(scope.row.createTime) }})
          </div>
        </template>
      </el-table-column>

      <el-table-column label="关联笔记" align="left" min-width="280">
        <template #default="scope">
          <div class="text-sm font-medium text-gray-800 line-clamp-2 mb-1" :title="scope.row.noteTitle || '未知笔记'">
            <el-tag v-if="scope.row.noteIsMonitored" type="danger" effect="dark" size="small" class="mr-1 shrink-0 font-bold">
              🔥 监控笔记
            </el-tag>
            {{ scope.row.noteTitle || '未知笔记' }}
          </div>
          <div class="text-xs text-gray-400 mb-1" v-if="scope.row.notePublishTime">
            发布时间: {{ scope.row.notePublishTime }}
          </div>
          <div class="text-xs text-gray-500 line-clamp-2 mb-2" :title="scope.row.noteDesc || ''" v-if="scope.row.noteDesc">
            {{ scope.row.noteDesc }}
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <el-tag type="info" size="small" class="cursor-pointer" @click="copyNoteShellCmd(scope.row.noteId)" title="点击复制App跳转命令">
              📌 {{ scope.row.noteId }}
            </el-tag>
            <el-button link type="primary" size="small" @click="filterByNote(scope.row.noteId)">查该笔记评论</el-button>
            <el-button link type="success" size="small" @click="goToNoteCollect(scope.row.noteId)">跳转原笔记</el-button>
            <el-button v-if="scope.row.noteUrl" link type="primary" size="small" @click="copyText(scope.row.noteUrl, '笔记链接')" class="shrink-0">复制笔记链接</el-button>
            <el-button 
              link 
              :type="scope.row.noteIsMonitored ? 'danger' : 'primary'" 
              size="small" 
              @click="handleToggleMonitor(scope.row)" 
              class="shrink-0"
            >
              {{ scope.row.noteIsMonitored ? '取消监控' : '设为监控' }}
            </el-button>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="私信截流状态" align="center" width="140">
        <template #default="scope">
          <el-tag :type="getInterceptTagType(scope.row.interceptStatus)" size="small">
            {{ getInterceptStatusText(scope.row.interceptStatus) }}
          </el-tag>
          <div class="text-xs text-gray-500 mt-1" v-if="scope.row.remark">
            备注: {{ scope.row.remark }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" align="center" width="180">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openStatusDialog(scope.row)"
          >
            截流跟进
          </el-button>
          <el-button
            link
            type="info"
            @click="copyNoteShellCmd(scope.row.noteId)"
          >
            复制跳转命令
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 截流状态变更弹窗 -->
  <el-dialog v-model="statusDialogVisible" title="更新私信截流跟进状态" width="500px" append-to-body>
    <el-form :model="statusForm" label-width="100px">
      <el-form-item label="评论用户">
        <span class="font-bold">{{ statusForm.nickname }}</span> (小红书号: {{ statusForm.redId || '无' }})
      </el-form-item>
      <el-form-item label="评论内容">
        <div class="text-sm text-gray-600 bg-gray-50 p-2 rounded">{{ statusForm.content }}</div>
      </el-form-item>
      <el-form-item label="跟进状态" required>
        <el-radio-group v-model="statusForm.interceptStatus">
          <el-radio :value="0">未触达</el-radio>
          <el-radio :value="1">已发私信</el-radio>
          <el-radio :value="2">已加微信</el-radio>
          <el-radio :value="3">意向偏低/无效</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="跟进备注">
        <el-input
          v-model="statusForm.remark"
          type="textarea"
          placeholder="请输入跟进沟通记录或微信号等备注"
          rows="3"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="statusSubmitting" @click="submitStatusUpdate">保存记录</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage as message, ElMessageBox } from 'element-plus'
import {
  getXhsNoteCommentPage,
  updateXhsNoteCommentStatus,
  deleteXhsNoteComment,
  XhsNoteCommentVO,
  XhsNoteCommentPageReqVO
} from '@/api/business/xhsNoteComment'
import { updateNoteMonitorStatus } from '@/api/business/xhsNoteCollect'
import { formatDate } from '@/utils/formatTime'

defineOptions({ name: 'XhsNoteComment' })

const router = useRouter()
const loading = ref(false)
const list = ref<XhsNoteCommentVO[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])

const handleSelectionChange = (selection: XhsNoteCommentVO[]) => {
  selectedIds.value = selection.map((item) => item.id)
}

const queryParams = reactive<XhsNoteCommentPageReqVO>({
  pageNo: 1,
  pageSize: 10,
  noteId: '',
  nickname: '',
  redId: '',
  content: '',
  interceptStatus: undefined,
  sortFields: 'commentTime:desc'
})

const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await getXhsNoteCommentPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 解析时间：支持毫秒时间戳 / Date / 日期字符串 */
const parseToDate = (val?: string | number | Date) => {
  if (val === undefined || val === null || val === '') return null
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val
  const raw = String(val).trim()
  if (/^\d{13}$/.test(raw)) return new Date(Number(raw))
  if (/^\d{10}$/.test(raw)) return new Date(Number(raw) * 1000)
  const d = new Date(raw.replace(/-/g, '/').replace('T', ' '))
  return isNaN(d.getTime()) ? null : d
}

/** 入库创建时间展示 */
const formatCreateTime = (val?: string | number | Date) => {
  const d = parseToDate(val)
  if (!d) return val ? String(val) : '-'
  return formatDate(d) || '-'
}

/** 计算距离现在的相对时间 (如: 3分钟前、2小时前、1天前、1个月前) */
const formatRelativeTime = (val?: string | number | Date) => {
  const pubDate = parseToDate(val)
  if (!pubDate) return ''
  try {
    const now = new Date()
    const diffMs = now.getTime() - pubDate.getTime()
    if (diffMs < 0) return '刚刚'

    const seconds = Math.floor(diffMs / 1000)
    if (seconds < 60) return '刚刚'

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}分钟前`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}小时前`

    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}天前`

    const months = Math.floor(days / 30)
    if (months < 12) return `${months}个月前`

    const years = Math.floor(months / 12)
    return `${years}年前`
  } catch (e) {
    return ''
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 切换监控状态 */
const handleToggleMonitor = async (row: XhsNoteCommentVO) => {
  if (!row.noteCollectId) {
    message.warning('该笔记缺少关联的采集ID，无法操作')
    return
  }
  const newStatus = !row.noteIsMonitored
  try {
    await updateNoteMonitorStatus([row.noteCollectId], newStatus)
    message.success(`${newStatus ? '设置监控' : '取消监控'}成功`)
    row.noteIsMonitored = newStatus
  } catch (error) {
    // 异常由 axios 拦截器统一处理
  }
}

const resetQuery = () => {
  queryParams.sortFields = 'commentTime:desc'
  queryFormRef.value?.resetFields()
  handleQuery()
}

/** 复制文本通用函数 */
const copyText = (text?: string, name: string = '内容') => {
  if (!text) {
    message.warning('无有效内容可复制')
    return
  }
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${name}已成功复制到剪贴板`)
    }).catch(() => fallbackCopy(text, name))
  } else {
    fallbackCopy(text, name)
  }
}

const fallbackCopy = (val: string, name: string) => {
  const textArea = document.createElement('textarea')
  textArea.value = val
  textArea.style.position = 'fixed'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.select()
  try {
    document.execCommand('copy')
    message.success(`${name}已成功复制到剪贴板`)
  } catch (err) {
    message.error('复制失败')
  }
  document.body.removeChild(textArea)
}

/** 排序变更：单列互斥（点创建时间时清掉默认的评论时间排序） */
const handleSortChange = ({ prop, order }: { prop: string; order: string | null }) => {
  if (order === 'ascending') {
    queryParams.sortFields = `${prop}:asc`
  } else if (order === 'descending') {
    queryParams.sortFields = `${prop}:desc`
  } else {
    queryParams.sortFields = 'commentTime:desc'
  }
  handleQuery()
}

const filterByNote = (noteId: string) => {
  queryParams.noteId = noteId
  handleQuery()
}

const goToNoteCollect = (noteId: string) => {
  router.push({
    path: '/business/xhs-note-collect',
    query: { noteId }
  })
}

const getInterceptStatusText = (status?: number) => {
  switch (status) {
    case 1:
      return '已发私信'
    case 2:
      return '已加微信'
    case 3:
      return '意向偏低/无效'
    default:
      return '未触达'
  }
}

const getInterceptTagType = (status?: number) => {
  switch (status) {
    case 1:
      return 'warning'
    case 2:
      return 'success'
    case 3:
      return 'info'
    default:
      return 'danger'
  }
}

const copyNoteShellCmd = (noteId: string) => {
  if (!noteId) return
  const cmd = `adb shell am start -a android.intent.action.VIEW -d "xhsdiscover://item/${noteId}"`
  navigator.clipboard.writeText(cmd).then(() => {
    ElMessage.success('跳转 Shell 命令已成功复制到剪贴板！')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 状态变更弹窗
const statusDialogVisible = ref(false)
const statusSubmitting = ref(false)
const statusForm = reactive({
  id: 0,
  nickname: '',
  redId: '',
  content: '',
  interceptStatus: 0,
  remark: ''
})

const openStatusDialog = (row: XhsNoteCommentVO) => {
  statusForm.id = row.id
  statusForm.nickname = row.nickname || ''
  statusForm.redId = row.redId || ''
  statusForm.content = row.content || ''
  statusForm.interceptStatus = row.interceptStatus ?? 0
  statusForm.remark = row.remark || ''
  statusDialogVisible.value = true
}

const submitStatusUpdate = async () => {
  statusSubmitting.value = true
  try {
    await updateXhsNoteCommentStatus({
      id: statusForm.id,
      interceptStatus: statusForm.interceptStatus,
      remark: statusForm.remark
    })
    ElMessage.success('跟进状态更新成功！')
    statusDialogVisible.value = false
    getList()
  } finally {
    statusSubmitting.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该条评论记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteXhsNoteComment(id)
    ElMessage.success('删除成功')
    getList()
  } catch {}
}

const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(`确定要批量删除选中的 ${selectedIds.value.length} 条评论记录吗？`, '批量删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await Promise.all(selectedIds.value.map(id => deleteXhsNoteComment(id)))
    ElMessage.success('批量删除成功')
    selectedIds.value = []
    getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
