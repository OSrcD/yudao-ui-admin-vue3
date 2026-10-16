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
      <el-form-item label="用户手机" prop="mobile">
        <el-input
          v-model="queryParams.mobile"
          placeholder="请输入用户手机号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-160px"
        />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入App用户ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-140px"
        />
      </el-form-item>
      <el-form-item label="小红书号" prop="accountId">
        <el-input
          v-model="queryParams.accountId"
          placeholder="请输入作者小红书号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-180px"
        />
      </el-form-item>
      <el-form-item label="作者昵称" prop="nickname">
        <el-input
          v-model="queryParams.nickname"
          placeholder="请输入作者昵称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-160px"
        />
      </el-form-item>
      <el-form-item label="备注说明" prop="remark">
        <el-input
          v-model="queryParams.remark"
          placeholder="请输入备注关键字"
          clearable
          @keyup.enter="handleQuery"
          class="!w-160px"
        />
      </el-form-item>
      <el-form-item label="过滤状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="全部状态"
          clearable
          class="!w-140px"
        >
          <el-option label="开启过滤(生效)" :value="0" />
          <el-option label="关闭过滤(停用)" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="handleAdd"
          v-hasPermi="['business:xhs-official-account:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增官方号
        </el-button>
        <el-button
          type="success"
          plain
          @click="openBatchDialog"
          v-hasPermi="['business:xhs-official-account:create']"
        >
          <Icon icon="ep:upload" class="mr-5px" /> 批量导入
        </el-button>
        <el-button
          type="danger"
          plain
          @click="handleClearAll"
          v-hasPermi="['business:xhs-official-account:delete']"
        >
          <Icon icon="ep:delete-filled" class="mr-5px" /> 清空名单
        </el-button>
        <el-button
          type="warning"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['business:xhs-official-account:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出 Excel
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表内容区 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="90" />
      <el-table-column label="所属用户" align="left" min-width="170">
        <template #default="scope">
          <div v-if="scope.row.mobile || scope.row.userId">
            <div class="font-medium text-gray-800">{{ scope.row.mobile || '-' }}</div>
            <div class="text-12px text-gray-400">UID: {{ scope.row.userId || '-' }}</div>
          </div>
          <span v-else class="text-gray-400">系统全局/未绑定</span>
        </template>
      </el-table-column>
      <el-table-column label="小红书号" align="left" prop="accountId" min-width="160">
        <template #default="scope">
          <div class="flex items-center gap-6px">
            <span class="font-bold text-gray-800">{{ scope.row.accountId }}</span>
            <el-tooltip content="点击复制小红书号" placement="top">
              <el-button
                link
                type="primary"
                size="small"
                @click="copyText(scope.row.accountId)"
              >
                <Icon icon="ep:copy-document" />
              </el-button>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="作者昵称" align="left" prop="nickname" min-width="150">
        <template #default="scope">
          <span>{{ scope.row.nickname || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注说明" align="left" prop="remark" min-width="180">
        <template #default="scope">
          <span class="text-gray-500">{{ scope.row.remark || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过滤状态" align="center" prop="status" width="130">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="0"
            :inactive-value="1"
            active-text="生效"
            inactive-text="禁用"
            inline-prompt
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column label="操作" align="center" width="140" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['business:xhs-official-account:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id, scope.row.accountId)"
            v-hasPermi="['business:xhs-official-account:delete']"
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

  <!-- 单个添加 / 修改弹窗 -->
  <el-dialog :title="dialogTitle" v-model="dialogVisible" width="520px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
      <el-form-item label="用户手机" prop="mobile">
        <el-input v-model="form.mobile" placeholder="请输入绑定的App手机号码 (选填)" />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input-number v-model="form.userId" :min="1" placeholder="App用户UID (选填)" class="!w-full" />
      </el-form-item>
      <el-form-item label="小红书号" prop="accountId">
        <el-input v-model="form.accountId" placeholder="请输入作者小红书号 (唯一识别码)" />
      </el-form-item>
      <el-form-item label="作者昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入作者昵称 (选填)" />
      </el-form-item>
      <el-form-item label="备注说明" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注说明 (选填)" />
      </el-form-item>
      <el-form-item label="过滤状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio :value="0">开启过滤(生效)</el-radio>
          <el-radio :value="1">关闭过滤(停用)</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
    </template>
  </el-dialog>

  <!-- 批量导入弹窗 -->
  <el-dialog title="批量导入不评论官方号名单" v-model="batchDialogVisible" width="680px" append-to-body>
    <el-alert
      type="info"
      :closable="false"
      class="mb-14px"
      show-icon
    >
      <template #title>
        <div class="font-bold">导入规则说明：</div>
      </template>
      <div class="text-12px leading-20px text-gray-600 mt-4px">
        <div>1. 输入框每行一个官方号，共支持 3 列数据：</div>
        <div class="pl-14px font-mono text-gray-700">
          【第一列】作者小红书号（必填）&nbsp;&nbsp;【第二列】作者昵称（选填）&nbsp;&nbsp;【第三列】备注说明（选填）
        </div>
        <div>2. 列与列之间支持使用 <b>Tab键、空格、英文逗号(,)、分号(;)或竖线(|)</b> 分隔，直接从 Excel 复制整列粘贴即可。</div>
        <div>3. 系统会自动去除首尾多余空格及常见前缀（如“小红书号：”），若已有相同账号会自动更新。</div>
      </div>
    </el-alert>

    <div class="flex items-center gap-12px mb-12px bg-gray-50 p-10px rounded-6px">
      <span class="text-13px text-gray-700 whitespace-nowrap font-medium">批量绑定所属用户(选填)：</span>
      <el-input v-model="batchMobile" placeholder="App手机号 (如 13800138000)" clearable class="!w-200px" />
      <el-input-number v-model="batchUserId" :min="1" placeholder="UID" class="!w-140px" />
    </div>

    <el-input
      v-model="batchContent"
      type="textarea"
      :rows="9"
      placeholder="每行一个官方号，支持从 Excel 直接复制粘贴，示例：
xhs_official_01  小红书官方号  官方认证不评论
xhs_official_02  某知名大V    同行博主避让
xhs_official_03"
    />

    <div v-if="parsedBatchItems.length > 0" class="mt-14px">
      <div class="flex items-center justify-between mb-8px">
        <span class="text-13px font-bold text-gray-700">
          已解析预览（共识别出 {{ parsedBatchItems.length }} 个有效账号）：
        </span>
        <el-tag type="success" size="small">解析有效</el-tag>
      </div>
      <el-table :data="parsedBatchItems.slice(0, 5)" size="small" border max-height="180">
        <el-table-column label="小红书号" prop="accountId" />
        <el-table-column label="昵称" prop="nickname" />
        <el-table-column label="备注" prop="remark" />
      </el-table>
      <div v-if="parsedBatchItems.length > 5" class="text-12px text-gray-400 mt-4px text-center">
        仅预览前 5 条，其余 {{ parsedBatchItems.length - 5 }} 条将在提交后一同导入
      </div>
    </div>

    <template #footer>
      <el-button @click="batchDialogVisible = false">取 消</el-button>
      <el-button
        type="primary"
        :disabled="parsedBatchItems.length === 0"
        :loading="batchLoading"
        @click="submitBatchImport"
      >
        确认导入 ({{ parsedBatchItems.length }})
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import {
  getXhsOfficialAccountPage,
  getXhsOfficialAccount,
  createXhsOfficialAccount,
  batchCreateXhsOfficialAccount,
  updateXhsOfficialAccount,
  deleteXhsOfficialAccount,
  clearXhsOfficialAccounts,
  exportXhsOfficialAccountExcel,
  XhsOfficialAccountVO
} from '@/api/business/xhsOfficialAccount'
import download from '@/utils/download'

defineOptions({ name: 'BusinessXhsOfficialAccount' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref<XhsOfficialAccountVO[]>([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  mobile: undefined,
  accountId: undefined,
  nickname: undefined,
  remark: undefined,
  status: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索表单
const exportLoading = ref(false) // 导出的加载中

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getXhsOfficialAccountPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 快捷复制文本 */
const copyText = (text: string) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    message.success(`已复制小红书号: ${text}`)
  })
}

/** 切换单项启用/禁用状态 */
const handleStatusChange = async (row: XhsOfficialAccountVO) => {
  try {
    await updateXhsOfficialAccount({ id: row.id, status: row.status })
    message.success(row.status === 0 ? '已开启该账号过滤' : '已停用该账号过滤')
  } catch {
    row.status = row.status === 0 ? 1 : 0
  }
}

/** 单项删除按钮操作 */
const handleDelete = async (id: number, accountId: string) => {
  try {
    await message.confirm(`确定要将小红书号【${accountId}】从官方号名单中删除吗？`)
    await deleteXhsOfficialAccount(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

/** 清空全部名单操作 */
const handleClearAll = async () => {
  try {
    await message.confirm('确定要清空全部官方号名单吗？此操作无法撤销！')
    await clearXhsOfficialAccounts()
    message.success('已清空全部官方号名单')
    await getList()
  } catch {}
}

/** 导出操作 */
const handleExport = async () => {
  try {
    await message.confirm('是否确认导出所有小红书官方号名单数据项？')
    exportLoading.value = true
    const data = await exportXhsOfficialAccountExcel(queryParams)
    download.excel(data, '小红书不评论官方号名单.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

// ========== 表单弹窗相关 ==========
const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref<'create' | 'update'>('create')
const form = ref<Partial<XhsOfficialAccountVO>>({
  id: undefined,
  userId: undefined,
  mobile: '',
  accountId: '',
  nickname: '',
  remark: '',
  status: 0
})
const formRules = reactive({
  accountId: [{ required: true, message: '作者小红书号不能为空', trigger: 'blur' }]
})
const formRef = ref()

const resetForm = () => {
  form.value = {
    id: undefined,
    userId: undefined,
    mobile: '',
    accountId: '',
    nickname: '',
    remark: '',
    status: 0
  }
  formRef.value?.resetFields()
}

/** 新增按钮操作 */
const handleAdd = () => {
  resetForm()
  dialogTitle.value = '添加不评论官方号'
  formType.value = 'create'
  dialogVisible.value = true
}

/** 修改按钮操作 */
const handleUpdate = async (row: XhsOfficialAccountVO) => {
  resetForm()
  dialogTitle.value = '修改不评论官方号'
  formType.value = 'update'
  dialogVisible.value = true
  formLoading.value = true
  try {
    const data = await getXhsOfficialAccount(row.id!)
    form.value = data
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return

  formLoading.value = true
  try {
    if (formType.value === 'create') {
      await createXhsOfficialAccount(form.value)
      message.success('添加成功')
    } else {
      await updateXhsOfficialAccount(form.value)
      message.success('修改成功')
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

// ========== 批量导入相关 ==========
const batchDialogVisible = ref(false)
const batchLoading = ref(false)
const batchContent = ref('')
const batchMobile = ref('')
const batchUserId = ref<number | undefined>(undefined)

const openBatchDialog = () => {
  batchContent.value = ''
  batchMobile.value = ''
  batchUserId.value = undefined
  batchDialogVisible.value = true
}

/** 解析批量输入的文本，提取最多 3 列 */
const parsedBatchItems = computed(() => {
  const text = batchContent.value.trim()
  if (!text) return []

  const lines = text.split(/\r?\n/)
  const result: Partial<XhsOfficialAccountVO>[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // 分隔符：Tab、空格、逗号、分号、竖线
    const cols = trimmed.split(/[\t,;|\s]+/)
    if (cols.length === 0 || !cols[0]) continue

    let accountId = cols[0].trim()
    // 过滤常见前缀
    if (accountId.startsWith('小红书号：') || accountId.startsWith('小红书号:')) {
      accountId = accountId.replace(/^小红书号[：:]/, '').trim()
    } else if (accountId.startsWith('ID：') || accountId.startsWith('ID:')) {
      accountId = accountId.replace(/^ID[：:]/, '').trim()
    }
    if (!accountId) continue

    const nickname = cols.length > 1 ? cols[1].trim() : ''
    const remark = cols.length > 2 ? cols.slice(2).join(' ').trim() : ''

    result.push({
      accountId,
      nickname,
      remark,
      status: 0
    })
  }

  return result
})

/** 提交批量导入 */
const submitBatchImport = async () => {
  const items = parsedBatchItems.value
  if (items.length === 0) {
    message.warning('未检测到有效的官方号数据')
    return
  }

  batchLoading.value = true
  try {
    const payload = items.map((it) => ({
      ...it,
      mobile: batchMobile.value.trim() || undefined,
      userId: batchUserId.value || undefined
    }))
    const count = await batchCreateXhsOfficialAccount(payload)
    message.success(`批量导入完成，成功导入/更新 ${count} 条记录`)
    batchDialogVisible.value = false
    await getList()
  } finally {
    batchLoading.value = false
  }
}

/** 初始化 */
onMounted(() => {
  getList()
})
</script>
