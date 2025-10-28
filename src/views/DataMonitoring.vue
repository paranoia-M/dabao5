
<template>
  <div class="data-monitoring-container">
    <el-card class="header-card">
      <div class="header-content">
        <h1>航清水资源保护与智能化系统</h1>
        <div class="filter-area">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索监测点" 
            class="search-input" 
            clearable
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
          
          <el-select 
            v-model="selectedRegion" 
            placeholder="选择区域" 
            class="region-select"
            clearable
          >
            <el-option 
              v-for="region in regions" 
              :key="region.value" 
              :label="region.label" 
              :value="region.value" 
            />
          </el-select>
          
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="date-picker"
          />
        </div>
      </div>
    </el-card>
    
    <div class="data-content">
      <div class="summary-cards">
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <h3>监测点总数</h3>
            <div class="summary-value">{{ filteredData.length }}</div>
          </div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <h3>优良水质占比</h3>
            <div class="summary-value">{{ calculateGoodQualityPercentage() }}%</div>
          </div>
        </el-card>
        <el-card class="summary-card" shadow="hover">
          <div class="summary-content">
            <h3>异常指标数</h3>
            <div class="summary-value">{{ calculateAbnormalIndicators() }}</div>
          </div>
        </el-card>
      </div>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in paginatedData" :key="item.id">
          <el-card class="data-card" shadow="hover">
            <div class="card-header">
              <h3>{{ item.name }}</h3>
              <el-tag :type="getQualityTagType(item.quality)">{{ item.quality }}</el-tag>
            </div>
            
            <div class="card-content">
              <div class="data-item">
                <span class="label">pH值:</span>
                <span class="value" :class="getValueClass(item.ph, 6, 8.5)">{{ item.ph }}</span>
              </div>
              
              <div class="data-item">
                <span class="label">溶解氧(mg/L):</span>
                <span class="value" :class="getValueClass(item.oxygen, 5, 10)">{{ item.oxygen }}</span>
              </div>
              
              <div class="data-item">
                <span class="label">氨氮(mg/L):</span>
                <span class="value" :class="getValueClass(item.nh3n, 0, 1)">{{ item.nh3n }}</span>
              </div>
              
              <div class="data-item">
                <span class="label">更新时间:</span>
                <span class="value">{{ item.updateTime }}</span>
              </div>
            </div>
            
            <div class="card-footer">
              <el-button type="primary" size="small" @click="showDetail(item)">水质详情</el-button>
              <el-button size="small" @click="showTrend(item)">多源分析</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="filteredData.length"
        layout="prev, pager, next, jumper, total"
        class="pagination"
      />
    </div>
    
    <el-dialog v-model="detailVisible" :title="currentItem?.name + ' - 水质详细数据'" width="60%">
      <div v-if="currentItem" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="监测点编号">{{ currentItem.id }}</el-descriptions-item>
          <el-descriptions-item label="所在区域">{{ currentItem.region }}</el-descriptions-item>
          <el-descriptions-item label="水质类别">{{ currentItem.quality }}</el-descriptions-item>
          <el-descriptions-item label="水温(℃)">{{ currentItem.temperature }}</el-descriptions-item>
          <el-descriptions-item label="浊度(NTU)">{{ currentItem.turbidity }}</el-descriptions-item>
          <el-descriptions-item label="电导率(μS/cm)">{{ currentItem.conductivity }}</el-descriptions-item>
          <el-descriptions-item label="总磷(mg/L)">{{ currentItem.tp }}</el-descriptions-item>
          <el-descriptions-item label="总氮(mg/L)">{{ currentItem.tn }}</el-descriptions-item>
          <el-descriptions-item label="高锰酸盐指数(mg/L)">{{ currentItem.codmn }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ currentItem.updateTime }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="chart-container">
          <h3>多源数据融合分析</h3>
          <div ref="chart" style="height: 300px;"></div>
        </div>
      </div>
    </el-dialog>
    
    <el-dialog v-model="trendVisible" :title="currentItem?.name + ' - 多源趋势分析'" width="70%">
      <div v-if="currentItem" class="trend-content">
        <div ref="trendChart" style="height: 400px;"></div>
        <div class="data-source-info">
          <h4>数据来源融合分析</h4>
          <el-table :data="dataSources" border style="width: 100%">
            <el-table-column prop="source" label="数据来源" width="180" />
            <el-table-column prop="frequency" label="更新频率" />
            <el-table-column prop="reliability" label="可信度" />
            <el-table-column prop="lastUpdate" label="最后更新时间" />
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 模拟数据
const mockData = [
  {
    id: 'WQ001',
    name: '长江南京段',
    region: '南京',
    quality: 'Ⅱ类',
    ph: 7.2,
    oxygen: 8.1,
    nh3n: 0.3,
    temperature: 18.5,
    turbidity: 12.4,
    conductivity: 256,
    tp: 0.05,
    tn: 0.8,
    codmn: 2.1,
    updateTime: '2023-05-15 09:30:22'
  },
  {
    id: 'WQ002',
    name: '太湖西山',
    region: '苏州',
    quality: 'Ⅲ类',
    ph: 7.8,
    oxygen: 6.5,
    nh3n: 0.8,
    temperature: 20.1,
    turbidity: 18.2,
    conductivity: 312,
    tp: 0.12,
    tn: 1.2,
    codmn: 3.5,
    updateTime: '2023-05-15 10:15:45'
  },
  {
    id: 'WQ003',
    name: '秦淮河',
    region: '南京',
    quality: 'Ⅳ类',
    ph: 8.2,
    oxygen: 5.2,
    nh3n: 1.5,
    temperature: 19.8,
    turbidity: 25.6,
    conductivity: 456,
    tp: 0.25,
    tn: 2.1,
    codmn: 5.8,
    updateTime: '2023-05-14 16:20:33'
  },
  {
    id: 'WQ004',
    name: '洪泽湖',
    region: '淮安',
    quality: 'Ⅱ类',
    ph: 7.5,
    oxygen: 7.8,
    nh3n: 0.4,
    temperature: 17.9,
    turbidity: 15.2,
    conductivity: 278,
    tp: 0.08,
    tn: 0.9,
    codmn: 2.8,
    updateTime: '2023-05-15 08:45:12'
  },
  {
    id: 'WQ005',
    name: '阳澄湖',
    region: '苏州',
    quality: 'Ⅲ类',
    ph: 7.9,
    oxygen: 6.2,
    nh3n: 0.9,
    temperature: 20.5,
    turbidity: 20.1,
    conductivity: 342,
    tp: 0.15,
    tn: 1.5,
    codmn: 4.2,
    updateTime: '2023-05-15 11:30:18'
  },
  {
    id: 'WQ006',
    name: '瘦西湖',
    region: '扬州',
    quality: 'Ⅱ类',
    ph: 7.3,
    oxygen: 7.5,
    nh3n: 0.5,
    temperature: 18.2,
    turbidity: 14.8,
    conductivity: 265,
    tp: 0.07,
    tn: 0.85,
    codmn: 2.5,
    updateTime: '2023-05-15 09:15:42'
  }
];

