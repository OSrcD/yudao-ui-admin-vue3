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
      <el-form-item label="评论编号" prop="commentId">
        <el-input
          v-model="queryParams.commentId"
          placeholder="请输入评论编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="账号编号" prop="mediaAccountId">
        <el-input
          v-model="queryParams.mediaAccountId"
          placeholder="请输入自媒体账号编号"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="检查状态" prop="checkStatus">
        <el-select
          v-model="queryParams.checkStatus"
          placeholder="请选择检查状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_SCRAPER_CHECK_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="评论状态" prop="commentStatus">
        <el-select
          v-model="queryParams.commentStatus"
          placeholder="请选择评论状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_SCRAPER_COMMENT_STATUS)"
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
          v-hasPermi="['business:prompt-comment-complete:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="已评论编号" align="center" prop="id" />
      <el-table-column label="评论编号" align="center" prop="commentId" />
      <el-table-column label="账号编号" align="center" prop="mediaAccountId" />
      <el-table-column label="检查状态" align="center" prop="checkStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BIZ_SCRAPER_CHECK_STATUS" :value="scope.row.checkStatus" />
        </template>
      </el-table-column>
      <el-table-column label="评论状态" align="center" prop="commentStatus">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BIZ_SCRAPER_COMMENT_STATUS" :value="scope.row.commentStatus" />
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
            v-hasPermi="['business:prompt-comment-complete:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['business:prompt-comment-complete:delete']"
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
      <el-form-item label="评论编号" prop="commentId">
        <el-input v-model="form.commentId" placeholder="请输入评论编号" />
      </el-form-item>
      <el-form-item label="自媒体账号ID" prop="mediaAccountId">
        <el-input v-model="form.mediaAccountId" placeholder="请输入自媒体账号ID" />
      </el-form-item>
      <el-form-item label="检查状态" prop="checkStatus">
        <el-radio-group v-model="form.checkStatus">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_SCRAPER_CHECK_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="评论状态" prop="commentStatus">
        <el-radio-group v-model="form.commentStatus">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_SCRAPER_COMMENT_STATUS)"
            :key="dict.value"
            :label="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { getPromptCommentCompletePage, getPromptCommentComplete, createPromptCommentComplete, updatePromptCommentComplete, deletePromptCommentComplete } from '@/api/business/promptCommentComplete'

defineOptions({ name: 'PromptCommentComplete' })

const message = useMessage()
const { t } = useI18n()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  commentId: undefined,
  mediaAccountId: undefined,
  checkStatus: undefined,
  commentStatus: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await getPromptCommentCompletePage(queryParams)
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
  commentId: undefined,
  mediaAccountId: undefined,
  checkStatus: 0,
  commentStatus: 0,
  remark: undefined
})
const formRules = reactive({
  commentId: [{ required: true, message: '评论编号不能为空', trigger: 'blur' }],
  mediaAccountId: [{ required: true, message: '自媒体账号ID不能为空', trigger: 'blur' }]
})
const formRef = ref()

const handleAdd = () => {
  resetForm()
  dialogTitle.value = '添加已评论记录'
  formType.value = 'create'
  dialogVisible.value = true
}

const handleUpdate = async (id: number) => {
  resetForm()
  dialogTitle.value = '修改已评论记录'
  formType.value = 'update'
  dialogVisible.value = true
  formLoading.value = true
  try {
    form.value = await getPromptCommentComplete(id)
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
      await createPromptCommentComplete(data)
      message.success(t('common.createSuccess'))
    } else {
      await updatePromptCommentComplete(data)
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
    await deletePromptCommentComplete(id)
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const resetForm = () => {
  form.value = {
    id: undefined,
    commentId: undefined,
    mediaAccountId: undefined,
    checkStatus: 0,
    commentStatus: 0,
    remark: undefined
  }
  formRef.value?.resetFields()
}

onMounted(() => {
  getList()
})
</script>
