<template>
  <ContentWrap>
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="用户编号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="用户编号"
          clearable
          class="!w-200px"
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="支付状态" prop="payStatus">
        <el-select v-model="queryParams.payStatus" clearable placeholder="全部" class="!w-200px">
          <el-option :value="true" label="已支付" />
          <el-option :value="false" label="未支付" />
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
      </el-form-item>
    </el-form>
  </ContentWrap>

  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="订单号" align="center" prop="id" width="90" />
      <el-table-column label="用户" align="center" min-width="140">
        <template #default="{ row }">
          <div>{{ row.userNickname || '-' }}</div>
          <div class="text-12px text-gray-400">{{ row.userMobile || row.userId }}</div>
        </template>
      </el-table-column>
      <el-table-column label="套餐" align="center" prop="packageName" min-width="100" />
      <el-table-column label="金额" align="center" prop="price" width="100">
        <template #default="{ row }"> {{ fenToYuan(row.price) }} 元</template>
      </el-table-column>
      <el-table-column label="天数" align="center" prop="durationDays" width="80" />
      <el-table-column label="支付状态" align="center" prop="payStatus" width="100">
        <template #default="{ row }">
          <el-tag :type="row.payStatus ? 'success' : 'info'">
            {{ row.payStatus ? '已支付' : '未支付' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付单号" align="center" prop="payOrderId" width="110" />
      <el-table-column label="渠道" align="center" prop="payChannelCode" width="100" />
      <el-table-column
        label="支付时间"
        align="center"
        prop="payTime"
        :formatter="dateFormatter"
        width="170"
      />
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="170"
      />
    </el-table>
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import * as VipApi from '@/api/member/vip'
import { fenToYuan } from '@/utils'

defineOptions({ name: 'MemberVipOrder' })

const loading = ref(true)
const total = ref(0)
const list = ref([])
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  userId: undefined as any,
  payStatus: undefined as any,
  createTime: []
})
const queryFormRef = ref()

const getList = async () => {
  loading.value = true
  try {
    const data = await VipApi.getVipOrderPage(queryParams)
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

onMounted(() => {
  getList()
})
</script>
