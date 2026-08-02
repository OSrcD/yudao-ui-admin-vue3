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
      <el-form-item label="搜索关键词" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="请输入搜索关键词"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="笔记ID" prop="noteId">
        <el-input
          v-model="queryParams.noteId"
          placeholder="请输入笔记ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="笔记类型" prop="noteType">
        <el-select
          v-model="queryParams.noteType"
          placeholder="请选择笔记类型"
          clearable
          class="!w-150px"
        >
          <el-option label="图文" :value="1" />
          <el-option label="视频" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="笔记标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入笔记标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="用户名称" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入作者名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="数据排序">
        <el-select
          v-model="currentSortOption"
          placeholder="默认排序"
          clearable
          @change="onSortOptionChange"
          class="!w-170px"
        >
          <el-option label="点赞最多 ❤️" value="likedCount:desc" />
          <el-option label="点赞最少 ❤️" value="likedCount:asc" />
          <el-option label="收藏最多 ⭐" value="collectedCount:desc" />
          <el-option label="收藏最少 ⭐" value="collectedCount:asc" />
          <el-option label="评论最多 💬" value="commentsCount:desc" />
          <el-option label="评论最少 💬" value="commentsCount:asc" />
          <el-option label="发布时间最新 🕒" value="publishTime:desc" />
          <el-option label="发布时间最旧 🕒" value="publishTime:asc" />
          <el-option label="采集时间最新 🕒" value="createTime:desc" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          :type="expandAllComments ? 'warning' : 'primary'"
          plain
          @click="toggleExpandAllComments"
        >
          <Icon :icon="expandAllComments ? 'ep:arrow-up' : 'ep:arrow-down'" class="mr-5px" />
          {{ expandAllComments ? '折叠所有评论' : '展开所有评论' }}
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleUpdateAllValid"
        >
          <Icon icon="ep:check" class="mr-5px" /> 全部恢复有效链接
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 (卡片视图：笔记与评论 100% 等宽蓝色 Header 框) -->
  <ContentWrap>
    <!-- 快捷排序与记录统计工具栏 -->
    <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 flex-wrap gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-bold text-gray-500 flex items-center gap-1">
          <Icon icon="ep:sort" /> 快捷排序：
        </span>
        <el-button
          size="small"
          :type="queryParams.sortFields === 'likedCount:desc' ? 'primary' : 'default'"
          @click="setQuickSort('likedCount:desc')"
        >
          ❤️ 点赞最多
        </el-button>
        <el-button
          size="small"
          :type="queryParams.sortFields === 'collectedCount:desc' ? 'primary' : 'default'"
          @click="setQuickSort('collectedCount:desc')"
        >
          ⭐ 收藏最多
        </el-button>
        <el-button
          size="small"
          :type="queryParams.sortFields === 'commentsCount:desc' ? 'primary' : 'default'"
          @click="setQuickSort('commentsCount:desc')"
        >
          💬 评论最多
        </el-button>
        <el-button
          size="small"
          :type="queryParams.sortFields === 'publishTime:desc' ? 'primary' : 'default'"
          @click="setQuickSort('publishTime:desc')"
        >
          🕒 发布时间最新
        </el-button>
        <el-button
          v-if="queryParams.sortFields"
          size="small"
          type="info"
          plain
          @click="setQuickSort(undefined)"
        >
          重置排序
        </el-button>
      </div>

      <div class="text-xs text-gray-400 font-mono">
        共找到 <span class="font-bold text-blue-600 text-sm">{{ total }}</span> 篇笔记
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div class="flex items-center gap-3 pb-3 mb-3 border-b border-slate-200 flex-wrap">
      <el-checkbox :model-value="isAllSelected" @change="toggleSelectAll" :indeterminate="selectedIds.length > 0 && !isAllSelected">
        全选
      </el-checkbox>
      <span v-if="selectedIds.length > 0" class="text-sm text-blue-600 font-medium">
        已选 {{ selectedIds.length }} 篇
      </span>
      <el-button
        v-if="selectedIds.length > 0"
        type="primary"
        size="small"
        @click="handleBatchMonitor"
      >
        <Icon icon="ep:view" class="mr-1" /> 批量添加监控
      </el-button>
      <el-button
        v-if="selectedIds.length > 0"
        type="danger"
        size="small"
        @click="handleBatchDelete"
      >
        <Icon icon="ep:delete" class="mr-1" /> 批量删除
      </el-button>
      <el-button
        v-if="selectedIds.length > 0"
        size="small"
        @click="selectedIds.length = 0"
      >
        取消选择
      </el-button>
    </div>

    <div v-loading="loading" class="space-y-5">
      <div v-if="!list || list.length === 0" class="py-12 text-center text-gray-400">
        暂无符合条件的笔记采集数据
      </div>

      <div
        v-for="item in list"
        :key="item.id"
        :class="[
          'rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md',
          selectedIds.includes(item.id) ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-blue-500'
        ]"
      >
        <!-- 1. 笔记主卡片顶部蓝色 Header -->
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-3 flex flex-col gap-3 shadow-sm">
          
          <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
            <!-- 左侧/上方区: Checkbox, 标签, 标题 -->
            <div class="flex flex-col gap-2 min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <el-checkbox
                  :model-value="selectedIds.includes(item.id)"
                  @change="toggleSelectItem(item.id)"
                  class="!text-white shrink-0"
                  @click.stop
                />
                <span class="bg-white text-blue-800 font-extrabold px-2.5 py-0.5 rounded text-xs shrink-0 shadow-sm">
                  📌 笔记
                </span>
                <span class="text-xs text-blue-200 font-mono shrink-0">
                  (ID: {{ item.noteId }})
                </span>
                <el-tag :type="item.noteType === 2 ? 'danger' : 'primary'" effect="dark" size="small" class="shrink-0 font-bold">
                  {{ item.noteType === 2 ? '🎬 视频' : '🖼️ 图文' }}
                </el-tag>
                <el-tag v-if="item.keyword" type="warning" effect="dark" size="small" class="shrink-0 font-bold">
                  🔍 {{ item.keyword }}
                </el-tag>
                <el-tag v-if="item.isLinkInvalid" type="danger" effect="dark" size="small" class="shrink-0 font-bold">
                  ❌ 链接已失效
                </el-tag>
              </div>
              
              <!-- 标题区域，支持多行显示 -->
              <div class="font-bold text-base text-white leading-snug break-words">
                《{{ item.title || '无标题' }}》
              </div>
            </div>

            <!-- 右侧/下方区: 操作按钮与时间 -->
            <div class="flex flex-col lg:items-end gap-2 shrink-0">
              <div class="flex items-center gap-2 flex-wrap lg:justify-end">
                <el-button size="small" type="primary" plain class="!bg-white !text-blue-700 !border-white hover:!bg-blue-50 !font-bold" @click="copyText(item.noteUrl, '笔记链接')">
                  链接
                </el-button>
                <el-button size="small" type="success" class="!font-bold" @click="copyText(item.shellCmd, 'Shell 命令')">
                  Shell
                </el-button>
                <el-button size="small" type="warning" class="!font-bold" @click="showRawJson(item)">
                  JSON
                </el-button>
                <el-button
                  size="small"
                  :type="item.isMonitored ? 'warning' : 'success'"
                  class="!font-bold"
                  @click="handleToggleMonitor(item)"
                >
                  {{ item.isMonitored ? '🔕 取消监控' : '👁️ 监控' }}
                </el-button>
                <el-button size="small" type="danger" link class="!text-rose-200 hover:!text-white" @click="handleDelete(item.id)">
                  删除
                </el-button>
              </div>
              <span
                class="text-xs text-white font-mono font-bold bg-blue-900/60 px-2.5 py-1 rounded-md shadow-xs border border-blue-300/40 inline-flex items-center gap-1 self-start lg:self-end"
                v-if="item.publishTime"
              >
                🕒 发布时间: {{ item.publishTime }}
                <span v-if="formatRelativeTime(item.publishTime)" class="text-xs text-amber-300 font-normal ml-1">
                  ({{ formatRelativeTime(item.publishTime) }})
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- 2. 笔记内容区 (主体区域) -->
        <div class="p-4 bg-slate-50/40 flex items-center justify-between gap-4 flex-wrap">
          <!-- 笔记描述 (高亮框) -->
          <div class="flex-1 min-w-[280px]">
            <div class="flex items-center gap-1 mb-1">
              <span class="bg-blue-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                📝 笔记描述
              </span>
            </div>
            <div class="text-sm font-medium text-gray-900 leading-relaxed bg-blue-50/90 p-3 rounded-lg border-2 border-blue-200 border-l-4 border-l-blue-600 shadow-sm">
              {{ item.noteDesc || '暂无描述' }}
            </div>
            
            <div class="mt-2 text-xs bg-white p-2 rounded border border-slate-200 space-y-1 shadow-xs" v-if="item.pcShareLink || item.lastPcShareCollectTime || item.lastCommentCollectTime || item.isLinkInvalid">
              <div class="flex items-center gap-2" v-if="item.pcShareLink">
                <span class="font-bold text-gray-600 shrink-0">🔗 PC分享链接:</span>
                <a :href="item.pcShareLink" target="_blank" :class="['hover:underline truncate max-w-xs sm:max-w-md', item.isLinkInvalid ? 'text-gray-400 line-through' : 'text-blue-600']">{{ item.pcShareLink }}</a>
                <el-button link type="primary" size="small" @click="copyText(item.pcShareLink, 'PC分享链接')" class="shrink-0" v-if="!item.isLinkInvalid">复制</el-button>
                <el-tag v-if="item.isLinkInvalid" type="danger" size="small" effect="plain" class="shrink-0 ml-1">已失效</el-tag>
              </div>
              <div class="flex items-center gap-4 text-gray-500 mt-1 flex-wrap">
                <span v-if="item.lastPcShareCollectTime" class="flex items-center gap-1">
                  <Icon icon="ep:clock" /> PC采集时间: <span class="font-mono text-blue-600">{{ formatTimestamp(item.lastPcShareCollectTime) }}</span>
                </span>
                <span v-if="item.lastCommentCollectTime" class="flex items-center gap-1">
                  <Icon icon="ep:clock" /> 评论采集时间: <span class="font-mono text-emerald-600">{{ formatTimestamp(item.lastCommentCollectTime) }}</span>
                </span>
                <span v-if="item.isLinkInvalid && item.linkInvalidTime" class="flex items-center gap-1">
                  <Icon icon="ep:warning" class="text-red-500" /> 失效时间: <span class="font-mono text-red-500">{{ formatTimestamp(item.linkInvalidTime) }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- 作者信息 -->
          <div class="w-[220px] shrink-0 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs text-xs text-gray-600 space-y-1">
            <div class="font-bold text-sm text-gray-800 flex items-center gap-1">
              👤 {{ item.userName || '未知作者' }}
            </div>
            <div class="text-gray-400">UID: {{ item.userId || 'N/A' }}</div>
            <div class="text-gray-400" v-if="item.redId">小红书号: {{ item.redId }}</div>
          </div>

          <!-- 互动数据与评论列表展开按钮 -->
          <div class="flex items-center gap-4 shrink-0 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
            <div class="flex flex-col items-center px-1">
              <span class="text-xs text-gray-400">点赞</span>
              <span class="text-rose-500 font-bold text-sm">❤️ {{ item.likedCount || 0 }}</span>
            </div>
            <div class="h-6 w-px bg-gray-200"></div>
            <div class="flex flex-col items-center px-1">
              <span class="text-xs text-gray-400">收藏</span>
              <span class="text-amber-500 font-bold text-sm">⭐ {{ item.collectedCount || 0 }}</span>
            </div>
            <div class="h-6 w-px bg-gray-200"></div>
            <div class="flex flex-col items-center px-1">
              <span class="text-xs text-gray-400 mb-0.5">评论列表</span>
              <el-tag
                v-if="item.commentsCount && item.commentsCount > 0"
                type="primary"
                class="cursor-pointer font-bold"
                @click="toggleRowExpansionSingle(item)"
              >
                💬 {{ item.commentsCount }} 条 {{ expandedRowKeys.includes(item.id) ? '▲ 折叠' : '▼ 展开' }}
              </el-tag>
              <el-tag v-else type="info" size="small">
                💬 0 条评论
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 3. 下方：属于该笔记的评论区 (100% 宽度全长蓝色 Header，与上边笔记 Header 绝对平齐!) -->
        <div
          v-if="expandedRowKeys.includes(item.id) && (commentsLoadingMap[item.noteId] || (commentsMap[item.noteId] && commentsMap[item.noteId].length > 0))"
          class="border-t-2 border-blue-400 bg-blue-50/70 p-4"
        >
          <div class="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-blue-200">
            <div class="flex items-center gap-3">
              <span class="bg-amber-400 text-gray-900 font-extrabold px-2.5 py-0.5 rounded text-xs shadow-sm">
                💬 评论明细
              </span>
              <el-tag type="primary" effect="dark" size="small" class="rounded-full">
                共 {{ commentsMap[item.noteId]?.length || 0 }} 条显示
              </el-tag>
            </div>
            <div class="flex items-center gap-2">
              <el-button size="small" type="warning" plain @click="fetchCommentsForNote(item.noteId, true)">
                <Icon icon="ep:refresh" class="mr-1" /> 刷新
              </el-button>
              <el-button size="small" type="primary" @click="goToCommentPage(item.noteId)">
                评论跟进 <Icon icon="ep:arrow-right" class="ml-1" />
              </el-button>
            </div>
          </div>

          <!-- 评论明细卡片列表 -->
          <div v-if="commentsLoadingMap[item.noteId]" class="py-6 text-center text-blue-600 bg-white/90 rounded-lg shadow-inner">
            <Icon icon="ep:loading" class="is-loading text-2xl mb-1" />
            <div class="text-xs font-medium mt-1">正在载入该笔记的评论列表...</div>
          </div>

          <div v-else class="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
            <div
              v-for="(comment, index) in commentsMap[item.noteId]"
              :key="comment.id"
              :class="[
                'p-3 rounded-lg border transition-all flex gap-3 items-start',
                comment.isAuthor === 1
                  ? 'bg-rose-50/90 border-rose-300 shadow-sm'
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400'
              ]"
            >
              <!-- 楼层序号与头像 -->
              <div class="flex flex-col items-center gap-1 shrink-0">
                <span class="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  #{{ index + 1 }}
                </span>
                <el-avatar :src="comment.avatar" :size="34" class="border-2 border-white shadow-sm">
                  {{ comment.nickname ? comment.nickname.substring(0, 1) : 'U' }}
                </el-avatar>
              </div>

              <!-- 评论卡片主体 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-bold text-sm text-gray-900">{{ comment.nickname || '匿名用户' }}</span>
                    <el-tag v-if="comment.isAuthor === 1" type="danger" size="small" effect="dark" class="font-bold">
                      📌 帖子作者
                    </el-tag>
                    <span class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded" v-if="comment.redId">
                      小红书号: {{ comment.redId }}
                    </span>
                    <el-tag :type="getInterceptTagType(comment.interceptStatus)" size="small" effect="plain" class="font-medium">
                      {{ getInterceptStatusText(comment.interceptStatus) }}
                    </el-tag>
                  </div>
                  <div class="text-xs text-gray-400 font-mono" v-if="comment.ipLocation">
                    📍 {{ comment.ipLocation }}
                  </div>
                </div>

                <!-- 评论内容框 (评论时间直接紧跟在内容旁边，加粗加大显示并附带相对时间) -->
                <div class="p-2.5 bg-slate-50 rounded-md border border-slate-200 text-gray-900 text-sm font-medium leading-relaxed">
                  <span class="whitespace-pre-wrap">{{ comment.content }}</span>
                  <span
                    class="text-sm text-slate-700 font-mono font-bold ml-2.5 inline-block whitespace-nowrap bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/50 shadow-2xs"
                    v-if="comment.commentTime"
                  >
                    🕒 {{ comment.commentTime }}
                    <span v-if="formatRelativeTime(comment.commentTime)" class="text-xs text-blue-700 font-medium ml-1">
                      ({{ formatRelativeTime(comment.commentTime) }})
                    </span>
                  </span>
                </div>

                <div class="flex items-center justify-between flex-wrap gap-2 mt-2 pt-1 text-xs text-gray-500">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium border border-rose-100">
                      ❤️ 点赞 <strong class="text-rose-700">{{ comment.likeCount || 0 }}</strong>
                    </span>
                    <span v-if="comment.subCommentCount" class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">
                      💬 子回复 <strong class="text-blue-700">{{ comment.subCommentCount }}</strong>
                    </span>
                  </div>
                  <div v-if="comment.remark" class="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                    📝 备注: {{ comment.remark }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 完整 JSON 视角对话框 -->
  <el-dialog v-model="jsonDialogVisible" title="完整帖子原始 JSON 数据" width="700px" destroy-on-close>
    <el-input
      v-model="formattedJson"
      type="textarea"
      :rows="18"
      readonly
      style="font-family: monospace"
    />
    <template #footer>
      <el-button @click="jsonDialogVisible = false">关闭</el-button>
      <el-button type="primary" @click="copyText(formattedJson, '完整 JSON')">复制 JSON</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { getXhsNoteCollectPage, deleteXhsNoteCollect, deleteXhsNoteCollectBatch, updateAllNotesValid, updateNoteMonitorStatus, XhsNoteCollectVO } from '@/api/business/xhsNoteCollect'
