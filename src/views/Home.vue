<template>
  <div class="monitor-container">
    <!-- 头部标题区域 -->
    <div class="header">
      <h2>航清智慧环保数据采集分析系统</h2>
      <div class="subtitle">实时监测 · 智能预警 · 数据分析</div>
    </div>

    <!-- 可视化表单区域 -->
    <el-row :gutter="20" class="form-row">
      <el-col :span="8">
        <el-card shadow="hover" class="form-card">
          <div class="card-title">数据筛选</div>
          <el-form :model="formData" label-width="100px">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="formData.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
              />
            </el-form-item>
            <el-form-item label="监测类型">
              <el-select v-model="formData.monitorType" placeholder="请选择监测类型">
                <el-option
                  v-for="item in monitorOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="预警级别">
              <el-select v-model="formData.warningLevel" placeholder="请选择预警级别">
                <el-option
                  v-for="item in warningOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card shadow="hover" class="stats-card">
          <div class="card-title">实时统计</div>
          <el-row :gutter="20">
            <el-col :span="6" v-for="(item, index) in statsData" :key="index">
              <div class="stat-item">
                <div class="stat-value">{{ item.value }}</div>
                <div class="stat-label">{{ item.label }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格区域 -->
    <el-card shadow="hover" class="table-card">
      <div class="card-title">异常数据列表</div>
      <el-table :data="tableData" style="width: 100%" border>
        <el-table-column prop="date" label="日期" width="180" />
        <el-table-column prop="location" label="监测点" width="120" />
        <el-table-column prop="type" label="监测类型" width="120" />
        <el-table-column prop="value" label="监测值" width="120" />
        <el-table-column prop="standard" label="标准值" width="120" />
        <el-table-column prop="level" label="预警级别" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="处理状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '已处理' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button size="small" @click="handleDetail(row)">详情</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleProcess(row)"
              v-if="row.status === '未处理'"
            >
              处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        class="pagination"
        :current-page="pagination.current"
        :page-size="pagination.size"
        :total="pagination.total"
        @current-change="handlePageChange"
        layout="total, prev, pager, next, jumper"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

// 表单数据
const formData = reactive({
  dateRange: [],
  monitorType: '',
  warningLevel: ''
});

// 筛选选项
const monitorOptions = ref([
  { value: 'air', label: '空气质量' },
  { value: 'water', label: '水质监测' },
  { value: 'noise', label: '噪音监测' },
  { value: 'soil', label: '土壤监测' }
]);

const warningOptions = ref([
  { value: '1', label: '一级预警' },
  { value: '2', label: '二级预警' },
  { value: '3', label: '三级预警' },
  { value: '4', label: '四级预警' }
]);

// 统计数据
const statsData = ref([
  { value: '24', label: '今日预警数' },
  { value: '156', label: '本周预警数' },
  { value: '82%', label: '处理完成率' },
  { value: '15', label: '紧急预警数' }
]);

// 表格数据
const tableData = ref([
  {
    date: '2023-05-15 08:30',
    location: 'A区监测点',
    type: '空气质量',
    value: '158',
    standard: '100',
    level: '二级预警',
    status: '未处理'
  },
  {
    date: '2023-05-15 09:45',
    location: 'B区监测点',
    type: '水质监测',
    value: '6.8',
    standard: '5.0',
    level: '三级预警',
    status: '已处理'
  },
  {
    date: '2023-05-15 10:20',
    location: 'C区监测点',
    type: '噪音监测',
    value: '75',
    standard: '60',
    level: '一级预警',
    status: '未处理'
  },
  {
    date: '2023-05-15 11:05',
    location: 'D区监测点',
    type: '土壤监测',
    value: '2.8',
    standard: '1.5',
    level: '四级预警',
    status: '已处理'
  },
  {
    date: '2023-05-15 13:40',
    location: 'E区监测点',
    type: '空气质量',
    value: '132',
    standard: '100',
    level: '二级预警',
    status: '未处理'
  }
]);

// 分页数据
const pagination = reactive({
  current: 1,
  size: 10,
  total: 50
});

// 获取预警级别对应的tag类型
const getLevelType = (level) => {
  const levelMap = {
    '一级预警': 'danger',
    '二级预警': 'warning',
    '三级预警': 'info',
    '四级预警': ''
  };
  return levelMap[level] || '';
};

// 查询方法
const handleSearch = () => {
  console.log('查询条件:', formData);
  // 这里应该是API请求，使用假数据模拟
  tableData.value = tableData.value.filter(item => {
    if (formData.monitorType && item.type !== formData.monitorType) return false;
    if (formData.warningLevel && item.level !== formData.warningLevel) return false;
    return true;
  });
};

// 重置方法
const handleReset = () => {
  formData.dateRange = [];
  formData.monitorType = '';
  formData.warningLevel = '';
  // 重置后重新加载数据
  loadTableData();
};

// 分页变化
const handlePageChange = (current) => {
  pagination.current = current;
  loadTableData();
};

// 详情查看
const handleDetail = (row) => {
  console.log('查看详情:', row);
  // 这里可以打开详情弹窗
};

// 处理预警
const handleProcess = (row) => {
  console.log('处理预警:', row);
  row.status = '已处理';
  // 这里可以调用API更新状态
};

// 加载表格数据
const loadTableData = () => {
  // 模拟API请求
  console.log('加载表格数据，页码:', pagination.current);
};

onMounted(() => {
  loadTableData();
});
</script>

<style lang="scss" scoped>


@use './Home.scss';


</style>