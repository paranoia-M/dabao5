<template>
  <div class="data-management-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2>航清环境、污染应急预案处理系统</h2>
        <div class="time-range">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleTimeChange"
          />
        </div>
      </div>

      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in overviewData" :key="item.name">
            <div class="overview-item">
              <div class="item-icon" :style="{ backgroundColor: item.color }">
                <span class="icon-text">{{ getIconText(item.name) }}</span>
              </div>
              <div class="item-content">
                <div class="item-title">{{ item.name }}</div>
                <div class="item-value">{{ item.value }} <span class="unit">{{ item.unit }}</span></div>
                <div class="item-trend" :class="item.trend">
                  <span class="trend-icon">{{ getTrendIcon(item.trend) }}</span> {{ item.trendValue }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <el-card class="dashboard-card chart-section">
      <div class="section-header">
        <h3>环境数据趋势分析</h3>
        <el-radio-group v-model="chartType" size="small" @change="fetchChartData">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
        </el-radio-group>
      </div>
      <div class="chart-container">
        <div class="chart-wrapper">
          <div ref="lineChart" class="chart" style="height: 300px;"></div>
        </div>
      </div>
    </el-card>

    <el-card class="dashboard-card">
      <div class="section-header">
        <h3>设备校准记录</h3>
        <el-button type="primary" size="small" @click="showAddDialog = true">新增校准</el-button>
      </div>
      <el-table
        :data="tableData"
        style="width: 100%"
        border
        v-loading="loading"
      >
        <el-table-column prop="date" label="校准日期" width="180" />
        <el-table-column prop="device" label="设备名称" width="180" />
        <el-table-column prop="type" label="监测类型" />
        <el-table-column prop="before" label="校准前数值" />
        <el-table-column prop="after" label="校准后数值" />
        <el-table-column prop="operator" label="操作人员" />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showAddDialog" :title="form.id ? '编辑校准记录' : '新增校准记录'" width="600px">
      <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
        <el-form-item label="设备名称" prop="device">
          <el-select v-model="form.device" placeholder="请选择设备" style="width: 100%">
            <el-option
              v-for="item in deviceOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="监测类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择监测类型" style="width: 100%">
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="校准前数值" prop="before">
          <el-input v-model="form.before" placeholder="请输入校准前数值" />
        </el-form-item>
        <el-form-item label="校准后数值" prop="after">
          <el-input v-model="form.after" placeholder="请输入校准后数值" />
        </el-form-item>
        <el-form-item label="操作人员" prop="operator">
          <el-input v-model="form.operator" placeholder="请输入操作人员" />
        </el-form-item>
        <el-form-item label="校准日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="校准详情" width="600px">
      <div class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="设备名称">{{ currentRecord.device }}</el-descriptions-item>
          <el-descriptions-item label="监测类型">{{ currentRecord.type }}</el-descriptions-item>
          <el-descriptions-item label="校准日期">{{ currentRecord.date }}</el-descriptions-item>
          <el-descriptions-item label="校准前数值">{{ currentRecord.before }}</el-descriptions-item>
          <el-descriptions-item label="校准后数值">{{ currentRecord.after }}</el-descriptions-item>
          <el-descriptions-item label="操作人员">{{ currentRecord.operator }}</el-descriptions-item>
          <el-descriptions-item label="校准差值">{{ calculateDifference(currentRecord.before, currentRecord.after) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'

// 数据概览
const overviewData = ref([
  {
    name: 'PM2.5',
    value: 32.5,
    unit: 'μg/m³',
    trend: 'up',
    trendValue: '2.1%',
    color: '#FF6B6B'
  },
  {
    name: '温度',
    value: 26.5,
    unit: '℃',
    trend: 'down',
    trendValue: '1.2%',
    color: '#4ECDC4'
  },
  {
    name: '湿度',
    value: 65,
    unit: '%',
    trend: 'stable',
    trendValue: '0.5%',
    color: '#45B7D1'
  },
  {
    name: '噪音',
    value: 42,
    unit: 'dB',
    trend: 'up',
    trendValue: '3.2%',
    color: '#A37EBA'
  }
])

// 获取图标文本
const getIconText = (name) => {
  const map = {
    'PM2.5': 'PM',
    '温度': '℃',
    '湿度': '%',
    '噪音': 'dB'
  }
  return map[name] || name.charAt(0)
}

// 获取趋势图标
const getTrendIcon = (trend) => {
  return trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'
}

// 时间范围选择
const timeRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()])
const handleTimeChange = () => {
  fetchOverviewData()
  fetchChartData()
  fetchTableData()
}

// 图表相关
const chartType = ref('day')
const lineChart = ref(null)
let chartInstance = null

// 模拟获取图表数据
const fetchChartData = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const dataMap = {
      day: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
      week: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      month: ['1日', '5日', '10日', '15日', '20日', '25日', '30日']
    }
    
    const xAxisData = dataMap[chartType.value]
    const seriesData = [
      {
        name: 'PM2.5',
        data: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 20)
      },
      {
        name: '温度',
        data: Array(7).fill(0).map(() => Math.floor(Math.random() * 10) + 20)
      },
      {
        name: '湿度',
        data: Array(7).fill(0).map(() => Math.floor(Math.random() * 20) + 50)
      },
      {
        name: '噪音',
        data: Array(7).fill(0).map(() => Math.floor(Math.random() * 15) + 35)
      }
    ]
    
    updateChart(xAxisData, seriesData)
  } catch (error) {
    ElMessage.error('获取图表数据失败')
  }
}