import { getXhsNoteCommentPage, XhsNoteCommentVO } from '@/api/business/xhsNoteComment'

defineOptions({ name: 'BusinessXhsNoteCollect' })

const formatTimestamp = (val: any) => {
  if (!val) return ''
  if (/^\d{13}$/.test(String(val))) {
    return formatDate(new Date(Number(val)))
  }
  return formatDate(val)
}

const route = useRoute()
const router = useRouter()
const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref<XhsNoteCollectVO[]>([])
const queryParams = reactive<{
  pageNo: number
  pageSize: number
  keyword?: string
  noteId?: string
  noteType?: number
  title?: string
  userName?: string
  publishTimeAsc?: boolean
  sortField?: string
  sortOrder?: string
  sortFields?: string
}>({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined,
  noteId: undefined,
  noteType: undefined,
  title: undefined,
  userName: undefined,
  publishTimeAsc: undefined,
  sortField: undefined,
  sortOrder: undefined,
  sortFields: undefined
})
const queryFormRef = ref()

// 全局展开评论控制与数据映射
const expandAllComments = ref(true)
const expandedRowKeys = ref<number[]>([])
const commentsMap = reactive<Record<string, XhsNoteCommentVO[]>>({})
const commentsLoadingMap = reactive<Record<string, boolean>>({})

