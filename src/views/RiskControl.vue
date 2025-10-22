<template>
  <div class="risk-control-container">
    <!-- 顶部统计卡片 -->
    <div class="stat-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card danger">
            <div class="card-content">
              <div class="card-icon">
                <span class="iconfont icon-warning"></span>
              </div>
              <div class="card-info">
                <div class="card-title">高风险点</div>
                <div class="card-value">{{ statData.highRisk }}</div>
                <div class="card-trend">较上月 <span class="up">↑12%</span></div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card warning">
            <div class="card-content">
              <div class="card-icon">
                <span class="iconfont icon-alert"></span>
              </div>
              <div class="card-info">
                <div class="card-title">中风险点</div>
                <div class="card-value">{{ statData.mediumRisk }}</div>
                <div class="card-trend">较上月 <span class="down">↓5%</span></div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card primary">
            <div class="card-content">
              <div class="card-icon">
                <span class="iconfont icon-info"></span>
              </div>
              <div class="card-info">
                <div class="card-title">低风险点</div>
                <div class="card-value">{{ statData.lowRisk }}</div>
                <div class="card-trend">较上月 <span class="up">↑8%</span></div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card shadow="hover" class="stat-card success">
            <div class="card-content">
              <div class="card-icon">
                <span class="iconfont icon-success"></span>
              </div>
              <div class="card-info">
                <div class="card-title">已整改</div>
                <div class="card-value">{{ statData.resolved }}</div>
                <div class="card-trend">整改率 <span class="up">↑15%</span></div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 风险分布图表 -->
    <div class="chart-section">
      <el-card shadow="hover" class="chart-card">
        <template #header>
          <div class="chart-header">
            <span class="section-title">风险等级分布</span>
            <el-select v-model="chartFilter" size="small" style="width: 120px">
              <el-option label="本月" value="month"></el-option>
              <el-option label="本季度" value="quarter"></el-option>
              <el-option label="本年度" value="year"></el-option>
            </el-select>
          </div>
        </template>
        <div class="chart-container">
          <div ref="riskChart" style="height: 300px"></div>
        </div>
      </el-card>
    </div>

    <!-- 风险点列表 -->
    <div class="risk-list-section">
      <el-card shadow="hover">
        <template #header>
          <div class="list-header">
            <span class="section-title">风险点列表</span>
            <div class="list-actions">
              <el-input
                v-model="searchQuery"
                placeholder="搜索风险点"
                clearable
                style="width: 200px; margin-right: 10px"
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <span class="iconfont icon-search"></span>
                </template>
              </el-input>
              <el-select
                v-model="riskLevelFilter"
                placeholder="风险等级"
                clearable
                style="width: 120px; margin-right: 10px"
              >
                <el-option label="高风险" value="high"></el-option>
                <el-option label="中风险" value="medium"></el-option>
                <el-option label="低风险" value="low"></el-option>
              </el-select>
              <el-button type="primary" @click="handleSearch">
                <span class="iconfont icon-search"></span>
                <span>搜索</span>
              </el-button>
            </div>
          </div>
        </template>
        <el-table :data="filteredRiskList" style="width: 100%" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="name" label="风险点名称" />
          <el-table-column prop="location" label="位置" />
          <el-table-column prop="level" label="风险等级" width="120">
            <template #default="{ row }">
              <el-tag :type="getRiskTagType(row.level)" effect="light">
                {{ row.level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="responsible" label="责任人" width="120" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === '已整改' ? 'success' : 'danger'" effect="light">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="date" label="发现日期" width="120" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="showRiskDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :small="true"
            layout="total, sizes, prev, pager, next"
            :total="totalRisk"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 风险预警 -->
    <div class="alert-section">
      <el-card shadow="hover">
        <template #header>
          <div class="alert-header">
            <span class="section-title">风险预警</span>
            <el-button type="text" @click="refreshAlerts">
              <span class="iconfont icon-refresh"></span>
              <span>刷新</span>
            </el-button>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(alert, index) in alerts"
            :key="index"
            :timestamp="alert.time"
            placement="top"
          >
            <el-card shadow="hover">
              <div class="alert-item">
                <el-tag :type="alert.level === 'high' ? 'danger' : 'warning'" size="small" effect="light">
                  {{ alert.level === 'high' ? '高危' : '中危' }}
                </el-tag>
                <span class="alert-message">{{ alert.message }}</span>
                <el-button size="small" type="text" @click="showAlertDetail(alert)">
                  查看详情
                </el-button>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <!-- 风险详情弹窗 -->
    <el-dialog v-model="riskDetailVisible" :title="currentRisk.name" width="50%">
      <div class="risk-detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险点ID">{{ currentRisk.id }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskTagType(currentRisk.level)">{{ currentRisk.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置">{{ currentRisk.location }}</el-descriptions-item>
          <el-descriptions-item label="责任人">{{ currentRisk.responsible }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentRisk.status === '已整改' ? 'success' : 'danger'">{{ currentRisk.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发现日期">{{ currentRisk.date }}</el-descriptions-item>
          <el-descriptions-item label="风险描述" :span="2">
            <p>该风险点存在{{ currentRisk.level === '高风险' ? '严重' : currentRisk.level === '中风险' ? '中等' : '轻微' }}安全隐患，需要及时处理</p>
          </el-descriptions-item>
          <el-descriptions-item label="整改建议" :span="2">
            <p>{{ getRiskSolution(currentRisk.level) }}</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="riskDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleRiskReport">生成整改报告</el-button>
      </template>
    </el-dialog>

    <!-- 预警详情弹窗 -->
    <el-dialog v-model="alertDetailVisible" :title="'预警详情 - ' + (currentAlert.message || '').substring(0, 20) + (currentAlert.message && currentAlert.message.length > 20 ? '...' : '')" width="50%">
      <div class="alert-detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="预警ID">{{ currentAlert.id }}</el-descriptions-item>
          <el-descriptions-item label="预警级别">
            <el-tag :type="currentAlert.level === 'high' ? 'danger' : 'warning'">
              {{ currentAlert.level === 'high' ? '高危' : '中危' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警时间">{{ currentAlert.time }}</el-descriptions-item>
          <el-descriptions-item label="预警内容">
            <p>{{ currentAlert.message }}</p>
          </el-descriptions-item>
          <el-descriptions-item label="处理建议">
            <p>{{ getAlertSolution(currentAlert.level) }}</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="alertDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleAlertConfirm">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 统计数据
const statData = ref({
  highRisk: 24,
  mediumRisk: 56,
  lowRisk: 132,
  resolved: 89,
});

// 图表筛选
const chartFilter = ref('month');
const riskChart = ref(null);

// 风险点列表
const riskList = ref([
  {
    id: 1,
    name: '配电室电气设备老化',
    location: 'A区配电室',
    level: '高风险',
    responsible: '张三',
    status: '未整改',
    date: '2023-05-15',
  },
  {
    id: 2,
    name: '车间消防通道堵塞',
    location: 'B区车间',
    level: '中风险',
    responsible: '李四',
    status: '整改中',
    date: '2023-06-02',
  },
  {
    id: 3,
    name: '仓库物品堆放不规范',
    location: 'C区仓库',
    level: '低风险',
    responsible: '王五',
    status: '已整改',
    date: '2023-04-28',
  },
  {
    id: 4,
    name: '实验室化学品储存不当',
    location: 'D区实验室',
    level: '高风险',
    responsible: '赵六',
    status: '未整改',
    date: '2023-06-10',
  },
  {
    id: 5,
    name: '生产设备防护罩缺失',
    location: 'E区生产线',
    level: '中风险',
    responsible: '钱七',
    status: '整改中',
    date: '2023-05-22',
  },
]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalRisk = computed(() => riskList.value.length);

// 搜索和筛选
const searchQuery = ref('');
const riskLevelFilter = ref('');
const loading = ref(false);

// 预警信息
const alerts = ref([
  {
    id: 1,
    level: 'high',
    message: 'A区配电室温度异常升高，达到预警阈值',
    time: '2023-06-15 10:23:45',
  },
  {
    id: 2,
    level: 'medium',
    message: 'B区车间烟雾探测器检测到烟雾浓度异常',
    time: '2023-06-15 09:12:30',
  },
  {
    id: 3,
    level: 'high',
    message: 'D区实验室压力容器压力超过安全范围',
    time: '2023-06-14 16:45:22',
  },
]);

// 详情弹窗相关
const riskDetailVisible = ref(false);
const currentRisk = ref({
  id: '',
  name: '',
  location: '',
  level: '',
  responsible: '',
  status: '',
  date: ''
});
const alertDetailVisible = ref(false);
const currentAlert = ref({
  id: '',
  level: '',
  message: '',
  time: ''
});

// 计算属性
const filteredRiskList = computed(() => {
  let result = [...riskList.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.responsible.toLowerCase().includes(query)
    );
  }
  
  if (riskLevelFilter.value) {
    const levelMap = {
      high: '高风险',
      medium: '中风险',
      low: '低风险',
    };
    result = result.filter((item) => item.level === levelMap[riskLevelFilter.value]);
  }
  
  return result;
});

// 方法
const getRiskTagType = (level) => {
  switch (level) {
    case '高风险':
      return 'danger';
    case '中风险':
      return 'warning';
    case '低风险':
      return 'primary';
    default:
      return '';
  }
};

const getRiskSolution = (level) => {
  switch (level) {
    case '高风险':
      return '立即停止相关作业，设置隔离区，由专业技术人员进行检修，24小时内完成整改';
    case '中风险':
      return '3个工作日内完成整改，整改期间加强巡查频次，做好防护措施';
    case '低风险':
      return '7个工作日内完成整改，加强日常检查';
    default:
      return '请根据实际情况制定整改方案';
  }
};

const getAlertSolution = (level) => {
  return level === 'high' 
    ? '立即启动应急预案，疏散相关人员，由专业团队进行紧急处理' 
    : '加强监控，安排专人现场检查，2小时内反馈处理情况';
};

const showRiskDetail = (row) => {
  currentRisk.value = { ...row };
  riskDetailVisible.value = true;
};

const showAlertDetail = (alert) => {
  currentAlert.value = { ...alert };
  alertDetailVisible.value = true;
};

const handleRiskReport = () => {
  ElMessage.success('整改报告生成成功，已发送至责任人邮箱');
  riskDetailVisible.value = false;
};

const handleAlertConfirm = () => {
  ElMessage.success('预警已确认处理，状态已更新');
  alertDetailVisible.value = false;
};

const handleSearch = () => {
  loading.value = true;
  // 模拟搜索延迟
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

const handleSearchClear = () => {
  searchQuery.value = '';
  handleSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

const refreshAlerts = () => {
  // 模拟刷新预警信息
  alerts.value = [...alerts.value, {
    id: alerts.value.length + 1,
    level: Math.random() > 0.5 ? 'high' : 'medium',
    message: `新增预警${alerts.value.length + 1}: 检测到新的安全隐患`,
    time: new Date().toLocaleString(),
  }];
  ElMessage.success('预警信息已刷新');
};

// 初始化图表
const initChart = () => {
  if (!riskChart.value) return;
  
  const chart = echarts.init(riskChart.value);
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      top: '5%',
      left: 'center',
      data: ['高风险', '中风险', '低风险', '已整改']
    },
    series: [
      {
        name: '风险分布',
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
          { value: statData.value.highRisk, name: '高风险', itemStyle: { color: '#f56c6c' } },
          { value: statData.value.mediumRisk, name: '中风险', itemStyle: { color: '#e6a23c' } },
          { value: statData.value.lowRisk, name: '低风险', itemStyle: { color: '#409eff' } },
          { value: statData.value.resolved, name: '已整改', itemStyle: { color: '#67c23a' } }
        ]
      }
    ]
  };
  chart.setOption(option);
  
  // 响应式调整
  window.addEventListener('resize', () => {
    chart.resize();
  });
};

// 生命周期
onMounted(() => {
  initChart();
});
</script>

<style lang="scss" scoped>

@use './RiskControl.scss';

</style>