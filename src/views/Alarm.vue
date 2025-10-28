
<template>
  <div class="alarm-container">
    <el-card class="dashboard-card">
      <div class="card-header">
        <h2 class="system-title">航清智慧环保数据采集分析系统</h2>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索异常事件"
            clearable
            style="width: 300px"
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
            class="search-input"
          >
            <template #append>
              <el-button @click="handleSearch" class="search-btn">搜索</el-button>
            </template>
          </el-input>
          <el-select
            v-model="filterStatus"
            placeholder="筛选状态"
            clearable
            style="width: 150px; margin-left: 10px"
            class="status-filter"
          >
            <el-option label="未处理" value="pending" />
            <el-option label="已处理" value="resolved" />
            <el-option label="全部" value="all" />
          </el-select>
        </div>
      </div>

      <el-table
        :data="paginatedAlarms"
        style="width: 100%"
        v-loading="loading"
        :default-sort="{ prop: 'timestamp', order: 'descending' }"
        class="alarm-table"
      >
        <el-table-column prop="id" label="ID" width="80" sortable />
        <el-table-column prop="location" label="监测点位" width="180" />
        <el-table-column prop="type" label="异常类型" width="150">
          <template #default="{ row }">
            <el-tag :type="getTagType(row.type)" class="alarm-tag">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="监测值" width="120">
          <template #default="{ row }">
            <span :class="{ 'danger-value': row.value > row.threshold }">{{ row.value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="阈值" width="120" />
        <el-table-column prop="timestamp" label="发生时间" width="180" sortable>
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'resolved' ? 'success' : 'warning'">
              {{ row.status === 'resolved' ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="handleDetail(row)"
              class="detail-btn"
              >详情</el-button
            >
            <el-button
              size="small"
              type="primary"
              @click="handleResolve(row)"
              class="resolve-btn"
              v-if="row.status === 'pending'"
              >处理</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :small="small"
          :disabled="disabled"
          :background="background"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="异常详情" width="50%" class="alarm-dialog">
      <div v-if="currentAlarm" class="alarm-detail">
        <el-descriptions :column="1" border class="detail-descriptions">
          <el-descriptions-item label="异常ID">{{ currentAlarm.id }}</el-descriptions-item>
          <el-descriptions-item label="监测点位">{{ currentAlarm.location }}</el-descriptions-item>
          <el-descriptions-item label="异常类型">
            <el-tag :type="getTagType(currentAlarm.type)" class="alarm-tag">{{ currentAlarm.type }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="监测值">
            <span :class="{ 'danger-text': currentAlarm.value > currentAlarm.threshold }">
              {{ currentAlarm.value }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="阈值">{{ currentAlarm.threshold }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ formatDate(currentAlarm.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentAlarm.status === 'resolved' ? 'success' : 'warning'">
              {{ currentAlarm.status === 'resolved' ? '已处理' : '未处理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">{{ currentAlarm.description }}</el-descriptions-item>
        </el-descriptions>

        <div class="action-buttons" style="margin-top: 20px">
          <el-button type="primary" @click="handleResolve(currentAlarm)" v-if="currentAlarm.status === 'pending'" class="resolve-btn">
            标记为已处理
          </el-button>
          <el-button @click="detailVisible = false" class="close-btn">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 模拟数据
const mockAlarms = Array.from({ length: 50 }, (_, i) => ({
  id: `AL${1000 + i}`,
  location: `监测点${i % 5 + 1}`,
  type: ['温度异常', '湿度异常', 'PM2.5超标', '噪音超标', '水质异常'][i % 5],
  value: (Math.random() * 100).toFixed(2),
  threshold: [30, 60, 75, 85, 50][i % 5],
  timestamp: Date.now() - i * 3600000,
  status: i % 3 === 0 ? 'resolved' : 'pending',
  description: `这是第${i + 1}条异常数据的详细描述，描述了具体的异常情况和可能的原因。`
}));

// 响应式数据
const alarms = ref([]);
const loading = ref(true);
const searchQuery = ref('');
const filterStatus = ref('all');
const currentPage = ref(1);
const pageSize = ref(10);
const small = ref(false);
const disabled = ref(false);
const background = ref(true);
const total = computed(() => filteredAlarms.value.length);
const detailVisible = ref(false);
const currentAlarm = ref(null);

// 计算属性
const filteredAlarms = computed(() => {
  let result = alarms.value;
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      item =>
        item.id.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
  }
  
  // 状态过滤
  if (filterStatus.value && filterStatus.value !== 'all') {
    result = result.filter(item => item.status === filterStatus.value);
  }
  
  return result;
});

const paginatedAlarms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredAlarms.value.slice(start, end);
});

// 方法
const fetchAlarms = () => {
  loading.value = true;
  // 模拟异步请求
  setTimeout(() => {
    alarms.value = mockAlarms;
    loading.value = false;
  }, 800);
};

const handleSearch = () => {
  currentPage.value = 1;
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

const handleDetail = (alarm) => {
  currentAlarm.value = alarm;
  detailVisible.value = true;
};

const handleResolve = (alarm) => {
  ElMessageBox.confirm('确认将此异常标记为已处理?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    alarm.status = 'resolved';
    ElMessage.success('处理成功');
    detailVisible.value = false;
  }).catch(() => {});
};

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const getTagType = (type) => {
  const typeMap = {
    '温度异常': 'danger',
    '湿度异常': 'warning',
    'PM2.5超标': 'info',
    '噪音超标': '',
    '水质异常': 'success'
  };
  return typeMap[type] || '';
};

// 生命周期钩子
onMounted(() => {
  fetchAlarms();
});
</script>

<style lang="scss" scoped>


@use './Alarm.scss';


</style>