// 多列组合排序缓存表
const activeSortsMap = reactive<Record<string, 'asc' | 'desc'>>({})

// JSON 弹窗
const jsonDialogVisible = ref(false)
const formattedJson = ref('')

// 批量选择监控
const selectedIds = ref<number[]>([])
const isAllSelected = computed(() =>
  list.value.length > 0 && list.value.every((item) => selectedIds.value.includes(item.id))
)

const toggleSelectItem = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = list.value.map((item) => item.id)
  }
}

/** 单个添加/移除监控 */
const handleToggleMonitor = async (item: XhsNoteCollectVO) => {
  const newStatus = !item.isMonitored
  try {
    await updateNoteMonitorStatus([item.id], newStatus)
    item.isMonitored = newStatus
    message.success(newStatus ? '已添加监控' : '已移除监控')
  } catch {}
}

/** 批量添加监控 */
const handleBatchMonitor = async () => {
  if (selectedIds.value.length === 0) {
    message.warning('请先勾选要监控的笔记')
    return
  }
  try {
    await updateNoteMonitorStatus(selectedIds.value, true)
    message.success(`已批量添加 ${selectedIds.value.length} 篇笔记的监控`)
    selectedIds.value = []
    await getList()
  } catch {}
}

/** 批量删除笔记 */
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) {
    message.warning('请先勾选要删除的笔记')
    return
  }
  try {
    await message.confirm(`是否确认批量删除选中的 ${selectedIds.value.length} 篇笔记？`)
    await deleteXhsNoteCollectBatch(selectedIds.value)
    message.success('批量删除成功')
    selectedIds.value = []
    await getList()
  } catch {}
}

