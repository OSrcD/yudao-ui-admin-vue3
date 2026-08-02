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
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
      <div class="flex items-center gap-3">
        <el-checkbox :model-value="isAllSelected" @change="toggleSelectAll" :indeterminate="selectedIds.length > 0 && !isAllSelected">
          全选
        </el-checkbox>
        <span v-if="selectedIds.length > 0" class="text-sm text-blue-600 font-medium">
          已选 {{ selectedIds.length }} 篇
        </span>
        <el-button
          v-if="selectedIds.length > 0"
          type="danger"
          size="small"
          @click="handleBatchRemoveMonitor"
        >
          <Icon icon="ep:delete" class="mr-1" /> 批量移除监控
        </el-button>
        <el-button v-if="selectedIds.length > 0" size="small" @click="selectedIds.length = 0">
          取消选择
        </el-button>
      </div>
      <div class="text-xs text-gray-400 font-mono">
        共监控 <span class="font-bold text-blue-600 text-sm">{{ total }}</span> 篇笔记
      </div>
    </div>

    <div v-loading="loading" class="space-y-5">
      <div v-if="!list || list.length === 0" class="py-12 text-center text-gray-400">
        暂无监控中的笔记
      </div>

      <div
        v-for="item in list"
        :key="item.id"
        :class="[
          'rounded-xl border-2 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md',
          selectedIds.includes(item.id) ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-purple-500'
        ]"
      >
        <!-- 卡片顶部 Header -->
        <div class="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white px-4 py-2.5 flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3 min-w-0">
            <el-checkbox
              :model-value="selectedIds.includes(item.id)"
              @change="toggleSelectItem(item.id)"
              class="!text-white shrink-0"
              @click.stop
            />
            <span class="bg-white text-purple-800 font-extrabold px-2.5 py-0.5 rounded text-xs shrink-0 shadow-sm">
              👁️ 监控
            </span>
            <span class="font-bold text-base text-white truncate" :title="item.title">
              《{{ item.title || '无标题' }}》
            </span>
            <span class="text-xs text-purple-200 font-mono shrink-0">
              (ID: {{ item.noteId }})
            </span>
            <el-tag :type="item.noteType === 2 ? 'danger' : 'primary'" effect="dark" size="small" class="ml-1 shrink-0 font-bold">
              {{ item.noteType === 2 ? '🎬 视频' : '🖼️ 图文' }}
            </el-tag>
            <el-tag v-if="item.keyword" type="warning" effect="dark" size="small" class="shrink-0 font-bold">
              🔍 {{ item.keyword }}
            </el-tag>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <span
              class="text-sm text-white font-mono font-bold bg-purple-900/60 px-2.5 py-1 rounded-md shadow-xs border border-purple-300/40 hidden sm:inline-flex items-center gap-1"
              v-if="item.publishTime"
            >
              🕒 {{ item.publishTime }}
            </span>
            <el-button size="small" type="primary" plain class="!bg-white !text-purple-700 !border-white hover:!bg-purple-50 !font-bold" @click="copyText(item.noteUrl, '笔记链接')">
              链接
            </el-button>
            <el-button
              size="small"
              type="warning"
              class="!font-bold"
              @click="handleRemoveMonitor(item)"
            >
              🔕 移除监控
            </el-button>
          </div>
        </div>

        <!-- 内容区 -->
        <div class="p-4 bg-slate-50/40 flex items-center justify-between gap-4 flex-wrap">
          <div class="flex-1 min-w-[280px]">
            <div class="flex items-center gap-1 mb-1">
              <span class="bg-purple-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                📝 笔记描述
              </span>
            </div>
            <div class="text-sm font-medium text-gray-900 leading-relaxed bg-purple-50/90 p-3 rounded-lg border-2 border-purple-200 border-l-4 border-l-purple-600 shadow-sm">
              {{ item.noteDesc || '暂无描述' }}
            </div>
          </div>

          <div class="w-[220px] shrink-0 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs text-xs text-gray-600 space-y-1">
            <div class="font-bold text-sm text-gray-800 flex items-center gap-1">
              👤 {{ item.userName || '未知作者' }}
            </div>
            <div class="text-gray-400">UID: {{ item.userId || 'N/A' }}</div>
            <div class="text-gray-400" v-if="item.redId">小红书号: {{ item.redId }}</div>
          </div>

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
              <span class="text-xs text-gray-400">评论</span>
              <span class="text-blue-500 font-bold text-sm">💬 {{ item.commentsCount || 0 }}</span>
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
</template>

<script setup lang="ts">
import { getXhsNoteMonitorPage, updateNoteMonitorStatus, XhsNoteCollectVO } from '@/api/business/xhsNoteCollect'

defineOptions({ name: 'BusinessXhsNoteMonitor' })

const message = useMessage()

const loading = ref(true)
const total = ref(0)
const list = ref<XhsNoteCollectVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  keyword: undefined as string | undefined,
  noteId: undefined as string | undefined,
  noteType: undefined as number | undefined,
  title: undefined as string | undefined,
  userName: undefined as string | undefined
})
const queryFormRef = ref()

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

/** 单个移除监控 */
const handleRemoveMonitor = async (item: XhsNoteCollectVO) => {
  try {
    await message.confirm(`是否确认移除笔记《${item.title || item.noteId}》的监控？`)
    await updateNoteMonitorStatus([item.id], false)
    message.success('已移除监控')
    await getList()
  } catch {}
}

/** 批量移除监控 */
const handleBatchRemoveMonitor = async () => {
  if (selectedIds.value.length === 0) {
    message.warning('请先勾选要移除监控的笔记')
    return
  }
  try {
    await message.confirm(`是否确认移除已选 ${selectedIds.value.length} 篇笔记的监控？`)
    await updateNoteMonitorStatus(selectedIds.value, false)
    message.success(`已批量移除 ${selectedIds.value.length} 篇笔记的监控`)
    selectedIds.value = []
    await getList()
  } catch {}
}

/** 复制文本 */
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
  } catch {
    message.error('复制失败')
  }
  document.body.removeChild(textArea)
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getXhsNoteMonitorPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

const resetQuery = () => {
  queryFormRef.value?.resetFields()
  handleQuery()
}

onMounted(() => {
  getList()
})
</script>
