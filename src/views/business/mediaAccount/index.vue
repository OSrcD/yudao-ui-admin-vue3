<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="100px"
    >
      <el-form-item label="账号ID" prop="accountId">
        <el-input
          v-model="queryParams.accountId"
          placeholder="请输入账号ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="账号名称" prop="accountName">
        <el-input
          v-model="queryParams.accountName"
          placeholder="请输入账号名称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="平台" prop="accountPlatform">
        <el-select
          v-model="queryParams.accountPlatform"
          placeholder="请选择平台"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_ACCOUNT_PLATFORM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="handleAdd"
          v-hasPermi="['business:media-account:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['business:media-account:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="自媒体账号ID" align="center" prop="id" />
      <el-table-column label="账号ID" align="center" prop="accountId" />
      <el-table-column label="账号名称" align="center" prop="accountName" />
      <el-table-column label="平台" align="center" prop="accountPlatform">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BIZ_ACCOUNT_PLATFORM" :value="scope.row.accountPlatform" />
        </template>
      </el-table-column>
      <el-table-column label="手机号码" align="center" prop="phoneNumber" />
      <el-table-column label="粉丝数" align="center" prop="followerCount" />
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180px" />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleUpdate(scope.row.id)"
            v-hasPermi="['business:media-account:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['business:media-account:delete']"
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

  <!-- 表单弹窗：添加/修改 -->
  <el-dialog :title="dialogTitle" v-model="dialogVisible" width="600px" append-to-body>
    <el-form
      ref="formRef"
      :model="form"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="账号ID" prop="accountId">
        <el-input v-model="form.accountId" placeholder="请输入账号ID" />
      </el-form-item>
      <el-form-item label="账号名称" prop="accountName">
        <el-input v-model="form.accountName" placeholder="请输入账号名称" />
      </el-form-item>
      <el-form-item label="平台" prop="accountPlatform">
        <el-select v-model="form.accountPlatform" placeholder="请选择平台">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_ACCOUNT_PLATFORM)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="主页链接" prop="accountUrl">
        <el-input v-model="form.accountUrl" type="textarea" placeholder="请输入主页链接" />
      </el-form-item>
      <el-form-item label="手机号码" prop="phoneNumber">
        <el-input v-model="form.phoneNumber" placeholder="请输入手机号码" />
      </el-form-item>
      <el-form-item label="粉丝数" prop="followerCount">
        <el-input-number v-model="form.followerCount" :min="0" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="描述" prop="remark">
        <el-input v-model="form.remark" type="textarea" placeholder="请输入描述" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取 消</el-button>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { getMediaAccountPage, getMediaAccount, createMediaAccount, updateMediaAccount, deleteMediaAccount, exportMediaAccount } from '@/api/business/mediaAccount'

defineOptions({ name: 'MediaAccount' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  accountId: undefined,
  accountName: undefined,
  accountPlatform: undefined,
  status: undefined
})
const queryFormRef = ref()
const exportLoading = ref(false)

const getList = async () => {
  loading.value = true
  try {
    const data = await getMediaAccountPage(queryParams)
    list.value = data.rows
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
  queryFormRef.value.resetFields()
  handleQuery()
}

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const form = ref({
  id: undefined,
  accountId: undefined,
  accountName: undefined,
  accountPlatform: undefined,
  accountUrl: undefined,
  phoneNumber: undefined,
  followerCount: 0,
  status: 0,
  remark: undefined
})
const formRules = reactive({
  accountId: [{ required: true, message: '账号ID不能为空', trigger: 'blur' }],
  accountName: [{ required: true, message: '账号名称不能为空', trigger: 'blur' }],
  accountPlatform: [{ required: true, message: '平台不能为空', trigger: 'change' }]
})
const formRef = ref()

const handleAdd = () => {
  resetForm()
  dialogTitle.value = '添加自媒体账号'
  formType.value = 'create'
  dialogVisible.value = true
}

const handleUpdate = async (id: number) => {
  resetForm()
  dialogTitle.value = '修改自媒体账号'
  formType.value = 'update'
  dialogVisible.value = true
  formLoading.value = true
  try {
    form.value = await getMediaAccount(id)
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = form.value as any
    if (formType.value === 'create') {
      await createMediaAccount(data)
      message.success(t('common.createSuccess'))
    } else {
      await updateMediaAccount(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    await getList()
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await deleteMediaAccount(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const handleExport = async () => {
  try {
    await message.exportConfirm()
    exportLoading.value = true
    const res = await exportMediaAccount(queryParams)
    // Yudao frames normally handle the download in request.download
  } catch {
  } finally {
    exportLoading.value = false
  }
}

const resetForm = () => {
  form.value = {
    id: undefined,
    accountId: undefined,
    accountName: undefined,
    accountPlatform: undefined,
    accountUrl: undefined,
    phoneNumber: undefined,
    followerCount: 0,
    status: 0,
    remark: undefined
  }
  formRef.value?.resetFields()
}

onMounted(() => {
  getList()
})
</script>