/** 将全部笔记改为有效链接 */
const handleUpdateAllValid = async () => {
  try {
    await message.confirm('是否确认将全部已被标记为失效的笔记重置为有效链接状态？')
    await updateAllNotesValid()
    message.success('已将全部笔记标记为有效链接')
    await getList()
  } catch {}
}

// 动态表格行样式 (展开时主笔记行与评论行形成整合高亮)
const tableRowClassName = ({ row }: { row: XhsNoteCollectVO }) => {
  if (expandedRowKeys.value.includes(row.id)) {
    return 'expanded-note-row'
  }
  return ''
}

// 截流跟进状态文案与 Tag
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
      return 'primary'
    case 2:
      return 'success'
    case 3:
      return 'info'
    default:
      return 'warning'
  }
}

/** 单个笔记评论加载 */
const fetchCommentsForNote = async (noteId: string, force = false) => {
  if (!noteId) return
  if (!force && commentsMap[noteId] !== undefined) return
  commentsLoadingMap[noteId] = true
  try {
    const res = await getXhsNoteCommentPage({
      noteId,
      pageNo: 1,
      pageSize: 100,
      sortFields: 'commentTime:desc'
    })
    commentsMap[noteId] = res.list || []
    
    // 如果无评论，从展开列表中移除，不展示空框
    if (commentsMap[noteId].length === 0) {
      const targetNote = list.value.find((item) => item.noteId === noteId)
      if (targetNote) {
        const idx = expandedRowKeys.value.indexOf(targetNote.id)
        if (idx > -1) {
          expandedRowKeys.value.splice(idx, 1)
        }
      }
    }
  } catch (error) {
    console.error(`获取笔记[${noteId}]评论失败`, error)
    commentsMap[noteId] = []
  } finally {
    commentsLoadingMap[noteId] = false
  }
}

