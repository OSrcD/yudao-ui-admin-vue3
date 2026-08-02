<template>
  <!-- 区域 1：关键词管理 -->
  <ContentWrap>
    <div class="flex items-center gap-2 mb-3">
      <span class="font-bold text-gray-700 text-sm">🔍 监控关键词</span>
      <el-tag type="info" size="small">
        {{ keywords.length > 0 ? '命中任意关键词的评论才会显示' : '未配置关键词则显示全部监控笔记评论' }}
      </el-tag>
    </div>

    <div class="flex flex-wrap items-center gap-2 mb-3">
      <el-tag
        v-for="kw in keywords"
        :key="kw.id"
        type="success"
        closable
        size="large"
        class="font-medium"
        @close="handleDeleteKeyword(kw.id)"
      >
        {{ kw.keyword }}
      </el-tag>
      <span v-if="keywords.length === 0" class="text-gray-400 text-sm">暂无关键词，所有已监控笔记的评论都会显示</span>
    </div>

    <div class="flex items-center gap-2">
      <el-input
        v-model="newKeyword"
        placeholder="输入关键词，按 Enter 添加"
        clearable
        class="!w-250px"
        @keyup.enter="handleAddKeyword"
      />
      <el-button type="primary" @click="handleAddKeyword">
        <Icon icon="ep:plus" class="mr-1" /> 添加关键词
      </el-button>
    </div>
  </ContentWrap>

  <!-- 区域 2：推送配置 -->
  <ContentWrap>
    <div class="flex items-center gap-2 mb-4">
      <span class="font-bold text-gray-700 text-sm">🔔 第三方推送配置</span>
      <el-tag :type="notifyConfig.enabled ? 'success' : 'info'" size="small">
        {{ notifyConfig.enabled ? '推送已开启' : '推送已关闭' }}
      </el-tag>
      <el-tag type="warning" size="small">每条评论每个关键词仅推送一次</el-tag>
    </div>

    <el-form :model="notifyConfig" label-width="110px" class="max-w-600px">
      <el-form-item label="开启推送">
        <el-switch v-model="notifyConfig.enabled" />
      </el-form-item>
      <el-form-item label="推送类型">
        <el-select v-model="notifyConfig.type" class="!w-200px">
          <el-option label="通用 Webhook" value="webhook" />
          <el-option label="企业微信" value="wecom" />
          <el-option label="飞书" value="feishu" />
        </el-select>
      </el-form-item>
      <el-form-item label="Webhook 地址">
        <el-input v-model="notifyConfig.url" placeholder="请输入 Webhook URL" class="!w-400px" />
      </el-form-item>
      <el-form-item label="签名密钥">
        <el-input
          v-model="notifyConfig.secret"
          placeholder="选填，预留签名密钥"
          class="!w-300px"
          show-password
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="savingConfig" @click="handleSaveConfig">
          保存配置
        </el-button>
        <el-button type="success" plain :loading="testingNotify" @click="handleTestNotify">
          发送测试
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 区域 3：评论列表 -->
  <ContentWrap>
    <!-- 搜索栏 -->
    <el-form class="-mb-15px" :model="queryParams" ref="queryFormRef" :inline="true" label-width="80px">
      <el-form-item label="内容搜索" prop="keyword">
        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索评论内容或昵称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="评论者" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入评论者昵称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="笔记ID" prop="noteId">
        <el-input
          v-model="queryParams.noteId"
          placeholder="请输入笔记ID"
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

    <!-- 统计栏 -->
    <div class="flex items-center justify-between py-3 mt-3 mb-4 border-b border-slate-200">
      <div class="text-xs text-gray-500">
        当前显示：
        <span class="font-bold text-green-600">{{ keywords.length > 0 ? '命中关键词的评论' : '所有已监控笔记评论' }}</span>
      </div>
      <div class="text-xs text-gray-400 font-mono">
        共 <span class="font-bold text-green-600 text-sm">{{ total }}</span> 条评论
      </div>
    </div>

    <!-- 评论卡片列表 -->
    <div v-loading="loading" class="space-y-3">
      <div v-if="!list || list.length === 0" class="py-12 text-center text-gray-400">
        暂无符合条件的监控评论数据
      </div>

      <div
        v-for="(comment, index) in list"
        :key="comment.id"
        :class="[
          'p-3 rounded-xl border-2 transition-all flex gap-3 items-start bg-white',
          comment.isAuthor === 1
            ? 'border-rose-300 bg-rose-50/60 shadow-sm'
            : 'border-green-300 bg-green-50/30 shadow-sm hover:shadow-md hover:border-green-500'
        ]"
      >
        <!-- 序号 + 头像 -->
        <div class="flex flex-col items-center gap-1 shrink-0">
          <span class="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
            #{{ (queryParams.pageNo - 1) * queryParams.pageSize + index + 1 }}
          </span>
          <el-avatar :src="comment.avatar" :size="38" class="border-2 border-white shadow-sm">
            {{ comment.nickname ? comment.nickname.substring(0, 1) : 'U' }}
          </el-avatar>
        </div>

        <!-- 评论主体 -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-bold text-sm text-gray-900">{{ comment.nickname || '匿名用户' }}</span>
              <el-tag v-if="comment.isAuthor === 1" type="danger" size="small" effect="dark" class="font-bold">
                📌 帖子作者
              </el-tag>
              <span v-if="comment.redId" class="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                小红书号: {{ comment.redId }}
              </span>
              <!-- 笔记标签 -->
              <el-tag type="primary" size="small" effect="plain" class="font-mono">
                📝 笔记: {{ comment.noteId }}
              </el-tag>
            </div>
            <div class="flex items-center gap-2">
              <div v-if="comment.ipLocation" class="text-xs text-gray-400 font-mono">
                📍 {{ comment.ipLocation }}
              </div>
            </div>
          </div>

          <!-- 评论内容（关键词高亮） -->
          <div class="p-2.5 bg-white rounded-md border border-green-200 text-gray-900 text-sm font-medium leading-relaxed">
            <span v-html="highlightKeywords(comment.content)" class="whitespace-pre-wrap"></span>
            <span
              v-if="comment.commentTime"
              class="text-sm text-slate-700 font-mono font-bold ml-2.5 inline-block whitespace-nowrap bg-slate-200/80 px-2 py-0.5 rounded border border-slate-300/50"
            >
              🕒 {{ comment.commentTime }}
            </span>
          </div>

          <!-- 底部：互动数据 -->
          <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span class="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-medium border border-rose-100">
              ❤️ 点赞 <strong class="text-rose-700">{{ comment.likeCount || 0 }}</strong>
            </span>
            <span v-if="comment.subCommentCount" class="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">
              💬 子回复 <strong class="text-blue-700">{{ comment.subCommentCount }}</strong>
            </span>
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
import {
  getCommentMonitorPage,
  getMonitorKeywords,
  addMonitorKeyword,
  deleteMonitorKeyword,
  getNotifyConfig,
  saveNotifyConfig,
  sendNotifyTest,
  CommentMonitorKeywordVO,
  CommentMonitorNotifyConfigVO
} from '@/api/business/xhsCommentMonitor'
import { XhsNoteCommentVO } from '@/api/business/xhsNoteComment'

