
<template>
  <div class="data-fusion-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="24">
        <el-card class="welcome-card" shadow="hover">
          <h1 class="welcome-title">航清水资源保护与智能化系统</h1>
          <p class="welcome-desc">整合多源水质数据，提供智能分析与可视化展示</p>
          <div class="welcome-features">
            <span class="feature-item">多源数据接入</span>
            <span class="feature-item">智能分析预警</span>
            <span class="feature-item">可视化展示</span>
            <span class="feature-item">决策支持</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :xs="24" :sm="12" :md="8" class="mb-20">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-icon data-icon"></span>
            <span>数据总量</span>
          </div>
          <div class="card-content">
            <h3>1,248,756</h3>
            <p>条水质监测数据</p>
            <el-button type="primary" size="small" @click="showDataDetail('data')">详情</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" class="mb-20">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-icon site-icon"></span>
            <span>监测站点</span>
          </div>
          <div class="card-content">
            <h3>328</h3>
            <p>个监测点位</p>
            <el-button type="primary" size="small" @click="showDataDetail('site')">详情</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" class="mb-20">
        <el-card class="data-card" shadow="hover">
          <div class="card-header">
            <span class="card-icon time-icon"></span>
            <span>实时更新</span>
          </div>
          <div class="card-content">
            <h3>15分钟</h3>
            <p>数据更新频率</p>
            <el-button type="primary" size="small" @click="showDataDetail('time')">详情</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="chart-header">
              <span>水质指标趋势分析</span>
              <div class="chart-controls">
                <el-select v-model="selectedIndicator" placeholder="选择指标" style="width: 200px">
                  <el-option
                    v-for="item in indicators"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
                <el-button type="primary" @click="analyzeWaterQuality">分析</el-button>
              </div>
            </div>
          </template>
          <div class="chart-container">
            <div class="fake-chart">
              <p>这里是水质指标趋势分析图表</p>
              <p>当前选择指标: {{ selectedIndicator }}</p>
              <div class="chart-legend">
                <span class="legend-item"><span class="legend-color ph"></span>pH值</span>
                <span class="legend-item"><span class="legend-color do"></span>溶解氧</span>
                <span class="legend-item"><span class="legend-color cod"></span>COD</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="table-header">
              <span>最新水质数据</span>
              <div class="table-controls">
                <el-input
                  v-model="searchQuery"
                  placeholder="搜索监测点"
                  style="width: 200px"
                  clearable
                  @clear="handleSearchClear"
                  @keyup.enter="handleSearch">
                  <template #append>
                    <el-button @click="handleSearch">搜索</el-button>
                  </template>
                </el-input>
                <el-button type="primary" @click="exportWaterData">导出数据</el-button>
              </div>
            </div>
          </template>
          <el-table
            :data="filteredWaterData"
            style="width: 100%"
            border
            stripe
            v-loading="loading">
            <el-table-column
              prop="siteName"
              label="监测点"
              width="180">
            </el-table-column>
            <el-table-column
              prop="ph"
              label="pH值"
              width="120">
            </el-table-column>
            <el-table-column
              prop="do"
              label="溶解氧(mg/L)"
              width="150">
            </el-table-column>
            <el-table-column
              prop="cod"
              label="COD(mg/L)"
              width="150">
            </el-table-column>
            <el-table-column
              prop="nh3n"
              label="氨氮(mg/L)"
              width="150">
            </el-table-column>
            <el-table-column
              prop="time"
              label="监测时间"
              width="180">
            </el-table-column>
            <el-table-column
              label="状态"
              width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column
              label="操作"
              width="120">
              <template #default="{ row }">
                <el-button type="text" @click="showDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            class="mt-20"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="waterData.length">
          </el-pagination>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="detailTitle" width="50%">
      <div class="detail-content">
        <p v-if="detailType === 'data'">平台已接入来自环保部门、水利部门、气象部门等多源水质监测数据，共计1,248,756条记录，覆盖全国主要流域和重点湖泊。</p>
        <p v-if="detailType === 'site'">平台监测网络包含328个监测点位，覆盖长江、黄河、珠江等七大流域，以及重点湖泊水库。</p>
        <p v-if="detailType === 'time'">系统每15分钟自动更新一次实时监测数据，历史数据每日凌晨进行归档处理。</p>
        <div v-if="currentDetail" class="water-detail">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="监测点">{{ currentDetail.siteName }}</el-descriptions-item>
            <el-descriptions-item label="监测时间">{{ currentDetail.time }}</el-descriptions-item>
            <el-descriptions-item label="pH值">{{ currentDetail.ph }}</el-descriptions-item>
            <el-descriptions-item label="溶解氧">{{ currentDetail.do }} mg/L</el-descriptions-item>
            <el-descriptions-item label="COD">{{ currentDetail.cod }} mg/L</el-descriptions-item>
            <el-descriptions-item label="氨氮">{{ currentDetail.nh3n }} mg/L</el-descriptions-item>
            <el-descriptions-item label="水质状态">
              <el-tag :type="getStatusType(currentDetail.status)">{{ currentDetail.status }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 水质指标选择
const selectedIndicator = ref('ph')
const indicators = [
  { value: 'ph', label: 'pH值' },
  { value: 'do', label: '溶解氧' },
  { value: 'cod', label: '化学需氧量' },
  { value: 'nh3n', label: '氨氮' },
  { value: 'tp', label: '总磷' },
  { value: 'tn', label: '总氮' }
]

// 水质数据表格
const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// 详情弹窗
const detailVisible = ref(false)
const detailTitle = ref('')
const detailType = ref('')
const currentDetail = ref(null)

// 模拟水质数据
const waterData = ref([])

const generateMockData = () => {
  const sites = ['长江武汉段', '汉江仙桃段', '东湖风景区', '梁子湖', '洪湖', '丹江口水库', '三峡水库']
  const statuses = ['优良', '轻度污染', '中度污染', '重度污染']
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    siteName: `${sites[i % sites.length]}监测点${Math.floor(i / sites.length) + 1}`,
    ph: (6.5 + Math.random() * 3).toFixed(2),
    do: (5 + Math.random() * 5).toFixed(2),
    cod: (10 + Math.random() * 30).toFixed(2),
    nh3n: (0.1 + Math.random() * 2).toFixed(2),
    time: `2023-06-${String(Math.floor(i / 10) + 1).padStart(2, '0')} 08:00`,
    status: statuses[Math.floor(Math.random() * statuses.length)]
  }))
}

