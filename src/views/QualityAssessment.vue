
<template>
  <div class="quality-assessment-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2>航清水资源保护与智能化系统</h2>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            class="date-picker"
          />
          <el-select 
            v-model="regionFilter" 
            placeholder="选择区域" 
            @change="handleRegionChange"
            class="region-select"
          >
            <el-option
              v-for="item in regions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-button 
            type="primary" 
            @click="showDataFusionDialog"
            class="fusion-btn"
          >
            多源数据融合分析
          </el-button>
        </div>
      </div>

      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in overviewData" :key="index">
            <div class="stat-card" :class="`stat-card-${index + 1}`">
              <div class="stat-content">
                <h3>{{ item.title }}</h3>
                <p class="stat-value">{{ item.value }}</p>
                <p class="stat-desc">{{ item.desc }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :xs="24" :md="12">
            <el-card class="chart-card">
              <div class="chart-title">
                <h3>水质指标趋势分析</h3>
                <el-button 
                  type="text" 
                  @click="showTrendAnalysisDialog"
                  class="detail-btn"
                >
                  详细分析
                </el-button>
              </div>
              <div class="chart-container" ref="trendChart"></div>
            </el-card>
          </el-col>
          <el-col :xs="24" :md="12">
            <el-card class="chart-card">
              <div class="chart-title">
                <h3>水质类别分布</h3>
                <el-button 
                  type="text" 
                  @click="showCategoryAnalysisDialog"
                  class="detail-btn"
                >
                  详细分析
                </el-button>
              </div>
              <div class="chart-container" ref="categoryChart"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <div class="data-table-section">
        <el-card>
          <div class="table-header">
            <h3>监测点详细数据</h3>
            <div class="table-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索监测点"
                clearable
                @clear="handleSearchClear"
                @input="handleSearch"
                class="search-input"
              />
              <el-button 
                type="primary" 
                @click="exportData"
                class="export-btn"
              >
                导出数据
              </el-button>
              <el-button 
                type="success" 
                @click="showDataQualityDialog"
                class="quality-btn"
              >
                数据质量报告
              </el-button>
            </div>
          </div>
          <el-table
            :data="paginatedData"
            border
            style="width: 100%"
            v-loading="tableLoading"
            class="monitor-table"
          >
            <el-table-column prop="pointName" label="监测点" width="180" />
            <el-table-column prop="region" label="区域" width="120" />
            <el-table-column prop="ph" label="PH值" sortable />
            <el-table-column prop="oxygen" label="溶解氧(mg/L)" sortable />
            <el-table-column prop="cod" label="COD(mg/L)" sortable />
            <el-table-column prop="nh3n" label="氨氮(mg/L)" sortable />
            <el-table-column prop="qualityLevel" label="水质类别" />
            <el-table-column prop="updateTime" label="更新时间" width="180" sortable />
          </el-table>
          <el-pagination
            class="pagination"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredTableData.length"
          />
        </el-card>
      </div>
    </el-card>

    <!-- 弹窗组件 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="60%"
      class="analysis-dialog"
    >
      <div v-if="currentDialog === 'fusion'">
        <h4>多源数据融合分析结果</h4>
        <p>基于卫星遥感、地面监测和模型模拟数据的融合分析显示：</p>
        <ul>
          <li>北部流域水质改善明显，氨氮指标下降15%</li>
          <li>南部流域受农业面源污染影响，COD指标上升8%</li>
          <li>东西部流域水质保持稳定，达到Ⅱ类标准</li>
        </ul>
        <div class="fusion-chart" ref="fusionChart"></div>
      </div>
      
      <div v-if="currentDialog === 'trend'">
        <h4>水质指标详细趋势分析</h4>
        <p>近12个月水质指标变化趋势：</p>
        <div class="trend-chart" ref="detailTrendChart"></div>
        <el-table :data="trendAnalysisData" border class="analysis-table">
          <el-table-column prop="month" label="月份" />
          <el-table-column prop="ph" label="PH值" />
          <el-table-column prop="oxygen" label="溶解氧" />
          <el-table-column prop="cod" label="COD" />
          <el-table-column prop="nh3n" label="氨氮" />
        </el-table>
      </div>
      
      <div v-if="currentDialog === 'category'">
        <h4>水质类别详细分布</h4>
        <p>当前区域水质类别构成：</p>
        <div class="category-chart" ref="detailCategoryChart"></div>
        <el-table :data="categoryAnalysisData" border class="analysis-table">
          <el-table-column prop="level" label="水质类别" />
          <el-table-column prop="count" label="监测点数量" />
          <el-table-column prop="percentage" label="占比" />
        </el-table>
      </div>
      
      <div v-if="currentDialog === 'quality'">
        <h4>数据质量评估报告</h4>
        <p>当前数据集质量评估结果：</p>
        <el-progress 
          :percentage="95" 
          :format="formatDataQuality" 
          status="success" 
          class="quality-progress"
        />
        <ul class="quality-list">
          <li>数据完整性：98%</li>
          <li>数据准确性：96%</li>
          <li>数据时效性：93%</li>
          <li>数据一致性：94%</li>
        </ul>
      </div>
      
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleDialogConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 假数据
const dateRange = ref([new Date(2023, 0, 1), new Date(2023, 11, 31)]);
const regionFilter = ref('all');
const regions = ref([
  { value: 'all', label: '全部区域' },
  { value: 'north', label: '北部流域' },
  { value: 'south', label: '南部流域' },
  { value: 'east', label: '东部流域' },
  { value: 'west', label: '西部流域' }
]);

const overviewData = ref([
  {
    title: '监测点数量',
    value: '1,248',
    desc: '较上月 ↑12%',
  },
  {
    title: '优良水质占比',
    value: '78.5%',
    desc: '较上月 ↑3.2%',
  },
  {
    title: '超标指标',
    value: '3',
    desc: '主要超标: 氨氮',
  },
  {
    title: '数据总量',
    value: '2.4TB',
    desc: '每日新增 5.6GB',
  }
]);

const tableData = ref(generateMockTableData());
const filteredTableData = ref([]);
const searchQuery = ref('');
const tableLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);