const updateChart = (xAxisData, seriesData) => {
  if (!chartInstance) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['PM2.5', '温度', '湿度', '噪音']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: xAxisData
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '数值',
        axisLabel: {
          formatter: '{value}'
        }
      }
    ],
    series: seriesData.map(item => ({
      name: item.name,
      type: 'line',
      smooth: true,
      lineStyle: {
        width: 2
      },
      showSymbol: true,
      areaStyle: {
        opacity: 0.3,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: overviewData.value.find(d => d.name === item.name).color + '80'
          },
          {
            offset: 1,
            color: overviewData.value.find(d => d.name === item.name).color + '10'
          }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: item.data
    }))
  }
  
  chartInstance.setOption(option, true)
}

const initChart = () => {
  if (!lineChart.value) return
  
  chartInstance = echarts.init(lineChart.value)
  fetchChartData()
}

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize()
  }
}

// 表格相关
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 模拟获取表格数据
const fetchTableData = async () => {
  try {
    loading.value = true
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockData = []
    const devices = ['空气质量监测仪001', '温湿度传感器002', '噪音监测仪003', '水质监测仪004']
    const types = ['PM2.5', '温度', '湿度', '噪音', '水质']
    const operators = ['张三', '李四', '王五', '赵六']
    
    for (let i = 0; i < 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)]
      mockData.push({
        id: i + 1,
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        device: devices[Math.floor(Math.random() * devices.length)],
        type: type,
        before: getRandomValue(type),
        after: getRandomValue(type, true),
        operator: operators[Math.floor(Math.random() * operators.length)]
      })
    }
    
    total.value = mockData.length
    tableData.value = mockData.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
  } catch (error) {
    ElMessage.error('获取表格数据失败')
  } finally {
    loading.value = false
  }
}

const getRandomValue = (type, isAfter = false) => {
  const ranges = {
    'PM2.5': [20, 50],
    '温度': [20, 30],
    '湿度': [50, 80],
    '噪音': [35, 60],
    '水质': [0, 100]
  }
  
  const [min, max] = ranges[type] || [0, 100]
  let value = Math.random() * (max - min) + min
  
  if (isAfter) {
    // 校准后的值应该更接近标准值
    const standard = (max + min) / 2
    value = value * 0.3 + standard * 0.7
  }
  
  return type === '温度' || type === '水质' ? value.toFixed(1) : Math.round(value)
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchTableData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchTableData()
}

