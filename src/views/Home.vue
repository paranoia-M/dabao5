
<template>
  <div class="water-resource-platform">
    <!-- 欢迎卡片 -->
    <el-row :gutter="20" class="dashboard-header">
      <el-col :span="24">
        <el-card shadow="hover" class="welcome-card">
          <div class="welcome-content">
            <h1>航清水资源保护与智能化系统</h1>
            <p class="subtitle">全面监测、智能分析、科学决策</p>
            <div class="water-wave"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据卡片 -->
    <el-row :gutter="20" class="dashboard-content">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(card, index) in cards" :key="index">
        <el-card shadow="hover" class="data-card" @click="handleCardClick(card)">
          <div class="card-content">
            <div class="card-icon" :class="'icon-' + index">
              <component :is="card.icon" size="40" />
            </div>
            <h3>{{ card.title }}</h3>
            <p class="card-value">{{ card.value }}</p>
            <p class="card-desc">{{ card.desc }}</p>
            <div class="card-footer">
              <el-button type="text" @click.stop="showCardDetail(card)">查看详情</el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="dashboard-charts">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <h3>水质指标趋势分析</h3>
            <el-select v-model="trendPeriod" placeholder="选择时间段" size="small" style="width: 120px" @change="updateTrendChart">
              <el-option label="近7天" value="7d" />
              <el-option label="近30天" value="30d" />
              <el-option label="近半年" value="6m" />
            </el-select>
          </div>
          <div ref="trendChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div class="chart-header">
            <h3>区域水质分布</h3>
            <el-select v-model="region" placeholder="选择区域" size="small" style="width: 120px" @change="updateDistributionChart">
              <el-option label="全省" value="all" />
              <el-option label="长江流域" value="yangtze" />
              <el-option label="汉江流域" value="hanjiang" />
            </el-select>
          </div>
          <div ref="distributionChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-row class="dashboard-table">
      <el-col :span="24">
        <el-card shadow="hover">
          <div class="table-header">
            <h3>最新监测数据</h3>
            <div class="table-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索监测点"
                clearable
                style="width: 200px"
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch">
                    <el-icon><Search /></el-icon>
                  </el-button>
                </template>
              </el-input>
              <el-button type="primary" @click="exportData">导出数据</el-button>
            </div>
          </div>
          <el-table :data="filteredTableData" style="width: 100%" border>
            <el-table-column prop="location" label="监测点" width="180" />
            <el-table-column prop="ph" label="PH值" width="120" />
            <el-table-column prop="oxygen" label="溶解氧(mg/L)" width="150" />
            <el-table-column prop="turbidity" label="浊度(NTU)" width="120" />
            <el-table-column prop="temperature" label="温度(℃)" width="120" />
            <el-table-column prop="time" label="监测时间" width="180" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="text" @click="showDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="tableData.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="detailTitle" width="50%">
      <div class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="监测点">{{ currentDetail.location }}</el-descriptions-item>
          <el-descriptions-item label="监测时间">{{ currentDetail.time }}</el-descriptions-item>
          <el-descriptions-item label="PH值">{{ currentDetail.ph }}</el-descriptions-item>
          <el-descriptions-item label="溶解氧">{{ currentDetail.oxygen }} mg/L</el-descriptions-item>
          <el-descriptions-item label="浊度">{{ currentDetail.turbidity }} NTU</el-descriptions-item>
          <el-descriptions-item label="温度">{{ currentDetail.temperature }} ℃</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentDetail.status)">{{ currentDetail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="建议措施">{{ getSuggestion(currentDetail.status) }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-chart" ref="detailChart"></div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="generateReport">生成报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Monitor,
  DataAnalysis,
  Warning,
  Collection,
  TrendCharts,
  MapLocation
} from '@element-plus/icons-vue'

// 数据卡片
const cards = ref([
  {
    title: '监测站点',
    value: '128',
    desc: '覆盖全省主要水域',
    icon: Monitor,
    detail: '已部署128个水质监测站点，覆盖长江、汉江等主要水域，实时监测水质变化。'
  },
  {
    title: '异常指标',
    value: '12',
    desc: '今日新增3个',
    icon: Warning,
    detail: '当前有12个异常指标，其中3个为今日新增，主要分布在府河和洪湖区域。'
  },
  {
    title: '分析报告',
    value: '24',
    desc: '本月生成报告',
    icon: DataAnalysis,
    detail: '本月已生成24份水质分析报告，包含趋势分析、异常预警等内容。'
  },
  {
    title: '数据源',
    value: '5',
    desc: '多源数据融合',
    icon: Collection,
    detail: '整合了5个数据源，包括自动监测站、人工采样、卫星遥感、无人机巡查和公众上报数据。'
  }
])