/** 批量加载列表所有笔记评论 */
const fetchCommentsForNotes = async (noteIds: string[]) => {
  const promises = noteIds.filter((id) => !!id).map((id) => fetchCommentsForNote(id))
  await Promise.all(promises)
}

/** 全局展开/折叠所有评论切换 */
const toggleExpandAllComments = () => {
  expandAllComments.value = !expandAllComments.value
  if (expandAllComments.value) {
    // 仅展开有评论（commentsCount > 0 或未指定）的笔记
    const notesWithComments = list.value.filter((item) => item.commentsCount === undefined || item.commentsCount > 0)
    expandedRowKeys.value = notesWithComments.map((item) => item.id)
    fetchCommentsForNotes(notesWithComments.map((item) => item.noteId))
  } else {
    expandedRowKeys.value = []
  }
}

/** 切换单行展开/折叠 */
const toggleRowExpansionSingle = (row: XhsNoteCollectVO) => {
  if (row.commentsCount === 0) {
    message.warning('该笔记暂无评论')
    return
  }
  const index = expandedRowKeys.value.indexOf(row.id)
  if (index > -1) {
    expandedRowKeys.value.splice(index, 1)
  } else {
    expandedRowKeys.value.push(row.id)
    if (row.noteId) {
      fetchCommentsForNote(row.noteId)
    }
  }
  expandAllComments.value = list.value.length > 0 && expandedRowKeys.value.length === list.value.length
}

