<template>
  <Dialog v-model="dialogVisible" title="修改用户 VIP" width="640">
    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="formRules"
      label-width="110px"
    >
      <el-form-item label="用户编号">
        <el-input v-model="formData.id" class="!w-260px" disabled />
      </el-form-item>
      <el-form-item label="用户昵称">
        <el-input v-model="formData.nickname" class="!w-260px" disabled />
      </el-form-item>
      <el-form-item label="当前到期">
        <el-input :model-value="expireText" class="!w-260px" disabled />
      </el-form-item>
      <el-form-item label="当前状态">
        <el-tag :type="formData.vipActive ? 'success' : 'info'">
          {{ formData.vipActive ? '有效' : '无效/过期' }}
        </el-tag>
        <el-tag v-if="formData.vipTrialUsed" class="ml-8px" type="warning">已发试用</el-tag>
      </el-form-item>
      <el-form-item label="操作类型" prop="changeType">
        <el-radio-group v-model="formData.changeType">
          <el-radio :value="2">延长天数</el-radio>
          <el-radio :value="1">设置到期时间</el-radio>
          <el-radio :value="3">清空 VIP</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="formData.changeType === 2" label="延长天数" prop="durationDays">
        <el-input-number v-model="formData.durationDays" :min="1" :precision="0" class="!w-260px" />
        <div class="text-12px text-gray-400 mt-4px">快捷：3 / 30 / 365</div>
        <div class="mt-6px">
          <el-button size="small" @click="formData.durationDays = 3">试用 3 天</el-button>
          <el-button size="small" @click="formData.durationDays = 30">月卡 30 天</el-button>
          <el-button size="small" @click="formData.durationDays = 365">年卡 365 天</el-button>
        </div>
      </el-form-item>
      <el-form-item v-if="formData.changeType === 1" label="到期时间" prop="vipExpireTime">
        <el-date-picker
          v-model="formData.vipExpireTime"
          class="!w-260px"
          type="datetime"
          value-format="YYYY-MM-DD HH:mm:ss"
          placeholder="选择到期时间"
        />
      </el-form-item>
      <el-form-item label="试用标记">
        <el-select v-model="formData.vipTrialUsed" clearable class="!w-260px" placeholder="不修改">
          <el-option :value="true" label="已发放试用" />
          <el-option :value="false" label="未发放试用" />
        </el-select>
      </el-form-item>
      <el-form-item label="修改原因" prop="reason">
        <el-input v-model="formData.reason" type="textarea" placeholder="可选，便于运营留痕" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button :disabled="formLoading" type="primary" @click="submitForm">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script lang="ts" setup>
import * as UserApi from '@/api/member/user'

defineOptions({ name: 'UserVipUpdateForm' })

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const formLoading = ref(false)
const formData = ref<any>({
  id: undefined,
  nickname: undefined,
  vipExpireTime: undefined,
  vipTrialUsed: undefined,
  vipActive: false,
  changeType: 2,
  durationDays: 30,
  reason: undefined
})
const formRules = reactive({
  changeType: [{ required: true, message: '请选择操作类型', trigger: 'change' }],
  durationDays: [{ required: true, message: '延长天数不能为空', trigger: 'blur' }],
  vipExpireTime: [{ required: true, message: '到期时间不能为空', trigger: 'change' }]
})
const formRef = ref()

const expireText = computed(() => {
  const v = formData.value.vipExpireTime
  if (!v) return '无'
  return String(v).replace('T', ' ').slice(0, 19)
})

const open = async (id?: number) => {
  dialogVisible.value = true
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const user = await UserApi.getUser(id)
      formData.value.id = user.id
      formData.value.nickname = user.nickname
      formData.value.vipExpireTime = user.vipExpireTime
      formData.value.vipTrialUsed = undefined
      formData.value.vipActive = !!user.vipActive
      formData.value.changeType = 2
      formData.value.durationDays = 30
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return
  if (formData.value.changeType === 2) {
    await formRef.value.validateField('durationDays')
  } else if (formData.value.changeType === 1) {
    await formRef.value.validateField('vipExpireTime')
  }
  formLoading.value = true
  try {
    const payload: any = {
      id: formData.value.id,
      changeType: formData.value.changeType,
      reason: formData.value.reason
    }
    if (formData.value.changeType === 1) {
      payload.vipExpireTime = formData.value.vipExpireTime
    } else if (formData.value.changeType === 2) {
      payload.durationDays = formData.value.durationDays
    }
    if (formData.value.vipTrialUsed === true || formData.value.vipTrialUsed === false) {
      payload.vipTrialUsed = formData.value.vipTrialUsed
    }
    await UserApi.updateUserVip(payload)
    message.success(t('common.updateSuccess'))
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    nickname: undefined,
    vipExpireTime: undefined,
    vipTrialUsed: undefined,
    vipActive: false,
    changeType: 2,
    durationDays: 30,
    reason: undefined
  }
  formRef.value?.resetFields()
}
</script>