const trendChart = ref(null);
const categoryChart = ref(null);

// 弹窗相关
const dialogVisible = ref(false);
const dialogTitle = ref('');
const currentDialog = ref('');
const fusionChart = ref(null);
const detailTrendChart = ref(null);
const detailCategoryChart = ref(null);
const trendAnalysisData = ref(generateTrendAnalysisData());
const categoryAnalysisData = ref(generateCategoryAnalysisData());

// 计算属性
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTableData.value.slice(start, end);
});

// 方法
function generateMockTableData() {
  const mockData = [];
  const regions = ['北部流域', '南部流域', '东部流域', '西部流域'];
  const qualityLevels = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类', 'Ⅴ类', '劣Ⅴ类'];
  
  for (let i = 1; i <= 100; i++) {
    mockData.push({
      pointName: `监测点${i}`,
      region: regions[i % 4],
      ph: (6.5 + Math.random() * 2.5).toFixed(1),
      oxygen: (5 + Math.random() * 5).toFixed(1),
      cod: (5 + Math.random() * 15).toFixed(1),
      nh3n: (0.1 + Math.random() * 1.5).toFixed(2),
      qualityLevel: qualityLevels[Math.floor(Math.random() * qualityLevels.length)],
      updateTime: `2023-${(i % 12 + 1).toString().padStart(2, '0')}-${(i % 28 + 1).toString().padStart(2, '0')}`
    });
  }
  return mockData;
}

function generateTrendAnalysisData() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return months.map(month => ({
    month,
    ph: (6.5 + Math.random() * 2.5).toFixed(1),
    oxygen: (5 + Math.random() * 5).toFixed(1),
    cod: (5 + Math.random() * 15).toFixed(1),
    nh3n: (0.1 + Math.random() * 1.5).toFixed(2)
  }));
}

function generateCategoryAnalysisData() {
  const levels = ['Ⅰ类', 'Ⅱ类', 'Ⅲ类', 'Ⅳ类', 'Ⅴ类', '劣Ⅴ类'];
  const total = levels.reduce((sum, _, i) => sum + (35 - i * 5), 0);
  return levels.map((level, i) => ({
    level,
    count: 35 - i * 5,
    percentage: `${((35 - i * 5) / total * 100).toFixed(1)}%`
  }));
}

function handleDateChange() {
  tableLoading.value = true;
  setTimeout(() => {
    tableData.value = generateMockTableData();
    filterTableData();
    tableLoading.value = false;
    updateCharts();
  }, 800);
}

function handleRegionChange() {
  filterTableData();
  updateCharts();
}

function filterTableData() {
  let result = [...tableData.value];
  
  if (regionFilter.value !== 'all') {
    const regionMap = {
      north: '北部流域',
      south: '南部流域',
      east: '东部流域',
      west: '西部流域'
    };
    result = result.filter(item => item.region === regionMap[regionFilter.value]);
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.pointName.toLowerCase().includes(query) || 
      item.region.toLowerCase().includes(query)
    );
  }
  
  filteredTableData.value = result;
  currentPage.value = 1;
}

function handleSearch() {
  filterTableData();
}

function handleSearchClear() {
  searchQuery.value = '';
  filterTableData();
}

function handleSizeChange(val) {
  pageSize.value = val;
}

function handleCurrentChange(val) {
  currentPage.value = val;
}

function exportData() {
  ElMessage.success('数据导出成功！可在下载文件夹查看');
}

