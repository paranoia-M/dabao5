<template>
  <div class="alarm-container">
    <div class="alarm-header">
      <h2 class="system-title">泰捷欣监控设备数据压缩上传应用系统</h2>
      <div class="sub-title">告警监控中心</div>
      
      <div class="filter-area">
        <div class="filter-group">
          <el-input
            v-model="searchQuery"
            placeholder="请输入告警标题或内容关键词"
            clearable
            class="search-input"
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
        </div>
        
        <div class="filter-group">
          <el-select
            v-model="alarmLevel"
            placeholder="全部告警级别"
            clearable
            class="level-select"
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in levelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        
        <div class="filter-group">
          <el-select
            v-model="alarmStatus"
            placeholder="全部告警状态"
            clearable
            class="status-select"
            @change="handleFilterChange"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
    </div>
    
    <div class="alarm-statistics">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card critical">
            <div class="stat-title">紧急告警</div>
            <div class="stat-value">{{ alarmStats.critical }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-title">严重告警</div>
            <div class="stat-value">{{ alarmStats.warning }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card normal">
            <div class="stat-title">一般告警</div>
            <div class="stat-value">{{ alarmStats.normal }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card minor">
            <div class="stat-title">轻微告警</div>
            <div class="stat-value">{{ alarmStats.minor }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <el-table
      :data="paginatedAlarms"
      style="width: 100%"
      :row-class-name="tableRowClassName"
      v-loading="loading"
      element-loading-text="数据加载中..."
      border
      stripe
      highlight-current-row
    >
      <el-table-column prop="id" label="告警ID" width="100" align="center" />
      <el-table-column prop="title" label="告警标题" min-width="180" />
      <el-table-column prop="content" label="告警详情" min-width="250" />
      <el-table-column prop="level" label="告警级别" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getLevelTagType(row.level)" effect="light">
            {{ row.level }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="处理状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === '已处理' ? 'success' : 'danger'" effect="light">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="time" label="发生时间" width="180" align="center" />
      <el-table-column label="操作" width="150" fixed="right" align="center">
        <template #default="{ row }">
          <el-button
            size="small"
            :type="row.status === '未处理' ? 'primary' : 'info'"
            :disabled="row.status === '已处理'"
            @click="showProcessDialog(row)"
          >
            {{ row.status === '未处理' ? '处理告警' : '已处理' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="totalAlarms"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    
    <!-- 处理告警弹窗 -->
    <el-dialog
      v-model="processDialogVisible"
      title="处理告警"
      width="500px"
      :before-close="handleCloseDialog"
    >
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="告警ID">
          <el-input v-model="processForm.id" disabled />
        </el-form-item>
        <el-form-item label="告警标题">
          <el-input v-model="processForm.title" disabled />
        </el-form-item>
        <el-form-item label="处理意见" required>
          <el-input
            v-model="processForm.comment"
            type="textarea"
            :rows="3"
            placeholder="请输入处理意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmProcess">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 模拟数据
const generateMockAlarms = () => {
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    title: `系统${['CPU', '内存', '磁盘', '网络'][i % 4]}${['过载', '不足', '异常', '中断'][i % 4]}告警`,
    content: `检测到${['主服务器', '数据库节点', '应用服务', '网络设备'][i % 4]}${['性能下降', '连接超时', '响应异常', '资源耗尽'][i % 4]}，当前值：${Math.round(Math.random() * 100)}%`,
    level: ['紧急', '严重', '一般', '轻微'][Math.floor(Math.random() * 4)],
    status: ['未处理', '已处理'][Math.floor(Math.random() * 2)],
    time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
  }));
};

// 响应式数据
const alarms = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const alarmLevel = ref('');
const alarmStatus = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const processDialogVisible = ref(false);
const currentAlarm = ref(null);
const processForm = ref({
  id: '',
  title: '',
  comment: ''
});

// 选项数据
const levelOptions = [
  { value: '紧急', label: '紧急' },
  { value: '严重', label: '严重' },
  { value: '一般', label: '一般' },
  { value: '轻微', label: '轻微' },
];

const statusOptions = [
  { value: '未处理', label: '未处理' },
  { value: '已处理', label: '已处理' },
];

// 计算属性
const filteredAlarms = computed(() => {
  let result = alarms.value;
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      item => 
        item.title.toLowerCase().includes(query) || 
        item.content.toLowerCase().includes(query)
    );
  }
  
  if (alarmLevel.value) {
    result = result.filter(item => item.level === alarmLevel.value);
  }
  
  if (alarmStatus.value) {
    result = result.filter(item => item.status === alarmStatus.value);
  }
  
  return result;
});

const totalAlarms = computed(() => filteredAlarms.value.length);

const paginatedAlarms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredAlarms.value.slice(start, end);
});

const alarmStats = computed(() => {
  return {
    critical: alarms.value.filter(a => a.level === '紧急').length,
    warning: alarms.value.filter(a => a.level === '严重').length,
    normal: alarms.value.filter(a => a.level === '一般').length,
    minor: alarms.value.filter(a => a.level === '轻微').length
  };
});

// 方法
const getLevelTagType = (level) => {
  switch (level) {
    case '紧急': return 'danger';
    case '严重': return 'warning';
    case '一般': return 'primary';
    case '轻微': return 'info';
    default: return '';
  }
};

const tableRowClassName = ({ row }) => {
  if (row.status === '未处理') return 'unprocessed-row';
  return '';
};

const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchClear = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

const handleFilterChange = () => {
  currentPage.value = 1;
};

const showProcessDialog = (row) => {
  currentAlarm.value = row;
  processForm.value = {
    id: row.id,
    title: row.title,
    comment: ''
  };
  processDialogVisible.value = true;
};

const confirmProcess = () => {
  if (!processForm.value.comment) {
    ElMessage.warning('请填写处理意见');
    return;
  }
  
  const alarm = alarms.value.find(a => a.id === currentAlarm.value.id);
  if (alarm) {
    alarm.status = '已处理';
    ElMessage.success('告警处理成功');
    processDialogVisible.value = false;
  }
};

const handleCloseDialog = (done) => {
  ElMessageBox.confirm('确认关闭？未保存的处理意见将丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done();
  }).catch(() => {});
};

const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 模拟API请求
const fetchAlarms = () => {
  loading.value = true;
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = generateMockAlarms();
      resolve(data);
    }, 800);
  });
};

// 生命周期钩子
onMounted(async () => {
  try {
    alarms.value = await fetchAlarms();
  } catch (error) {
    ElMessage.error('获取告警数据失败，已使用模拟数据');
    alarms.value = generateMockAlarms();
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>

@use './Alarm.scss';

</style>