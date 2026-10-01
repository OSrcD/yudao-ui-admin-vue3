<!--  AI 对话  -->
<template>
  <el-aside
    width="280px"
    class="h-100% relative flex flex-col justify-between px-2.5 pt-2.5 pb-0 overflow-hidden"
  >
    <!-- 左顶部：对话 -->
    <div class="h-100%">
      <el-button class="w-1/1 py-4.5" type="primary" @click="createConversation">
        <Icon icon="ep:plus" class="mr-5px" />
        新建对话
      </el-button>

      <!-- 左顶部：搜索对话 -->
      <el-input
        v-model="searchName"
        size="large"
        class="mt-5"
        placeholder="搜索对话 / 账号 / 手机号"
        @keyup="searchConversation"
      >
        <template #prefix>
          <Icon icon="ep:search" />
        </template>
      </el-input>

      <!-- 左中间：对话列表 -->
      <div class="overflow-auto h-full">
        <!-- 情况一：加载中 -->
        <el-empty v-if="loading" description="." :v-loading="loading" />
        <!-- 情况二：按照 group 分组，展示聊天会话 list 列表 -->
        <div v-for="conversationKey in Object.keys(conversationMap)" :key="conversationKey">
          <div class="mt-1.25 pt-2.5" v-if="conversationMap[conversationKey].length">
            <el-text class="mx-1" size="small" tag="b">
              {{ conversationKey }}
            </el-text>
          </div>
          <div
            class="mt-1.25"
            v-for="conversation in conversationMap[conversationKey]"
            :key="conversation.id"
            @click="handleConversationClick(conversation.id)"
            @mouseover="hoverConversationId = conversation.id"
            @mouseout="hoverConversationId = ''"
          >
            <div
              class="flex flex-row justify-between flex-1 p-1.5 cursor-pointer rounded-1.25 items-center"
              :style="
                conversation.id === activeConversationId
                  ? 'background-color: var(--el-color-primary-light-9); border: 1px solid var(--el-color-primary-light-7);'
                  : 'border: 1px solid transparent;'
              "
            >
              <div class="flex flex-row items-center flex-1 min-w-0 mr-1">
                <img
                  class="w-7 h-7 rounded-1.25 flex-shrink-0"
                  :src="conversation.roleAvatar || roleAvatarDefaultImg"
                />
                <div class="flex flex-col ml-2 min-w-0 flex-1">
                  <!-- 第一行：标题 + 消息数 -->
                  <div class="flex items-center justify-between">
                    <span
                      class="text-13px font-medium text-[var(--el-text-color-primary)] truncate"
                      :title="conversation.title"
                    >
                      {{ conversation.title }}
                    </span>
                    <el-tag
                      v-if="conversation.messageCount !== undefined && conversation.messageCount !== null"
                      size="small"
                      type="info"
                      effect="light"
                      class="ml-1 scale-90 origin-right flex-shrink-0"
                    >
                      {{ conversation.messageCount }}条
                    </el-tag>
                  </div>
                  <!-- 第二行：所属账号信息 -->
                  <div class="flex items-center text-11px text-[var(--el-text-color-secondary)] mt-0.5 truncate">
                    <el-tag
                      size="small"
                      :type="conversation.userType === 2 ? 'warning' : 'info'"
                      effect="plain"
                      class="mr-1 scale-85 origin-left flex-shrink-0"
                      style="padding: 0 4px; height: 18px; line-height: 16px;"
                    >
                      {{ conversation.userType === 2 ? 'App' : '管理' }}
                    </el-tag>
                    <span class="truncate" :title="getAccountDisplay(conversation)">
                      {{ getAccountDisplay(conversation) }}
                    </span>
                  </div>
                </div>
              </div>
              <div
                class="right-0.5 flex flex-row justify-center flex-shrink-0"
                style="color: var(--el-text-color-regular)"
                v-show="hoverConversationId === conversation.id"
              >
                <el-button class="m-0 !p-1" link @click.stop="handleTop(conversation)">
                  <el-icon title="置顶" v-if="!conversation.pinned"><Top /></el-icon>
                  <el-icon title="置顶" v-if="conversation.pinned"><Bottom /></el-icon>
                </el-button>
                <el-button class="m-0 !p-1" link @click.stop="updateConversationTitle(conversation)">
                  <el-icon title="编辑">
                    <Icon icon="ep:edit" />
                  </el-icon>
                </el-button>
                <el-button class="m-0 !p-1" link @click.stop="deleteChatConversation(conversation)">
                  <el-icon title="删除对话">
                    <Icon icon="ep:delete" />
                  </el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 底部占位  -->
        <div class="h-160px w-100%"></div>
      </div>
    </div>

    <!-- 左底部：工具栏 -->
    <div
      class="absolute bottom-0 left-0 right-0 px-5 leading-8.75 flex justify-between items-center"
      style="
        background-color: var(--el-fill-color-extra-light);
        box-shadow: 0 0 1px 1px var(--el-border-color-lighter);
        color: var(--el-text-color);
      "
    >
      <div
        class="flex items-center p-0 m-0 cursor-pointer"
        style="color: var(--el-text-color-regular)"
        @click="handleRoleRepository"
      >
        <Icon icon="ep:user" />
        <el-text class="ml-1.25" size="small">角色仓库</el-text>
      </div>
      <div
        class="flex items-center p-0 m-0 cursor-pointer"
        style="color: var(--el-text-color-regular)"
        @click="handleClearConversation"
      >
        <Icon icon="ep:delete" />
        <el-text class="ml-1.25" size="small">清空未置顶对话</el-text>
      </div>
    </div>

    <!-- 角色仓库抽屉 -->
    <el-drawer v-model="roleRepositoryOpen" title="角色仓库" size="754px">
      <RoleRepository />
    </el-drawer>
  </el-aside>