// 表格数据
const tableData = ref([
  {
    location: '长江武汉段',
    ph: '7.2',
    oxygen: '8.5',
    turbidity: '12',
    temperature: '18.5',
    time: '2023-05-15 08:30',
    status: '正常'
  },
  {
    location: '汉江仙桃段',
    ph: '6.8',
    oxygen: '7.2',
    turbidity: '15',
    temperature: '19.2',
    time: '2023-05-15 09:15',
    status: '正常'
  },
  {
    location: '东湖风景区',
    ph: '7.5',
    oxygen: '6.8',
    turbidity: '8',
    temperature: '20.1',
    time: '2023-05-15 10:00',
    status: '正常'
  },
  {
    location: '洪湖湿地',
    ph: '6.5',
    oxygen: '5.2',
    turbidity: '25',
    temperature: '22.3',
    time: '2023-05-15 11:45',
    status: '警告'
  },
  {
    location: '梁子湖',
    ph: '7.8',
    oxygen: '9.1',
    turbidity: '6',
    temperature: '17.8',
    time: '2023-05-15 13:20',
    status: '正常'
  },
  {
    location: '清江宜昌段',
    ph: '7.0',
    oxygen: '8.2',
    turbidity: '10',
    temperature: '16.5',
    time: '2023-05-15 14:30',
    status: '正常'
  },
  {
    location: '丹江口水库',
    ph: '7.3',
    oxygen: '7.8',
    turbidity: '18',
    temperature: '15.2',
    time: '2023-05-15 15:45',
    status: '正常'
  },
  {
    location: '府河武汉段',
    ph: '6.2',
    oxygen: '4.5',
    turbidity: '30',
    temperature: '21.5',
    time: '2023-05-15 16:30',
    status: '严重'
  }
])

// 分页和搜索
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const trendPeriod = ref('7d')
const region = ref('all')

