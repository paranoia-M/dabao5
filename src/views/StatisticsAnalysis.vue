
<template>
  <div class="statistics-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(item, index) in summaryData" :key="index">
        <el-card shadow="hover" class="summary-card">
          <div class="card-content">
            <div class="icon-wrapper" :style="{ backgroundColor: item.color }">
              <span class="icon">{{ item.iconText }}</span>
            </div>
            <div class="text-wrapper">
              <div class="title">{{ item.title }}</div>
              <div class="value">{{ item.value }}</div>
              <div class="trend" :class="item.trend > 0 ? 'up' : 'down'">
                <span>{{ Math.abs(item.trend) }}%</span>
                <span v-if="item.trend > 0" class="trend-icon">↑</span>
                <span v-else class="trend-icon">↓</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :xs="24" :sm="24" :md="16" :lg="16">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3>风险等级分布</h3>
            <el-select v-model="timeRange" placeholder="选择时间范围" size="small" class="time-select" @change="handleTimeRangeChange">
              <el-option label="近7天" value="7" />
              <el-option label="近30天" value="30" />
              <el-option label="近90天" value="90" />
            </el-select>
          </div>
          <div class="chart-wrapper">
            <div ref="riskChart" class="chart" style="height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="8" :lg="8">
        <el-card shadow="hover" class="chart-card">
          <div class="card-header">
            <h3>风险类型占比</h3>
            <el-button size="small" @click="showTypeAnalysis">分析说明</el-button>
          </div>
          <div class="chart-wrapper">
            <div ref="typeChart" class="chart" style="height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" class="table-card">
          <div class="card-header">
            <h3>最新风险预警</h3>
            <div class="header-actions">
              <el-input
                v-model="searchText"
                placeholder="搜索风险名称"
                clearable
                size="small"
                style="width: 200px; margin-right: 10px;"
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
              />
              <el-select
                v-model="riskLevelFilter"
                placeholder="风险等级"
                clearable
                size="small"
                style="width: 120px; margin-right: 10px;"
                @change="handleFilterChange"
              >
                <el-option
                  v-for="item in riskLevelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-button type="primary" size="small" @click="handleSearch">搜索</el-button>
              <el-button size="small" @click="exportRiskData">导出数据</el-button>
            </div>
          </div>
          <el-table
            :data="filteredRiskData"
            style="width: 100%"
            border
            stripe
            v-loading="loading"
          >
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="风险名称" min-width="180" />
            <el-table-column prop="level" label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="getRiskLevelTagType(row.level)" effect="light">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="风险类型" width="150" />
            <el-table-column prop="location" label="风险位置" width="150" />
            <el-table-column prop="discoverTime" label="发现时间" width="180" />
            <el-table-column prop="status" label="处理状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" effect="light">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleDetail(row)">详情查看</el-button>
                <el-button type="warning" size="small" @click="handleProcess(row)">风险处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 风险详情弹窗 -->
    <el-dialog v-model="detailVisible" title="风险详情" width="50%">
      <div class="risk-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险ID">{{ currentRisk.id }}</el-descriptions-item>
          <el-descriptions-item label="风险名称">{{ currentRisk.name }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskLevelTagType(currentRisk.level)">{{ currentRisk.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险类型">{{ currentRisk.type }}</el-descriptions-item>
          <el-descriptions-item label="风险位置">{{ currentRisk.location }}</el-descriptions-item>
          <el-descriptions-item label="发现时间">{{ currentRisk.discoverTime }}</el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="getStatusTagType(currentRisk.status)">{{ currentRisk.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险描述" :span="2">
            <div class="risk-description">
              {{ getRiskDescription(currentRisk) }}
            </div>
          </el-descriptions-item>
        </el-descriptions>
        <div class="risk-images" v-if="currentRisk.images && currentRisk.images.length > 0">
          <h4>风险图片</h4>
          <div class="image-list">
            <div class="image-item" v-for="(img, index) in currentRisk.images" :key="index">
              <el-image :src="img" :preview-src-list="currentRisk.images" fit="cover" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleProcess(currentRisk)">处理风险</el-button>
      </template>
    </el-dialog>

    <!-- 风险处理弹窗 -->
    <el-dialog v-model="processVisible" title="风险处理" width="40%">
      <el-form :model="processForm" label-width="100px">
        <el-form-item label="处理措施" required>
          <el-select v-model="processForm.measure" placeholder="请选择处理措施" style="width: 100%">
            <el-option label="立即整改" value="immediate" />
            <el-option label="限期整改" value="timed" />
            <el-option label="停工整改" value="stop" />
            <el-option label="其他措施" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改期限" v-if="processForm.measure === 'timed'">
          <el-date-picker
            v-model="processForm.deadline"
            type="date"
            placeholder="选择整改期限"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="处理说明" required>
          <el-input
            v-model="processForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入处理说明"
          />
        </el-form-item>
        <el-form-item label="上传附件">
          <el-upload
            action="#"
            multiple
            :limit="3"
            :on-exceed="handleExceed"
            :file-list="processForm.files"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持上传图片、文档等附件，最多3个文件
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processVisible = false">取消</el-button>
        <el-button type="primary" @click="submitProcess">提交处理</el-button>
      </template>
    </el-dialog>

    <!-- 风险类型分析弹窗 -->
    <el-dialog v-model="typeAnalysisVisible" title="风险类型分析说明" width="50%">
      <div class="analysis-content">
        <h4>风险类型分布说明</h4>
        <p>本图表展示了当前系统中各类风险的比例分布情况，帮助您快速识别主要风险来源。</p>
        <el-divider />
        <h4>主要风险类型说明</h4>
        <div class="risk-type-list">
          <div class="risk-type-item" v-for="item in riskTypeAnalysis" :key="item.type">
            <div class="risk-type-header">
              <span class="risk-type-name">{{ item.type }}</span>
              <span class="risk-type-percent">{{ item.percent }}%</span>
            </div>
            <div class="risk-type-desc">{{ item.desc }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="typeAnalysisVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import * as echarts from 'echarts';
import { ElMessage, ElMessageBox } from 'element-plus';

// 汇总数据
const summaryData = ref([
  {
    title: '总风险数',
    value: '1,248',
    trend: 12.5,
    iconText: '总',
    color: '#f56c6c'
  },
  {
    title: '待处理风险',
    value: '86',
    trend: -8.3,
    iconText: '待',
    color: '#e6a23c'
  },
  {
    title: '高风险数',
    value: '42',
    trend: 5.6,
    iconText: '高',
    color: '#f56c6c'
  },
  {
    title: '今日新增',
    value: '18',
    trend: 0,
    iconText: '新',
    color: '#409eff'
  }
]);

// 图表相关
const riskChart = ref(null);
const typeChart = ref(null);
const timeRange = ref('7');

// 表格相关
const searchText = ref('');
const riskLevelFilter = ref('');
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(1248);

// 弹窗相关
const detailVisible = ref(false);
const processVisible = ref(false);
const typeAnalysisVisible = ref(false);
const currentRisk = ref({});
const processForm = ref({
  measure: '',
  deadline: '',
  description: '',
  files: []
});

const riskLevelOptions = [
  { value: '高风险', label: '高风险' },
  { value: '中风险', label: '中风险' },
  { value: '低风险', label: '低风险' }
];

const riskTypeAnalysis = [
  {
    type: '高空作业',
    percent: 35,
    desc: '主要包括脚手架、高空平台、屋顶作业等未设置防护措施或防护不足的风险'
  },
  {
    type: '电气安全',
    percent: 25,
    desc: '包括电气线路老化、违规接线、配电箱隐患等电气相关风险'
  },
  {
    type: '消防安全',
    percent: 15,
    desc: '包括消防通道堵塞、消防设施缺失或失效、易燃物堆积等风险'
  },
  {
    type: '化学品安全',
    percent: 10,
    desc: '包括化学品存储不规范、未设置MSDS、未配备防护用品等风险'
  },
  {
    type: '机械安全',
    percent: 8,
    desc: '包括机械设备防护缺失、违规操作、未定期维护等风险'
  },
  {
    type: '其他',
    percent: 7,
    desc: '包括环境安全、个人防护、标识缺失等其他类型风险'
  }
];

// 模拟风险数据
const riskData = ref([
  {
    id: 'R20230001',
    name: '高空作业防护不足',
    level: '高风险',
    type: '高空作业',
    location: 'A区3号楼',
    discoverTime: '2023-05-15 08:30:22',
    status: '待处理',
    images: [
      'https://fuss10.elemecdn.com/e/5d/4a731a90594a4af544c0c25941171jpeg.jpeg',
      'https://fuss10.elemecdn.com/8/27/f01c15bb73e1ef3793e64e6b7bbccjpeg.jpeg'
    ]
  },
  {
    id: 'R20230002',
    name: '电气线路老化',
    level: '中风险',
    type: '电气安全',
    location: 'B区配电室',
    discoverTime: '2023-05-14 14:15:10',
    status: '处理中',
    images: [
      'https://fuss10.elemecdn.com/1/8e/aeffeb4de74e2fde4bd74fc7b4486jpeg.jpeg'
    ]
  },
  {
    id: 'R20230003',
    name: '消防通道堵塞',
    level: '低风险',
    type: '消防安全',
    location: 'C区走廊',
    discoverTime: '2023-05-14 09:45:33',
    status: '已处理',
    images: []
  },
  {
    id: 'R20230004',
    name: '化学品存储不规范',
    level: '高风险',
    type: '化学品安全',
    location: 'D区仓库',
    discoverTime: '2023-05-13 16:20:18',
    status: '待处理',
    images: [
      'https://fuss10.elemecdn.com/0/6f/e35ff375812e6b0020b6b4e8f9583jpeg.jpeg'
    ]
  },
  {
    id: 'R20230005',
    name: '机械设备防护缺失',
    level: '中风险',
    type: '机械安全',
    location: 'E区车间',
    discoverTime: '2023-05-13 11:10:45',
    status: '处理中',
    images: []
  },
  {
    id: 'R20230006',
    name: '地面湿滑',
    level: '低风险',
    type: '环境安全',
    location: 'F区洗手间',
    discoverTime: '2023-05-12 13:25:30',
    status: '已处理',
    images: []
  },
  {
    id: 'R20230007',
    name: '安全标识缺失',
    level: '低风险',
    type: '标识安全',
    location: 'G区通道',
    discoverTime: '2023-05-12 10:15:22',
    status: '待处理',
    images: []
  },
  {
    id: 'R20230008',
    name: '脚手架松动',
    level: '高风险',
    type: '高空作业',
    location: 'H区外墙',
    discoverTime: '2023-05-11 15:40:18',
    status: '处理中',
    images: []
  },
  {
    id: 'R20230009',
    name: '个人防护用品缺失',
    level: '中风险',
    type: '个人防护',
    location: 'I区车间',
    discoverTime: '2023-05-11 09:30:45',
    status: '待处理',
    images: []
  },
  {
    id: 'R20230010',
    name: '应急照明失效',
    level: '中风险',
    type: '消防安全',
    location: 'J区楼梯间',
    discoverTime: '2023-05-10 17:20:33',
    status: '已处理',
    images: []
  }
]);

// 计算属性
const filteredRiskData = computed(() => {
  let data = [...riskData.value];
  
  if (searchText.value) {
    data = data.filter(item => 
      item.name.includes(searchText.value) || 
      item.id.includes(searchText.value)
    );
  }
  
  if (riskLevelFilter.value) {
    data = data.filter(item => item.level === riskLevelFilter.value);
  }
  
  return data.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

// 方法
const getRiskLevelTagType = (level) => {
  switch (level) {
    case '高风险': return 'danger';
    case '中风险': return 'warning';
    case '低风险': return 'success';
    default: return 'info';
  }
};

const getStatusTagType = (status) => {
  switch (status) {
    case '待处理': return 'danger';
    case '处理中': return 'warning';
    case '已处理': return 'success';
    default: return 'info';
  }
};

const getRiskDescription = (risk) => {
  switch (risk.type) {
    case '高空作业':
      return '该风险点存在高空作业防护措施不足的问题，可能导致人员坠落事故。';
    case '电气安全':
      return '电气线路老化可能导致短路、火灾等电气安全事故。';
    case '消防安全':
      return '消防通道被杂物堵塞，紧急情况下影响人员疏散和消防救援。';
    case '化学品安全':
      return '化学品存储未按照规范分类存放，未设置防泄漏措施。';
    case '机械安全':
      return '机械设备旋转部件防护罩缺失，存在机械伤害风险。';
    default:
      return '该风险点存在安全隐患，需及时处理。';
  }
};

const handleDetail = (row) => {
  currentRisk.value = row;
  detailVisible.value = true;
};

const handleProcess = (row) => {
  currentRisk.value = row;
  processForm.value = {
    measure: '',
    deadline: '',
    description: '',
    files: []
  };
  processVisible.value = true;
};

const submitProcess = () => {
  if (!processForm.value.measure) {
    ElMessage.warning('请选择处理措施');
    return;
  }
  if (!processForm.value.description) {
    ElMessage.warning('请输入处理说明');
    return;
  }
  
  // 模拟处理提交
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    ElMessage.success('风险处理提交成功');
    processVisible.value = false;
    
    // 更新风险状态
    const index = riskData.value.findIndex(item => item.id === currentRisk.value.id);
    if (index !== -1) {
      riskData.value[index].status = '处理中';
    }
  }, 1000);
};

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    total.value = filteredRiskData.value.length;
  }, 500);
};

const handleSearchClear = () => {
  searchText.value = '';
  handleSearch();
};

const handleFilterChange = () => {
  handleSearch();
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  handleSearch();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  handleSearch();
};

const handleExceed = () => {
  ElMessage.warning('最多只能上传3个文件');
};

const exportRiskData = () => {
  ElMessage.success('导出数据功能正在开发中');
};

const showTypeAnalysis = () => {
  typeAnalysisVisible.value = true;
};

const handleTimeRangeChange = () => {
  initCharts();
};

// 初始化图表
const initCharts = () => {
  // 风险等级分布图
  const riskChartInstance = echarts.init(riskChart.value);
  const days = timeRange.value === '7' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] 
               : timeRange.value === '30' ? Array.from({length: 4}, (_, i) => `第${i+1}周`) 
               : Array.from({length: 3}, (_, i) => `第${i+1}月`);
  
  const highRiskData = timeRange.value === '7' ? [12, 15, 8, 10, 14, 7, 9] 
                      : timeRange.value === '30' ? [45, 52, 48, 56] 
                      : [120, 135, 142];
  
  const mediumRiskData = timeRange.value === '7' ? [25, 28, 22, 30, 26, 20, 24] 
                        : timeRange.value === '30' ? [85, 92, 88, 96] 
                        : [245, 255, 262];
  
  const lowRiskData = timeRange.value === '7' ? [40, 38, 45, 42, 36, 48, 44] 
                     : timeRange.value === '30' ? [140, 138, 145, 142] 
                     : [340, 338, 345];
  
  riskChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: params => {
        let result = `${params[0].axisValue}<br>`;
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ${item.value}<br>`;
        });
        return result;
      }
    },
    legend: {
      data: ['高风险', '中风险', '低风险'],
      textStyle: {
        color: '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      },
      axisLabel: {
        color: '#666'
      },
      splitLine: {
        lineStyle: {
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '高风险',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: highRiskData,
        itemStyle: {
          color: '#f56c6c',
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#f56c6c'
        }
      },
      {
        name: '中风险',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: mediumRiskData,
        itemStyle: {
          color: '#e6a23c',
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#e6a23c'
        }
      },
      {
        name: '低风险',
        type: 'bar',
        stack: 'total',
        emphasis: {
          focus: 'series'
        },
        data: lowRiskData,
        itemStyle: {
          color: '#67c23a',
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top',
          color: '#67c23a'
        }
      }
    ]
  });

  // 风险类型占比图
  const typeChartInstance = echarts.init(typeChart.value);
  typeChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#333'
      }
    },
    series: [
      {
        name: '风险类型',
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
          position: 'center',
          formatter: '{b}: {d}%'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold',
            color: '#333'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '高空作业', itemStyle: { color: '#f56c6c' } },
          { value: 25, name: '电气安全', itemStyle: { color: '#e6a23c' } },
          { value: 15, name: '消防安全', itemStyle: { color: '#409eff' } },
          { value: 10, name: '化学品安全', itemStyle: { color: '#909399' } },
          { value: 8, name: '机械安全', itemStyle: { color: '#67c23a' } },
          { value: 7, name: '其他', itemStyle: { color: '#b37feb' } }
        ]
      }
    ]
  });

  // 响应式调整
  window.addEventListener('resize', () => {
    riskChartInstance.resize();
    typeChartInstance.resize();
  });
};

onMounted(() => {
  initCharts();
});
</script>

<style lang="scss" scoped>


@use './StatisticsAnalysis.scss';


</style>
