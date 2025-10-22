
<template>
  <div class="security-audit-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2>上网行为管理概览</h2>
        <div class="time-range">
          <el-date-picker
            v-model="timeRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="small"
            @change="handleDateChange"
          />
        </div>
      </div>

      <div class="statistics-grid">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <div class="stat-card danger">
              <div class="stat-value">{{ stats.highRisk }}</div>
              <div class="stat-label">高风险行为</div>
              <div class="stat-icon">⚠️</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <div class="stat-card warning">
              <div class="stat-value">{{ stats.mediumRisk }}</div>
              <div class="stat-label">中风险行为</div>
              <div class="stat-icon">⚠️</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <div class="stat-card primary">
              <div class="stat-value">{{ stats.totalRecords }}</div>
              <div class="stat-label">总审计记录</div>
              <div class="stat-icon">📄</div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6" :lg="6">
            <div class="stat-card success">
              <div class="stat-value">{{ stats.complianceRate }}%</div>
              <div class="stat-label">合规率</div>
              <div class="stat-icon">✅</div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="chart-section">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <div class="chart-card">
              <h3>上网行为类型分布</h3>
              <div class="chart-container">
                <div ref="behaviorChart" style="height: 300px;"></div>
              </div>
            </div>
          </el-col>
          <el-col :xs="24" :sm="24" :md="12" :lg="12">
            <div class="chart-card">
              <h3>风险趋势分析</h3>
              <div class="chart-container">
                <div ref="riskTrendChart" style="height: 300px;"></div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div class="recent-audit">
        <h3>最近审计记录</h3>
        <el-table :data="auditLogs" style="width: 100%" height="300" border>
          <el-table-column prop="time" label="时间" width="180" />
          <el-table-column prop="user" label="用户" width="120" />
          <el-table-column prop="ip" label="IP地址" width="150" />
          <el-table-column prop="behavior" label="行为类型" width="150" />
          <el-table-column prop="url" label="访问URL" />
          <el-table-column prop="riskLevel" label="风险等级" width="120">
            <template #default="{ row }">
              <el-tag :type="getRiskTagType(row.riskLevel)" size="small">
                {{ row.riskLevel }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="showDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :total="totalLogs"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="审计记录详情" width="50%">
      <div class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{ currentDetail.time }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentDetail.user }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentDetail.ip }}</el-descriptions-item>
          <el-descriptions-item label="行为类型">{{ currentDetail.behavior }}</el-descriptions-item>
          <el-descriptions-item label="访问URL">
            <el-link type="primary" :href="currentDetail.url" target="_blank">{{ currentDetail.url }}</el-link>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskTagType(currentDetail.riskLevel)">{{ currentDetail.riskLevel }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细信息">
            <p>检测到{{ currentDetail.behavior }}行为，系统已{{ currentDetail.riskLevel === '高' ? '拦截并' : '' }}记录该操作。</p>
            <p v-if="currentDetail.riskLevel === '高'">建议：对该用户进行安全培训并加强监控。</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleExport">导出报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

const timeRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]);
const currentPage = ref(1);
const pageSize = ref(10);
const totalLogs = ref(100);
const behaviorChart = ref(null);
const riskTrendChart = ref(null);
const detailVisible = ref(false);
const currentDetail = ref({});

const stats = ref({
  highRisk: 1248,
  mediumRisk: 3456,
  totalRecords: 12789,
  complianceRate: 98.7
});