</template>

<script setup lang="ts">
import { ChatConversationApi, ChatConversationVO } from '@/api/ai/chat/conversation'
import RoleRepository from '../role/RoleRepository.vue'
import { Bottom, Top } from '@element-plus/icons-vue'
import roleAvatarDefaultImg from '@/assets/ai/gpt.svg'

const message = useMessage() // 消息弹窗

// 定义属性
const searchName = ref<string>('') // 对话搜索
const activeConversationId = ref<number | null>(null) // 选中的对话，默认为 null
const hoverConversationId = ref<number | null>(null) // 悬浮上去的对话
const conversationList = ref([] as ChatConversationVO[]) // 对话列表
const conversationMap = ref<any>({}) // 对话分组 (置顶、今天、三天前、一星期前、一个月前)
const loading = ref<boolean>(false) // 加载中
const loadingTime = ref<any>() // 加载中定时器

// 定义组件 props
const props = defineProps({
  activeId: {
    type: String || null,
    required: true
  }
})

// 定义钩子
const emits = defineEmits([
  'onConversationCreate',
  'onConversationClick',
  'onConversationClear',
  'onConversationDelete'
])

/** 获取账号显示名称 */
const getAccountDisplay = (conversation: ChatConversationVO) => {
  if (conversation.userNickname) {
    if (conversation.userMobile) {
      return `${conversation.userNickname} (${conversation.userMobile})`
    }
    return conversation.userNickname
  }
  if (conversation.userName) {
    return conversation.userName
  }
  if (conversation.userMobile) {
    return conversation.userMobile
  }
  if (conversation.userId) {
    return `用户#${conversation.userId}`
  }
  return '默认用户'
}

/** 获取对话最新活跃时间戳（支持多轮对话时按最后更新时间排序） */
const getActiveTime = (conv: ChatConversationVO) => {
  const t = conv.updateTime || conv.createTime
  return t ? new Date(t).getTime() : 0
}

/** 搜索对话 */
const searchConversation = async (_e?: any) => {
  // 恢复数据
  const keyword = searchName.value.trim().toLowerCase()
  if (!keyword.length) {
    conversationMap.value = await getConversationGroupByActiveTime(conversationList.value)
  } else {
    // 过滤：支持标题、账号昵称、用户名、手机号搜索
    const filterValues = conversationList.value.filter((item) => {
      const matchTitle = item.title && item.title.toLowerCase().includes(keyword)
      const matchNickname = item.userNickname && item.userNickname.toLowerCase().includes(keyword)
      const matchUserName = item.userName && item.userName.toLowerCase().includes(keyword)
      const matchMobile = item.userMobile && item.userMobile.includes(keyword)
      return matchTitle || matchNickname || matchUserName || matchMobile
    })
    conversationMap.value = await getConversationGroupByActiveTime(filterValues)
  }
}

/** 点击对话 */
const handleConversationClick = async (id: number) => {
  // 过滤出选中的对话
  const filterConversation = conversationList.value.filter((item) => {
    return item.id === id
  })
  // 回调 onConversationClick
  // noinspection JSVoidFunctionReturnValueUsed
  const success = emits('onConversationClick', filterConversation[0])
  // 切换对话
  if (success) {
    activeConversationId.value = id
  }
}

/** 获取对话列表 */
const getChatConversationList = async () => {
  try {
    // 加载中
    loadingTime.value = setTimeout(() => {
      loading.value = true
    }, 50)

    // 1.1 获取 对话数据
    conversationList.value = await ChatConversationApi.getChatConversationMyList()
    // 1.2 排序：置顶优先，其次按最新活跃时间倒序（多轮对话最新发消息排在最前面）
    conversationList.value.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1
      }
      return getActiveTime(b) - getActiveTime(a)
    })
    // 1.3 没有任何对话情况
    if (conversationList.value.length === 0) {
      activeConversationId.value = null
      conversationMap.value = {}
      return
    }

    // 2. 对话根据最新活跃时间分组(置顶、今天、一天前、三天前、七天前、30 天前)
    conversationMap.value = await getConversationGroupByActiveTime(conversationList.value)
  } finally {
    // 清理定时器
    if (loadingTime.value) {
      clearTimeout(loadingTime.value)
    }
    // 加载完成
    loading.value = false
  }
}

