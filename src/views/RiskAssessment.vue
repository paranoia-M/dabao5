<template>
  <div class="risk-assessment-container">
    <el-row :gutter="20" class="dashboard-header">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #f0f9eb;">
              <span class="icon-font">⚠️</span>
            </div>
            <div class="stat-info">
              <div class="stat-title">高风险数量</div>
              <div class="stat-value">28</div>
              <div class="stat-trend">
                <span class="trend-up">↑ 12%</span> 较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #ecf5ff;">
              <span class="icon-font">🔔</span>
            </div>
            <div class="stat-info">
              <div class="stat-title">待处理预警</div>
              <div class="stat-value">15</div>
              <div class="stat-trend">
                <span class="trend-down">↓ 5%</span> 较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fdf6ec;">
              <span class="icon-font">⏳</span>
            </div>
            <div class="stat-info">
              <div class="stat-title">整改中</div>
              <div class="stat-value">42</div>
              <div class="stat-trend">
                <span class="trend-up">↑ 8%</span> 较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #fef0f0;">
              <span class="icon-font">❌</span>
            </div>
            <div class="stat-info">
              <div class="stat-title">超期未整改</div>
              <div class="stat-value">7</div>
              <div class="stat-trend">
                <span class="trend-up">↑ 3%</span> 较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-charts">
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>风险等级分布</span>
              <el-select v-model="riskTimeRange" size="small" style="width: 120px">
                <el-option label="本月" value="month" />
                <el-option label="本季度" value="quarter" />
                <el-option label="本年" value="year" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="riskLevelChart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>预警趋势分析</span>
              <el-select v-model="warningTimeRange" size="small" style="width: 120px">
                <el-option label="近7天" value="week" />
                <el-option label="近30天" value="month" />
                <el-option label="近90天" value="quarter" />
              </el-select>
            </div>
          </template>
          <div class="chart-container">
            <div ref="warningTrendChart" style="height: 300px"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row class="dashboard-table">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="table-header">
              <span>高风险预警列表</span>
              <div>
                <el-input
                  v-model="searchKeyword"
                  placeholder="请输入关键词"
                  style="width: 200px; margin-right: 10px"
                  clearable
                  size="small"
                />
                <el-button type="primary" size="small" @click="handleSearch">搜索</el-button>
              </div>
            </div>
          </template>
          <el-table :data="filteredRiskList" style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="riskName" label="风险名称" width="180" />
            <el-table-column prop="level" label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="getRiskLevelTagType(row.level)">{{ row.level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="风险位置" width="180" />
            <el-table-column prop="responsible" label="责任人" width="120" />
            <el-table-column prop="discoveryTime" label="发现时间" width="180" />
            <el-table-column prop="deadline" label="整改期限" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="text" size="small" @click="showDetailDialog(row)">详情</el-button>
                <el-button type="text" size="small" @click="showProcessDialog(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="风险详情" width="50%">
      <div v-if="currentRisk" class="risk-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险ID">{{ currentRisk.id }}</el-descriptions-item>
          <el-descriptions-item label="风险名称">{{ currentRisk.riskName }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskLevelTagType(currentRisk.level)">{{ currentRisk.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险位置">{{ currentRisk.location }}</el-descriptions-item>
          <el-descriptions-item label="责任人">{{ currentRisk.responsible }}</el-descriptions-item>
          <el-descriptions-item label="发现时间">{{ currentRisk.discoveryTime }}</el-descriptions-item>
          <el-descriptions-item label="整改期限">{{ currentRisk.deadline }}</el-descriptions-item>
          <el-descriptions-item label="风险描述" :span="2">
            <div class="risk-description">
              该风险点位于{{ currentRisk.location }}，主要问题是{{ currentRisk.riskName }}，目前由{{ currentRisk.responsible }}负责整改，需在{{ currentRisk.deadline }}前完成。
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 处理弹窗 -->
    <el-dialog v-model="processVisible" title="风险处理" width="40%">
      <el-form v-if="currentRisk" :model="processForm" label-width="100px">
        <el-form-item label="处理措施">
          <el-select v-model="processForm.action" placeholder="请选择处理措施">
            <el-option label="立即整改" value="fix"></el-option>
            <el-option label="延期整改" value="delay"></el-option>
            <el-option label="风险降级" value="downgrade"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input v-model="processForm.comment" type="textarea" :rows="3"></el-input>
        </el-form-item>
        <el-form-item label="上传附件">
          <el-upload
            action="#"
            multiple
            :limit="3"
            :on-exceed="handleExceed"
          >
            <el-button type="primary">点击上传</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 统计数据
const riskTimeRange = ref('month');
const warningTimeRange = ref('month');

// 表格数据
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(50);
const loading = ref(false);

// 弹窗相关
const detailVisible = ref(false);
const processVisible = ref(false);
const currentRisk = ref(null);
const processForm = ref({
  action: '',
  comment: '',
});

// 假数据
const riskList = ref([
  {
    id: 'R001',
    riskName: '高空作业防护不足',
    level: '高风险',
    location: 'A区3号楼5层',
    responsible: '张三',
    discoveryTime: '2023-05-15 09:30',
    deadline: '2023-05-30',
  },
  {
    id: 'R002',
    riskName: '电气线路老化',
    level: '中风险',
    location: 'B区配电房',
    responsible: '李四',
    discoveryTime: '2023-05-18 14:20',
    deadline: '2023-06-05',
  },
  {
    id: 'R003',
    riskName: '消防通道堵塞',
    level: '高风险',
    location: 'C区1号楼',
    responsible: '王五',
    discoveryTime: '2023-05-20 10:15',
    deadline: '2023-05-25',
  },
  {
    id: 'R004',
    riskName: '化学品存储不规范',
    level: '高风险',
    location: 'D区仓库',
    responsible: '赵六',
    discoveryTime: '2023-05-22 16:40',
    deadline: '2023-06-10',
  },
  {
    id: 'R005',
    riskName: '机械设备防护缺失',
    level: '中风险',
    location: 'E区车间',
    responsible: '钱七',
    discoveryTime: '2023-05-25 11:05',
    deadline: '2023-06-15',
  },
]);

// 过滤后的数据
const filteredRiskList = computed(() => {
  return riskList.value.filter(
    (item) =>
      item.riskName.includes(searchKeyword.value) ||
      item.location.includes(searchKeyword.value) ||
      item.responsible.includes(searchKeyword.value)
  );
});

// 风险等级标签类型
const getRiskLevelTagType = (level) => {
  switch (level) {
    case '高风险':
      return 'danger';
    case '中风险':
      return 'warning';
    case '低风险':
      return 'success';
    default:
      return '';
  }
};

// 分页相关
const handleSizeChange = (val) => {
  pageSize.value = val;
  fetchRiskData();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchRiskData();
};

// 搜索
const handleSearch = () => {
  loading.value = true;
  fetchRiskData();
};

// 获取风险数据
const fetchRiskData = () => {
  setTimeout(() => {
    loading.value = false;
  }, 500);
};

// 显示详情弹窗
const showDetailDialog = (row) => {
  currentRisk.value = row;
  detailVisible.value = true;
};

// 显示处理弹窗
const showProcessDialog = (row) => {
  currentRisk.value = row;
  processForm.value = {
    action: '',
    comment: '',
  };
  processVisible.value = true;
};

// 提交处理
const submitProcess = () => {
  ElMessage.success('处理措施已提交');
  processVisible.value = false;
};

// 上传文件超出限制
const handleExceed = () => {
  ElMessage.warning('最多上传3个文件');
};

// 图表相关
const riskLevelChart = ref(null);
const warningTrendChart = ref(null);

onMounted(() => {
  initCharts();
});

const initCharts = () => {
  // 风险等级分布图
  const riskLevelInstance = echarts.init(riskLevelChart.value);
  riskLevelInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      data: ['高风险', '中风险', '低风险']
    },
    series: [
      {
        name: '风险等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 28, name: '高风险', itemStyle: { color: '#f56c6c' } },
          { value: 45, name: '中风险', itemStyle: { color: '#e6a23c' } },
          { value: 102, name: '低风险', itemStyle: { color: '#67c23a' } },
        ],
      },
    ],
  });

  // 预警趋势图
  const warningTrendInstance = echarts.init(warningTrendChart.value);
  warningTrendInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['高风险', '中风险', '低风险'],
      bottom: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['5/1', '5/5', '5/10', '5/15', '5/20', '5/25', '5/30'],
    },
    yAxis: {
      type: 'value',
      name: '预警数量'
    },
    series: [
      {
        name: '高风险',
        type: 'line',
        data: [12, 13, 10, 13, 9, 23, 21],
        lineStyle: {
          width: 3,
          color: '#f56c6c'
        },
        symbolSize: 8,
        itemStyle: {
          color: '#f56c6c'
        }
      },
      {
        name: '中风险',
        type: 'line',
        data: [20, 22, 18, 23, 19, 30, 31],
        lineStyle: {
          width: 3,
          color: '#e6a23c'
        },
        symbolSize: 8,
        itemStyle: {
          color: '#e6a23c'
        }
      },
      {
        name: '低风险',
        type: 'line',
        data: [30, 32, 28, 33, 29, 40, 41],
        lineStyle: {
          width: 3,
          color: '#67c23a'
        },
        symbolSize: 8,
        itemStyle: {
          color: '#67c23a'
        }
      },
    ],
  });

  // 响应式调整
  window.addEventListener('resize', () => {
    riskLevelInstance.resize();
    warningTrendInstance.resize();
  });
};
</script>

<style lang="scss" scoped>

@use './RiskAssessment.scss';

</style>