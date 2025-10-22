<template>
  <div class="early-warning-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-title">风险总数</div>
          <div class="stat-value">1,248</div>
          <div class="stat-trend">
            <span class="trend-up">↑ 5.2%</span> 较上月
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-title">高风险</div>
          <div class="stat-value danger">328</div>
          <div class="stat-trend">
            <span class="trend-down">↓ 2.1%</span> 较上月
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-title">中风险</div>
          <div class="stat-value warning">576</div>
          <div class="stat-trend">
            <span class="trend-up">↑ 8.7%</span> 较上月
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-title">低风险</div>
          <div class="stat-value success">344</div>
          <div class="stat-trend">
            <span class="trend-down">↓ 1.3%</span> 较上月
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="16">
        <el-card class="chart-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">风险趋势分析</h3>
            <el-select v-model="timeRange" placeholder="选择时间范围" size="small" style="width: 150px" @change="fetchRiskTrendData">
              <el-option label="近7天" value="7d"></el-option>
              <el-option label="近30天" value="30d"></el-option>
              <el-option label="近90天" value="90d"></el-option>
            </el-select>
          </div>
          <div class="chart-container">
            <div ref="trendChart" style="height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card" shadow="hover">
          <div class="card-header">
            <h3 class="card-title">风险等级分布</h3>
          </div>
          <div class="chart-container">
            <div ref="pieChart" style="height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <div class="card-header">
            <h3 class="card-title">最新预警信息</h3>
            <el-input
              v-model="searchText"
              placeholder="搜索预警信息"
              size="small"
              style="width: 200px"
              clearable
              @clear="handleSearchClear"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
          <el-table :data="filteredWarnings" style="width: 100%" height="350" border>
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="level" label="风险等级" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.level)" effect="light">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="180" align="center" />
            <el-table-column prop="type" label="风险类型" width="150" align="center" />
            <el-table-column prop="description" label="描述" align="center" />
            <el-table-column prop="time" label="时间" width="180" align="center" />
            <el-table-column label="操作" width="120" align="center">
              <template #default="{ row }">
                <el-button type="primary" size="small" plain @click="handleWarning(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 30, 50]"
              :total="warningList.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 处理预警弹窗 -->
    <el-dialog v-model="dialogVisible" title="处理预警信息" width="600px">
      <el-form :model="currentWarning" label-width="100px">
        <el-form-item label="预警ID">
          <el-input v-model="currentWarning.id" disabled />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-tag :type="getLevelTagType(currentWarning.level)" effect="light">
            {{ currentWarning.level }}
          </el-tag>
        </el-form-item>
        <el-form-item label="位置">
          <el-input v-model="currentWarning.location" disabled />
        </el-form-item>
        <el-form-item label="风险类型">
          <el-input v-model="currentWarning.type" disabled />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="currentWarning.description" type="textarea" :rows="3" disabled />
        </el-form-item>
        <el-form-item label="处理措施" required>
          <el-input v-model="currentWarning.action" type="textarea" :rows="3" placeholder="请输入处理措施" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="currentWarning.handler" placeholder="请输入处理人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWarningAction">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 假数据
const warningList = ref([
  { id: 1001, level: '高风险', location: 'A区-生产车间1', type: '电气安全', description: '配电箱线路老化，存在短路风险', time: '2023-05-15 09:23:45' },
  { id: 1002, level: '中风险', location: 'B区-仓库2', type: '消防安全', description: '消防通道被临时货物占用', time: '2023-05-15 10:12:33' },
  { id: 1003, level: '低风险', location: 'C区-办公楼3层', type: '职业健康', description: '办公区域通风不良', time: '2023-05-14 15:45:21' },
  { id: 1004, level: '高风险', location: 'D区-化学品存储区', type: '化学品安全', description: '危险化学品未按规定存放', time: '2023-05-14 14:30:18' },
  { id: 1005, level: '中风险', location: 'A区-生产车间2', type: '机械安全', description: '设备防护罩缺失', time: '2023-05-13 11:22:09' },
  { id: 1006, level: '低风险', location: 'B区-装卸区', type: '作业安全', description: '装卸作业未设置警示标志', time: '2023-05-13 09:45:37' },
  { id: 1007, level: '高风险', location: 'C区-实验室', type: '实验室安全', description: '实验后未及时清理危险废弃物', time: '2023-05-12 16:33:52' },
  { id: 1008, level: '中风险', location: 'D区-锅炉房', type: '特种设备', description: '压力表未按期校验', time: '2023-05-12 13:28:41' },
  { id: 1009, level: '低风险', location: 'A区-办公区走廊', type: '公共安全', description: '应急照明灯故障', time: '2023-05-11 17:15:29' },
  { id: 1010, level: '高风险', location: 'B区-配电室', type: '电气安全', description: '配电室堆放杂物', time: '2023-05-11 10:05:47' },
]);

