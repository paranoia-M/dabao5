
<template>
  <div class="report-container">
    <el-card class="overview-card" shadow="hover">
      <div class="card-header">
        <h2 class="title">上网行为概览</h2>
        <div class="date-picker-wrapper">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
            class="custom-date-picker"
          />
        </div>
      </div>
      
      <div class="chart-container">
        <div class="chart-item">
          <h3 class="chart-title">
            <span class="icon-wrapper">📶</span>
            上网流量趋势
          </h3>
          <div ref="trafficChart" class="chart"></div>
        </div>
        <div class="chart-item">
          <h3 class="chart-title">
            <span class="icon-wrapper">📊</span>
            访问类型分布
          </h3>
          <div ref="typeChart" class="chart"></div>
        </div>
      </div>
    </el-card>

    <el-card class="audit-card" shadow="hover">
      <div class="card-header">
        <h2 class="title">安全审计记录</h2>
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索IP/用户/URL"
            clearable
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
            class="custom-search-input"
          >
            <template #append>
              <el-button @click="handleSearch" class="search-btn">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
      
      <el-table
        :data="filteredAuditData"
        style="width: 100%"
        v-loading="loading"
        :default-sort="{ prop: 'time', order: 'descending' }"
        class="audit-table"
      >
        <el-table-column prop="time" label="时间" sortable width="180" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="url" label="访问URL" />
        <el-table-column prop="action" label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" class="action-tag">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="risk" label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="getRiskType(row.risk)" class="risk-tag">
              {{ row.risk }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="text" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalItems"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
          class="custom-pagination"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="审计记录详情"
      width="50%"
      class="detail-dialog"
    >
      <div class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{ currentDetail.time }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ currentDetail.user }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentDetail.ip }}</el-descriptions-item>
          <el-descriptions-item label="访问URL">
            <a :href="currentDetail.url" target="_blank">{{ currentDetail.url }}</a>
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag :type="getActionType(currentDetail.action)">{{ currentDetail.action }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskType(currentDetail.risk)">{{ currentDetail.risk }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="安全建议" v-if="currentDetail.risk === '高'">
            <el-alert type="error" :closable="false">
              检测到高风险操作，建议立即阻断该IP并通知安全团队
            </el-alert>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleExport" v-if="currentDetail.risk === '高'">
          导出报告
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 假数据生成
const generateTrafficData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      hour: `${i}:00`,
      value: Math.floor(Math.random() * 1000) + 500
    });
  }
  return data;
};

const generateTypeData = () => {
  return [
    { value: 335, name: '社交媒体' },
    { value: 310, name: '视频流媒体' },
    { value: 234, name: '新闻资讯' },
    { value: 135, name: '购物网站' },
    { value: 154, name: '其他' }
  ];
};

const generateAuditData = (count = 100) => {
  const actions = ['访问', '下载', '上传', '删除'];
  const risks = ['低', '中', '高'];
  const users = ['张三', '李四', '王五', '赵六', '钱七'];
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    data.push({
      id: i + 1,
      time: date.toLocaleString(),
      user: users[Math.floor(Math.random() * users.length)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      url: `https://example.com/${Math.random().toString(36).substring(7)}`,
      action: actions[Math.floor(Math.random() * actions.length)],
      risk: risks[Math.floor(Math.random() * risks.length)],
      detail: `这是第${i+1}条审计记录的详细内容，包含了用户${users[Math.floor(Math.random() * users.length)]}的详细操作信息。`
    });
  }
  
  return data;
};

// 响应式数据
const dateRange = ref([new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()]);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const trafficChart = ref(null);
const typeChart = ref(null);
const trafficData = ref(generateTrafficData());
const typeData = ref(generateTypeData());
const auditData = ref(generateAuditData(150));
const detailVisible = ref(false);
const currentDetail = ref({});

// 计算属性
const totalItems = computed(() => auditData.value.length);
const filteredAuditData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  
  let data = auditData.value;
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    data = data.filter(item => 
      item.user.toLowerCase().includes(query) || 
      item.ip.toLowerCase().includes(query) || 
      item.url.toLowerCase().includes(query)
    );
  }
  
  return data.slice(start, end);
});

// 方法
const handleDateChange = () => {
  loading.value = true;
  // 模拟数据加载
  setTimeout(() => {
    trafficData.value = generateTrafficData();
    typeData.value = generateTypeData();
    auditData.value = generateAuditData(150);
    initCharts();
    loading.value = false;
  }, 800);
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchClear = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handlePageChange = (val) => {
  currentPage.value = val;
};

const getActionType = (action) => {
  switch (action) {
    case '访问': return '';
    case '下载': return 'info';
    case '上传': return 'warning';
    case '删除': return 'danger';
    default: return '';
  }
};

const getRiskType = (risk) => {
  switch (risk) {
    case '低': return 'success';
    case '中': return 'warning';
    case '高': return 'danger';
    default: return '';
  }
};

const showDetail = (row) => {
  currentDetail.value = row;
  detailVisible.value = true;
};

const handleExport = () => {
  ElMessage.success('高风险报告已导出');
  detailVisible.value = false;
};

const initCharts = () => {
  // 流量趋势图
  if (trafficChart.value) {
    const trafficInstance = echarts.init(trafficChart.value);
    trafficInstance.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}<br/>流量: {c} MB'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: trafficData.value.map(item => item.hour),
        axisLabel: {
          rotate: 45
        },
        name: '时间'
      },
      yAxis: {
        type: 'value',
        name: '流量(MB)'
      },
      series: [
        {
          name: '流量',
          type: 'bar',
          data: trafficData.value.map(item => item.value),
          itemStyle: {
            color: '#409EFF'
          },
          emphasis: {
            itemStyle: {
              color: '#66b1ff'
            }
          }
        }
      ]
    });
    
    // 访问类型分布图
    const typeInstance = echarts.init(typeChart.value);
    typeInstance.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: typeData.value.map(item => item.name)
      },
      series: [
        {
          name: '访问类型',
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
          data: typeData.value.map(item => ({
            ...item,
            itemStyle: {
              color: getPieColor(item.name)
            }
          }))
        }
      ]
    });
    
    // 响应式调整
    window.addEventListener('resize', () => {
      trafficInstance.resize();
      typeInstance.resize();
    });
  }
};

const getPieColor = (name) => {
  const colors = {
    '社交媒体': '#FF9F43',
    '视频流媒体': '#7367F0',
    '新闻资讯': '#28C76F',
    '购物网站': '#EA5455',
    '其他': '#00CFE8'
  };
  return colors[name] || '#B9C3CD';
};

// 生命周期钩子
onMounted(() => {
  initCharts();
});
</script>

<style lang="scss" scoped>

@use './ReportCenter.scss';

</style>
    