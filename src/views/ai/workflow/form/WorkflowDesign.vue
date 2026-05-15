<template>
  <div class="relative" style="width: 100%; height: 700px">
    <Tinyflow
      v-if="workflowData"
      ref="tinyflowRef"
      :className="'custom-class'"
      :style="{ width: '100%', height: '100%' }"
      :data="workflowData"
      :provider="provider"
      :customNodes="customNodes"
    />
    <div class="absolute top-30px right-30px">
      <el-button @click="testWorkflowModel" type="primary" v-hasPermi="['ai:workflow:test']">
        测试
      </el-button>
    </div>

    <!-- 测试窗口 -->
    <el-drawer v-model="showTestDrawer" title="工作流测试" :modal="false">
      <fieldset>
        <legend class="ml-15px"><h3>运行参数配置</h3></legend>
        <div class="p-20px">
          <div
            class="flex justify-around mb-10px"
            v-for="(param, index) in params4Test"
            :key="index"
          >
            <el-select class="w-200px!" v-model="param.key" placeholder="参数名">
              <el-option
                v-for="(value, key) in paramsOfStartNode"
                :key="key"
                :label="value?.description || key"
                :value="key"
                :disabled="!!value?.disabled"
              />
            </el-select>
            <el-input class="w-200px!" v-model="param.value" placeholder="参数值" />
            <el-button type="danger" plain :icon="Delete" circle @click="removeParam(index)" />
          </div>
          <!-- TODO @lesan：是不是不用添加和删除参数，直接把必填和选填列出来，然后加上参数校验？ -->
          <el-button type="primary" plain @click="addParam">添加参数</el-button>
        </div>
      </fieldset>
      <fieldset class="mt-20px bg-#f8f9fa">
        <legend class="ml-15px"><h3>运行结果</h3></legend>
        <div class="p-20px">
          <div v-if="loading"> <el-text type="primary">执行中...</el-text></div>
          <div v-else-if="error">
            <el-text type="danger">{{ error }}</el-text>
          </div>
          <pre v-else-if="testResult" class="result-content"
            >{{ JSON.stringify(testResult, null, 2) }}
          </pre>
          <div v-else> <el-text type="info">点击运行查看结果</el-text> </div>
        </div>
      </fieldset>
      <el-button class="mt-20px w-100%" size="large" type="success" @click="goRun">
        运行流程
      </el-button>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, Ref, createApp } from 'vue'
import Tinyflow from '@/components/Tinyflow/Tinyflow.vue'
import * as WorkflowApi from '@/api/ai/workflow'
import { Delete } from '@element-plus/icons-vue'
import PuppeteerNodeConfig from './PuppeteerNodeConfig.vue'

const props = defineProps<{
  modelValue: any
  provider: any
}>()

const tinyflowRef = ref()
const workflowData = inject('workflowData') as Ref
const showTestDrawer = ref(false)
const params4Test = ref([])
const paramsOfStartNode = ref({})
const testResult = ref(null)
const loading = ref(false)
const error = ref(null)

const customNodes = {
  puppeteerNode: {
    title: '大模型本地执行节点',
    description: '通过本地 Puppeteer 环境执行 AI 自动化任务',
    icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 9.5H21C21.55 9.5 22 9.95 22 10.5V14.5C22 15.05 21.55 15.5 21 15.5H19.5V17C19.5 18.66 18.16 20 16.5 20H7.5C5.84 20 4.5 18.66 4.5 17V15.5H3C2.45 15.5 2 15.05 2 14.5V10.5C2 9.95 2.45 9.5 3 9.5H4.5V8C4.5 6.34 5.84 5 7.5 5H10.5V3H13.5V5H16.5C18.16 5 19.5 6.34 19.5 8V9.5ZM17.5 9.5V8C17.5 7.45 17.05 7 16.5 7H7.5C6.95 7 6.5 7.45 6.5 8V17C6.5 17.55 6.95 18 7.5 18H16.5C17.05 18 17.5 17.55 17.5 17V9.5ZM9 11.5C9.83 11.5 10.5 10.83 10.5 10C10.5 9.17 9.83 8.5 9 8.5C8.17 8.5 7.5 9.17 7.5 10C7.5 10.83 8.17 11.5 9 11.5ZM16.5 10C16.5 10.83 15.83 11.5 15 11.5C14.17 11.5 13.5 10.83 13.5 10C13.5 9.17 14.17 8.5 15 8.5C15.83 8.5 16.5 9.17 16.5 10ZM15.5 15H8.5V13H15.5V15Z" fill="currentColor"/></svg>`,
    group: 'tools',
    parameters: [],
    outputDefs: [
      { name: 'taskId', description: '任务 ID', dataType: 'Number' },
      { name: 'status', description: '状态', dataType: 'String' }
    ],
    render: (parent, node, flow) => {
      const app = createApp(PuppeteerNodeConfig, {
        node,
        onUpdate: (newData) => flow.updateNodeData(node.id, newData)
      })
      app.mount(parent)
    }
  }
}

