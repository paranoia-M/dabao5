
<template>
  <div class="environment-monitor-container">
    <!-- 顶部可视化卡片区域 -->
    <div class="dashboard-cards">
      <el-card class="stat-card" v-for="card in statCards" :key="card.type" shadow="hover">
        <div class="card-content">
          <div class="card-icon" :class="card.type">
            <span class="icon-font">{{ getIconText(card.type) }}</span>
          </div>
          <div class="card-info">
            <h3>{{ card.title }}</h3>
            <div class="card-value">
              <span class="value">{{ card.value }}</span>
              <span class="unit">{{ card.unit }}</span>
            </div>
            <div class="card-status">
              <el-tag :type="card.statusType" size="small">{{ card.status }}</el-tag>
              <span class="trend" :class="card.trend">
                <span class="trend-icon">{{ card.trend === 'up' ? '↑' : '↓' }}</span>
                {{ card.trendValue }}
              </span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主数据区域 -->
    <el-card class="main-card" shadow="hover">
      <div class="card-header">
        <h2>环境监测实时数据</h2>
        <div class="filter-group">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索监测点" 
            clearable 
            style="width: 200px"
            @clear="handleSearchClear"
          />
          <el-select 
            v-model="filterType" 
            placeholder="选择环境类型" 
            clearable
            style="width: 180px; margin-left: 10px"
          >
            <el-option 
              v-for="item in environmentTypes" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
          <el-button 
            type="primary" 
            style="margin-left: 10px"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button 
            type="success" 
            style="margin-left: 10px"
            @click="handleRefresh"
          >
            刷新数据
          </el-button>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table 
        :data="filteredData" 
        style="width: 100%" 
        v-loading="loading"
        :default-sort="{ prop: 'timestamp', order: 'descending' }"
        stripe
      >
        <el-table-column 
          prop="location" 
          label="监测点" 
          sortable 
          width="180"
        />
        <el-table-column 
          prop="type" 
          label="环境类型" 
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getTagType(row.type)">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="value" 
          label="监测值" 
          width="120"
        >
          <template #default="{ row }">
            {{ row.value }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column 
          prop="status" 
          label="状态" 
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="timestamp" 
          label="更新时间" 
          sortable 
          width="180"
        >
          <template #default="{ row }">
            {{ formatTime(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column 
          label="操作" 
          width="180"
        >
          <template #default="{ row }">
            <el-button 
              size="small" 
              @click="handleCalibrate(row)"
            >
              校准
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="handleDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
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

    <!-- 校准对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      title="数据校准" 
      width="500px"
    >
      <el-form 
        :model="calibrationForm" 
        label-width="120px"
        ref="calibrationFormRef"
      >
        <el-form-item label="监测点位置">
          <el-input 
            v-model="calibrationForm.location" 
            disabled
          />
        </el-form-item>
        <el-form-item label="环境类型">
          <el-input 
            v-model="calibrationForm.type" 
            disabled
          />
        </el-form-item>
        <el-form-item 
          label="当前值" 
          prop="currentValue"
        >
          <el-input 
            v-model="calibrationForm.currentValue" 
            disabled
          />
        </el-form-item>
        <el-form-item 
          label="校准值" 
          prop="newValue"
          :rules="[
            { required: true, message: '请输入校准值', trigger: 'blur' },
            { validator: validateCalibrationValue, trigger: 'blur' }
          ]"
        >
          <el-input 
            v-model="calibrationForm.newValue" 
            :placeholder="'请输入校准值 (' + calibrationForm.unit + ')'"
          />
        </el-form-item>
        <el-form-item 
          label="校准原因" 
          prop="reason"
          :rules="[
            { required: true, message: '请输入校准原因', trigger: 'blur' }
          ]"
        >
          <el-input 
            v-model="calibrationForm.reason" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入校准原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitCalibration"
          :loading="submitting"
        >
          确认校准
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="监测点详情" 
      width="600px"
    >
      <div class="detail-container">
        <div class="detail-row">
          <span class="detail-label">监测点位置:</span>
          <span class="detail-value">{{ currentDetail.location }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">环境类型:</span>
          <span class="detail-value">
            <el-tag :type="getTagType(currentDetail.type)">
              {{ currentDetail.type }}
            </el-tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">当前值:</span>
          <span class="detail-value">
            {{ currentDetail.value }} {{ currentDetail.unit }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态:</span>
          <span class="detail-value">
            <el-tag :type="getStatusType(currentDetail.status)">
              {{ currentDetail.status }}
            </el-tag>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">更新时间:</span>
          <span class="detail-value">{{ formatTime(currentDetail.timestamp) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">历史数据:</span>
          <div class="history-chart">
            <div class="chart-placeholder">
              <el-empty description="历史数据图表" />
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟数据
const mockData = [
  {
    id: 1,
    location: '东区A栋1楼',
    type: '温度',
    value: 26.5,
    unit: '°C',
    status: '正常',
    timestamp: Date.now() - 1000 * 60 * 5
  },
  {
    id: 2,
    location: '西区B栋3楼',
    type: '湿度',
    value: 45,
    unit: '%',
    status: '偏低',
    timestamp: Date.now() - 1000 * 60 * 15
  },
  {
    id: 3,
    location: '南区C栋2楼',
    type: 'PM2.5',
    value: 35,
    unit: 'μg/m³',
    status: '正常',
    timestamp: Date.now() - 1000 * 60 * 30
  },
  {
    id: 4,
    location: '北区D栋1楼',
    type: 'CO2',
    value: 800,
    unit: 'ppm',
    status: '偏高',
    timestamp: Date.now() - 1000 * 60 * 45
  },
  {
    id: 5,
    location: '中区E栋4楼',
    type: '噪音',
    value: 65,
    unit: 'dB',
    status: '正常',
    timestamp: Date.now() - 1000 * 60 * 60
  },
  {
    id: 6,
    location: '东区A栋2楼',
    type: '温度',
    value: 24.8,
    unit: '°C',
    status: '正常',
    timestamp: Date.now() - 1000 * 60 * 75
  },
  {
    id: 7,
    location: '西区B栋1楼',
    type: '湿度',
    value: 60,
    unit: '%',
    status: '正常',
    timestamp: Date.now() - 1000 * 60 * 90
  },
  {
    id: 8,
    location: '南区C栋3楼',
    type: 'PM2.5',
    value: 55,
    unit: 'μg/m³',
    status: '偏高',
    timestamp: Date.now() - 1000 * 60 * 105
  },
  {
    id: 9,
    location: '北区D栋2楼',
    type: 'CO2',
    value: 1200,
    unit: 'ppm',
    status: '严重偏高',
    timestamp: Date.now() - 1000 * 60 * 120
  },
  {
    id: 10,
    location: '中区E栋1楼',
    type: '噪音',
    value: 75,
    unit: 'dB',
    status: '偏高',
    timestamp: Date.now() - 1000 * 60 * 135
  }
]

// 顶部统计卡片数据
const statCards = ref([
  {
    type: 'temperature',
    title: '平均温度',
    value: '24.8',
    unit: '°C',
    status: '正常',
    statusType: 'success',
    trend: 'up',
    trendValue: '+0.5°C'
  },
  {
    type: 'humidity',
    title: '平均湿度',
    value: '52',
    unit: '%',
    status: '正常',
    statusType: 'success',
    trend: 'down',
    trendValue: '-3%'
  },
  {
    type: 'pm25',
    title: 'PM2.5',
    value: '42',
    unit: 'μg/m³',
    status: '良好',
    statusType: 'success',
    trend: 'up',
    trendValue: '+5μg/m³'
  },
  {
    type: 'co2',
    title: 'CO2浓度',
    value: '850',
    unit: 'ppm',
    status: '正常',
    statusType: 'success',
    trend: 'down',
    trendValue: '-50ppm'
  }
])

// 响应式数据
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(mockData.length)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const submitting = ref(false)
const calibrationFormRef = ref(null)

const environmentTypes = [
  { value: '温度', label: '温度' },
  { value: '湿度', label: '湿度' },
  { value: 'PM2.5', label: 'PM2.5' },
  { value: 'CO2', label: 'CO2' },
  { value: '噪音', label: '噪音' }
]

const calibrationForm = ref({
  id: null,
  location: '',
  type: '',
  currentValue: '',
  newValue: '',
  unit: '',
  reason: ''
})

const currentDetail = ref({
  location: '',
  type: '',
  value: '',
  unit: '',
  status: '',
  timestamp: ''
})

// 计算属性
const filteredData = computed(() => {
  let result = [...mockData]
  
  if (searchQuery.value) {
    result = result.filter(item => 
      item.location.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (filterType.value) {
    result = result.filter(item => item.type === filterType.value)
  }
  
  // 模拟分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  total.value = result.length
  return result.slice(start, end)
})

// 方法
const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    currentPage.value = 1
  }, 500)
}

const handleRefresh = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

const handleSearchClear = () => {
  searchQuery.value = ''
  handleSearch()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  handleSearch()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  handleSearch()
}

const handleCalibrate = (row) => {
  calibrationForm.value = {
    id: row.id,
    location: row.location,
    type: row.type,
    currentValue: row.value,
    newValue: '',
    unit: row.unit,
    reason: ''
  }
  dialogVisible.value = true
}

const handleDetail = (row) => {
  currentDetail.value = { ...row }
  detailDialogVisible.value = true
}

const validateCalibrationValue = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入校准值'))
  } else if (isNaN(value)) {
    callback(new Error('请输入数字'))
  } else {
    callback()
  }
}

const submitCalibration = async () => {
  try {
    await calibrationFormRef.value.validate()
    submitting.value = true
    
    // 模拟API调用
    setTimeout(() => {
      submitting.value = false
      dialogVisible.value = false
      ElMessage.success('校准成功')
      
      // 更新模拟数据
      const index = mockData.findIndex(item => item.id === calibrationForm.value.id)
      if (index !== -1) {
        mockData[index].value = calibrationForm.value.newValue
        mockData[index].timestamp = Date.now()
        
        // 根据值更新状态
        const type = mockData[index].type
        const value = parseFloat(calibrationForm.value.newValue)
        
        if (type === '温度') {
          mockData[index].status = value < 10 ? '偏低' : value > 30 ? '偏高' : '正常'
        } else if (type === '湿度') {
          mockData[index].status = value < 30 ? '偏低' : value > 70 ? '偏高' : '正常'
        } else if (type === 'PM2.5') {
          mockData[index].status = value > 75 ? '偏高' : '正常'
        } else if (type === 'CO2') {
          mockData[index].status = value > 1000 ? '偏高' : value > 1500 ? '严重偏高' : '正常'
        } else if (type === '噪音') {
          mockData[index].status = value > 70 ? '偏高' : '正常'
        }
      }
    }, 1000)
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const getTagType = (type) => {
  const map = {
    '温度': 'danger',
    '湿度': 'warning',
    'PM2.5': 'info',
    'CO2': 'success',
    '噪音': ''
  }
  return map[type] || ''
}

const getStatusType = (status) => {
  const map = {
    '正常': 'success',
    '偏低': 'info',
    '偏高': 'warning',
    '严重偏高': 'danger'
  }
  return map[status] || ''
}

const getIconText = (type) => {
  const map = {
    'temperature': '🌡️',
    'humidity': '💧',
    'pm25': '🌫️',
    'co2': '🌿'
  }
  return map[type] || '📊'
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
}

const padZero = (num) => {
  return num < 10 ? `0${num}` : num
}

// 生命周期钩子
onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>