// 数据来源模拟数据
const dataSources = [
  {
    source: '水质自动监测站',
    frequency: '每小时',
    reliability: '高',
    lastUpdate: '2023-05-15 12:00:00'
  },
  {
    source: '卫星遥感数据',
    frequency: '每日',
    reliability: '中',
    lastUpdate: '2023-05-15 08:00:00'
  },
  {
    source: '人工采样检测',
    frequency: '每周',
    reliability: '高',
    lastUpdate: '2023-05-12 14:30:00'
  },
  {
    source: '水文气象站',
    frequency: '实时',
    reliability: '高',
    lastUpdate: '2023-05-15 12:05:00'
  }
];

// 区域选项
const regions = [
  { value: '南京', label: '南京' },
  { value: '苏州', label: '苏州' },
  { value: '淮安', label: '淮安' },
  { value: '扬州', label: '扬州' }
];

// 响应式数据
const searchQuery = ref('');
const selectedRegion = ref('');
const dateRange = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const detailVisible = ref(false);
const trendVisible = ref(false);
const currentItem = ref(null);
const chart = ref(null);
const trendChart = ref(null);

// 计算属性
const filteredData = computed(() => {
  let result = [...mockData];
  
  // 搜索过滤
  if (searchQuery.value) {
    result = result.filter(item => 
      item.name.includes(searchQuery.value) || 
      item.id.includes(searchQuery.value)
    );
  }
  
  // 区域过滤
  if (selectedRegion.value) {
    result = result.filter(item => item.region === selectedRegion.value);
  }
  
  // 日期过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value;
    result = result.filter(item => {
      const itemDate = new Date(item.updateTime.split(' ')[0]);
      return itemDate >= start && itemDate <= end;
    });
  }
  
  return result;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// 方法
const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchClear = () => {
  currentPage.value = 1;
};

const getQualityTagType = (quality) => {
  switch (quality) {
    case 'Ⅰ类': return 'success';
    case 'Ⅱ类': return 'success';
    case 'Ⅲ类': return 'warning';
    case 'Ⅳ类': return 'danger';
    case 'Ⅴ类': return 'danger';
    default: return 'info';
  }
};

const getValueClass = (value, min, max) => {
  if (value < min || value > max) return 'abnormal';
  return 'normal';
};

const calculateGoodQualityPercentage = () => {
  const goodQualityCount = filteredData.value.filter(item => 
    item.quality === 'Ⅰ类' || item.quality === 'Ⅱ类'
  ).length;
  return Math.round((goodQualityCount / filteredData.value.length) * 100) || 0;
};

const calculateAbnormalIndicators = () => {
  let count = 0;
  filteredData.value.forEach(item => {
    if (item.ph < 6 || item.ph > 8.5) count++;
    if (item.oxygen < 5 || item.oxygen > 10) count++;
    if (item.nh3n < 0 || item.nh3n > 1) count++;
  });
  return count;
};

const showDetail = (item) => {
  currentItem.value = item;
  detailVisible.value = true;
  
  nextTick(() => {
    renderChart();
  });
};

const showTrend = (item) => {
  currentItem.value = item;
  trendVisible.value = true;
  
  nextTick(() => {
    renderTrendChart();
  });
};

const renderChart = () => {
  if (!chart.value || !currentItem.value) return;
  
  const myChart = echarts.init(chart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['pH值', '溶解氧', '氨氮']
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
      data: ['1月', '2月', '3月', '4月', '5月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'pH值',
        type: 'line',
        data: [7.1, 7.3, 7.0, 7.2, currentItem.value.ph],
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '溶解氧',
        type: 'line',
        data: [7.5, 7.8, 7.2, 7.6, currentItem.value.oxygen],
        smooth: true,
        lineStyle: {
          color: '#67C23A'
        },
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '氨氮',
        type: 'line',
        data: [0.5, 0.4, 0.6, 0.5, currentItem.value.nh3n],
        smooth: true,
        lineStyle: {
          color: '#E6A23C'
        },
        itemStyle: {
          color: '#E6A23C'
        }
      }
    ]
  };
  
  myChart.setOption(option);
  
  window.addEventListener('resize', function() {
    myChart.resize();
  });
};