defineOptions({ name: 'BusinessXhsCommentMonitor' })

const message = useMessage()

// ========== 关键词管理 ==========
const keywords = ref<CommentMonitorKeywordVO[]>([])
const newKeyword = ref('')

const loadKeywords = async () => {
  keywords.value = await getMonitorKeywords()
}

const handleAddKeyword = async () => {
  const kw = newKeyword.value.trim()
  if (!kw) {
    message.warning('请输入关键词')
    return
  }
  await addMonitorKeyword(kw)
  newKeyword.value = ''
  message.success('关键词添加成功')
  await loadKeywords()
  await getList()
}

const handleDeleteKeyword = async (id: number) => {
  try {
    await message.confirm('确认删除该关键词？删除后监控列表将重新计算。')
    await deleteMonitorKeyword(id)
    message.success('已删除关键词')
    await loadKeywords()
    await getList()
  } catch {}
}

// ========== 推送配置 ==========
const notifyConfig = reactive<CommentMonitorNotifyConfigVO>({
  enabled: false,
  type: 'webhook',
  url: '',
  secret: ''
})
const savingConfig = ref(false)
const testingNotify = ref(false)

const loadNotifyConfig = async () => {
  const cfg = await getNotifyConfig()
  notifyConfig.enabled = cfg.enabled
  notifyConfig.type = cfg.type || 'webhook'
  notifyConfig.url = cfg.url || ''
  notifyConfig.secret = cfg.secret || ''
}

const handleSaveConfig = async () => {
  savingConfig.value = true
  try {
    await saveNotifyConfig({ ...notifyConfig })
    message.success('推送配置已保存')
  } catch {
    message.error('保存失败')
  } finally {
    savingConfig.value = false
  }
}

const handleTestNotify = async () => {
  if (!notifyConfig.url) {
    message.warning('请先填写 Webhook 地址')
    return
  }
  testingNotify.value = true
  try {
    const ok = await sendNotifyTest({ ...notifyConfig })
    if (ok) {
      message.success('测试推送发送成功！请查看接收端')
    } else {
      message.error('测试推送发送失败，请检查地址是否正确')
    }
  } catch {
    message.error('测试推送请求异常')
  } finally {
    testingNotify.value = false
  }
}

// ========== 评论列表 ==========
const loading = ref(true)
const total = ref(0)
const list = ref<XhsNoteCommentVO[]>([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 20,
  keyword: undefined as string | undefined,
  nickname: undefined as string | undefined,
  noteId: undefined as string | undefined,
  sortFields: 'commentTime:desc'
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await getCommentMonitorPage(queryParams)
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

/** 关键词高亮（将命中的持久化关键词用黄色标记） */
const highlightKeywords = (content?: string) => {
  if (!content) return '暂无内容'
  let result = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  for (const kw of keywords.value) {
    if (!kw.keyword) continue
    const escaped = kw.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(
      new RegExp(escaped, 'gi'),
      (match) => `<mark class="bg-yellow-200 text-yellow-900 font-bold rounded px-0.5">${match}</mark>`
    )
  }
  return result
}

onMounted(async () => {
  await Promise.all([loadKeywords(), loadNotifyConfig()])
  getList()
})
</script>
