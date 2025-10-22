
<template>
  <div class="analysis-container">
    <div class="stats-grid">
      <el-card v-for="(stat, key) in stats" :key="key" class="stat-card" shadow="hover">
        <div class="stat-content">
          <h3 class="stat-title">{{ getStatLabel(key) }}</h3>
          <div class="stat-value-wrapper">
            <p class="stat-value">{{ formatStatValue(key, stat) }}</p>
            <span v-if="key === 'accuracy'" class="stat-unit">%</span>
          </div>
          <div class="stat-trend">
            <span v-if="key === 'totalDocuments'" class="trend-up">↑ 较上月增长12%</span>
            <span v-if="key === 'accuracy'" class="trend-up">↑ 准确率持续提升</span>
          </div>
        </div>
      </el-card>
    </div>

    <div class="chart-container">
      <div class="chart-card">
        <div class="chart-header">
          <h3>AI智能分类分析</h3>
          <el-tag type="success" effect="plain">实时更新</el-tag>
        </div>
        <div class="chart-placeholder">
          <div class="ai-icon">AI</div>
          <p class="chart-description">知识图谱智能分析展示区域</p>
          <p class="chart-tip">基于深度学习算法实时分析企业知识结构</p>
        </div>
      </div>
    </div>

    <div class="action-bar">
      <el-button 
        type="primary" 
        @click="refreshAnalysis" 
        :loading="refreshing"
        class="action-btn"
      >
        <span class="btn-text">智能刷新分析</span>
      </el-button>
      <el-button 
        type="success" 
        plain 
        @click="showDetails"
        class="action-btn"
      >
        <span class="btn-text">查看AI详细报告</span>
      </el-button>
    </div>

    <div class="last-updated">
      <el-text type="info">最后更新时间: {{ stats.lastUpdated || '2023-11-15 14:30:22' }}</el-text>
      <el-tooltip content="数据每30分钟自动更新" placement="top">
        <span class="update-tip">ⓘ</span>
      </el-tooltip>
    </div>

    <!-- 详细报告弹窗 -->
    <el-dialog
      v-model="detailVisible"
      title="AI智能分析报告"
      width="60%"
      center
    >
      <div class="report-content">
        <h4>企业知识分类概况</h4>
        <el-table :data="reportData" border style="width: 100%">
          <el-table-column prop="category" label="知识类别" width="180" />
          <el-table-column prop="count" label="文档数量" />
          <el-table-column prop="percentage" label="占比" />
          <el-table-column prop="trend" label="趋势" />
          <el-table-column label="操作">
            <template #default="scope">
              <el-button link type="primary" @click="showCategoryDetail(scope.row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="report-summary">
          <p>AI分析结论：企业知识结构完整度达到85%，建议加强技术文档分类管理。</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportReport">导出报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      totalDocuments: 1256,
      classified: 1024,
      unclassified: 232,
      accuracy: 92.5,
      lastUpdated: ''
    })
  }
});

const emit = defineEmits(['refresh']);

const refreshing = ref(false);
const detailVisible = ref(false);
const reportData = ref([
  { category: '技术文档', count: 456, percentage: '36.3%', trend: '↑ 增长' },
  { category: '产品手册', count: 312, percentage: '24.8%', trend: '→ 稳定' },
  { category: '市场分析', count: 198, percentage: '15.8%', trend: '↑ 增长' },
  { category: '财务报告', count: 145, percentage: '11.5%', trend: '→ 稳定' },
  { category: '未分类文档', count: 232, percentage: '18.5%', trend: '↓ 减少' }
]);

const getStatLabel = (key) => {
  const labels = {
    totalDocuments: '总文档数',
    classified: '已分类文档',
    unclassified: '未分类文档',
    accuracy: '分类准确率'
  };
  return labels[key] || key;
};

const formatStatValue = (key, value) => {
  if (key === 'accuracy') return value;
  return value.toLocaleString();
};

const refreshAnalysis = () => {
  refreshing.value = true;
  setTimeout(() => {
    emit('refresh');
    refreshing.value = false;
    ElMessage.success('智能分析已刷新');
  }, 1500);
};

const showDetails = () => {
  detailVisible.value = true;
};

const showCategoryDetail = (row) => {
  ElMessageBox.alert(
    `${row.category}类文档详细分析：<br><br>
    • 文档数量：${row.count}份<br>
    • 分类准确率：${row.category === '未分类文档' ? 'N/A' : '92%'}<br>
    • 最近更新：2023-11-15`,
    'AI分类详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  );
};

const exportReport = () => {
  ElMessage.success('报告导出成功，请查看下载目录');
  detailVisible.value = false;
};
</script>

<style lang="scss" scoped>

@use './Settings.scss';

</style>
