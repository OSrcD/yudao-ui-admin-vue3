<template>
  <doc-alert title="AI 视频创作" url="https://doc.iocoder.cn/ai/video/" />

  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="68px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-select
          v-model="queryParams.userId"
          clearable
          placeholder="请输入用户编号"
          class="!w-240px"
        >
          <el-option
            v-for="item in userList"
            :key="item.id"
            :label="item.nickname"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="视频状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择视频状态"
          clearable
          class="!w-240px"
        >
          <el-option
            v-for="dict in getIntDictOptions(DICT_TYPE.AI_IMAGE_STATUS)"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="提示词" prop="prompt">
        <el-input
          v-model="queryParams.prompt"
          placeholder="请输入提示词"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
        <el-button type="primary" @click="handleSync"><Icon icon="ep:refresh" class="mr-5px" /> 同步进展</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="100" fixed="left" />
      <el-table-column label="视频" align="center" prop="videoUrl" width="200px">
        <template #default="{ row }">
          <video
            v-if="row.videoUrl"
            :src="row.videoUrl"
            class="h-100px w-180px"
            controls
          ></video>
          <el-image
            v-else-if="row.previewUrl"
            class="h-100px w-180px"
            :src="row.previewUrl"
            fit="cover"
          />
          <span v-else>无视频</span>
        </template>
      </el-table-column>
      <el-table-column label="用户" align="center" prop="userId" width="120">
        <template #default="scope">
          <span>{{ userList.find((item) => item.id === scope.row.userId)?.nickname || scope.row.userId }}</span>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_PLATFORM" :value="scope.row.platform" />
        </template>
      </el-table-column>
      <el-table-column label="模型" align="center" prop="model" width="150" />
      <el-table-column label="状态" align="center" prop="status" width="100">
        <template #default="scope">
          <dict-tag :type="DICT_TYPE.AI_IMAGE_STATUS" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="提示词" align="center" prop="prompt" min-width="200" />
      <el-table-column label="分辨率" align="center" width="100">
        <template #default="scope">
          {{ scope.row.width }}x{{ scope.row.height }}
        </template>
      </el-table-column>
      <el-table-column label="时长" align="center" prop="duration" width="80">
        <template #default="scope">
          {{ scope.row.duration }}s
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="180px"
      />
      <el-table-column label="错误信息" align="center" prop="errorMessage" width="150" />
      <el-table-column label="任务编号" align="center" prop="taskId" width="180" />
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleSync(scope.row.id)"
            v-if="scope.row.status === 10"
          >
            同步
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['ai:video:delete']"
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
</template>

<script setup lang="ts">
import { getIntDictOptions, DICT_TYPE } from '@/utils/dict'
import { dateFormatter } from '@/utils/formatTime'
import { VideoApi, VideoVO } from '@/api/ai/video'
import * as UserApi from '@/api/system/user'

/** AI 视频 列表 */
defineOptions({ name: 'AiVideoManager' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<VideoVO[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined,
  status: undefined,
  prompt: undefined
})
const queryFormRef = ref() // 搜索的表单
const userList = ref<UserApi.UserVO[]>([]) // 用户列表

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await VideoApi.getVideoPage(queryParams)
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

/** 同步进展操作 */
const handleSync = async (id?: number) => {
  try {
    await VideoApi.syncVideo(id)
    message.success(id ? '已触发同步' : '已触发全量同步')
    getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await VideoApi.deleteVideo(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(async () => {
  getList()
  // 获得用户列表
  userList.value = await UserApi.getSimpleUserList()
})
</script>