/** 监听表格展开行变化 */
const handleExpandChange = (row: XhsNoteCollectVO, expandedRows: XhsNoteCollectVO[]) => {
  expandedRowKeys.value = expandedRows.map((item) => item.id)
  const isExpanded = expandedRows.some((item) => item.id === row.id)
  if (isExpanded && row.noteId) {
    fetchCommentsForNote(row.noteId)
  }
  expandAllComments.value = list.value.length > 0 && expandedRowKeys.value.length === list.value.length
}

/** 跳转至评论跟进管理页面 */
const goToCommentPage = (noteId: string) => {
  router.push({
    path: '/business/xhs-note-comment',
    query: { noteId }
  })
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getXhsNoteCollectPage(queryParams)
    list.value = data.list
    total.value = data.total

    if (expandAllComments.value && list.value.length > 0) {
      // 仅展开有评论（commentsCount > 0）的笔记
      const notesWithComments = list.value.filter((item) => item.commentsCount === undefined || item.commentsCount > 0)
      expandedRowKeys.value = notesWithComments.map((item) => item.id)
      fetchCommentsForNotes(notesWithComments.map((item) => item.noteId))
    } else {
      expandedRowKeys.value = []
    }
  } finally {
    loading.value = false
  }
}

/** 排序变更 (支持多列叠加组合排序) */
const handleSortChange = ({ prop, order }: { prop: string; order: string }) => {
  if (order === 'ascending') {
    activeSortsMap[prop] = 'asc'
  } else if (order === 'descending') {
    activeSortsMap[prop] = 'desc'
  } else {
    delete activeSortsMap[prop]
  }

  const sortList: string[] = []
  for (const key in activeSortsMap) {
    if (activeSortsMap[key]) {
      sortList.push(`${key}:${activeSortsMap[key]}`)
    }
  }

  queryParams.sortFields = sortList.length > 0 ? sortList.join(',') : undefined
  handleQuery()
}