const timeRange = ref('30d');
const searchText = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const dialogVisible = ref(false);
const currentWarning = ref({
  id: '',
  level: '',
  location: '',
  type: '',
  description: '',
  action: '',
  handler: ''
});
const trendChart = ref(null);
const pieChart = ref(null);

// 计算属性
const filteredWarnings = computed(() => {
  let result = warningList.value;
  
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(item => 
      item.location.toLowerCase().includes(search) || 
      item.type.toLowerCase().includes(search) || 
      item.description.toLowerCase().includes(search)
    );
  }
  
  return result.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
});

// 方法
const getLevelTagType = (level) => {
  switch (level) {
    case '高风险': return 'danger';
    case '中风险': return 'warning';
    case '低风险': return 'success';
    default: return 'info';
  }
};

const handleWarning = (row) => {
  currentWarning.value = {
    id: row.id,
    level: row.level,
    location: row.location,
    type: row.type,
    description: row.description,
    action: '',
    handler: ''
  };
  dialogVisible.value = true;
};

const submitWarningAction = () => {
  // 这里应该是提交处理措施的API调用
  console.log('提交处理措施:', currentWarning.value);
  dialogVisible.value = false;
  ElMessage.success('处理措施提交成功');
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchClear = () => {
  searchText.value = '';
  currentPage.value = 1;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

const fetchRiskTrendData = () => {
  // 模拟API请求获取风险趋势数据
  const data = {
    '7d': {
      dates: ['05-09', '05-10', '05-11', '05-12', '05-13', '05-14', '05-15'],
      high: [12, 15, 18, 20, 16, 14, 10],
      medium: [25, 28, 30, 32, 28, 26, 24],
      low: [18, 20, 22, 24, 20, 18, 16]
    },
    '30d': {
      dates: ['04-16', '04-20', '04-24', '04-28', '05-02', '05-06', '05-10', '05-14'],
      high: [10, 12, 15, 18, 16, 14, 12, 10],
      medium: [20, 22, 25, 28, 26, 24, 22, 20],
      low: [15, 18, 20, 22, 20, 18, 16, 14]
    },
    '90d': {
      dates: ['02-16', '03-02', '03-16', '03-30', '04-13', '04-27', '05-11'],
      high: [8, 10, 12, 14, 12, 10, 8],
      medium: [18, 20, 22, 24, 22, 20, 18],
      low: [12, 14, 16, 18, 16, 14, 12]
    }
  };
  
  const selectedData = data[timeRange.value];
  initTrendChart(selectedData);
};

const initTrendChart = (data) => {
  const chart = echarts.init(trendChart.value);
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['高风险', '中风险', '低风险'],
      right: 10,
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLabel: {
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#666'
      },
      axisLine: {
        lineStyle: {
          color: '#ddd'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f5f5f5'
        }
      }
    },
    series: [
      {
        name: '高风险',
        type: 'line',
        smooth: true,
        data: data.high,
        itemStyle: {
          color: '#f56c6c'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '中风险',
        type: 'line',
        smooth: true,
        data: data.medium,
        itemStyle: {
          color: '#e6a23c'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: '低风险',
        type: 'line',
        smooth: true,
        data: data.low,
        itemStyle: {
          color: '#67c23a'
        },
        lineStyle: {
          width: 3
        }
      }
    ]
  };
  chart.setOption(option);
};

const initPieChart = () => {
  const chart = echarts.init(pieChart.value);
  const option = {
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
          { value: 328, name: '高风险', itemStyle: { color: '#f56c6c' } },
          { value: 576, name: '中风险', itemStyle: { color: '#e6a23c' } },
          { value: 344, name: '低风险', itemStyle: { color: '#67c23a' } }
        ]
      }
    ]
  };
  chart.setOption(option);
};

onMounted(() => {
  nextTick(() => {
    fetchRiskTrendData();
    initPieChart();
  });
});
</script>

<style lang="scss" scoped>

@use './EarlyWarning.scss';

</style>