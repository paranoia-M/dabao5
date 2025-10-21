<template>
  <div class="dashboard-container">
    <!-- 标题区域 -->
    <div class="header-container">
      <h2>泰捷欣监控设备数据压缩上传应用系统</h2>
      <div class="status-indicator">
        <span class="status-dot" :class="{ 'active': systemStatus === 'normal' }"></span>
        <span>系统状态: {{ systemStatus === 'normal' ? '正常运行' : '异常' }}</span>
      </div>
    </div>

    <!-- 表单区域 -->
    <el-card class="form-card" shadow="hover">
      <el-form :model="formData" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="formData.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                class="full-width"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="筛选类型">
              <el-select v-model="formData.type" placeholder="请选择" class="full-width">
                <el-option
                  v-for="item in typeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 统计卡片区域 -->
    <div class="stats-row">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <div class="stat-title">今日告警</div>
          <div class="stat-value warning">{{ stats.todayAlerts }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <div class="stat-title">处理中</div>
          <div class="stat-value processing">{{ stats.processing }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <div class="stat-title">已解决</div>
          <div class="stat-value success">{{ stats.resolved }}</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-item">
          <div class="stat-title">系统可用率</div>
          <div class="stat-value primary">{{ stats.availability }}%</div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="chart-row">
      <el-card class="chart-card" shadow="hover">
        <div class="chart-header">
          <h3>告警类型分布</h3>
          <el-select v-model="chartTimeRange" size="small" style="width: 120px">
            <el-option label="近7天" value="7d" />
            <el-option label="近30天" value="30d" />
            <el-option label="近90天" value="90d" />
          </el-select>
        </div>
        <div class="pie-chart-container">
          <PieChart :chart-data="pieChartData" />
        </div>
      </el-card>
      <el-card class="chart-card" shadow="hover">
        <div class="chart-header">
          <h3>告警趋势</h3>
          <el-select v-model="trendTimeRange" size="small" style="width: 120px">
            <el-option label="近7天" value="7d" />
            <el-option label="近30天" value="30d" />
            <el-option label="近90天" value="90d" />
          </el-select>
        </div>
        <div class="line-chart-container">
          <LineChart :chart-data="lineChartData" />
        </div>
      </el-card>
    </div>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <div class="table-header">
        <h3>告警事件列表</h3>
        <el-button type="primary" size="small" @click="showExportDialog">导出数据</el-button>
      </div>
      <el-table :data="tableData" border style="width: 100%" v-loading="tableLoading">
        <el-table-column prop="date" label="发生时间" width="180" sortable />
        <el-table-column prop="name" label="告警名称" width="180" />
        <el-table-column prop="level" label="级别" width="100">
          <template #default="scope">
            <el-tag :type="getLevelTagType(scope.row.level)">
              {{ scope.row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="指标值" />
        <el-table-column prop="status" label="处理状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已解决' ? 'success' : scope.row.status === '处理中' ? 'warning' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="showDetailDialog(scope.row)">详情</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="告警详情" width="50%">
      <div v-if="currentDetail" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="告警ID">{{ currentDetail.id }}</el-descriptions-item>
          <el-descriptions-item label="告警名称">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentDetail.date }}</el-descriptions-item>
          <el-descriptions-item label="告警级别">
            <el-tag :type="getLevelTagType(currentDetail.level)">{{ currentDetail.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="指标值">{{ currentDetail.value }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="currentDetail.status === '已解决' ? 'success' : 'warning'">{{ currentDetail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">{{ currentDetail.description || '暂无详细描述' }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleResolve(currentDetail)" v-if="currentDetail && currentDetail.status !== '已解决'">标记为已解决</el-button>
      </template>
    </el-dialog>

    <!-- 导出弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="导出数据" width="30%">
      <el-form label-width="100px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportFormat">
            <el-radio label="csv">CSV</el-radio>
            <el-radio label="excel">Excel</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="exportDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="full-width"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PieChart from '@/components/PieChart.vue'
import LineChart from '@/components/LineChart.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 系统状态
const systemStatus = ref('normal')

// 表单数据
const formData = ref({
  dateRange: '',
  type: ''
})

const typeOptions = [
  { value: 'network', label: '网络异常' },
  { value: 'server', label: '服务器异常' },
  { value: 'database', label: '数据库异常' },
  { value: 'application', label: '应用异常' }
]

// 统计卡片数据
const stats = ref({
  todayAlerts: 12,
  processing: 5,
  resolved: 32,
  availability: 99.8
})

// 图表数据
const pieChartData = ref({
  labels: ['网络异常', '服务器异常', '数据库异常', '应用异常'],
  datasets: [
    {
      data: [30, 40, 20, 10],
      backgroundColor: [
        '#409EFF',
        '#67C23A',
        '#E6A23C',
        '#F56C6C'
      ],
      borderWidth: 1
    }
  ]
})

const lineChartData = ref({
  labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
  datasets: [
    {
      label: '告警数量',
      data: [65, 59, 80, 81, 56, 55, 40],
      fill: false,
      backgroundColor: '#409EFF',
      borderColor: '#409EFF',
      tension: 0.1
    }
  ]
})


const chartTimeRange = ref('7d')
const trendTimeRange = ref('7d')

// 表格数据
const tableData = ref([
  { id: 'ALERT-2023-001', date: '2023-01-01 08:30:22', name: 'CPU使用率过高', level: '严重', value: '95%', status: '已解决', description: '服务器CPU使用率超过阈值' },
  { id: 'ALERT-2023-002', date: '2023-01-02 14:15:33', name: '内存不足', level: '警告', value: '85%', status: '处理中', description: '应用服务器内存使用率持续偏高' },
  { id: 'ALERT-2023-003', date: '2023-01-03 09:45:12', name: '网络延迟', level: '一般', value: '320ms', status: '未处理', description: '核心交换机到数据库服务器网络延迟增加' },
  { id: 'ALERT-2023-004', date: '2023-01-04 16:20:45', name: '数据库连接数满', level: '严重', value: '100/100', status: '已解决', description: '数据库连接池耗尽' },
  { id: 'ALERT-2023-005', date: '2023-01-05 11:10:30', name: '应用响应超时', level: '警告', value: '5.2s', status: '处理中', description: '关键业务接口响应时间超过阈值' }
])

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(50)
const tableLoading = ref(false)

// 弹窗相关
const detailDialogVisible = ref(false)
const currentDetail = ref(null)
const exportDialogVisible = ref(false)
const exportFormat = ref('csv')
const exportDateRange = ref('')

// 方法
const handleSearch = () => {
  tableLoading.value = true
  // 模拟API请求
  setTimeout(() => {
    // 更新图表数据
    pieChartData.value = {
      labels: ['网络异常', '服务器异常', '数据库异常', '应用异常'],
      datasets: [
        {
          data: [
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100)
          ],
          backgroundColor: [
            '#409EFF',
            '#67C23A',
            '#E6A23C',
            '#F56C6C'
          ],
          borderWidth: 1
        }
      ]
    }
    
    lineChartData.value = {
      labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月'],
      datasets: [
        {
          label: '告警数量',
          data: [
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100),
            Math.floor(Math.random() * 100)
          ],
          fill: false,
          backgroundColor: '#409EFF',
          borderColor: '#409EFF',
          tension: 0.1
        }
      ]
    }
    
    // 更新统计数据
    stats.value = {
      todayAlerts: Math.floor(Math.random() * 20),
      processing: Math.floor(Math.random() * 10),
      resolved: Math.floor(Math.random() * 50),
      availability: (98 + Math.random() * 2).toFixed(1)
    }
    
    tableLoading.value = false
    ElMessage.success('数据查询成功')
  }, 800)
}

const handleReset = () => {
  formData.value = {
    dateRange: '',
    type: ''
  }
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

const getLevelTagType = (level) => {
  switch(level) {
    case '严重': return 'danger'
    case '警告': return 'warning'
    default: return ''
  }
}

const showDetailDialog = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

const handleResolve = (row) => {
  if (row) {
    row.status = '已解决'
    detailDialogVisible.value = false
    ElMessage.success('已标记为已解决')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该告警记录吗?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

const showExportDialog = () => {
  exportDialogVisible.value = true
}

const handleExport = () => {
  exportDialogVisible.value = false
  ElMessage.success(`数据已导出为${exportFormat.value === 'csv' ? 'CSV' : 'Excel'}格式`)
}

onMounted(() => {
  // 初始化数据
  handleSearch()
  
  // 模拟系统状态检查
  setInterval(() => {
    systemStatus.value = Math.random() > 0.1 ? 'normal' : 'error'
  }, 10000)
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>