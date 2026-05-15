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
      <el-form-item label="模板ID" prop="promptId">
        <el-input
          v-model="queryParams.promptId"
          placeholder="请输入模板ID"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="评论内容" prop="commentContent">
        <el-input
          v-model="queryParams.commentContent"
          placeholder="请输入内容"
          clearable
          @keyup.enter="handleQuery"
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
          v-hasPermi="['business:prompt-comment:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="评论ID" align="center" prop="id" />
      <el-table-column label="模板ID" align="center" prop="promptId" />
      <el-table-column label="标题" align="center" prop="title" />
      <el-table-column label="评论内容" align="center" prop="commentContent" />
      <el-table-column label="正常计数" align="center" prop="xhsNormalCount">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.xhsNormalCount > 0">{{ scope.row.xhsNormalCount }}</el-tag>
          <span v-else>{{ scope.row.xhsNormalCount || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="拦截计数" align="center" prop="xhsInterceptCount">
        <template #default="scope">
          <el-tag type="danger" v-if="scope.row.xhsInterceptCount > 0">{{ scope.row.xhsInterceptCount }}</el-tag>
          <span v-else>{{ scope.row.xhsInterceptCount || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="创建时间" align="center" prop="createTime" :formatter="dateFormatter" width="180px" />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleUpdate(scope.row.id)"
            v-hasPermi="['business:prompt-comment:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['business:prompt-comment:delete']"
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
      <el-form-item label="提示词模板ID" prop="promptId">
        <el-input v-model="form.promptId" placeholder="请输入模板ID" />
      </el-form-item>
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="评论内容" prop="commentContent">
        <el-input v-model="form.commentContent" type="textarea" :rows="4" placeholder="请输入评论内容" />
      </el-form-item>
      <el-form-item label="正常计数" prop="xhsNormalCount">
        <el-input-number v-model="form.xhsNormalCount" :min="0" />
      </el-form-item>
      <el-form-item label="拦截计数" prop="xhsInterceptCount">
        <el-input-number v-model="form.xhsInterceptCount" :min="0" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="请输入备注" />
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
import { getPromptCommentPage, getPromptComment, createPromptComment, updatePromptComment, deletePromptComment } from '@/api/business/promptComment'

defineOptions({ name: 'PromptComment' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  promptId: undefined,
  title: undefined,
  commentContent: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await getPromptCommentPage(queryParams)
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
  promptId: undefined,
  title: undefined,
  commentContent: undefined,
  xhsNormalCount: 0,
  xhsInterceptCount: 0,
  remark: undefined
})
const formRules = reactive({
  promptId: [{ required: true, message: '提示词模板ID不能为空', trigger: 'blur' }],
  commentContent: [{ required: true, message: '评论内容不能为空', trigger: 'blur' }]
})
const formRef = ref()

const handleAdd = () => {
  resetForm()
  dialogTitle.value = '添加提示词评论'
  formType.value = 'create'
  dialogVisible.value = true
}

const handleUpdate = async (id: number) => {
  resetForm()
  dialogTitle.value = '修改提示词评论'
  formType.value = 'update'
  dialogVisible.value = true
  formLoading.value = true
  try {
    form.value = await getPromptComment(id)
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
      await createPromptComment(data)
      message.success(t('common.createSuccess'))
    } else {
      await updatePromptComment(data)
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
    await deletePromptComment(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const resetForm = () => {
  form.value = {
    id: undefined,
    promptId: undefined,
    title: undefined,
    commentContent: undefined,
    xhsNormalCount: 0,
    xhsInterceptCount: 0,
    remark: undefined
  }
  formRef.value?.resetFields()
}

onMounted(() => {
  getList()
})
</script>
