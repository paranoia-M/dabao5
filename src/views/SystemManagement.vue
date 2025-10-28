
<template>
  <div class="water-quality-platform">
    <el-main>
      <!-- 数据概览卡片 -->
      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in overviewData" :key="index">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" :style="{ backgroundColor: item.color }">
                  <span class="icon-text">{{ getIconText(item.label) }}</span>
                </div>
                <div class="stat-info">
                  <h3>{{ item.value }}</h3>
                  <p>{{ item.label }}</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 水质监测地图 -->
      <el-card shadow="never" class="map-card">
        <template #header>
          <div class="card-header">
            <span>水质监测点分布</span>
            <el-select v-model="selectedRegion" placeholder="选择区域" size="small" style="width: 120px" @change="handleRegionChange">
              <el-option
                v-for="item in regions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </template>
        <div class="map-container">
          <div class="mock-map">
            <div class="map-point" v-for="(point, index) in filteredPoints" :key="index" 
                 :style="{ left: point.x + '%', top: point.y + '%', backgroundColor: point.color }"
                 @click="showPointDetail(point)">
              <el-tooltip effect="light" :content="point.name + ' - ' + point.status" placement="top">
                <div class="point-inner"></div>
              </el-tooltip>
            </div>
            <div class="map-legend">
              <div class="legend-item" v-for="(item, index) in legendItems" :key="index">
                <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-text">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 水质数据趋势 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>主要指标趋势分析</span>
                <el-date-picker
                  v-model="trendDateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  style="width: 240px"
                  @change="fetchTrendData"
                />
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart-line">
                <div class="chart-line" v-for="(item, index) in trendData" :key="index" 
                     :style="{ height: item.value + '%', backgroundColor: item.color }"></div>
              </div>
              <div class="chart-axis">
                <div class="axis-label" v-for="(label, index) in trendLabels" :key="index">{{ label }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>水质等级分布</span>
                <el-select v-model="selectedParameter" placeholder="选择参数" size="small" style="width: 120px" @change="fetchPieData">
                  <el-option
                    v-for="item in parameters"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="mock-chart-pie">
                <div class="pie-segment" v-for="(item, index) in pieData" :key="index" 
                     :style="{ transform: 'rotate(' + item.rotation + 'deg)', backgroundColor: item.color }"></div>
              </div>
              <div class="pie-legend">
                <div class="legend-item" v-for="(item, index) in pieData" :key="index">
                  <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                  <span class="legend-text">{{ item.label }} ({{ item.value }}%)</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最新监测数据 -->
      <el-card shadow="never" class="table-card">
        <template #header>
          <div class="card-header">
            <span>最新监测数据</span>
            <div>
              <el-input
                v-model="searchQuery"
                placeholder="搜索监测点"
                clearable
                size="small"
                style="width: 200px; margin-right: 10px"
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
              />
              <el-button type="primary" size="small" @click="handleSearch">搜索</el-button>
              <el-button type="success" size="small" @click="showDataAnalysis">数据分析</el-button>
            </div>
          </div>
        </template>
        <el-table :data="paginatedTableData" style="width: 100%" border stripe>
          <el-table-column prop="pointName" label="监测点" width="180" />
          <el-table-column prop="date" label="监测时间" width="180" />
          <el-table-column prop="ph" label="PH值" />
          <el-table-column prop="oxygen" label="溶解氧(mg/L)" />
          <el-table-column prop="cod" label="COD(mg/L)" />
          <el-table-column prop="ammonia" label="氨氮(mg/L)" />
          <el-table-column prop="level" label="水质等级" width="120">
            <template #default="{ row }">
              <el-tag :type="getLevelTagType(row.level)" size="small">{{ row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="showDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredTableData.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </el-main>

    <!-- 监测点详情弹窗 -->
    <el-dialog v-model="pointDetailVisible" :title="currentPoint.name + '监测点详情'" width="50%">
      <div class="point-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="监测点名称">{{ currentPoint.name }}</el-descriptions-item>
          <el-descriptions-item label="水质状态">{{ currentPoint.status }}</el-descriptions-item>
          <el-descriptions-item label="最近监测时间">{{ currentPoint.lastDate }}</el-descriptions-item>
          <el-descriptions-item label="PH值">{{ currentPoint.ph }}</el-descriptions-item>
          <el-descriptions-item label="溶解氧(mg/L)">{{ currentPoint.oxygen }}</el-descriptions-item>
          <el-descriptions-item label="COD(mg/L)">{{ currentPoint.cod }}</el-descriptions-item>
          <el-descriptions-item label="氨氮(mg/L)">{{ currentPoint.ammonia }}</el-descriptions-item>
          <el-descriptions-item label="综合评价">{{ getEvaluation(currentPoint.status) }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-footer">
          <el-button type="primary" @click="pointDetailVisible = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 数据分析弹窗 -->
    <el-dialog v-model="analysisVisible" title="水质数据分析" width="60%">
      <div class="analysis-content">
        <el-tabs v-model="activeAnalysisTab">
          <el-tab-pane label="区域对比" name="region">
            <div class="analysis-chart">
              <div class="mock-analysis-chart"></div>
            </div>
            <div class="analysis-table">
              <el-table :data="analysisData" border style="width: 100%">
                <el-table-column prop="region" label="区域" />
                <el-table-column prop="excellent" label="优(%)" />
                <el-table-column prop="good" label="良(%)" />
                <el-table-column prop="light" label="轻度污染(%)" />
                <el-table-column prop="heavy" label="重度污染(%)" />
              </el-table>
            </div>
          </el-tab-pane>
          <el-tab-pane label="时间趋势" name="trend">
            <div class="analysis-chart">
              <div class="mock-trend-chart"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="analysis-footer">
        <el-button type="primary" @click="analysisVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 数据概览
const overviewData = ref([
  { label: '监测点数量', value: '128', color: '#409EFF' },
  { label: '达标率', value: '92.5%', color: '#67C23A' },
  { label: '本月新增数据', value: '2,456', color: '#E6A23C' },
  { label: '实时监测中', value: '86', color: '#F56C6C' }
]);

const getIconText = (label) => {
  const map = {
    '监测点数量': '点',
    '达标率': '率',
    '本月新增数据': '新',
    '实时监测中': '实'
  };
  return map[label] || '';
};

// 地图相关数据
const selectedRegion = ref('all');
const regions = ref([
  { value: 'all', label: '全部区域' },
  { value: 'north', label: '北部区域' },
  { value: 'south', label: '南部区域' },
  { value: 'east', label: '东部区域' },
  { value: 'west', label: '西部区域' }
]);

const mapPoints = ref([
  { x: 30, y: 40, name: '长江1号', status: '优', color: '#67C23A', ph: 7.2, oxygen: 8.5, cod: 2.1, ammonia: 0.3, lastDate: '2023-06-15 08:00' },
  { x: 45, y: 60, name: '黄河2号', status: '良', color: '#E6A23C', ph: 7.8, oxygen: 7.2, cod: 3.5, ammonia: 0.8, lastDate: '2023-06-15 08:30' },
  { x: 60, y: 30, name: '珠江3号', status: '轻度污染', color: '#F56C6C', ph: 6.9, oxygen: 6.0, cod: 5.2, ammonia: 1.2, lastDate: '2023-06-15 09:00' },
  { x: 25, y: 70, name: '淮河4号', status: '优', color: '#67C23A', ph: 7.5, oxygen: 8.1, cod: 2.3, ammonia: 0.4, lastDate: '2023-06-15 09:30' },
  { x: 70, y: 50, name: '松花江5号', status: '良', color: '#E6A23C', ph: 7.6, oxygen: 7.5, cod: 3.8, ammonia: 0.7, lastDate: '2023-06-15 10:00' },
  { x: 50, y: 20, name: '辽河6号', status: '优', color: '#67C23A', ph: 7.3, oxygen: 8.3, cod: 1.9, ammonia: 0.2, lastDate: '2023-06-15 10:30' },
  { x: 40, y: 80, name: '海河7号', status: '重度污染', color: '#F56C6C', ph: 6.5, oxygen: 4.2, cod: 8.7, ammonia: 2.5, lastDate: '2023-06-15 11:00' }
]);

const legendItems = ref([
  { color: '#67C23A', label: '优' },
  { color: '#E6A23C', label: '良' },
  { color: '#F56C6C', label: '污染' }
]);

const filteredPoints = computed(() => {
  if (selectedRegion.value === 'all') return mapPoints.value;
  return mapPoints.value.filter(point => point.name.includes(getRegionText(selectedRegion.value)));
});

const getRegionText = (region) => {
  const map = {
    'north': '黄河',
    'south': '珠江',
    'east': '长江',
    'west': '辽河'
  };
  return map[region] || '';
};

const handleRegionChange = () => {
  // 模拟区域变化时加载数据
};

// 趋势分析相关数据
const trendDateRange = ref(['2023-06-01', '2023-06-15']);
const selectedParameter = ref('ph');
const parameters = ref([
  { value: 'ph', label: 'PH值' },
  { value: 'oxygen', label: '溶解氧' },
  { value: 'cod', label: 'COD' },
  { value: 'ammonia', label: '氨氮' }
]);

const trendData = ref([
  { value: 80, color: '#409EFF', label: 'PH值' },
  { value: 65, color: '#67C23A', label: '溶解氧' },
  { value: 45, color: '#E6A23C', label: 'COD' },
  { value: 30, color: '#F56C6C', label: '氨氮' }
]);

const trendLabels = ref(['6/1', '6/3', '6/5', '6/7', '6/9', '6/11', '6/13', '6/15']);

const fetchTrendData = () => {
  // 模拟获取趋势数据
};

// 饼图相关数据
const pieData = ref([
  { value: 45, color: '#67C23A', label: '优', rotation: 0 },
  { value: 30, color: '#E6A23C', label: '良', rotation: 162 },
  { value: 15, color: '#F56C6C', label: '轻度污染', rotation: 252 },
  { value: 10, color: '#909399', label: '重度污染', rotation: 306 }
]);

const fetchPieData = () => {
  // 模拟获取饼图数据
};

// 表格相关数据
const tableData = ref([
  { pointName: '长江1号', date: '2023-06-15 08:00', ph: 7.2, oxygen: 8.5, cod: 2.1, ammonia: 0.3, level: '优' },
  { pointName: '黄河2号', date: '2023-06-15 08:30', ph: 7.8, oxygen: 7.2, cod: 3.5, ammonia: 0.8, level: '良' },
  { pointName: '珠江3号', date: '2023-06-15 09:00', ph: 6.9, oxygen: 6.0, cod: 5.2, ammonia: 1.2, level: '轻度污染' },
  { pointName: '淮河4号', date: '2023-06-15 09:30', ph: 7.5, oxygen: 8.1, cod: 2.3, ammonia: 0.4, level: '优' },
  { pointName: '松花江5号', date: '2023-06-15 10:00', ph: 7.6, oxygen: 7.5, cod: 3.8, ammonia: 0.7, level: '良' },
  { pointName: '辽河6号', date: '2023-06-15 10:30', ph: 7.3, oxygen: 8.3, cod: 1.9, ammonia: 0.2, level: '优' },
  { pointName: '海河7号', date: '2023-06-15 11:00', ph: 6.5, oxygen: 4.2, cod: 8.7, ammonia: 2.5, level: '重度污染' },
  { pointName: '长江8号', date: '2023-06-15 11:30', ph: 7.1, oxygen: 8.0, cod: 2.5, ammonia: 0.5, level: '优' },
  { pointName: '黄河9号', date: '2023-06-15 12:00', ph: 7.7, oxygen: 7.0, cod: 4.0, ammonia: 0.9, level: '良' },
  { pointName: '珠江10号', date: '2023-06-15 12:30', ph: 7.0, oxygen: 6.5, cod: 4.8, ammonia: 1.0, level: '轻度污染' }
]);

const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const filteredTableData = computed(() => {
  let filtered = tableData.value;
  if (searchQuery.value) {
    filtered = filtered.filter(item => 
      item.pointName.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  return filtered;
});

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTableData.value.slice(start, end);
});

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchClear = () => {
  currentPage.value = 1;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

const getLevelTagType = (level) => {
  switch (level) {
    case '优': return 'success';
    case '良': return 'warning';
    case '轻度污染': return 'danger';
    case '重度污染': return 'danger';
    default: return 'info';
  }
};

// 弹窗相关
const pointDetailVisible = ref(false);
const currentPoint = ref({});
const showPointDetail = (point) => {
  currentPoint.value = point;
  pointDetailVisible.value = true;
};

const showDetail = (row) => {
  currentPoint.value = {
    name: row.pointName,
    status: row.level,
    lastDate: row.date,
    ph: row.ph,
    oxygen: row.oxygen,
    cod: row.cod,
    ammonia: row.ammonia
  };
  pointDetailVisible.value = true;
};

const getEvaluation = (status) => {
  const map = {
    '优': '水质优良，适合各类用途',
    '良': '水质良好，基本满足使用要求',
    '轻度污染': '水质轻度污染，需注意特定用途',
    '重度污染': '水质严重污染，不适宜直接使用'
  };
  return map[status] || '暂无评价';
};

// 数据分析弹窗
const analysisVisible = ref(false);
const activeAnalysisTab = ref('region');
const analysisData = ref([
  { region: '北部区域', excellent: 45, good: 30, light: 15, heavy: 10 },
  { region: '南部区域', excellent: 35, good: 40, light: 15, heavy: 10 },
  { region: '东部区域', excellent: 55, good: 25, light: 15, heavy: 5 },
  { region: '西部区域', excellent: 40, good: 35, light: 15, heavy: 10 }
]);

const showDataAnalysis = () => {
  analysisVisible.value = true;
};

// 模拟数据加载
onMounted(() => {
  fetchTrendData();
  fetchPieData();
});
</script>

<style lang="scss" scoped>

@use './SystemManagement.scss';

</style>
