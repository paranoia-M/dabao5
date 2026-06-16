<template>
  <div class="home-container">
    <!-- 统计卡片区域 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :sm="12" :lg="6" class="mb-20">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-primary">
              <svg-icon name="network" />
            </div>
            <div class="stat-info">
              <h3>网络设备</h3>
              <p class="stat-value">{{ networkDevices.total }}</p>
              <p class="stat-desc">在线: {{ networkDevices.online }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6" class="mb-20">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-success">
              <svg-icon name="alert" />
            </div>
            <div class="stat-info">
              <h3>安全告警</h3>
              <p class="stat-value">{{ securityAlerts.total }}</p>
              <p class="stat-desc">今日新增: {{ securityAlerts.today }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6" class="mb-20">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-warning">
              <svg-icon name="traffic" />
            </div>
            <div class="stat-info">
              <h3>网络流量</h3>
              <p class="stat-value">{{ networkTraffic.current }}</p>
              <p class="stat-desc">峰值: {{ networkTraffic.peak }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="12" :lg="6" class="mb-20">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon bg-danger">
              <svg-icon name="vulnerability" />
            </div>
            <div class="stat-info">
              <h3>漏洞数量</h3>
              <p class="stat-value">{{ vulnerabilities.total }}</p>
              <p class="stat-desc">高危: {{ vulnerabilities.critical }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" :lg="16" class="mb-20">
        <el-card class="chart-card" shadow="hover">
          <div class="card-header">
            <h3>网络流量趋势</h3>
            <el-radio-group v-model="trafficRange" size="small" @change="fetchTrafficData">
              <el-radio-button label="day">日</el-radio-button>
              <el-radio-button label="week">周</el-radio-button>
              <el-radio-button label="month">月</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <div ref="trafficChartRef" style="height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="8" class="mb-20">
        <el-card class="chart-card" shadow="hover">
          <div class="card-header">
            <h3>安全告警分布</h3>
          </div>
          <div class="chart-container">
            <div ref="alertChartRef" style="height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 表单和表格区域 -->
    <el-row :gutter="20" class="dashboard-row">
      <el-col :xs="24" class="mb-20">
        <el-card shadow="hover">
          <div class="card-header">
            <h3>最近安全事件</h3>
            <div class="search-form">
              <el-input 
                v-model="eventSearch" 
                placeholder="搜索事件" 
                style="width: 200px" 
                clearable
              >
                <template #suffix>
                  <svg-icon name="search" />
                </template>
              </el-input>
              <el-button type="primary" @click="showAddForm = true">添加事件</el-button>
            </div>
          </div>
          
          <!-- 添加事件表单 -->
          <el-form 
            v-if="showAddForm" 
            :model="newEvent" 
            :rules="eventRules" 
            ref="eventForm" 
            label-width="80px" 
            class="event-form"
          >
            <el-form-item label="事件类型" prop="type">
              <el-select v-model="newEvent.type" placeholder="请选择类型">
                <el-option label="高危" value="高危"></el-option>
                <el-option label="中危" value="中危"></el-option>
                <el-option label="低危" value="低危"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="来源" prop="source">
              <el-input v-model="newEvent.source"></el-input>
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input type="textarea" v-model="newEvent.description"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addEvent">提交</el-button>
              <el-button @click="showAddForm = false">取消</el-button>
            </el-form-item>
          </el-form>
          
          <!-- 事件表格 -->
          <el-table 
            :data="filteredEvents" 
            style="width: 100%" 
            border
            stripe
          >
            <el-table-column prop="time" label="时间" width="180" sortable />
            <el-table-column prop="type" label="类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getEventTagType(row.type)">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="source" label="来源" width="150" />
            <el-table-column prop="description" label="描述" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="text" size="small" @click="showDetail(row)">详情</el-button>
                <el-button type="text" size="small" @click="confirmDelete(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              :current-page="currentPage"
              :page-size="pageSize"
              :total="securityEvents.length"
              layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 事件详情对话框 -->
    <el-dialog title="事件详情" v-model="detailDialogVisible" width="50%">
      <div v-if="currentEvent">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="时间">{{ currentEvent.time }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getEventTagType(currentEvent.type)">{{ currentEvent.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">{{ currentEvent.source }}</el-descriptions-item>
          <el-descriptions-item label="描述">{{ currentEvent.description }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="event-analysis" v-if="currentEvent.analysis">
          <h4>安全分析</h4>
          <p>{{ currentEvent.analysis }}</p>
        </div>
        
        <div class="event-solution" v-if="currentEvent.solution">
          <h4>解决方案</h4>
          <p>{{ currentEvent.solution }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleEventAction(currentEvent)">处理事件</el-button>
      </template>
    </el-dialog>
    
    <!-- 确认删除对话框 -->
    <el-dialog title="确认删除" v-model="deleteDialogVisible" width="30%">
      <span>确定要删除此安全事件记录吗？</span>
      <template #footer>
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="deleteEvent">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { ElMessage } from 'element-plus';

// 统计数据
const networkDevices = ref({ total: 128, online: 124 });
const securityAlerts = ref({ total: 12, today: 3 });
const networkTraffic = ref({ current: '1.2Gbps', peak: '1.8Gbps' });
const vulnerabilities = ref({ total: 24, critical: 8 });
const trafficRange = ref('day');

// 图表实例
const trafficChartRef = ref(null);
const alertChartRef = ref(null);
let trafficChart = null;
let alertChart = null;

// 安全事件数据
const securityEvents = ref([
  { 
    id: 1, 
    time: '2023-05-15 08:23:45', 
    type: '高危', 
    source: '防火墙', 
    description: '检测到SQL注入攻击',
    analysis: '攻击者尝试通过注入恶意SQL代码来获取数据库敏感信息',
    solution: '已自动阻断攻击IP，建议检查应用层防护规则并更新WAF策略'
  },
  { 
    id: 2, 
    time: '2023-05-15 10:12:33', 
    type: '中危', 
    source: 'IDS', 
    description: '端口扫描活动',
    analysis: '检测到来自外部IP的端口扫描行为，可能是攻击者在进行网络探测',
    solution: '已记录攻击IP，建议加强边界防火墙规则并监控该IP活动'
  },
  { 
    id: 3, 
    time: '2023-05-14 15:45:21', 
    type: '低危', 
    source: '服务器', 
    description: '弱密码尝试',
    analysis: '检测到多次使用常见弱密码的登录尝试',
    solution: '已临时锁定账户，建议用户修改为强密码并启用双因素认证'
  },
  { 
    id: 4, 
    time: '2023-05-14 09:30:15', 
    type: '高危', 
    source: 'WAF', 
    description: 'XSS攻击拦截',
    analysis: '攻击者尝试通过跨站脚本攻击获取用户会话信息',
    solution: '已拦截攻击请求，建议检查并更新Web应用输入过滤规则'
  },
  { 
    id: 5, 
    time: '2023-05-13 14:22:10', 
    type: '中危', 
    source: '防火墙', 
    description: '异常流量',
    analysis: '检测到来自单一IP的异常高流量，可能是DDoS攻击的一部分',
    solution: '已启用流量清洗，建议持续监控网络流量模式'
  },
  { 
    id: 6, 
    time: '2023-05-13 11:05:43', 
    type: '低危', 
    source: '终端', 
    description: '未授权访问尝试',
    analysis: '检测到对受限资源的访问尝试，可能是内部员工权限滥用',
    solution: '已记录访问日志，建议审查用户权限分配'
  },
  { 
    id: 7, 
    time: '2023-05-12 16:33:28', 
    type: '高危', 
    source: 'IDS', 
    description: '暴力破解攻击',
    analysis: '检测到针对管理接口的暴力破解尝试，攻击者尝试猜测密码',
    solution: '已锁定攻击IP，建议启用账户锁定机制和登录失败报警'
  },
  { 
    id: 8, 
    time: '2023-05-12 13:20:17', 
    type: '中危', 
    source: '服务器', 
    description: '可疑进程启动',
    analysis: '检测到服务器上启动了未知的可执行文件，可能是恶意软件',
    solution: '已隔离受影响服务器，建议进行全盘扫描并检查系统完整性'
  },
]);

// 表单相关
const showAddForm = ref(false);
const newEvent = ref({
  type: '',
  source: '',
  description: ''
});
const eventForm = ref(null);
const eventRules = {
  type: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  source: [{ required: true, message: '请输入来源', trigger: 'blur' }],
  description: [{ required: true, message: '请输入描述', trigger: 'blur' }]
};

// 搜索和分页
const eventSearch = ref('');
const currentPage = ref(1);
const pageSize = ref(5);

// 对话框
const detailDialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const currentEvent = ref(null);
const deletingEventId = ref(null);

// 计算属性
const filteredEvents = computed(() => {
  const search = eventSearch.value.toLowerCase();
  const filtered = securityEvents.value.filter(event => 
    event.type.toLowerCase().includes(search) || 
    event.source.toLowerCase().includes(search) || 
    event.description.toLowerCase().includes(search)
  );
  
  return filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

// 方法
const getEventTagType = (type) => {
  switch (type) {
    case '高危': return 'danger';
    case '中危': return 'warning';
    case '低危': return 'info';
    default: return '';
  }
};

const handlePageChange = (page) => {
  currentPage.value = page;
};

const addEvent = () => {
  eventForm.value.validate(valid => {
    if (valid) {
      const newId = securityEvents.value.length > 0 
        ? Math.max(...securityEvents.value.map(e => e.id)) + 1 
        : 1;
      
      const now = new Date();
      const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      securityEvents.value.unshift({
        id: newId,
        time: formattedTime,
        type: newEvent.value.type,
        source: newEvent.value.source,
        description: newEvent.value.description,
        analysis: '新添加事件，待安全团队分析',
        solution: '请等待安全团队处理建议'
      });
      
      showAddForm.value = false;
      newEvent.value = { type: '', source: '', description: '' };
      
      // 模拟API调用
      simulateAddEventAPI({
        id: newId,
        ...newEvent.value
      });
      
      ElMessage.success('安全事件添加成功');
    }
  });
};

const showDetail = (event) => {
  currentEvent.value = event;
  detailDialogVisible.value = true;
};

const confirmDelete = (id) => {
  deletingEventId.value = id;
  deleteDialogVisible.value = true;
};

const deleteEvent = () => {
  const index = securityEvents.value.findIndex(e => e.id === deletingEventId.value);
  if (index !== -1) {
    securityEvents.value.splice(index, 1);
    
    // 模拟API调用
    simulateDeleteEventAPI(deletingEventId.value);
    ElMessage.success('安全事件删除成功');
  }
  deleteDialogVisible.value = false;
};

const handleEventAction = (event) => {
  // 模拟处理安全事件
  ElMessage.success(`已处理安全事件: ${event.description}`);
  detailDialogVisible.value = false;
};

const fetchTrafficData = () => {
  // 模拟获取流量数据
  const data = generateTrafficData(trafficRange.value);
  initTrafficChart(data);
};

const initTrafficChart = (data) => {
  nextTick(() => {
    if (!trafficChart && trafficChartRef.value) {
      trafficChart = echarts.init(trafficChartRef.value);
    }
    
    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>流量: {c} Mbps'
      },
      xAxis: {
        type: 'category',
        data: data.labels,
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '流量(Mbps)',
        axisLine: {
          lineStyle: {
            color: '#999'
          }
        },
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        }
      },
      series: [
        {
          name: '入站流量',
          type: 'line',
          smooth: true,
          data: data.inbound,
          lineStyle: {
            width: 3,
            color: '#409EFF'
          },
          itemStyle: {
            color: '#409EFF'
          }
        },
        {
          name: '出站流量',
          type: 'line',
          smooth: true,
          data: data.outbound,
          lineStyle: {
            width: 3,
            color: '#67C23A'
          },
          itemStyle: {
            color: '#67C23A'
          }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
    
    trafficChart.setOption(option);
  });
};

const initAlertChart = () => {
  nextTick(() => {
    if (!alertChart && alertChartRef.value) {
      alertChart = echarts.init(alertChartRef.value);
    }
    
    const option = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        data: ['高危', '中危', '低危', '信息']
      },
      series: [
        {
          name: '告警分布',
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
            { value: 8, name: '高危', itemStyle: { color: '#F56C6C' } },
            { value: 15, name: '中危', itemStyle: { color: '#E6A23C' } },
            { value: 20, name: '低危', itemStyle: { color: '#909399' } },
            { value: 5, name: '信息', itemStyle: { color: '#409EFF' } }
          ]
        }
      ]
    };
    
    alertChart.setOption(option);
  });
};

// 模拟数据生成
const generateTrafficData = (range) => {
  const data = { labels: [], inbound: [], outbound: [] };
  
  if (range === 'day') {
    for (let i = 0; i < 24; i++) {
      data.labels.push(`${i}:00`);
      data.inbound.push(Math.round(Math.random() * 500 + 200));
      data.outbound.push(Math.round(Math.random() * 300 + 100));
    }
  } else if (range === 'week') {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    days.forEach(day => {
      data.labels.push(day);
      data.inbound.push(Math.round(Math.random() * 800 + 300));
      data.outbound.push(Math.round(Math.random() * 500 + 200));
    });
  } else {
    for (let i = 1; i <= 30; i++) {
      data.labels.push(`${i}日`);
      data.inbound.push(Math.round(Math.random() * 1000 + 400));
      data.outbound.push(Math.round(Math.random() * 600 + 300));
    }
  }
  
  return data;
};

// 模拟API调用
const simulateAddEventAPI = (event) => {
  console.log('API调用: 添加安全事件', event);
  // 这里可以添加实际的API调用逻辑
};

const simulateDeleteEventAPI = (id) => {
  console.log('API调用: 删除安全事件', id);
  // 这里可以添加实际的API调用逻辑
};

// 初始化
onMounted(() => {
  fetchTrafficData();
  initAlertChart();
  
  // 模拟获取统计数据
  setTimeout(() => {
    networkDevices.value = { total: 135, online: 130 };
    securityAlerts.value = { total: 15, today: 4 };
    networkTraffic.value = { current: '1.5Gbps', peak: '2.1Gbps' };
    vulnerabilities.value = { total: 28, critical: 10 };
  }, 1000);
});
</script>

<style lang="scss" scoped>
@use './Home.scss';
</style>