const auditLogs = ref([
  {
    time: '2023-05-15 09:23:45',
    user: '张三',
    ip: '192.168.1.101',
    behavior: '网页访问',
    url: 'https://example.com',
    riskLevel: '低'
  },
  {
    time: '2023-05-15 10:12:33',
    user: '李四',
    ip: '192.168.1.102',
    behavior: '文件下载',
    url: 'https://download.example.com/file.exe',
    riskLevel: '高'
  },
  {
    time: '2023-05-15 11:45:21',
    user: '王五',
    ip: '192.168.1.103',
    behavior: '社交媒体',
    url: 'https://social.example.com',
    riskLevel: '中'
  },
  {
    time: '2023-05-15 13:30:15',
    user: '赵六',
    ip: '192.168.1.104',
    behavior: '邮件发送',
    url: 'mailto:external@example.com',
    riskLevel: '低'
  },
  {
    time: '2023-05-15 14:22:10',
    user: '钱七',
    ip: '192.168.1.105',
    behavior: '网页访问',
    url: 'https://sensitive.example.com',
    riskLevel: '高'
  },
  {
    time: '2023-05-15 15:18:45',
    user: '孙八',
    ip: '192.168.1.106',
    behavior: '云存储',
    url: 'https://cloud.example.com/upload',
    riskLevel: '中'
  },
  {
    time: '2023-05-15 16:05:30',
    user: '周九',
    ip: '192.168.1.107',
    behavior: '即时通讯',
    url: 'https://im.example.com/chat',
    riskLevel: '低'
  },
  {
    time: '2023-05-15 17:42:18',
    user: '吴十',
    ip: '192.168.1.108',
    behavior: '网页访问',
    url: 'https://vpn.example.com',
    riskLevel: '高'
  },
  {
    time: '2023-05-15 18:30:55',
    user: '郑十一',
    ip: '192.168.1.109',
    behavior: '文件上传',
    url: 'https://transfer.example.com/upload',
    riskLevel: '中'
  },
  {
    time: '2023-05-15 19:15:40',
    user: '王十二',
    ip: '192.168.1.110',
    behavior: '网页访问',
    url: 'https://news.example.com',
    riskLevel: '低'
  }
]);

const getRiskTagType = (level) => {
  switch (level) {
    case '高': return 'danger';
    case '中': return 'warning';
    case '低': return 'success';
    default: return 'info';
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchAuditLogs();
};

const handleDateChange = () => {
  fetchStatistics();
  fetchAuditLogs();
};

const showDetail = (row) => {
  currentDetail.value = row;
  detailVisible.value = true;
};

const handleExport = () => {
  ElMessage.success('报告导出成功');
  detailVisible.value = false;
};

const fetchStatistics = () => {
  // 模拟API请求
  stats.value = {
    highRisk: Math.floor(Math.random() * 2000) + 1000,
    mediumRisk: Math.floor(Math.random() * 3000) + 2000,
    totalRecords: Math.floor(Math.random() * 10000) + 10000,
    complianceRate: (Math.random() * 5 + 95).toFixed(1)
  };
};

const fetchAuditLogs = () => {
  // 模拟API请求
  ElMessage.info(`加载第 ${currentPage.value} 页数据`);
};

const initCharts = () => {
  // 初始化行为类型分布图表
  const behaviorChartInstance = echarts.init(behaviorChart.value);
  behaviorChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['网页浏览', '文件下载', '社交媒体', '邮件收发', '即时通讯']
    },
    series: [
      {
        name: '行为类型',
        type: 'pie',
        radius: ['40%', '70%'],
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
          { value: 1048, name: '网页浏览' },
          { value: 735, name: '文件下载' },
          { value: 580, name: '社交媒体' },
          { value: 484, name: '邮件收发' },
          { value: 300, name: '即时通讯' }
        ]
      }
    ]
  });

  // 初始化风险趋势分析图表
  const riskTrendChartInstance = echarts.init(riskTrendChart.value);
  riskTrendChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['高风险', '中风险', '低风险']
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
        name: '高风险',
        type: 'line',
        stack: '总量',
        data: [12, 13, 10, 13, 9, 23, 21],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#F56C6C'
        }
      },
      {
        name: '中风险',
        type: 'line',
        stack: '总量',
        data: [22, 18, 19, 23, 29, 33, 31],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#E6A23C'
        }
      },
      {
        name: '低风险',
        type: 'line',
        stack: '总量',
        data: [150, 132, 101, 134, 90, 230, 210],
        lineStyle: {
          width: 3
        },
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  });

  // 响应式调整图表大小
  window.addEventListener('resize', () => {
    behaviorChartInstance.resize();
    riskTrendChartInstance.resize();
  });
};

onMounted(() => {
  initCharts();
  fetchStatistics();
});
</script>

<style lang="scss" scoped>

@use './SecurityAudit.scss';

</style>
    