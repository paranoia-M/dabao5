
<template>
  <div class="integration-container">
    <el-card class="welcome-card">
      <div class="welcome-header">
        <h1 class="platform-title">人工智能数据采集分析系统</h1>
        <p class="platform-subtitle">高效整合企业知识资源，智能分类管理</p>
      </div>
      
      <el-divider class="custom-divider" />
      
      <div class="dashboard-grid">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="(item, index) in dashboardItems" :key="index">
            <el-card shadow="hover" class="dashboard-card" @click="handleCardClick(item)">
              <div class="card-content">
                <div class="icon-wrapper" :class="'icon-' + item.statusType">
                  <component :is="item.icon" class="card-icon" />
                </div>
                <h3 class="card-title">{{ item.title }}</h3>
                <p class="card-desc">{{ item.description }}</p>
                <el-tag :type="item.statusType" class="card-tag">{{ item.status }}</el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <el-divider class="custom-divider" />
      
      <div class="recent-activity">
        <h2 class="activity-title">最近活动</h2>
        <el-timeline>
          <el-timeline-item 
            v-for="(activity, index) in activities" 
            :key="index" 
            :timestamp="activity.timestamp"
            placement="top"
            class="timeline-item">
            <el-card class="activity-card">
              <h4 class="activity-item-title">{{ activity.title }}</h4>
              <p class="activity-item-content">{{ activity.content }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-card>

    <!-- 弹窗组件 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentItem ? currentItem.title : ''"
      width="50%"
      center>
      <div class="dialog-content">
        <p v-if="currentItem">{{ currentItem.description }}</p>
        <div class="dialog-stats">
          <el-statistic 
            v-if="currentItem" 
            :value="getStatisticValue(currentItem.status)" 
            :title="getStatisticTitle(currentItem.status)" />
        </div>
        <div class="dialog-features">
          <h4>平台特色功能：</h4>
          <ul>
            <li>AI智能分类准确率高达98%</li>
            <li>支持多维度知识关联分析</li>
            <li>实时知识更新与同步</li>
            <li>智能推荐相关知识点</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="dialogVisible = false">开始使用</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import {
  Document,
  Collection,
  DataAnalysis,
  Setting,
  User,
  Files,
  Search,
  Connection
} from '@element-plus/icons-vue';

const dashboardItems = ref([
  {
    title: '知识文档',
    description: '企业各类文档资料管理',
    icon: Document,
    status: '12,345 篇',
    statusType: 'success',
    path: '/documents'
  },
  {
    title: '智能分类',
    description: 'AI自动分类企业知识',
    icon: Collection,
    status: '98% 准确率',
    statusType: 'warning',
    path: '/classification'
  },
  {
    title: '数据分析',
    description: '知识使用情况分析',
    icon: DataAnalysis,
    status: '7 个报表',
    statusType: '',
    path: '/analytics'
  },
  {
    title: '知识图谱',
    description: '企业知识关联网络',
    icon: Connection,
    status: '1,234 节点',
    statusType: 'info',
    path: '/knowledge-graph'
  },
  {
    title: '搜索中心',
    description: '快速查找企业知识',
    icon: Search,
    status: '0.2s 响应',
    statusType: 'success',
    path: '/search'
  },
  {
    title: '系统设置',
    description: '平台参数配置',
    icon: Setting,
    status: '3 项待更新',
    statusType: 'danger',
    path: '/settings'
  }
]);

const activities = ref([
  {
    title: '知识文档更新',
    content: '新增了125篇技术文档到知识库',
    timestamp: '2023-05-15 14:30'
  },
  {
    title: '分类模型训练',
    content: '完成了新一轮AI分类模型训练，准确率提升2%',
    timestamp: '2023-05-14 09:15'
  },
  {
    title: '系统维护',
    content: '完成了系统定期维护，优化了搜索性能',
    timestamp: '2023-05-12 18:00'
  },
  {
    title: '新员工培训',
    content: '为市场部新员工进行了知识平台使用培训',
    timestamp: '2023-05-10 10:00'
  }
]);

const dialogVisible = ref(false);
const currentItem = ref(null);

const handleCardClick = (item) => {
  currentItem.value = item;
  dialogVisible.value = true;
};

const getStatisticValue = (status) => {
  const match = status.match(/\d+([.,]\d+)?/);
  return match ? parseFloat(match[0].replace(',', '')) : 0;
};

const getStatisticTitle = (status) => {
  if (status.includes('篇')) return '文档数量';
  if (status.includes('%')) return '分类准确率';
  if (status.includes('报表')) return '分析报表';
  if (status.includes('节点')) return '知识节点';
  if (status.includes('s')) return '响应速度';
  if (status.includes('项')) return '待更新项';
  return '统计指标';
};
</script>

<style lang="scss" scoped>

@use './Integration.scss';

</style>
    