<template>
  <div class="home-container">
    <!-- 欢迎卡片 -->
    <el-card class="welcome-card">
      <div class="welcome-content">
        <h1 class="title">人工智能数据采集分析系统</h1>
        <p class="subtitle">基于AI技术实现企业知识的智能分类与整合</p>
        <el-divider />
        
        <!-- 统计卡片 -->
        <div class="stats-container">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(stat, index) in stats" :key="index">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon" :style="{ backgroundColor: stat.color }">
                    <span class="stat-icon-text">{{ stat.iconText }}</span>
                  </div>
                  <div class="stat-info">
                    <div class="stat-value">{{ stat.value }}</div>
                    <div class="stat-label">{{ stat.label }}</div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
    
    <!-- 最近文档表格 -->
    <div class="recent-container">
      <el-card>
        <template #header>
          <div class="recent-header">
            <span>最近处理的知识文档</span>
            <el-button type="primary" size="small" @click="handleViewAll">查看全部</el-button>
          </div>
        </template>
        
        <el-table :data="recentDocuments" style="width: 100%" height="300">
          <el-table-column prop="name" label="文档名称" width="180" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getTagType(row.type)">{{ row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="category" label="分类" />
          <el-table-column prop="date" label="处理时间" width="180" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="handlePreview(row)">预览</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            small
            layout="prev, pager, next"
            :total="50"
            :page-size="5"
            @current-change="handlePageChange"
          />
        </div>
      </el-card>
    </div>
    
    <!-- 快速操作 -->
    <div class="quick-actions">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(action, index) in quickActions" :key="index">
          <el-card shadow="hover" class="action-card" @click="handleQuickAction(action)">
            <div class="action-content">
              <span class="action-icon" :style="{ color: action.color }">{{ action.iconText }}</span>
              <div class="action-title">{{ action.title }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 预览弹窗 -->
    <el-dialog v-model="previewVisible" title="文档预览" width="70%">
      <div class="preview-content">
        <h3>{{ previewDocument.name }}</h3>
        <p>类型: <el-tag :type="getTagType(previewDocument.type)">{{ previewDocument.type }}</el-tag></p>
        <p>分类: {{ previewDocument.category }}</p>
        <p>处理时间: {{ previewDocument.date }}</p>
        <div class="preview-placeholder">
          <p>这里是文档的AI智能分析结果预览区域</p>
          <p>平台已自动识别文档关键内容并生成摘要</p>
        </div>
      </div>
    </el-dialog>

    <!-- 上传文档弹窗 -->
    <el-dialog v-model="uploadVisible" title="上传文档" width="50%">
      <el-upload
        class="upload-demo"
        drag
        action="#"
        multiple
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
      >
        <el-icon class="el-icon--upload"><upload /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">
            支持上传PDF、DOCX、XLSX、PPTX格式文件，系统将自动分类
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Upload } from '@element-plus/icons-vue';

// 统计数据
const stats = ref([
  { iconText: '📄', value: '1,245', label: '知识文档', color: '#409EFF' },
  { iconText: '🏷️', value: '328', label: '分类标签', color: '#67C23A' },
  { iconText: '📊', value: '98.7%', label: '分类准确率', color: '#E6A23C' },
  { iconText: '📁', value: '56', label: '知识库', color: '#F56C6C' }
]);

// 最近文档数据
const recentDocuments = ref([
  { id: 1, name: '2023年度产品规划', type: 'PDF', category: '产品文档', date: '2023-05-15 14:30' },
  { id: 2, name: '市场调研报告', type: 'DOCX', category: '市场分析', date: '2023-05-14 10:15' },
  { id: 3, name: '技术白皮书', type: 'PDF', category: '技术文档', date: '2023-05-13 16:45' },
  { id: 4, name: '用户反馈汇总', type: 'XLSX', category: '用户研究', date: '2023-05-12 09:20' },
  { id: 5, name: '项目进度报告', type: 'PPTX', category: '项目管理', date: '2023-05-11 11:30' }
]);

// 快速操作
const quickActions = ref([
  { iconText: '⬆️', title: '上传文档', color: '#409EFF', action: 'upload' },
  { iconText: '⬇️', title: '导出知识', color: '#67C23A', action: 'export' },
  { iconText: '🔍', title: '智能搜索', color: '#E6A23C', action: 'search' },
  { iconText: '⚙️', title: '分类设置', color: '#F56C6C', action: 'settings' }
]);

