
<template>
  <div class="broadcast-container">
    <el-card class="broadcast-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="header-title">智慧广播管理系统</span>
          <el-button type="primary" class="add-btn" @click="handleAddBroadcast">
            <span class="btn-icon">+</span> 新增广播
          </el-button>
        </div>
      </template>

      <div class="filter-container">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索广播标题或内容" 
          class="search-input" 
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>

        <el-select 
          v-model="filterStatus" 
          placeholder="广播状态" 
          class="status-select" 
          clearable
        >
          <el-option label="全部状态" value="" />
          <el-option label="已发布" value="published" />
          <el-option label="未发布" value="unpublished" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-picker"
          value-format="YYYY-MM-DD"
        />
      </div>

      <div class="data-visualization">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon total-icon">
                  <el-icon><Collection /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">总广播数</div>
                  <div class="stat-value">{{ totalBroadcasts }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon published-icon">
                  <el-icon><SuccessFilled /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">已发布</div>
                  <div class="stat-value">{{ publishedCount }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon unpublished-icon">
                  <el-icon><Clock /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-title">未发布</div>
                  <div class="stat-value">{{ unpublishedCount }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-table 
        :data="filteredBroadcasts" 
        style="width: 100%" 
        v-loading="loading"
        border
        stripe
        highlight-current-row
      >
        <el-table-column prop="id" label="广播ID" width="100" align="center" />
        <el-table-column prop="title" label="广播标题" width="200" />
        <el-table-column prop="content" label="广播内容" min-width="300" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" effect="light">
              {{ row.status === 'published' ? '已发布' : '未发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" class="edit-btn" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              class="delete-btn" 
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 广播编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      :before-close="handleClose"
      class="broadcast-dialog"
    >
      <el-form :model="formData" label-width="100px" :rules="formRules" ref="formRef">
        <el-form-item label="广播标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入广播标题" />
        </el-form-item>
        <el-form-item label="广播内容" prop="content">
          <el-input 
            v-model="formData.content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入广播内容"
            show-word-limit
            maxlength="500"
          />
        </el-form-item>
        <el-form-item label="广播状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio label="published" border>立即发布</el-radio>
            <el-radio label="unpublished" border>暂不发布</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="定时发布" v-if="formData.status === 'published'">
          <el-switch v-model="formData.scheduled" active-text="启用定时" />
          <el-date-picker
            v-model="formData.scheduleTime"
            type="datetime"
            placeholder="选择发布时间"
            :disabled="!formData.scheduled"
            style="margin-left: 10px;"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Collection, SuccessFilled, Clock } from '@element-plus/icons-vue';

// 表格数据
const broadcasts = ref([]);
const loading = ref(true);

// 分页
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索和筛选
const searchQuery = ref('');
const filterStatus = ref('');
const dateRange = ref([]);

// 对话框
const dialogVisible = ref(false);
const dialogTitle = ref('新增广播');
const formRef = ref(null);
const formData = ref({
  id: '',
  title: '',
  content: '',
  status: 'published',
  scheduled: false,
  scheduleTime: ''
});

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入广播标题', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入广播内容', trigger: 'blur' },
    { min: 10, max: 500, message: '长度在 10 到 500 个字符', trigger: 'blur' }
  ]
};

// 统计数据
const totalBroadcasts = computed(() => broadcasts.value.length);
const publishedCount = computed(() => broadcasts.value.filter(item => item.status === 'published').length);
const unpublishedCount = computed(() => broadcasts.value.filter(item => item.status === 'unpublished').length);

// 模拟数据
const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `校园广播${i + 1}：${['重要通知', '活动预告', '紧急通知', '日常播报'][i % 4]}`,
  content: `这是第${i + 1}条智慧校园广播内容。${['请全体师生注意', '本周五将举行', '紧急通知：', '今日天气'][i % 4]}${['学校将于下周进行消防演习', '校园艺术节开幕式', '图书馆临时闭馆维修', '多云转晴，气温20-25℃'][i % 4]}。`,
  status: Math.random() > 0.3 ? 'published' : 'unpublished',
  createTime: `2023-05-${String(15 - Math.floor(i / 10)).padStart(2, '0')} ${String(10 + i % 8).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00`
}));

// 计算属性 - 过滤后的数据
const filteredBroadcasts = computed(() => {
  let result = [...broadcasts.value];
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    );
  }
  
  // 状态过滤
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value);
  }
  
  // 日期过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value;
    result = result.filter(item => {
      const itemDate = new Date(item.createTime);
      return itemDate >= new Date(start) && itemDate <= new Date(end);
    });
  }
  
  // 分页
  total.value = result.length;
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  
  return result.slice(start, end);
});

// 生命周期钩子
onMounted(() => {
  fetchBroadcastData();
});

// 获取广播数据
const fetchBroadcastData = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    broadcasts.value = mockData;
    total.value = mockData.length;
    loading.value = false;
  }, 800);
};

// 方法
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

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

const handleAddBroadcast = () => {
  dialogTitle.value = '新增广播';
  formData.value = {
    id: '',
    title: '',
    content: '',
    status: 'published',
    scheduled: false,
    scheduleTime: ''
  };
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  dialogTitle.value = '编辑广播';
  formData.value = { 
    ...row,
    scheduled: false,
    scheduleTime: ''
  };
  dialogVisible.value = true;
};

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除广播 "${row.title}" 吗?`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 模拟删除操作
    broadcasts.value = broadcasts.value.filter(item => item.id !== row.id);
    total.value = broadcasts.value.length;
    ElMessage.success({
      message: '广播删除成功',
      type: 'success',
      showClose: true
    });
  }).catch(() => {
    ElMessage.info({
      message: '已取消删除',
      showClose: true
    });
  });
};

const handleClose = (done) => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  done();
};

const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (!valid) return;
    
    if (dialogTitle.value === '新增广播') {
      // 模拟新增
      const newId = broadcasts.value.length > 0 
        ? Math.max(...broadcasts.value.map(item => item.id)) + 1 
        : 1;
      const newBroadcast = {
        ...formData.value,
        id: newId,
        createTime: new Date().toLocaleString()
      };
      broadcasts.value.unshift(newBroadcast);
      total.value = broadcasts.value.length;
      ElMessage.success({
        message: '广播新增成功',
        type: 'success',
        showClose: true
      });
    } else {
      // 模拟编辑
      const index = broadcasts.value.findIndex(item => item.id === formData.value.id);
      if (index !== -1) {
        broadcasts.value[index] = { 
          ...formData.value,
          createTime: broadcasts.value[index].createTime
        };
        ElMessage.success({
          message: '广播更新成功',
          type: 'success',
          showClose: true
        });
      }
    }
    
    dialogVisible.value = false;
  });
};
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>
