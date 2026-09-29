<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="70px"
    >
      <el-form-item label="应用标识" prop="appCode">
        <el-input
          v-model="queryParams.appCode"
          placeholder="请输入应用标识，如 autoft"
          clearable
          @keyup.enter="handleQuery"
          class="!w-200px"
        />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="全部" clearable class="!w-120px">
          <el-option label="Android" value="android" />
          <el-option label="iOS" value="ios" />
        </el-select>
      </el-form-item>
      <el-form-item label="版本名称" prop="versionName">
        <el-input
          v-model="queryParams.versionName"
          placeholder="如 2.1.2"
          clearable
          @keyup.enter="handleQuery"
          class="!w-150px"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable class="!w-120px">
          <el-option label="开启" :value="0" />
          <el-option label="停用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 发布新版本
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="应用标识" align="center" prop="appCode" min-width="100" />
      <el-table-column label="平台" align="center" prop="platform" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.platform === 'android' ? 'success' : 'primary'">
            {{ scope.row.platform }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="版本名称" align="center" prop="versionName" width="110" />
      <el-table-column label="内部版本号" align="center" prop="versionCode" width="110">
        <template #default="scope">
          <el-tag type="info">v{{ scope.row.versionCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最低兼容" align="center" prop="minVersionCode" width="100" />
      <el-table-column label="包大小" align="center" prop="fileSize" width="100" />
      <el-table-column label="强制更新" align="center" prop="forceUpdate" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.forceUpdate ? 'danger' : 'info'">
            {{ scope.row.forceUpdate ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status" width="90">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'danger'">
            {{ scope.row.status === 0 ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="更新说明" prop="description" min-width="180" />
      <el-table-column
        label="发布时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="操作" align="center" width="160" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
          >
            编辑
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
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

  <!-- 表单弹窗 -->
  <AppVersionForm ref="formRef" @success="getList" />
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { dateFormatter } from '@/utils/formatTime'
import { useMessage } from '@/hooks/web/useMessage'
import * as AppVersionApi from '@/api/infra/appVersion'
import AppVersionForm from './AppVersionForm.vue'

defineOptions({ name: 'InfraAppVersion' })

const message = useMessage()

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  appCode: undefined,
  platform: undefined,
  versionName: undefined,
  status: undefined
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await AppVersionApi.getAppVersionPage(queryParams)
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
  queryFormRef.value.resetFields()
  handleQuery()
}

const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

const handleDelete = async (id: number) => {
  try {
    await message.delConfirm()
    await AppVersionApi.deleteAppVersion(id)
    message.success('删除成功')
    await getList()
  } catch {}
}

onMounted(() => {
  getList()
})
</script>