// 预览相关
const previewVisible = ref(false);
const previewDocument = ref({});

// 上传相关
const uploadVisible = ref(false);

// 获取标签类型
const getTagType = (type) => {
  const typeMap = {
    'PDF': 'primary',
    'DOCX': 'success',
    'XLSX': 'warning',
    'PPTX': 'danger'
  };
  return typeMap[type] || '';
};

// 处理分页变化
const handlePageChange = (currentPage) => {
  // 模拟分页数据加载
  const mockData = [
    { id: 1, name: '文档' + currentPage + '-1', type: 'PDF', category: '分类1', date: '2023-05-15' },
    { id: 2, name: '文档' + currentPage + '-2', type: 'DOCX', category: '分类2', date: '2023-05-14' },
    { id: 3, name: '文档' + currentPage + '-3', type: 'XLSX', category: '分类3', date: '2023-05-13' },
    { id: 4, name: '文档' + currentPage + '-4', type: 'PPTX', category: '分类4', date: '2023-05-12' },
    { id: 5, name: '文档' + currentPage + '-5', type: 'PDF', category: '分类5', date: '2023-05-11' }
  ];
  recentDocuments.value = mockData;
  ElMessage.success(`已加载第${currentPage}页数据`);
};

// 预览文档
const handlePreview = (document) => {
  previewDocument.value = document;
  previewVisible.value = true;
};

// 查看全部
const handleViewAll = () => {
  ElMessageBox.confirm(
    '将展示所有知识文档，确认继续吗？',
    '查看全部文档',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    }
  ).then(() => {
    // 模拟加载全部数据
    const mockAllData = [];
    for (let i = 1; i <= 10; i++) {
      mockAllData.push({
        id: i,
        name: '全部文档-' + i,
        type: ['PDF', 'DOCX', 'XLSX', 'PPTX'][Math.floor(Math.random() * 4)],
        category: ['产品文档', '市场分析', '技术文档', '用户研究', '项目管理'][Math.floor(Math.random() * 5)],
        date: '2023-05-' + (10 + i) + ' ' + Math.floor(Math.random() * 12) + ':' + Math.floor(Math.random() * 60)
      });
    }
    recentDocuments.value = mockAllData;
    ElMessage.success('已加载全部文档数据');
  }).catch(() => {
    ElMessage.info('已取消操作');
  });
};

// 快速操作
const handleQuickAction = (action) => {
  switch (action.action) {
    case 'upload':
      uploadVisible.value = true;
      break;
    case 'export':
      ElMessageBox.prompt('请输入导出文件名', '导出知识', {
        confirmButtonText: '导出',
        cancelButtonText: '取消',
        inputPlaceholder: '例如: 企业知识库_2023'
      }).then(({ value }) => {
        ElMessage.success(`正在导出知识库: ${value}.zip`);
      }).catch(() => {
        ElMessage.info('取消导出');
      });
      break;
    case 'search':
      ElMessageBox.prompt('请输入搜索关键词', '智能搜索', {
        confirmButtonText: '搜索',
        cancelButtonText: '取消',
        inputPlaceholder: '输入关键词进行智能搜索'
      }).then(({ value }) => {
        ElMessage.success(`正在搜索: ${value}，AI正在分析相关文档...`);
      }).catch(() => {
        ElMessage.info('取消搜索');
      });
      break;
    case 'settings':
      ElMessageBox.alert('分类设置功能正在开发中', '分类设置', {
        confirmButtonText: '确定'
      });
      break;
  }
};

// 上传成功处理
const handleUploadSuccess = (response, file, fileList) => {
  uploadVisible.value = false;
  ElMessage.success(`文件 ${file.name} 上传成功，AI正在分析内容...`);
  // 模拟添加到最近文档
  const newDoc = {
    id: recentDocuments.value.length + 1,
    name: file.name,
    type: file.name.split('.').pop().toUpperCase(),
    category: '待分类',
    date: new Date().toLocaleString()
  };
  recentDocuments.value.unshift(newDoc);
};

// 上传错误处理
const handleUploadError = (error, file, fileList) => {
  ElMessage.error(`文件 ${file.name} 上传失败: ${error}`);
};
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>