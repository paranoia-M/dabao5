<template>
  <div class="monitor-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="(stat, index) in statsData" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: stat.color }">
              <span class="stat-symbol">{{ getStatSymbol(stat.title) }}</span>
            </div>
            <div class="stat-info">
              <h3>{{ stat.title }}</h3>
              <p class="value">{{ stat.value }}</p>
              <p class="desc" :class="getTrendClass(stat.desc)">{{ stat.desc }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>系统资源使用率</span>
              <el-select v-model="timeRange" size="small" style="width: 120px" @change="refreshCharts">
                <el-option label="最近1小时" value="1h" />
                <el-option label="最近24小时" value="24h" />
                <el-option label="最近7天" value="7d" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="cpuChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span>内存使用情况</span>
              <el-select v-model="timeRange" size="small" style="width: 120px" @change="refreshCharts">
                <el-option label="最近1小时" value="1h" />
                <el-option label="最近24小时" value="24h" />
                <el-option label="最近7天" value="7d" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="memoryChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row class="alert-row">
      <el-col :span="24">
        <el-card shadow="hover" class="alert-card">
          <template #header>
            <div class="card-header">
              <span>告警信息</span>
              <div>
                <el-input
                  v-model="alertSearch"
                  placeholder="搜索告警"
                  size="small"
                  style="width: 200px; margin-right: 10px"
                  clearable
                />
                <el-select
                  v-model="alertLevel"
                  placeholder="告警级别"
                  size="small"
                  style="width: 120px"
                  clearable
                >
                  <el-option label="严重" value="critical" />
                  <el-option label="警告" value="warning" />
                  <el-option label="一般" value="normal" />
                </el-select>
              </div>
            </div>
          </template>
          <el-table :data="filteredAlerts" style="width: 100%" height="300">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="level" label="级别" width="120">
              <template #default="{ row }">
                <el-tag :type="getAlertTagType(row.level)" size="small">
                  {{ getAlertLevelText(row.level) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="150" />
            <el-table-column prop="message" label="内容" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="text" @click="showAlertDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              :total="alerts.length"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警详情弹窗 -->
    <el-dialog v-model="alertDetailVisible" :title="currentAlert ? currentAlert.source + '告警详情' : ''" width="50%">
      <div v-if="currentAlert" class="alert-detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="告警时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="告警级别">
            <el-tag :type="getAlertTagType(currentAlert.level)" size="small">
              {{ getAlertLevelText(currentAlert.level) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警来源">{{ currentAlert.source }}</el-descriptions-item>
          <el-descriptions-item label="告警内容">{{ currentAlert.message }}</el-descriptions-item>
          <el-descriptions-item label="处理建议">{{ getAlertAdvice(currentAlert.level) }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="alertDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAlertAction">标记为已处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 统计数据
const statsData = ref([
  {
    title: 'CPU使用率',
    value: '32%',
    desc: '较昨日 ↑2%',
    color: '#409EFF',
  },
  {
    title: '内存使用',
    value: '4.2/16GB',
    desc: '较昨日 ↓0.5GB',
    color: '#67C23A',
  },
  {
    title: '在线设备',
    value: '42',
    desc: '较昨日 ↑3',
    color: '#E6A23C',
  },
  {
    title: '告警数量',
    value: '5',
    desc: '较昨日 ↓2',
    color: '#F56C6C',
  },
]);

// 图表相关
const timeRange = ref('1h');
const cpuChart = ref(null);
const memoryChart = ref(null);

// 告警表格相关
const alerts = ref([
  {
    time: '2023-05-15 08:30:22',
    level: 'critical',
    source: '服务器-001',
    message: 'CPU使用率超过90%持续5分钟',
  },
  {
    time: '2023-05-15 08:25:10',
    level: 'warning',
    source: '数据库-002',
    message: '连接数达到上限的85%',
  },
  {
    time: '2023-05-15 08:20:05',
    level: 'normal',
    source: '网络设备-003',
    message: '接口eth0流量异常波动',
  },
  {
    time: '2023-05-15 08:15:33',
    level: 'critical',
    source: '存储设备-004',
    message: '磁盘空间不足，剩余5%',
  },
  {
    time: '2023-05-15 08:10:18',
    level: 'warning',
    source: '应用服务-005',
    message: '响应时间超过阈值',
  },
  {
    time: '2023-05-15 08:05:42',
    level: 'normal',
    source: '服务器-002',
    message: '内存使用率达到75%',
  },
  {
    time: '2023-05-15 08:00:15',
    level: 'normal',
    source: '数据库-001',
    message: '慢查询数量增加',
  },
]);

const alertSearch = ref('');
const alertLevel = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const alertDetailVisible = ref(false);
const currentAlert = ref(null);

// 计算属性
const filteredAlerts = computed(() => {
  let result = alerts.value;
  
  if (alertSearch.value) {
    const search = alertSearch.value.toLowerCase();
    result = result.filter(
      (item) =>
        item.source.toLowerCase().includes(search) ||
        item.message.toLowerCase().includes(search)
    );
  }
  
  if (alertLevel.value) {
    result = result.filter((item) => item.level === alertLevel.value);
  }
  
  return result.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
});

// 方法
const getAlertTagType = (level) => {
  switch (level) {
    case 'critical':
      return 'danger';
    case 'warning':
      return 'warning';
    default:
      return '';
  }
};

const getAlertLevelText = (level) => {
  switch (level) {
    case 'critical':
      return '严重';
    case 'warning':
      return '警告';
    default:
      return '一般';
  }
};

const getAlertAdvice = (level) => {
  switch (level) {
    case 'critical':
      return '请立即处理，系统稳定性受到严重影响';
    case 'warning':
      return '建议尽快处理，避免问题升级';
    default:
      return '可安排时间处理，持续关注';
  }
};

const getStatSymbol = (title) => {
  switch (title) {
    case 'CPU使用率':
      return 'CPU';
    case '内存使用':
      return 'RAM';
    case '在线设备':
      return 'DEV';
    case '告警数量':
      return 'ALM';
    default:
      return '';
  }
};

const getTrendClass = (desc) => {
  return desc.includes('↑') ? 'up-trend' : desc.includes('↓') ? 'down-trend' : '';
};

const showAlertDetail = (alert) => {
  currentAlert.value = alert;
  alertDetailVisible.value = true;
};

const handleAlertAction = () => {
  if (currentAlert.value) {
    alerts.value = alerts.value.filter(alert => alert !== currentAlert.value);
    alertDetailVisible.value = false;
    ElMessage.success('告警已标记为已处理');
  }
};

const refreshCharts = () => {
  initCharts();
};

const initCharts = () => {
  // 生成模拟数据
  const generateData = (baseValue, range, count) => {
    return Array.from({ length: count }, (_, i) => {
      const hour = i * (24 / count);
      const time = `${Math.floor(hour).toString().padStart(2, '0')}:${Math.floor((hour % 1) * 60).toString().padStart(2, '0')}`;
      const value = baseValue + Math.random() * range - range / 2;
      return { time, value: Math.round(value * 10) / 10 };
    });
  };

  // CPU使用率图表
  const cpuData = generateData(35, 20, 12);
  const cpuChartInstance = echarts.init(cpuChart.value);
  cpuChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>使用率: {c}%',
    },
    xAxis: {
      type: 'category',
      data: cpuData.map(item => item.time),
      axisLabel: {
        interval: Math.floor(cpuData.length / 6) - 1,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        data: cpuData.map(item => item.value),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' },
          ]),
        },
        lineStyle: {
          width: 3,
          color: '#409EFF',
        },
        symbol: 'circle',
        symbolSize: 8,
        markLine: {
          silent: true,
          data: [{ yAxis: 80, name: '警告阈值' }],
          lineStyle: { color: '#E6A23C', type: 'dashed' },
          label: { position: 'end', formatter: '警告阈值: 80%' },
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  });

  // 内存使用情况图表
  const memoryData = generateData(25, 15, 12);
  const memoryChartInstance = echarts.init(memoryChart.value);
  memoryChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>使用率: {c}%',
    },
    xAxis: {
      type: 'category',
      data: memoryData.map(item => item.time),
      axisLabel: {
        interval: Math.floor(memoryData.length / 6) - 1,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: {
        formatter: '{value}%',
      },
    },
    series: [
      {
        data: memoryData.map(item => item.value),
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.5)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.1)' },
          ]),
        },
        lineStyle: {
          width: 3,
          color: '#67C23A',
        },
        symbol: 'circle',
        symbolSize: 8,
        markLine: {
          silent: true,
          data: [{ yAxis: 70, name: '警告阈值' }],
          lineStyle: { color: '#E6A23C', type: 'dashed' },
          label: { position: 'end', formatter: '警告阈值: 70%' },
        },
      },
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
  });

  // 响应式调整图表大小
  window.addEventListener('resize', () => {
    cpuChartInstance.resize();
    memoryChartInstance.resize();
  });
};

onMounted(() => {
  initCharts();
});
</script>

<style lang="scss" scoped>

@use './System.scss';

</style>