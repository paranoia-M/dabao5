
<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <div class="welcome-header">
        <h1 class="platform-title">人工智能数据采集分析系统</h1>
        <p class="subtitle">智能分类 · 知识整合 · 高效管理</p>
      </div>
      
      <el-divider class="custom-divider" />
      
      <div class="stats-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(stat, index) in stats" :key="index">
            <div class="stat-card" :style="{'background-color': stat.color}">
              <div class="stat-content">
                <h3>{{ stat.title }}</h3>
                <p class="stat-value">{{ stat.value }}</p>
                <p class="stat-desc">{{ stat.desc }}</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <el-divider class="custom-divider" />
      
      <div class="recent-activity">
        <h2 class="section-title">最近活动</h2>
        <el-timeline>
          <el-timeline-item 
            v-for="(activity, index) in activities" 
            :key="index"
            :timestamp="activity.time"
            placement="top"
            :type="activity.type"
            :color="activity.color"
            :size="activity.size"
            :hollow="activity.hollow"
          >
            <el-card class="activity-card">
              <h4>{{ activity.title }}</h4>
              <p>{{ activity.content }}</p>
              <div class="activity-footer">
                <span class="activity-tag" :style="{'background-color': activity.tagColor}">
                  {{ activity.tag }}
                </span>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <div class="quick-actions">
        <h2 class="section-title">快捷操作</h2>
        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6" v-for="(action, index) in quickActions" :key="index">
            <el-button 
              class="action-btn" 
              :type="action.type" 
              @click="handleAction(action)"
            >
              {{ action.label }}
            </el-button>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 弹窗组件 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentAction.label + '操作'"
      width="50%"
    >
      <div class="dialog-content">
        <p>{{ getDialogContent(currentAction.label) }}</p>
        <div v-if="currentAction.label === '上传文档'">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            multiple
          >
            <div class="upload-area">
              <p>点击或拖拽文件到此处上传</p>
            </div>
          </el-upload>
        </div>
        <div v-else-if="currentAction.label === '分类管理'">
          <el-table :data="categoryData" style="width: 100%">
            <el-table-column prop="name" label="分类名称" />
            <el-table-column prop="count" label="文档数量" />
            <el-table-column label="操作">
              <template #default>
                <el-button type="text" size="small">编辑</el-button>
                <el-button type="text" size="small">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAction">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const stats = ref([
  { 
    title: '知识文档', 
    value: '1,245', 
    desc: '涵盖企业各类知识文档',
    color: '#f0f9eb' 
  },
  { 
    title: '分类标签', 
    value: '86', 
    desc: '智能分类体系标签',
    color: '#fdf6ec' 
  },
  { 
    title: '智能模型', 
    value: '12', 
    desc: 'AI分类模型数量',
    color: '#f0f7ff' 
  },
  { 
    title: '活跃用户', 
    value: '48', 
    desc: '近7天活跃用户数',
    color: '#f9f0ff' 
  }
]);

const activities = ref([
  {
    title: '新增知识文档',
    content: '用户张三上传了《2023年度市场分析报告》',
    time: '2023-06-15 14:30',
    type: 'primary',
    color: '#409eff',
    size: 'large',
    hollow: true,
    tag: '文档上传',
    tagColor: '#e1f3d8'
  },
  {
    title: '分类完成',
    content: '系统自动完成了50份文档的智能分类',
    time: '2023-06-15 10:15',
    type: 'success',
    color: '#67c23a',
    size: 'normal',
    hollow: false,
    tag: '智能分类',
    tagColor: '#f0f9eb'
  },
  {
    title: '分类警告',
    content: '有12份文档分类置信度低于阈值，需要人工复核',
    time: '2023-06-14 16:45',
    type: 'warning',
    color: '#e6a23c',
    size: 'normal',
    hollow: false,
    tag: '需复核',
    tagColor: '#fdf6ec'
  },
  {
    title: '系统维护',
    content: '完成了知识图谱的增量更新',
    time: '2023-06-14 02:00',
    type: 'info',
    color: '#909399',
    size: 'small',
    hollow: true,
    tag: '系统更新',
    tagColor: '#f4f4f5'
  }
]);

const quickActions = ref([
  { label: '上传文档', type: 'primary' },
  { label: '下载报告', type: 'success' },
  { label: '搜索知识', type: 'info' },
  { label: '分类管理', type: 'warning' },
  { label: '模型训练', type: 'danger' },
  { label: '系统设置', type: '' }
]);

const categoryData = ref([
  { name: '市场分析', count: 245 },
  { name: '产品文档', count: 189 },
  { name: '技术规范', count: 156 },
  { name: '会议纪要', count: 98 }
]);

const dialogVisible = ref(false);
const currentAction = ref({});

const handleAction = (action) => {
  currentAction.value = action;
  dialogVisible.value = true;
};

const confirmAction = () => {
  dialogVisible.value = false;
  ElMessage({
    message: `${currentAction.value.label}操作已提交`,
    type: 'success'
  });
};

const getDialogContent = (action) => {
  const contents = {
    '上传文档': '请上传需要分类的企业知识文档，支持多种格式',
    '下载报告': '选择需要下载的知识分类报告',
    '搜索知识': '输入关键词搜索企业知识库',
    '分类管理': '管理文档分类体系',
    '模型训练': '配置并训练新的分类模型',
    '系统设置': '配置平台参数和权限'
  };
  return contents[action] || '准备执行操作';
};
</script>

<style lang="scss" scoped>

@use './UserManagement.scss';

</style>
    