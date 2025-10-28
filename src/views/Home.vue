<template>
  <div class="home-container">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="color: #409EFF;">
                <i class="el-icon-document"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">128</div>
                <div class="stat-label">总申报项目</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="color: #67C23A;">
                <i class="el-icon-check"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">86</div>
                <div class="stat-label">审批通过</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="color: #E6A23C;">
                <i class="el-icon-time"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">32</div>
                <div class="stat-label">审批中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="color: #F56C6C;">
                <i class="el-icon-warning"></i>
              </div>
              <div class="stat-info">
                <div class="stat-value">10</div>
                <div class="stat-label">风险预警</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 项目进度图表 -->
    <el-card class="chart-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>项目进度分布</span>
          <el-button type="text" @click="showProgressDetail">查看详情</el-button>
        </div>
      </template>
      <div class="chart-container">
        <div class="progress-chart">
          <div class="progress-item" v-for="(item, index) in progressData" :key="index">
            <div class="progress-info">
              <span class="progress-label">{{ item.label }}</span>
              <span class="progress-value">{{ item.value }}个</span>
            </div>
            <el-progress 
              :percentage="item.percentage" 
              :color="item.color" 
              :show-text="false" 
              :stroke-width="12">
            </el-progress>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 项目列表 -->
    <el-card class="project-list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>最近申报项目</span>
          <div>
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索项目" 
              prefix-icon="el-icon-search" 
              style="width: 200px; margin-right: 10px;">
            </el-input>
            <el-button type="primary" icon="el-icon-refresh" @click="refreshList">刷新</el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="paginatedProjects" 
        style="width: 100%" 
        v-loading="loading">
        <el-table-column prop="name" label="项目名称" min-width="200"></el-table-column>
        <el-table-column prop="applicant" label="申报单位" width="150"></el-table-column>
        <el-table-column prop="date" label="申报日期" width="120"></el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)" 
              size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.progress" 
              :color="getProgressColor(row.progress)" 
              :show-text="false" 
              :stroke-width="12">
            </el-progress>
            <span style="margin-left: 8px; font-size: 12px;">{{ row.progress }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="text" size="small" @click="viewDetails(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="filteredProjects.length"
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange">
        </el-pagination>
      </div>
    </el-card>

    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentProject ? currentProject.name : '项目详情'"
      width="50%"
      center>
      <div v-if="currentProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">{{ currentProject.name }}</el-descriptions-item>
          <el-descriptions-item label="申报单位">{{ currentProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申报日期">{{ currentProject.date }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentProject.status)">{{ currentProject.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="项目进度" :span="2">
            <el-progress :percentage="currentProject.progress" :color="getProgressColor(currentProject.progress)" />
          </el-descriptions-item>
          <el-descriptions-item label="项目描述" :span="2">
            {{ getProjectDescription(currentProject) }}
          </el-descriptions-item>
          <el-descriptions-item label="风险评估" :span="2" v-if="currentProject.progress < 30 || currentProject.status === '风险预警'">
            <el-alert
              title="项目存在风险"
              type="warning"
              description="此项目进度较慢或存在审批风险，请密切关注并及时跟进。"
              show-icon>
            </el-alert>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleProjectAction">
            {{ currentProject && currentProject.status === '风险预警' ? '处理风险' : '跟进项目' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 进度详情弹窗 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="项目进度分布详情"
      width="60%"
      center>
      <div class="progress-detail">
        <el-table :data="progressData" style="width: 100%">
          <el-table-column prop="label" label="进度阶段" width="120" />
          <el-table-column prop="value" label="项目数量" width="100" />
          <el-table-column prop="percentage" label="占比" width="100">
            <template #default="{ row }">{{ row.percentage }}%</template>
          </el-table-column>
          <el-table-column label="进度条">
            <template #default="{ row }">
              <el-progress :percentage="row.percentage" :color="row.color" />
            </template>
          </el-table-column>
        </el-table>
        
        <div class="progress-summary">
          <h4>进度分析</h4>
          <p>当前共有 {{ totalProjectsCount }} 个项目处于不同审批阶段。</p>
          <p>其中 <span class="highlight">{{ getProgressCount('已完成') }} 个项目已完成审批</span>，占总数的 {{ getProgressPercentage('已完成') }}%。</p>
          <p><span class="warning">{{ getProgressCount('风险预警') }} 个项目存在风险</span>，需要重点关注和处理。</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 分页数据
const currentPage = ref(1)
const pageSize = ref(5)

// 弹窗控制
const detailDialogVisible = ref(false)
const progressDialogVisible = ref(false)
const currentProject = ref(null)

// 进度数据
const progressData = ref([
  { label: '申报中', value: 42, percentage: 33, color: '#409EFF' },
  { label: '初审中', value: 28, percentage: 22, color: '#E6A23C' },
  { label: '专家评审', value: 18, percentage: 14, color: '#909399' },
  { label: '终审中', value: 12, percentage: 9, color: '#67C23A' },
  { label: '已完成', value: 28, percentage: 22, color: '#67C23A' }
])

// 项目数据
const projects = ref([
  { 
    id: 1, 
    name: '智慧城市大数据平台建设', 
    applicant: '科技信息局', 
    date: '2023-06-15', 
    status: '初审中', 
    progress: 30,
    description: '构建城市级大数据平台，整合各部门数据资源，提升城市管理智能化水平。'
  },
  { 
    id: 2, 
    name: '新能源汽车产业园区规划', 
    applicant: '经济发展局', 
    date: '2023-06-12', 
    status: '专家评审', 
    progress: 60,
    description: '规划建设新能源汽车产业园区，吸引产业链上下游企业集聚发展。'
  },
  { 
    id: 3, 
    name: '生态环境保护监测系统', 
    applicant: '环境保护局', 
    date: '2023-06-10', 
    status: '申报中', 
    progress: 20,
    description: '建立全域生态环境监测网络，实时监控环境质量变化趋势。'
  },
  { 
    id: 4, 
    name: '乡村振兴示范项目', 
    applicant: '农业农村局', 
    date: '2023-06-08', 
    status: '终审中', 
    progress: 80,
    description: '选取典型乡村开展综合示范建设，探索乡村振兴可复制推广模式。'
  },
  { 
    id: 5, 
    name: '文化创意产业发展计划', 
    applicant: '文化广电局', 
    date: '2023-06-05', 
    status: '已完成', 
    progress: 100,
    description: '支持文化创意产业发展，培育新型文化业态和文化消费模式。'
  },
  { 
    id: 6, 
    name: '医疗卫生服务体系升级', 
    applicant: '卫生健康局', 
    date: '2023-06-03', 
    status: '初审中', 
    progress: 40,
    description: '升级医疗卫生服务基础设施，提高医疗服务能力和水平。'
  },
  { 
    id: 7, 
    name: '智慧交通管理系统', 
    applicant: '交通运输局', 
    date: '2023-06-01', 
    status: '专家评审', 
    progress: 70,
    description: '利用物联网、大数据技术构建智慧交通管理系统，缓解城市交通拥堵。'
  },
  { 
    id: 8, 
    name: '人才引进与培养计划', 
    applicant: '人力资源和社会保障局', 
    date: '2023-05-28', 
    status: '申报中', 
    progress: 15,
    description: '实施高层次人才引进和本土人才培养计划，强化人才支撑。'
  },
  { 
    id: 9, 
    name: '老旧小区改造工程', 
    applicant: '住房和城乡建设局', 
    date: '2023-05-25', 
    status: '终审中', 
    progress: 90,
    description: '对城区老旧小区进行综合改造，改善居民居住环境和生活质量。'
  },
  { 
    id: 10, 
    name: '全民健身设施建设', 
    applicant: '体育局', 
    date: '2023-05-22', 
    status: '已完成', 
    progress: 100,
    description: '建设全民健身设施网络，满足人民群众日益增长的健身需求。'
  }
])

// 过滤后的项目列表
const filteredProjects = computed(() => {
  if (!searchKeyword.value) {
    return projects.value
  }
  
  return projects.value.filter(project => 
    project.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
    project.applicant.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 分页后的项目列表
const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProjects.value.slice(start, end)
})

// 计算总项目数
const totalProjectsCount = computed(() => {
  return progressData.value.reduce((total, item) => total + item.value, 0)
})

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    '申报中': 'info',
    '初审中': 'warning',
    '专家评审': '',
    '终审中': 'success',
    '已完成': 'success',
    '风险预警': 'danger'
  }
  return statusMap[status] || ''
}

// 获取进度条颜色
const getProgressColor = (progress) => {
  if (progress < 30) {
    return '#F56C6C'
  } else if (progress < 70) {
    return '#E6A23C'
  } else {
    return '#67C23A'
  }
}

// 获取项目描述
const getProjectDescription = (project) => {
  return project.description || '暂无详细项目描述信息。'
}

// 获取特定进度阶段的项目数量
const getProgressCount = (label) => {
  const item = progressData.value.find(item => item.label === label)
  return item ? item.value : 0
}

// 获取特定进度阶段的百分比
const getProgressPercentage = (label) => {
  const item = progressData.value.find(item => item.label === label)
  return item ? item.percentage : 0
}

// 查看详情
const viewDetails = (project) => {
  currentProject.value = project
  detailDialogVisible.value = true
}

// 显示进度详情
const showProgressDetail = () => {
  progressDialogVisible.value = true
}

// 处理项目操作
const handleProjectAction = () => {
  if (currentProject.value && currentProject.value.status === '风险预警') {
    ElMessageBox.confirm(
      '确定要处理此项目的风险吗？系统将通知相关负责人跟进。',
      '处理风险提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      ElMessage.success('已通知相关负责人处理项目风险')
      detailDialogVisible.value = false
    }).catch(() => {
      // 取消操作
    })
  } else {
    ElMessage.info('已记录项目跟进需求，将安排专人联系')
    detailDialogVisible.value = false
  }
}

// 刷新列表
const refreshList = () => {
  loading.value = true
  // 模拟数据刷新
  setTimeout(() => {
    loading.value = false
    ElMessage.success('数据已刷新')
  }, 800)
}

// 处理分页变化
const handlePageChange = (page) => {
  currentPage.value = page
}

// 初始化数据
onMounted(() => {
  // 初始化代码
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>