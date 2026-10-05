<template>
  <!-- 顶部：评论数据分析统计概览 (吞评/折叠/正常率统计预览) -->
  <el-row :gutter="16" class="mb-16px">
    <el-col :xs="12" :sm="6" :md="4">
      <el-card shadow="never" class="!border-gray-200">
        <div class="text-13px text-gray-500 mb-6px">总评论入库数</div>
        <div class="text-22px font-bold text-gray-800">{{ analysis.totalCount || 0 }}</div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="6" :md="5">
      <el-card shadow="never" class="!border-green-200 !bg-green-50/40">
        <div class="text-13px text-green-700 mb-6px">正常展示评论</div>
        <div class="flex items-baseline justify-between">
          <span class="text-22px font-bold text-green-600">{{ analysis.normalCount || 0 }}</span>
          <span class="text-13px font-semibold text-green-600">{{ analysis.normalRate || 0 }}%</span>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="6" :md="5">
      <el-card shadow="never" class="!border-red-200 !bg-red-50/40">
        <div class="text-13px text-red-700 mb-6px">被吞 / 消失评论</div>
        <div class="flex items-baseline justify-between">
          <span class="text-22px font-bold text-red-600">{{ analysis.swallowedCount || 0 }}</span>
          <span class="text-13px font-semibold text-red-600">{{ analysis.swallowedRate || 0 }}%</span>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="6" :md="5">
      <el-card shadow="never" class="!border-amber-200 !bg-amber-50/40">
        <div class="text-13px text-amber-700 mb-6px">被折叠评论</div>
        <div class="flex items-baseline justify-between">
          <span class="text-22px font-bold text-amber-600">{{ analysis.foldedCount || 0 }}</span>
          <span class="text-13px font-semibold text-amber-600">{{ analysis.foldedRate || 0 }}%</span>
        </div>
      </el-card>
    </el-col>
    <el-col :xs="12" :sm="6" :md="5">
      <el-card shadow="never" class="!border-gray-200 !bg-gray-50/60">
        <div class="text-13px text-gray-600 mb-6px">状态未知 / 待检</div>
        <div class="text-22px font-bold text-gray-600">{{ analysis.unknownCount !== undefined ? analysis.unknownCount : (analysis.pendingCheckCount || 0) }}</div>
      </el-card>
    </el-col>
  </el-row>

  <!-- 搜索工作栏 -->
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="110px"
    >
      <el-form-item label="App账号ID" prop="appAccountId">
        <el-input
          v-model="queryParams.appAccountId"
          placeholder="请输入App账号ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="App登录手机" prop="appMobile">
        <el-input
          v-model="queryParams.appMobile"
          placeholder="请输入登录手机号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="小红书账号" prop="xhsUserId">
        <el-input
          v-model="queryParams.xhsUserId"
          placeholder="请输入小红书号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="小红书昵称" prop="xhsUserName">
        <el-input
          v-model="queryParams.xhsUserName"
          placeholder="请输入小红书昵称"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="评论状态" prop="commentStatus">
        <el-select
          v-model="queryParams.commentStatus"
          placeholder="请选择评论状态"
          clearable
          class="!w-200px"
        >
          <el-option label="未知" :value="0" />
          <el-option label="正常" :value="1" />
          <el-option label="被吞/消失" :value="2" />
          <el-option label="被折叠" :value="3" />
          <el-option label="其他异常" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="检测状态" prop="checkStatus">
        <el-select
          v-model="queryParams.checkStatus"
          placeholder="请选择检测状态"
          clearable
          class="!w-200px"
        >
          <el-option label="未检测" :value="0" />
          <el-option label="已检测" :value="1" />
          <el-option label="检测失败" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="作品标题" prop="noteTitle">
        <el-input
          v-model="queryParams.noteTitle"
          placeholder="请输入作品标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="评论内容" prop="commentContent">
        <el-input
          v-model="queryParams.commentContent"
          placeholder="评论关键词"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="success" plain @click="refreshAnalysis">
          <Icon icon="ep:pie-chart" class="mr-5px" /> 刷新统计
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 数据表格 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80" />
      <el-table-column label="App账号ID" align="center" prop="appAccountId" width="110" />
      <el-table-column label="手机号码" align="center" prop="appMobile" width="125">
        <template #default="{ row }">
          <span>{{ row.appMobile || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="评论人小红书" align="center" prop="xhsUserId" width="120">
        <template #default="{ row }">
          <span class="font-mono">{{ row.xhsUserId || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="小红书昵称" align="center" prop="xhsUserName" width="120">
        <template #default="{ row }">
          <span>{{ row.xhsUserName || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="作品标题" align="left" min-width="180" prop="noteTitle">
        <template #default="{ row }">
          <el-popover v-if="row.noteTitle" placement="top-start" :width="320" trigger="hover" :content="row.noteTitle">
            <template #reference>
              <div class="cursor-pointer line-clamp-2 font-medium text-gray-800">{{ row.noteTitle }}</div>
            </template>
          </el-popover>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="分享链接" align="left" min-width="180" prop="shareLink">
        <template #default="{ row }">
          <el-link
            v-if="row.shareLink"
            type="primary"
            :underline="false"
            :href="row.shareLink"
            target="_blank"
            class="text-12px max-w-170px truncate"
          >
            {{ row.shareLink }}
          </el-link>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="完整分享内容" align="left" min-width="190" prop="shareContent">
        <template #default="{ row }">
          <el-popover v-if="row.shareContent" placement="top-start" :width="360" trigger="hover" :content="row.shareContent">
            <template #reference>
              <div class="cursor-pointer line-clamp-2 text-12px text-gray-600">{{ row.shareContent }}</div>
            </template>
          </el-popover>
          <span v-else class="text-gray-400">-</span>
        </template>
      </el-table-column>
      <el-table-column label="评论内容" align="left" min-width="220">
        <template #default="{ row }">
          <el-popover placement="top-start" :width="360" trigger="hover" :content="row.commentContent">
            <template #reference>
              <div class="cursor-pointer line-clamp-2 text-gray-800">{{ row.commentContent }}</div>
            </template>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="评论状态" align="center" width="110" prop="commentStatus">
        <template #default="{ row }">
          <el-tag v-if="row.commentStatus === 0" type="info">未知</el-tag>
          <el-tag v-else-if="row.commentStatus === 1" type="success">正常</el-tag>
          <el-tag v-else-if="row.commentStatus === 2" type="danger">被吞/消失</el-tag>
          <el-tag v-else-if="row.commentStatus === 3" type="warning">被折叠</el-tag>
          <el-tag v-else type="info">其他异常 ({{ row.commentStatus }})</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="检测状态" align="center" width="100" prop="checkStatus">
        <template #default="{ row }">
          <el-tag v-if="row.checkStatus === 1" type="success" effect="plain">已检测</el-tag>
          <el-tag v-else-if="row.checkStatus === 2" type="danger" effect="plain">检测失败</el-tag>
          <el-tag v-else type="info" effect="plain">未检测</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="评论时间" align="center" prop="createTime" :formatter="dateFormatter" width="170" />
      <el-table-column label="备注" align="center" prop="remark" width="130" />
      <el-table-column label="操作" align="center" width="130" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleUpdate(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
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

  <!-- 表单弹窗：修改状态/备注 -->
  <el-dialog :title="dialogTitle" v-model="dialogVisible" width="560px" append-to-body>
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="110px" v-loading="formLoading">
      <el-form-item label="评论状态" prop="commentStatus">
        <el-radio-group v-model="form.commentStatus">
          <el-radio :label="0">未知</el-radio>
          <el-radio :label="1">正常展示</el-radio>
          <el-radio :label="2">被吞 / 消失</el-radio>
          <el-radio :label="3">被折叠</el-radio>
          <el-radio :label="4">其他异常</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="检测状态" prop="checkStatus">
        <el-radio-group v-model="form.checkStatus">
          <el-radio :label="0">未检测</el-radio>
          <el-radio :label="1">已检测</el-radio>
          <el-radio :label="2">检测失败</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="小红书昵称" prop="xhsUserName">
        <el-input v-model="form.xhsUserName" placeholder="小红书昵称" />
      </el-form-item>
      <el-form-item label="备注说明" prop="remark">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注说明" />
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
import {
  getXhsCommentRecordPage,
  getXhsCommentRecord,
  updateXhsCommentRecord,
  deleteXhsCommentRecord,
  getXhsCommentAnalysisPreview,
  XhsCommentRecordVO,
  XhsCommentAnalysisVO
} from '@/api/business/xhsCommentRecord'

defineOptions({ name: 'XhsCommentRecord' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref<XhsCommentRecordVO[]>([])
const analysis = ref<Partial<XhsCommentAnalysisVO>>({})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  appAccountId: undefined,
  appMobile: undefined,
  xhsUserId: undefined,
  xhsUserName: undefined,
  noteTitle: undefined,
  commentStatus: undefined,
  checkStatus: undefined,
  commentContent: undefined,
  createTime: []
})
const queryFormRef = ref()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const form = ref<Partial<XhsCommentRecordVO>>({})
const formRules = reactive({
  commentStatus: [{ required: true, message: '请选择评论状态', trigger: 'change' }]
})
const formRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await getXhsCommentRecordPage(queryParams)
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

const refreshAnalysis = async () => {
  try {
    analysis.value = await getXhsCommentAnalysisPreview()
  } catch (e) {
    console.error('获取统计预览失败', e)
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

const handleUpdate = async (row: XhsCommentRecordVO) => {
  dialogTitle.value = '修改评论状态与备注'
  dialogVisible.value = true
  formLoading.value = true
  try {
    const data = await getXhsCommentRecord(row.id)
    form.value = { ...data }
  } finally {
    formLoading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  formLoading.value = true
  try {
    await updateXhsCommentRecord(form.value)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    await getList()
    await refreshAnalysis()
  } finally {
    formLoading.value = false
  }
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await deleteXhsCommentRecord(id)
    message.success(t('common.delSuccess'))
    await getList()
    await refreshAnalysis()
  } catch {}
}

onMounted(() => {
  getList()
  refreshAnalysis()
})
</script>
