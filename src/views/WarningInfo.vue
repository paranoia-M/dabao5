
<template>
  <div class="warning-info-container">
    <el-card class="header-card">
      <div class="header-content">
        <h1>智慧交通信息发布管理系统</h1>
        <el-tag type="success" effect="light" class="status-tag">实时监控中</el-tag>
      </div>
    </el-card>

    <div class="dashboard-grid">
      <!-- 交通状态概览 -->
      <el-card class="status-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">交通状态概览</span>
            <el-button type="primary" plain @click="refreshData" class="refresh-btn">刷新数据</el-button>
          </div>
        </template>
        <div class="status-overview">
          <el-row :gutter="20">
            <el-col :span="8" v-for="(item, index) in statusData" :key="index">
              <div class="status-item" :class="'status-' + index">
                <div class="status-value" :style="{ color: item.color }">{{ item.value }}</div>
                <div class="status-label">{{ item.label }}</div>
                <div class="status-trend">
                  <span v-if="index === 0">↑ 2%</span>
                  <span v-else-if="index === 1">↓ 1%</span>
                  <span v-else>→ 0%</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 预警信息列表 -->
      <el-card class="warning-list-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">最新预警信息</span>
            <div class="search-container">
              <el-input
                v-model="searchQuery"
                placeholder="搜索预警信息"
                class="search-input"
                clearable
                @clear="handleSearchClear"
                @keyup.enter="handleSearch"
              >
                <template #append>
                  <el-button @click="handleSearch" class="search-btn">搜索</el-button>
                </template>
              </el-input>
            </div>
          </div>
        </template>
        <el-table :data="filteredWarnings" style="width: 100%" height="400" stripe class="warning-table">
          <el-table-column prop="id" label="ID" width="80" align="center" />
          <el-table-column prop="type" label="类型" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getTagType(row.type)" effect="light">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="location" label="位置" />
          <el-table-column prop="time" label="时间" width="180" align="center" />
          <el-table-column prop="level" label="级别" width="120" align="center">
            <template #default="{ row }">
              <div class="level-container">
                <el-progress
                  :percentage="row.level * 20"
                  :color="getLevelColor(row.level)"
                  :show-text="false"
                  :stroke-width="10"
                />
                <span class="level-text">{{ ['低', '中', '高', '严重', '紧急'][row.level - 1] }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button size="small" @click="handleDetail(row)" class="detail-btn">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="totalWarnings"
            layout="total, sizes, prev, pager, next, jumper"
            :page-sizes="[10, 20, 50, 100]"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>

      <!-- 交通事件统计 -->
      <el-card class="chart-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">交通事件统计</span>
            <el-select v-model="chartType" placeholder="选择图表类型" class="chart-select">
              <el-option label="柱状图" value="bar" />
              <el-option label="折线图" value="line" />
              <el-option label="饼图" value="pie" />
            </el-select>
          </div>
        </template>
        <div class="chart-container">
          <div v-if="chartType === 'pie'" class="pie-chart">
            <div class="chart-legend">
              <div v-for="(item, index) in pieChartData" :key="index" class="legend-item">
                <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-label">{{ item.name }} ({{ item.value }}%)</span>
              </div>
            </div>
            <div class="chart-visual">
              <div class="pie" :style="{ '--percentage': pieChartData[0].value }" data-name="交通事故"></div>
              <div class="pie" :style="{ '--percentage': pieChartData[1].value }" data-name="道路施工"></div>
              <div class="pie" :style="{ '--percentage': pieChartData[2].value }" data-name="恶劣天气"></div>
              <div class="pie" :style="{ '--percentage': pieChartData[3].value }" data-name="其他"></div>
            </div>
          </div>
          <div v-else-if="chartType === 'bar'" class="bar-chart">
            <div class="bar" v-for="(item, index) in barChartData" :key="index">
              <div class="bar-label">{{ item.day }}</div>
              <div class="bar-value" :style="{ height: item.value * 2 + 'px' }">
                <span class="bar-value-text">{{ item.value }}</span>
              </div>
            </div>
          </div>
          <div v-else class="line-chart">
            <div class="line" v-for="(item, index) in lineChartData" :key="index">
              <div class="line-point" :style="{ bottom: item.value * 2 + 'px' }"></div>
              <div class="line-label">{{ item.hour }}:00</div>
            </div>
            <div class="line-connector"></div>
          </div>
        </div>
      </el-card>

      <!-- 快速操作 -->
      <el-card class="quick-actions-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">快速操作</span>
          </div>
        </template>
        <div class="quick-actions">
          <el-button type="primary" @click="handleEmergency" class="action-btn emergency-btn">紧急发布</el-button>
          <el-button type="success" @click="handleExport" class="action-btn export-btn">导出数据</el-button>
          <el-button type="info" @click="handleSettings" class="action-btn settings-btn">系统设置</el-button>
        </div>
        <div class="system-status">
          <div class="status-item">
            <span class="status-label">系统版本:</span>
            <span class="status-value">v2.3.5</span>
          </div>
          <div class="status-item">
            <span class="status-label">最后更新:</span>
            <span class="status-value">{{ lastUpdateTime }}</span>
          </div>
          <div class="status-item">
            <span class="status-label">数据状态:</span>
            <span class="status-value">正常</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="预警详情" width="50%" class="warning-detail-dialog">
      <div v-if="currentWarning" class="warning-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="预警ID">{{ currentWarning.id }}</el-descriptions-item>
          <el-descriptions-item label="预警类型">
            <el-tag :type="getTagType(currentWarning.type)" effect="light">{{ currentWarning.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="发生位置">{{ currentWarning.location }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentWarning.time }}</el-descriptions-item>
          <el-descriptions-item label="预警级别">
            <div class="level-container">
              <el-progress
                :percentage="currentWarning.level * 20"
                :color="getLevelColor(currentWarning.level)"
                :show-text="false"
                :stroke-width="10"
              />
              <span class="level-text">{{ ['低', '中', '高', '严重', '紧急'][currentWarning.level - 1] }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">
            <p class="warning-description">{{ currentWarning.description }}</p>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false" class="dialog-btn">关闭</el-button>
        <el-button type="primary" @click="handleProcess" class="dialog-btn process-btn">标记为已处理</el-button>
      </template>
    </el-dialog>

    <!-- 紧急发布对话框 -->
    <el-dialog v-model="emergencyVisible" title="紧急信息发布" width="50%" class="emergency-dialog">
      <el-form :model="emergencyForm" label-width="100px" :rules="emergencyRules" ref="emergencyFormRef">
        <el-form-item label="信息类型" prop="type">
          <el-select v-model="emergencyForm.type" placeholder="请选择信息类型">
            <el-option label="交通事故" value="交通事故" />
            <el-option label="自然灾害" value="自然灾害" />
            <el-option label="道路管制" value="道路管制" />
            <el-option label="恶劣天气" value="恶劣天气" />
            <el-option label="其他紧急" value="其他紧急" />
          </el-select>
        </el-form-item>
        <el-form-item label="影响区域" prop="area">
          <el-input v-model="emergencyForm.area" placeholder="请输入影响区域"></el-input>
        </el-form-item>
        <el-form-item label="紧急级别" prop="level">
          <el-slider v-model="emergencyForm.level" :min="1" :max="5" :marks="levelMarks" show-stops />
        </el-form-item>
        <el-form-item label="详细信息" prop="details">
          <el-input v-model="emergencyForm.details" type="textarea" :rows="4" placeholder="请输入详细信息"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="emergencyVisible = false" class="dialog-btn">取消</el-button>
        <el-button type="primary" @click="submitEmergency" class="dialog-btn submit-btn">立即发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 状态数据
const statusData = ref([
  { label: '畅通路段', value: '86%', color: '#67C23A' },
  { label: '缓行路段', value: '12%', color: '#E6A23C' },
  { label: '拥堵路段', value: '2%', color: '#F56C6C' }
]);

// 预警数据
const warnings = ref([
  {
    id: 1001,
    type: '交通事故',
    location: '中山东路与解放路交叉口',
    time: '2023-05-15 08:23:45',
    level: 4,
    description: '两车追尾事故，占用一条车道，请过往车辆注意避让。'
  },
  {
    id: 1002,
    type: '道路施工',
    location: '人民南路(南向北方向)',
    time: '2023-05-15 07:15:30',
    level: 3,
    description: '道路维修施工，占用最右侧车道，预计持续至18:00。'
  },
  {
    id: 1003,
    type: '恶劣天气',
    location: '全城范围',
    time: '2023-05-15 06:50:12',
    level: 2,
    description: '大雾天气，能见度低于500米，请驾驶员开启雾灯，保持车距。'
  },
  {
    id: 1004,
    type: '信号灯故障',
    location: '建设大道与青年路交叉口',
    time: '2023-05-15 08:05:33',
    level: 3,
    description: '东西方向信号灯故障，已安排交警现场指挥，请服从指挥通行。'
  },
  {
    id: 1005,
    type: '大型活动',
    location: '体育中心周边道路',
    time: '2023-05-15 09:00:00',
    level: 2,
    description: '今日14:00-22:00体育中心有大型演唱会，周边道路将实施临时交通管制。'
  },
  {
    id: 1006,
    type: '交通事故',
    location: '环城高速西段K25+300',
    time: '2023-05-15 09:30:15',
    level: 5,
    description: '多车连环相撞事故，已造成严重拥堵，建议绕行。'
  },
  {
    id: 1007,
    type: '车辆故障',
    location: '解放北路(北向南方向)',
    time: '2023-05-15 10:12:45',
    level: 1,
    description: '货车故障停靠路边，占用非机动车道，不影响主路通行。'
  }
]);

// 图表数据
const pieChartData = ref([
  { name: '交通事故', value: 45, color: '#F56C6C' },
  { name: '道路施工', value: 25, color: '#E6A23C' },
  { name: '恶劣天气', value: 15, color: '#409EFF' },
  { name: '其他', value: 15, color: '#909399' }
]);

const barChartData = ref([
  { day: '周一', value: 12 },
  { day: '周二', value: 19 },
  { day: '周三', value: 15 },
  { day: '周四', value: 8 },
  { day: '周五', value: 22 },
  { day: '周六', value: 18 },
  { day: '周日', value: 10 }
]);

const lineChartData = ref([
  { hour: 0, value: 2 },
  { hour: 3, value: 1 },
  { hour: 6, value: 3 },
  { hour: 9, value: 8 },
  { hour: 12, value: 12 },
  { hour: 15, value: 10 },
  { hour: 18, value: 15 },
  { hour: 21, value: 7 }
]);

// 分页相关
const currentPage = ref(1);
const pageSize = ref(10);
const totalWarnings = computed(() => warnings.value.length);

// 搜索相关
const searchQuery = ref('');
const filteredWarnings = computed(() => {
  let result = warnings.value;
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      item =>
        item.type.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }
  return result.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
});

// 图表类型
const chartType = ref('bar');

// 详情对话框
const detailVisible = ref(false);
const currentWarning = ref(null);

// 紧急发布相关
const emergencyVisible = ref(false);
const emergencyForm = ref({
  type: '',
  area: '',
  level: 3,
  details: ''
});
const emergencyRules = {
  type: [{ required: true, message: '请选择信息类型', trigger: 'change' }],
  area: [{ required: true, message: '请输入影响区域', trigger: 'blur' }],
  details: [{ required: true, message: '请输入详细信息', trigger: 'blur' }]
};
const levelMarks = {
  1: '低',
  2: '中',
  3: '高',
  4: '严重',
  5: '紧急'
};

// 系统状态
const lastUpdateTime = ref(new Date().toLocaleString());

// 方法
const refreshData = () => {
  lastUpdateTime.value = new Date().toLocaleString();
  ElMessage.success('交通数据已刷新');
};

const handleSearch = () => {
  currentPage.value = 1;
  ElMessage.info(`正在搜索: ${searchQuery.value}`);
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

const handleDetail = (row) => {
  currentWarning.value = row;
  detailVisible.value = true;
};

const handleProcess = () => {
  ElMessage.success(`预警 #${currentWarning.value.id} 已标记为已处理`);
  detailVisible.value = false;
};

const handleEmergency = () => {
  emergencyVisible.value = true;
};

const submitEmergency = () => {
  emergencyFormRef.value.validate((valid) => {
    if (valid) {
      ElMessageBox.confirm('确认发布这条紧急信息吗？', '确认发布', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const newWarning = {
          id: Math.floor(Math.random() * 9000) + 1000,
          type: emergencyForm.value.type,
          location: emergencyForm.value.area,
          time: new Date().toLocaleString(),
          level: emergencyForm.value.level,
          description: emergencyForm.value.details
        };
        warnings.value.unshift(newWarning);
        emergencyVisible.value = false;
        emergencyFormRef.value.resetFields();
        ElMessage.success('紧急信息已发布');
      });
    }
  });
};

const handleExport = () => {
  ElMessageBox.confirm('确认导出当前数据吗？', '导出数据', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    // 模拟导出
    setTimeout(() => {
      ElMessage.success('数据导出成功');
    }, 1500);
  });
};

const handleSettings = () => {
  ElMessage.info('系统设置功能正在开发中');
};

const getTagType = (type) => {
  const map = {
    '交通事故': 'danger',
    '道路施工': 'warning',
    '恶劣天气': 'info',
    '信号灯故障': 'warning',
    '大型活动': 'success',
    '车辆故障': ''
  };
  return map[type] || '';
};

const getLevelColor = (level) => {
  const colors = ['#67C23A', '#E6A23C', '#F56C6C', '#F56C6C', '#F56C6C'];
  return colors[level - 1];
};

// 表单引用
const emergencyFormRef = ref(null);

// 初始化
onMounted(() => {
  // 模拟数据加载
  setTimeout(() => {
    ElMessage.success('系统数据加载完成');
  }, 1000);
});
</script>

<style lang="scss" scoped>

@use './WarningInfo.scss';

</style>