const filteredTableData = computed(() => {
  let filtered = tableData.value
  if (searchQuery.value) {
    filtered = filtered.filter(item =>
      item.location.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
})

// 图表引用
const trendChart = ref(null)
const distributionChart = ref(null)
const detailChart = ref(null)
let trendChartInstance = null
let distributionChartInstance = null

// 详情弹窗
const detailVisible = ref(false)
const detailTitle = ref('')
const currentDetail = ref({})

// 方法
const handleCardClick = (card) => {
  ElMessage.success(`点击了${card.title}卡片`)
}

const showCardDetail = (card) => {
  ElMessageBox.alert(card.detail, card.title, {
    confirmButtonText: '确定',
    customClass: 'card-detail-dialog'
  })
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const getStatusType = (status) => {
  switch (status) {
    case '正常':
      return 'success'
    case '警告':
      return 'warning'
    case '严重':
      return 'danger'
    default:
      return 'info'
  }
}

const getSuggestion = (status) => {
  switch (status) {
    case '正常':
      return '继续保持监测频率'
    case '警告':
      return '增加监测频率，排查污染源'
    case '严重':
      return '立即启动应急预案，组织专家会诊'
    default:
      return '暂无建议'
  }
}

const showDetail = (row) => {
  currentDetail.value = row
  detailTitle.value = `${row.location}监测详情`
  detailVisible.value = true
  
  nextTick(() => {
    if (detailChart.value) {
      const chartInstance = echarts.init(detailChart.value)
      chartInstance.setOption({
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['PH值', '溶解氧', '浊度', '温度']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'PH值',
            type: 'line',
            data: [7.0, 7.1, 7.2, 7.1, 7.0, 6.9],
            smooth: true
          },
          {
            name: '溶解氧',
            type: 'line',
            data: [8.2, 8.3, 8.1, 8.0, 7.9, 7.8],
            smooth: true
          },
          {
            name: '浊度',
            type: 'line',
            data: [10, 12, 15, 14, 13, 12],
            smooth: true
          },
          {
            name: '温度',
            type: 'line',
            data: [18.0, 19.2, 20.5, 21.0, 20.8, 20.0],
            smooth: true
          }
        ]
      })
    }
  })
}

const exportData = () => {
  ElMessage.success('数据导出成功')
}

const generateReport = () => {
  ElMessage.success('报告生成成功，已保存至报告中心')
}

// 更新趋势图数据
const updateTrendChart = () => {
  if (!trendChartInstance) return
  
  let xData = []
  let seriesData = []
  
  // 根据选择的时间段生成不同的数据
  if (trendPeriod.value === '7d') {
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    seriesData = [
      [7.2, 7.0, 6.8, 7.1, 7.3, 7.5, 7.2],
      [8.5, 8.2, 7.8, 8.1, 8.4, 8.6, 8.3],
      [12, 15, 18, 14, 10, 8, 11],
      [0.5, 0.6, 0.8, 0.7, 0.6, 0.5, 0.4],
      [0.2, 0.3, 0.4, 0.35, 0.3, 0.25, 0.2]
    ]
  } else if (trendPeriod.value === '30d') {
    xData = Array.from({length: 30}, (_, i) => `第${i+1}天`)
    seriesData = [
      Array.from({length: 30}, () => 6.5 + Math.random() * 1.5),
      Array.from({length: 30}, () => 7.5 + Math.random() * 1.5),
      Array.from({length: 30}, () => 5 + Math.random() * 20),
      Array.from({length: 30}, () => 0.2 + Math.random() * 0.8),
      Array.from({length: 30}, () => 0.1 + Math.random() * 0.4)
    ]
  } else {
    xData = ['1月', '2月', '3月', '4月', '5月', '6月']
    seriesData = [
      [7.2, 7.0, 6.8, 7.1, 7.3, 7.5],
      [8.5, 8.2, 7.8, 8.1, 8.4, 8.6],
      [12, 15, 18, 14, 10, 8],
      [0.5, 0.6, 0.8, 0.7, 0.6, 0.5],
      [0.2, 0.3, 0.4, 0.35, 0.3, 0.25]
    ]
  }
  
  trendChartInstance.setOption({
    xAxis: {
      data: xData
    },
    series: [
      { data: seriesData[0] },
      { data: seriesData[1] },
      { data: seriesData[2] },
      { data: seriesData[3] },
      { data: seriesData[4] }
    ]
  })
}

// 更新分布图数据
const updateDistributionChart = () => {
  if (!distributionChartInstance) return
  
  let data = []
  
  if (region.value === 'all') {
    data = [
      { value: 15, name: 'Ⅰ类' },
      { value: 35, name: 'Ⅱ类' },
      { value: 30, name: 'Ⅲ类' },
      { value: 12, name: 'Ⅳ类' },
      { value: 5, name: 'Ⅴ类' },
      { value: 3, name: '劣Ⅴ类' }
    ]
  } else if (region.value === 'yangtze') {
    data = [
      { value: 8, name: 'Ⅰ类' },
      { value: 25, name: 'Ⅱ类' },
      { value: 20, name: 'Ⅲ类' },
      { value: 5, name: 'Ⅳ类' },
      { value: 2, name: 'Ⅴ类' },
      { value: 1, name: '劣Ⅴ类' }
    ]
  } else {
    data = [
      { value: 7, name: 'Ⅰ类' },
      { value: 10, name: 'Ⅱ类' },
      { value: 10, name: 'Ⅲ类' },
      { value: 7, name: 'Ⅳ类' },
      { value: 3, name: 'Ⅴ类' },
      { value: 2, name: '劣Ⅴ类' }
    ]
  }
  
  distributionChartInstance.setOption({
    series: [{
      data: data
    }]
  })
}

// 初始化图表
const initCharts = () => {
  // 趋势图
  trendChartInstance = echarts.init(trendChart.value)
  trendChartInstance.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['PH值', '溶解氧', '浊度', '氨氮', '总磷']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'PH值',
        type: 'line',
        data: [7.2, 7.0, 6.8, 7.1, 7.3, 7.5, 7.2],
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: '溶解氧',
        type: 'line',
        data: [8.5, 8.2, 7.8, 8.1, 8.4, 8.6, 8.3],
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: '浊度',
        type: 'line',
        data: [12, 15, 18, 14, 10, 8, 11],
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: '氨氮',
        type: 'line',
        data: [0.5, 0.6, 0.8, 0.7, 0.6, 0.5, 0.4],
        smooth: true,
        lineStyle: {
          width: 3
        }
      },
      {
        name: '总磷',
        type: 'line',
        data: [0.2, 0.3, 0.4, 0.35, 0.3, 0.25, 0.2],
        smooth: true,
        lineStyle: {
          width: 3
        }
      }
    ]
  })

  // 分布图
  distributionChartInstance = echarts.init(distributionChart.value)
  distributionChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类', 'Ⅴ类', '劣Ⅴ类']
    },
    series: [
      {
        name: '水质类别',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 15, name: 'Ⅰ类' },
          { value: 35, name: 'Ⅱ类' },
          { value: 30, name: 'Ⅲ类' },
          { value: 12, name: 'Ⅳ类' },
          { value: 5, name: 'Ⅴ类' },
          { value: 3, name: '劣Ⅴ类' }
        ]
      }
    ]
  })

  // 响应式调整
  window.addEventListener('resize', () => {
    trendChartInstance && trendChartInstance.resize()
    distributionChartInstance && distributionChartInstance.resize()
  })
}

onMounted(() => {
  initCharts()
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>