/** 按照最新活跃时间，进行分组 */
const getConversationGroupByActiveTime = async (list: ChatConversationVO[]) => {
  // 排序、指定、时间分组(今天、一天前、三天前、七天前、30天前)
  // noinspection NonAsciiCharacters
  const groupMap = {
    置顶: [] as ChatConversationVO[],
    今天: [] as ChatConversationVO[],
    一天前: [] as ChatConversationVO[],
    三天前: [] as ChatConversationVO[],
    七天前: [] as ChatConversationVO[],
    三十天前: [] as ChatConversationVO[]
  }
  // 当前时间的时间戳
  const now = Date.now()
  // 定义时间间隔常量（单位：毫秒）
  const oneDay = 24 * 60 * 60 * 1000
  const threeDays = 3 * oneDay
  const sevenDays = 7 * oneDay
  const thirtyDays = 30 * oneDay
  for (const conversation of list) {
    // 置顶
    if (conversation.pinned) {
      groupMap['置顶'].push(conversation)
      continue
    }
    // 计算时间差（单位：毫秒，基于最新活跃时间）
    const diff = now - getActiveTime(conversation)
    // 根据时间间隔判断
    if (diff < oneDay) {
      groupMap['今天'].push(conversation)
    } else if (diff < threeDays) {
      groupMap['一天前'].push(conversation)
    } else if (diff < sevenDays) {
      groupMap['三天前'].push(conversation)
    } else if (diff < thirtyDays) {
      groupMap['七天前'].push(conversation)
    } else {
      groupMap['三十天前'].push(conversation)
    }
  }
  return groupMap
}

/** 新建对话 */
const createConversation = async () => {
  // 1. 新建对话
  const conversationId = await ChatConversationApi.createChatConversationMy(
    {} as unknown as ChatConversationVO
  )
  // 2. 获取对话内容
  await getChatConversationList()
  // 3. 选中对话
  await handleConversationClick(conversationId)
  // 4. 回调
  emits('onConversationCreate')
}

/** 修改对话的标题 */
const updateConversationTitle = async (conversation: ChatConversationVO) => {
  // 1. 二次确认
  const { value } = await ElMessageBox.prompt('修改标题', {
    inputPattern: /^[\s\S]*.*\S[\s\S]*$/, // 判断非空，且非空格
    inputErrorMessage: '标题不能为空',
    inputValue: conversation.title
  })
  // 2. 发起修改
  await ChatConversationApi.updateChatConversationMy({
    id: conversation.id,
    title: value
  } as ChatConversationVO)
  message.success('重命名成功')
  // 3. 刷新列表
  await getChatConversationList()
  // 4. 过滤当前切换的
  const filterConversationList = conversationList.value.filter((item) => {
    return item.id === conversation.id
  })
  if (filterConversationList.length > 0) {
    // tip：避免切换对话
    if (activeConversationId.value === filterConversationList[0].id) {
      emits('onConversationClick', filterConversationList[0])
    }
  }
}

/** 删除聊天对话 */
const deleteChatConversation = async (conversation: ChatConversationVO) => {
  try {
    // 删除的二次确认
    await message.delConfirm(`是否确认删除对话 - ${conversation.title}?`)
    // 发起删除
    await ChatConversationApi.deleteChatConversationMy(conversation.id)
    message.success('对话已删除')
    // 刷新列表
    await getChatConversationList()
    // 回调
    emits('onConversationDelete', conversation)
  } catch {}
}

/** 清空对话 */
const handleClearConversation = async () => {
  try {
    await message.confirm('确认后对话会全部清空，置顶的对话除外。')
    await ChatConversationApi.deleteChatConversationMyByUnpinned()
    ElMessage({
      message: '操作成功!',
      type: 'success'
    })
    // 清空 对话 和 对话内容
    activeConversationId.value = null
    // 获取 对话列表
    await getChatConversationList()
    // 回调 方法
    emits('onConversationClear')
  } catch {}
}

/** 对话置顶 */
const handleTop = async (conversation: ChatConversationVO) => {
  // 更新对话置顶
  conversation.pinned = !conversation.pinned
  await ChatConversationApi.updateChatConversationMy(conversation)
  // 刷新对话
  await getChatConversationList()
}

// ============ 角色仓库 ============

/** 角色仓库抽屉 */
const roleRepositoryOpen = ref<boolean>(false) // 角色仓库是否打开
const handleRoleRepository = async () => {
  roleRepositoryOpen.value = !roleRepositoryOpen.value
}

/** 监听选中的对话 */
const { activeId } = toRefs(props)
watch(activeId, async (newValue, oldValue) => {
  activeConversationId.value = newValue as string
})

// 定义 public 方法
defineExpose({ createConversation, getChatConversationList })

/** 初始化 */
onMounted(async () => {
  // 获取 对话列表
  await getChatConversationList()
  // 默认选中
  if (props.activeId) {
    activeConversationId.value = props.activeId
  } else {
    // 首次默认选中第一个
    if (conversationList.value.length) {
      activeConversationId.value = conversationList.value[0].id
      // 回调 onConversationClick
      await emits('onConversationClick', conversationList.value[0])
    }
  }
})
</script>