/** 展示工作流测试抽屉 */
const testWorkflowModel = () => {
  showTestDrawer.value = !showTestDrawer.value
}

/** 运行流程 */
const goRun = async () => {
  try {
    const val = tinyflowRef.value.getData()
    loading.value = true
    error.value = null
    testResult.value = null
    /// 查找start节点
    const startNode = getStartNode()

    // 获取参数定义
    const parameters = startNode.data?.parameters || []
    const paramDefinitions = {}
    parameters.forEach((param) => {
      paramDefinitions[param.name] = param.dataType
    })

    // 参数类型转换
    const convertedParams = {}
    for (const { key, value } of params4Test.value) {
      const paramKey = key.trim()
      if (!paramKey) continue

      let dataType = paramDefinitions[paramKey]
      if (!dataType) {
        dataType = 'String'
      }

      try {
        convertedParams[paramKey] = convertParamValue(value, dataType)
      } catch (e) {
        throw new Error(`参数 ${paramKey} 转换失败: ${e.message}`)
      }
    }

    const data = {
      id: props.modelValue?.id,
      graph: JSON.stringify(val),
      params: convertedParams
    }

    const response = await WorkflowApi.testWorkflow(data)
    testResult.value = response
  } catch (err) {
    error.value = err.response?.data?.message || '运行失败，请检查参数和网络连接'
  } finally {
    loading.value = false
  }
}

/** 监听测试抽屉的开启，获取开始节点参数列表 */
watch(showTestDrawer, (value) => {
  if (!value) return

  /// 查找start节点
  const startNode = getStartNode()

  // 获取参数定义
  const parameters = startNode.data?.parameters || []
  const paramDefinitions = {}

  // 加入参数选项方便用户添加非必须参数
  parameters.forEach((param) => {
    paramDefinitions[param.name] = param
  })

  function mergeIfRequiredButNotSet(target) {
    let needPushList = []
    for (let key in paramDefinitions) {
      let param = paramDefinitions[key]

      if (param.required) {
        let item = target.find((item) => item.key === key)

        if (!item) {
          needPushList.push({ key: param.name, value: param.defaultValue || '' })
        }
      }
    }
    target.push(...needPushList)
  }
  // 自动装载需必填的参数
  mergeIfRequiredButNotSet(params4Test.value)

  paramsOfStartNode.value = paramDefinitions
})

/** 获取开始节点 */
const getStartNode = () => {
  const val = tinyflowRef.value.getData()
  const startNode = val.nodes.find((node) => node.type === 'startNode')
  if (!startNode) {
    throw new Error('流程缺少开始节点')
  }
  return startNode
}

/** 添加参数项 */
const addParam = () => {
  params4Test.value.push({ key: '', value: '' })
}

/** 删除参数项 */
const removeParam = (index) => {
  params4Test.value.splice(index, 1)
}

/** 类型转换函数 */
const convertParamValue = (value, dataType) => {
  if (value === '') return null // 空值处理

  switch (dataType) {
    case 'String':
      return String(value)
    case 'Number':
      const num = Number(value)
      if (isNaN(num)) throw new Error('非数字格式')
      return num
    case 'Boolean':
      if (value.toLowerCase() === 'true') return true
      if (value.toLowerCase() === 'false') return false
      throw new Error('必须为 true/false')
    case 'Object':
    case 'Array':
      try {
        return JSON.parse(value)
      } catch (e) {
        throw new Error(`JSON格式错误: ${e.message}`)
      }
    default:
      throw new Error(`不支持的类型: ${dataType}`)
  }
}

/** 表单校验 */
const validate = async () => {
  try {
    // 获取最新的流程数据
    if (!workflowData.value) {
      throw new Error('请设计流程')
    }
    workflowData.value = tinyflowRef.value.getData()
    return true
  } catch (error) {
    throw error
  }
}
defineExpose({
  validate
})
</script>

<style lang="css" scoped>
.result-content {
  background: white;
  padding: 12px;
  border-radius: 4px;
  max-height: 300px;
  overflow: auto;
  font-family: Monaco, Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}
</style>