const renderTrendChart = () => {
  if (!trendChart.value || !currentItem.value) return;
  
  const myChart = echarts.init(trendChart.value);
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['pH值', '溶解氧', '氨氮', '浊度', '电导率']
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
      data: ['1月', '2月', '3月', '4月', '5月']
    },
    yAxis: [
      {
        type: 'value',
        name: 'pH值',
        position: 'left'
      },
      {
        type: 'value',
        name: '其他指标',
        position: 'right'
      }
    ],
    series: [
      {
        name: 'pH值',
        type: 'line',
        yAxisIndex: 0,
        data: [7.1, 7.3, 7.0, 7.2, currentItem.value.ph],
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '溶解氧',
        type: 'line',
        yAxisIndex: 1,
        data: [7.5, 7.8, 7.2, 7.6, currentItem.value.oxygen],
        smooth: true,
        lineStyle: {
          color: '#67C23A'
        },
        itemStyle: {
          color: '#67C23A'
        }
      },
      {
        name: '氨氮',
        type: 'line',
        yAxisIndex: 1,
        data: [0.5, 0.4, 0.6, 0.5, currentItem.value.nh3n],
        smooth: true,
        lineStyle: {
          color: '#E6A23C'
        },
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '浊度',
        type: 'line',
        yAxisIndex: 1,
        data: [10.2, 12.5, 15.3, 14.8, currentItem.value.turbidity],
        smooth: true,
        lineStyle: {
          color: '#F56C6C'
        },
        itemStyle: {
          color: '#F56C6C'
        }
      },
      {
        name: '电导率',
        type: 'line',
        yAxisIndex: 1,
        data: [240, 260, 280, 270, currentItem.value.conductivity],
        smooth: true,
        lineStyle: {
          color: '#909399'
        },
        itemStyle: {
          color: '#909399'
        }
      }
    ]
  };
  
  myChart.setOption(option);
  
  window.addEventListener('resize', function() {
    myChart.resize();
  });
};

// 生命周期钩子
onMounted(() => {
  // 可以在这里初始化一些数据
});
</script>

<style lang="scss" scoped>

@use './DataMonitoring.scss';

</style>
    