// 表单验证函数
const validateNumber = (rule, value, callback) => {
  if (isNaN(value)) {
    callback(new Error('请输入数字'))
  } else {
    callback()
  }
}

// 表单相关
const showAddDialog = ref(false)
const formRef = ref(null)
const form = ref({
  id: null,
  device: '',
  type: '',
  before: '',
  after: '',
  operator: '',
  date: ''
})

const deviceOptions = [
  { value: '空气质量监测仪001', label: '空气质量监测仪001' },
  { value: '温湿度传感器002', label: '温湿度传感器002' },
  { value: '噪音监测仪003', label: '噪音监测仪003' },
  { value: '水质监测仪004', label: '水质监测仪004' }
]

const typeOptions = [
  { value: 'PM2.5', label: 'PM2.5' },
  { value: '温度', label: '温度' },
  { value: '湿度', label: '湿度' },
  { value: '噪音', label: '噪音' },
  { value: '水质', label: '水质' }
]

const rules = reactive({
  device: [{ required: true, message: '请选择设备', trigger: 'change' }],
  type: [{ required: true, message: '请选择监测类型', trigger: 'change' }],
  before: [
    { required: true, message: '请输入校准前数值', trigger: 'blur' },
    { validator: validateNumber, trigger: 'blur' }
  ],
  after: [
    { required: true, message: '请输入校准后数值', trigger: 'blur' },
    { validator: validateNumber, trigger: 'blur' }
  ],
  operator: [{ required: true, message: '请输入操作人员', trigger: 'blur' }],
  date: [{ required: true, message: '请选择日期', trigger: 'change' }]
})

const handleEdit = (row) => {
  form.value = { ...row }
  showAddDialog.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗?', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 模拟删除操作
    await new Promise(resolve => setTimeout(resolve, 300))
    ElMessage.success('删除成功')
    fetchTableData()
  } catch {
    // 用户取消删除
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    // 模拟提交操作
    await new Promise(resolve => setTimeout(resolve, 300))
    
    if (form.value.id) {
      // 更新操作
      const index = tableData.value.findIndex(item => item.id === form.value.id)
      if (index !== -1) {
        tableData.value[index] = { ...form.value }
      }
      ElMessage.success('更新成功')
    } else {
      // 新增操作
      const newRecord = {
        id: Date.now(),
        ...form.value
      }
      tableData.value.unshift(newRecord)
      total.value += 1
      ElMessage.success('新增成功')
    }
    
    showAddDialog.value = false
    fetchTableData()
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

// 详情弹窗
const showDetailDialog = ref(false)
const currentRecord = ref({})

const showDetail = (record) => {
  currentRecord.value = record
  showDetailDialog.value = true
}

const calculateDifference = (before, after) => {
  const diff = parseFloat(after) - parseFloat(before)
  return diff.toFixed(2)
}

// 模拟获取概览数据
const fetchOverviewData = async () => {
  try {
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 200))
    
    overviewData.value = overviewData.value.map(item => {
      const randomChange = Math.random() * 5 - 2.5
      const newValue = parseFloat(item.value) + randomChange
      const trend = randomChange > 0 ? 'up' : randomChange < 0 ? 'down' : 'stable'
      
      return {
        ...item,
        value: newValue.toFixed(1),
        trend: trend,
        trendValue: Math.abs(randomChange).toFixed(1) + '%'
      }
    })
  } catch (error) {
    ElMessage.error('获取概览数据失败')
  }
}

// 生命周期
onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
  fetchOverviewData()
  fetchTableData()
})

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', resizeChart)
})
</script>

<style lang="scss" scoped>
@use './DataManagement.scss';
</style>