// 计算属性
const filteredWaterData = computed(() => {
  let data = waterData.value
  
  if (searchQuery.value) {
    data = data.filter(item => 
      item.siteName.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return data.slice(start, end)
})

// 方法
const getStatusType = (status) => {
  switch (status) {
    case '优良': return 'success'
    case '轻度污染': return 'warning'
    case '中度污染': return ''
    case '重度污染': return 'danger'
    default: return 'info'
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const showDataDetail = (type) => {
  detailVisible.value = true
  detailType.value = type
  currentDetail.value = null
  
  switch(type) {
    case 'data':
      detailTitle.value = '数据总量详情'
      break
    case 'site':
      detailTitle.value = '监测站点详情'
      break
    case 'time':
      detailTitle.value = '数据更新详情'
      break
  }
}

const showDetail = (row) => {
  detailVisible.value = true
  detailTitle.value = '水质监测详情'
  detailType.value = 'detail'
  currentDetail.value = row
}

const analyzeWaterQuality = () => {
  ElMessage.success(`正在分析${selectedIndicator.value}指标数据...`)
}

const exportWaterData = () => {
  ElMessage.success('导出水质数据成功')
}

// 生命周期
onMounted(() => {
  setTimeout(() => {
    waterData.value = generateMockData()
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './DataFusion.scss';

</style>
