<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="formLoading"
    >
      <el-form-item label="套餐名" prop="name">
        <el-input v-model="formData.name" placeholder="如：月会员 / 年会员" />
      </el-form-item>
      <el-form-item label="价格(元)" prop="priceYuan">
        <el-input-number v-model="formData.priceYuan" :min="0" :precision="2" :step="0.01" />
      </el-form-item>
      <el-form-item label="时长(天)" prop="durationDays">
        <el-input-number v-model="formData.durationDays" :min="1" :precision="0" />
      </el-form-item>
      <el-form-item label="排序" prop="sort">
        <el-input-number v-model="formData.sort" :min="0" :precision="0" />
      </el-form-item>
      <el-form-item label="开启状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="dict in getIntDictOptions(DICT_TYPE.COMMON_STATUS)"
            :key="dict.value"
            :value="dict.value"
          >
            {{ dict.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import * as VipApi from '@/api/member/vip'
import { DICT_TYPE, getIntDictOptions } from '@/utils/dict'
import { fenToYuan, yuanToFen } from '@/utils'

const { t } = useI18n()
const message = useMessage()

const dialogVisible = ref(false)
const dialogTitle = ref('')
const formLoading = ref(false)
const formType = ref('')
const formData = ref<any>({
  id: undefined,
  name: undefined,
  priceYuan: undefined,
  durationDays: 30,
  sort: 0,
  status: 0
})
const formRules = reactive({
  name: [{ required: true, message: '套餐名不能为空', trigger: 'blur' }],
  priceYuan: [{ required: true, message: '价格不能为空', trigger: 'blur' }],
  durationDays: [{ required: true, message: '时长不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'blur' }]
})
const formRef = ref()

const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  if (id) {
    formLoading.value = true
    try {
      const data = await VipApi.getVipPackage(id)
      formData.value = {
        ...data,
        priceYuan: Number(fenToYuan(data.price))
      }
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open })

const emit = defineEmits(['success'])
const submitForm = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate()
  if (!valid) return
  formLoading.value = true
  try {
    const data = {
      id: formData.value.id,
      name: formData.value.name,
      price: yuanToFen(formData.value.priceYuan),
      durationDays: formData.value.durationDays,
      sort: formData.value.sort ?? 0,
      status: formData.value.status
    }
    if (formType.value === 'create') {
      await VipApi.createVipPackage(data)
      message.success(t('common.createSuccess'))
    } else {
      await VipApi.updateVipPackage(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    emit('success')
  } finally {
    formLoading.value = false
  }
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    name: undefined,
    priceYuan: undefined,
    durationDays: 30,
    sort: 0,
    status: 0
  }
  formRef.value?.resetFields()
}
</script>