function showDataFusionDialog() {
  dialogTitle.value = '多源数据融合分析';
  currentDialog.value = 'fusion';
  dialogVisible.value = true;
  nextTick(() => {
    initFusionChart();
  });
}

function showTrendAnalysisDialog() {
  dialogTitle.value = '水质指标趋势分析';
  currentDialog.value = 'trend';
  dialogVisible.value = true;
  nextTick(() => {
    initDetailTrendChart();
  });
}

function showCategoryAnalysisDialog() {
  dialogTitle.value = '水质类别分布分析';
  currentDialog.value = 'category';
  dialogVisible.value = true;
  nextTick(() => {
    initDetailCategoryChart();
  });
}

function showDataQualityDialog() {
  dialogTitle.value = '数据质量评估报告';
  currentDialog.value = 'quality';
  dialogVisible.value = true;
}

function handleDialogConfirm() {
  dialogVisible.value = false;
  ElMessage.success('分析结果已保存');
}

function formatDataQuality() {
  return '数据质量优秀';
}

function initCharts() {
  updateCharts();
  
  window.addEventListener('resize', () => {
    const trendChartInstance = echarts.getInstanceByDom(trendChart.value);
    const categoryChartInstance = echarts.getInstanceByDom(categoryChart.value);
    if (trendChartInstance) trendChartInstance.resize();
    if (categoryChartInstance) categoryChartInstance.resize();
  });
}

function initFusionChart() {
  const chart = echarts.init(fusionChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['卫星数据', '地面监测', '模型模拟', '融合结果']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['PH值', '溶解氧', 'COD', '氨氮']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '卫星数据',
        type: 'bar',
        data: [6.8, 6.2, 12.5, 0.8]
      },
      {
        name: '地面监测',
        type: 'bar',
        data: [7.2, 7.5, 10.8, 0.6]
      },
      {
        name: '模型模拟',
        type: 'bar',
        data: [7.0, 6.8, 11.2, 0.7]
      },
      {
        name: '融合结果',
        type: 'line',
        data: [7.1, 6.9, 11.3, 0.7],
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        }
      }
    ]
  };
  chart.setOption(option);
}

function initDetailTrendChart() {
  const chart = echarts.init(detailTrendChart.value);
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['PH值', '溶解氧', 'COD', '氨氮']
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
      data: trendAnalysisData.value.map(item => item.month)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'PH值',
        type: 'line',
        smooth: true,
        data: trendAnalysisData.value.map(item => item.ph)
      },
      {
        name: '溶解氧',
        type: 'line',
        smooth: true,
        data: trendAnalysisData.value.map(item => item.oxygen)
      },
      {
        name: 'COD',
        type: 'line',
        smooth: true,
        data: trendAnalysisData.value.map(item => item.cod)
      },
      {
        name: '氨氮',
        type: 'line',
        smooth: true,
        data: trendAnalysisData.value.map(item => item.nh3n)
      }
    ]
  };
  chart.setOption(option);
}

function initDetailCategoryChart() {
  const chart = echarts.init(detailCategoryChart.value);
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '水质类别',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c} ({d}%)'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        data: categoryAnalysisData.value.map(item => ({
          value: item.count,
          name: item.level
        }))
      }
    ]
  };
  chart.setOption(option);
}

function updateCharts() {
  // 趋势图数据
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const trendOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['PH值', '溶解氧', 'COD', '氨氮']
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
      data: months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'PH值',
        type: 'line',
        smooth: true,
        data: months.map(() => 6.5 + Math.random() * 2.5)
      },
      {
        name: '溶解氧',
        type: 'line',
        smooth: true,
        data: months.map(() => 5 + Math.random() * 5)
      },
      {
        name: 'COD',
        type: 'line',
        smooth: true,
        data: months.map(() => 5 + Math.random() * 15)
      },
      {
        name: '氨氮',
        type: 'line',
        smooth: true,
        data: months.map(() => 0.1 + Math.random() * 1.5)
      }
    ]
  };
  
  // 类别分布图数据
  const categoryOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '水质类别',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 35, name: 'Ⅰ类' },
          { value: 30, name: 'Ⅱ类' },
          { value: 25, name: 'Ⅲ类' },
          { value: 15, name: 'Ⅳ类' },
          { value: 10, name: 'Ⅴ类' },
          { value: 5, name: '劣Ⅴ类' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ]
  };
  
  const trendChartInstance = echarts.init(trendChart.value);
  const categoryChartInstance = echarts.init(categoryChart.value);
  
  trendChartInstance.setOption(trendOption);
  categoryChartInstance.setOption(categoryOption);
}

// 生命周期
onMounted(() => {
  filterTableData();
  initCharts();
});
</script>

<style lang="scss" scoped>

@use './QualityAssessment.scss';

</style>