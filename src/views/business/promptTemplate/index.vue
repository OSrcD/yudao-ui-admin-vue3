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
      <el-form-item label="提示词模板" prop="template">
        <el-input
          v-model="queryParams.template"
          placeholder="请输入提示词模板"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="提示词分类" prop="templateType">
        <el-select
          v-model="queryParams.templateType"
          placeholder="请选择提示词分类"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_PROMPT_TEMPLATE_TYPE)"
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
          v-hasPermi="['business:prompt-template:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="提示词ID" align="center" prop="id" />
      <el-table-column label="提示词模板" align="center" prop="template" />
      <el-table-column label="提示词分类" align="center" prop="templateType">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.BIZ_PROMPT_TEMPLATE_TYPE" :value="scope.row.templateType" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.COMMON_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['business:prompt-template:update']"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['business:prompt-template:delete']"
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
      <el-form-item label="提示词模板" prop="template">
        <el-input v-model="form.template" type="textarea" :rows="4" placeholder="请输入提示词模板" />
      </el-form-item>
      <el-form-item label="提示词分类" prop="templateType">
        <el-select v-model="form.templateType" placeholder="请选择提示词分类">
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.BIZ_PROMPT_TEMPLATE_TYPE)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
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
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { getPromptTemplatePage, getPromptTemplate, deletePromptTemplate, createPromptTemplate, updatePromptTemplate } from '@/api/business/promptTemplate'

defineOptions({ name: 'BusinessPromptTemplate' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const total = ref(0) // 列表的总页数
const list = ref([]) // 列表的数据
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  template: undefined,
  templateType: undefined,
  status: undefined
})
const queryFormRef = ref() // 搜索表单

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await getPromptTemplatePage(queryParams)
    list.value = data.rows
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

/** 表单弹窗相关 */
const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：修改时从后台载入数据
const formType = ref('') // 表单的类型：create 还是 update
const form = ref({
  id: undefined,
  template: undefined,
  templateType: undefined,
  status: 0,
  remark: undefined
})
const formRules = reactive({
  template: [{ required: true, message: '提示词模板不能为空', trigger: 'blur' }],
  templateType: [{ required: true, message: '提示词分类不能为空', trigger: 'change' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref() // 表单 Ref

/** 新增按钮操作 */
const handleAdd = () => {
  resetForm()
  dialogTitle.value = '添加提示词模板'
  formType.value = 'create'
  dialogVisible.value = true
}

/** 修改按钮操作 */
const handleUpdate = async (row: any) => {
  resetForm()
  dialogTitle.value = '修改提示词模板'
  formType.value = 'update'
  dialogVisible.value = true
  formLoading.value = true
  try {
    const data = await getPromptTemplate(row.id)
    form.value = data
  } finally {
    formLoading.value = false
  }
}

/** 提交表单 */
const submitForm = async () => {
  // 校验表单
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  // 提交请求
  formLoading.value = true
  try {
    const data = form.value as any
    if (formType.value === 'create') {
      await createPromptTemplate(data)
      message.success(t('common.createSuccess'))
    } else {
      await updatePromptTemplate(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 刷新列表
    await getList()
  } finally {
    formLoading.value = false
  }
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 二次确认
    await message.delConfirm()
    // 发起删除
    await deletePromptTemplate(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 重置表单 */
const resetForm = () => {
  form.value = {
    id: undefined,
    template: undefined,
    templateType: undefined,
    status: 0,
    remark: undefined
  }
  formRef.value?.resetFields()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>