/** 计算距离现在的相对时间 (如: 3分钟前、2小时前、1天前、1个月前) */
const formatRelativeTime = (timeStr?: string) => {
  if (!timeStr) return ''
  try {
    const pubDate = new Date(timeStr.replace(/-/g, '/'))
    if (isNaN(pubDate.getTime())) return ''
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

const currentSortOption = ref<string | undefined>(undefined)

/** 改变下拉排序 */
const onSortOptionChange = (val?: string) => {
  queryParams.sortFields = val
  handleQuery()
}

/** 快捷排序控制 */
const setQuickSort = (val?: string) => {
  if (queryParams.sortFields === val) {
    queryParams.sortFields = undefined
    currentSortOption.value = undefined
  } else {
    queryParams.sortFields = val
    currentSortOption.value = val
  }
  handleQuery()
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.sortField = undefined
  queryParams.sortOrder = undefined
  queryParams.sortFields = undefined
  queryParams.publishTimeAsc = undefined
  currentSortOption.value = undefined
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

/** 格式化显示 JSON */
const showRawJson = (row: XhsNoteCollectVO) => {
  if (!row.rawJson) {
    formattedJson.value = '暂无原始 JSON 数据'
  } else {
    try {
      const obj = JSON.parse(row.rawJson)
      formattedJson.value = JSON.stringify(obj, null, 2)
    } catch (e) {
      formattedJson.value = row.rawJson
    }
  }
  jsonDialogVisible.value = true
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    await message.confirm('是否确认删除此采集记录？')
    await deleteXhsNoteCollect(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

/** 初始化 */
onMounted(() => {
  if (route.query.noteId) {
    queryParams.noteId = route.query.noteId as string
  }
  getList()
})
</script>

<style scoped>
:deep(.el-table__row) {
  border-left: 4px solid #3b82f6 !important;
}

:deep(.el-table__row.expanded-note-row) {
  background-color: #eff6ff !important;
  border-left: 6px solid #1d4ed8 !important;
}

:deep(.el-table__row.expanded-note-row > td) {
  border-top: 2px solid #3b82f6 !important;
  background-color: #eff6ff !important;
}

:deep(.el-table__expanded-cell) {
  padding: 0 8px 8px 8px !important;
  background-color: #eff6ff !important;
}
</style>


