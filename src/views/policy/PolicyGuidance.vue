<template>
  <div class="policy-guidance">
    <div class="header-section">
      <h1 class="page-title">政策指导与申报进度监控</h1>
      <p class="page-subtitle">实时跟踪项目申报进度，智能预警潜在风险</p>
    </div>
    
    <div class="dashboard-grid">
      <!-- 统计卡片区域 -->
      <div class="stats-cards">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #e6f7ff;">
                  <span class="custom-icon document-icon"></span>
                </div>
                <div class="stat-info">
                  <h3>128</h3>
                  <p>申报中项目</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #f6ffed;">
                  <span class="custom-icon check-icon"></span>
                </div>
                <div class="stat-info">
                  <h3>56</h3>
                  <p>已通过项目</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #fff7e6;">
                  <span class="custom-icon time-icon"></span>
                </div>
                <div class="stat-info">
                  <h3>42</h3>
                  <p>待审核项目</p>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :xs="24" :sm="12" :md="6">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-content">
                <div class="stat-icon" style="background-color: #fff2f0;">
                  <span class="custom-icon warning-icon"></span>
                </div>
                <div class="stat-info">
                  <h3>14</h3>
                  <p>风险预警项目</p>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 搜索和筛选区域 -->
      <el-card class="filter-card">
        <el-form :model="filterForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="项目名称">
                <el-input 
                  v-model="filterForm.keyword" 
                  placeholder="请输入项目名称" 
                  clearable
                  @clear="handleSearch"
                  @keyup.enter="handleSearch">
                  <template #append>
                    <el-button @click="handleSearch">
                      <span class="custom-icon search-icon"></span>
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="申报状态">
                <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
                  <el-option label="申报中" value="1"></el-option>
                  <el-option label="待审核" value="2"></el-option>
                  <el-option label="已通过" value="3"></el-option>
                  <el-option label="未通过" value="4"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="风险等级">
                <el-select v-model="filterForm.riskLevel" placeholder="请选择风险等级" clearable>
                  <el-option label="低风险" value="low"></el-option>
                  <el-option label="中风险" value="medium"></el-option>
                  <el-option label="高风险" value="high"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
      
      <!-- 项目列表 -->
      <el-card class="project-list-card">
        <template #header>
          <div class="card-header">
            <span>项目申报列表</span>
            <el-button type="primary" @click="fetchProjects">
              <span class="custom-icon refresh-icon"></span>
              刷新
            </el-button>
          </div>
        </template>
        
        <el-table 
          :data="projectList" 
          v-loading="loading"
          style="width: 100%">
          <el-table-column prop="name" label="项目名称" min-width="200">
            <template #default="{ row }">
              <div class="project-name">
                <span class="name-text">{{ row.name }}</span>
                <el-tag 
                  v-if="row.riskLevel === 'high'" 
                  size="small" 
                  type="danger">
                  高风险
                </el-tag>
                <el-tag 
                  v-else-if="row.riskLevel === 'medium'" 
                  size="small" 
                  type="warning">
                  中风险
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="applicant" label="申报单位" width="150" />
          <el-table-column prop="declareDate" label="申报日期" width="120" />
          <el-table-column prop="deadline" label="截止日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="getStatusType(row.status)" 
                size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="150">
            <template #default="{ row }">
              <div class="progress-container">
                <el-progress 
                  :percentage="row.progress" 
                  :color="getProgressColor(row.progress)" 
                  :show-text="false" />
                <span class="progress-text">{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button 
                type="text" 
                size="small" 
                @click="viewDetails(row)">
                查看详情
              </el-button>
              <el-button 
                v-if="row.riskLevel === 'high' || row.riskLevel === 'medium'"
                type="text" 
                size="small" 
                @click="showRiskWarning(row)"
                style="color: #ff4d4f;">
                风险预警
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
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>
    
    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentProject ? '项目详情 - ' + currentProject.name : '项目详情'"
      width="60%"
      center>
      <div v-if="currentProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">{{ currentProject.name }}</el-descriptions-item>
          <el-descriptions-item label="申报单位">{{ currentProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申报日期">{{ currentProject.declareDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentProject.deadline }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentProject.status)">
              {{ getStatusText(currentProject.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag 
              v-if="currentProject.riskLevel === 'high'" 
              type="danger">
              高风险
            </el-tag>
            <el-tag 
              v-else-if="currentProject.riskLevel === 'medium'" 
              type="warning">
              中风险
            </el-tag>
            <el-tag 
              v-else 
              type="success">
              低风险
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完成进度" :span="2">
            <div class="detail-progress">
              <el-progress 
                :percentage="currentProject.progress" 
                :color="getProgressColor(currentProject.progress)" 
                :text-inside="true" 
                :stroke-width="20" />
            </div>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="timeline-section">
          <h3>申报进度时间线</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in projectTimeline"
              :key="index"
              :timestamp="activity.timestamp">
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="detailDialogVisible = false">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 风险预警弹窗 -->
    <el-dialog
      v-model="riskWarningDialogVisible"
      :title="currentProject ? '风险预警 - ' + currentProject.name : '风险预警'"
      width="50%"
      center>
      <div v-if="currentProject" class="risk-warning">
        <div class="warning-header" :class="currentProject.riskLevel">
          <span class="warning-icon"></span>
          <h3>
            {{ currentProject.riskLevel === 'high' ? '高风险预警' : '中风险提示' }}
          </h3>
        </div>
        
        <div class="warning-content">
          <p v-if="currentProject.riskLevel === 'high'">
            此项目存在高风险因素，可能影响申报成功率。建议立即采取应对措施：
          </p>
          <p v-else>
            此项目存在中等风险因素，需要关注并适时调整策略：
          </p>
          
          <ul>
            <li v-if="currentProject.progress < 30 && daysUntilDeadline < 7">
              申报进度缓慢，距离截止日期仅剩{{ daysUntilDeadline }}天
            </li>
            <li v-if="currentProject.status === '2' && daysInReview > 14">
              审核已进行{{ daysInReview }}天，超出正常审核周期
            </li>
            <li v-if="currentProject.riskLevel === 'high'">
              同类项目历史通过率较低（仅35%）
            </li>
            <li>需要补充关键材料：项目可行性分析报告</li>
          </ul>
          
          <div class="suggestions">
            <h4>处理建议：</h4>
            <ol>
              <li>加快材料准备进度，优先完成核心文档</li>
              <li>联系审核部门了解审核进度及要求</li>
              <li>参考类似成功案例优化申报材料</li>
              <li>设置风险监控节点，定期检查进度</li>
            </ol>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="riskWarningDialogVisible = false">稍后处理</el-button>
          <el-button type="primary" @click="handleRiskAction">
            {{ currentProject && currentProject.riskLevel === 'high' ? '立即处理' : '已了解' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'

// 假数据生成
const generateMockData = () => {
  const statuses = ['1', '2', '3', '4']
  const riskLevels = ['low', 'medium', 'high']
  const applicants = ['科技公司A', '研究院B', '大学C', '企业D', '机构E']
  const projects = []
  
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)]
    const progress = status === '3' ? 100 : 
                    status === '4' ? 100 : 
                    Math.floor(Math.random() * 100)
    
    projects.push({
      id: i,
      name: `科技创新项目${i}号`,
      applicant: applicants[Math.floor(Math.random() * applicants.length)],
      declareDate: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      deadline: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      status: status,
      progress: progress,
      riskLevel: riskLevel
    })
  }
  
  return projects
}

// 响应式数据
const loading = ref(false)
const projectList = ref([])
const allProjects = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const detailDialogVisible = ref(false)
const riskWarningDialogVisible = ref(false)
const currentProject = ref(null)
const projectTimeline = ref([
  { timestamp: '2023-06-01', content: '项目申报启动' },
  { timestamp: '2023-06-15', content: '初步材料提交' },
  { timestamp: '2023-06-20', content: '材料初审通过' },
  { timestamp: '2023-07-05', content: '进入专家评审阶段' }
])

const filterForm = reactive({
  keyword: '',
  status: '',
  riskLevel: ''
})

// 计算属性
const filteredProjects = computed(() => {
  let result = allProjects.value
  
  if (filterForm.keyword) {
    result = result.filter(item => 
      item.name.includes(filterForm.keyword) || 
      item.applicant.includes(filterForm.keyword)
    )
  }
  
  if (filterForm.status) {
    result = result.filter(item => item.status === filterForm.status)
  }
  
  if (filterForm.riskLevel) {
    result = result.filter(item => item.riskLevel === filterForm.riskLevel)
  }
  
  return result
})

const daysUntilDeadline = computed(() => {
  if (!currentProject.value) return 0
  // 简单模拟剩余天数
  return Math.max(0, Math.floor(Math.random() * 10))
})

const daysInReview = computed(() => {
  if (!currentProject.value || currentProject.value.status !== '2') return 0
  // 简单模拟审核天数
  return Math.floor(Math.random() * 30) + 1
})

// 方法
const fetchProjects = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    allProjects.value = generateMockData()
    total.value = filteredProjects.value.length
    updatePageData()
    loading.value = false
    ElMessage.success('数据加载成功')
  }, 800)
}

const updatePageData = () => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  projectList.value = filteredProjects.value.slice(start, end)
}

const handleSearch = () => {
  currentPage.value = 1
  total.value = filteredProjects.value.length
  updatePageData()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  updatePageData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  updatePageData()
}

const getStatusType = (status) => {
  const types = {
    '1': 'info',      // 申报中
    '2': 'warning',   // 待审核
    '3': 'success',   // 已通过
    '4': 'danger'     // 未通过
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    '1': '申报中',
    '2': '待审核',
    '3': '已通过',
    '4': '未通过'
  }
  return texts[status] || ''
}

const getProgressColor = (percentage) => {
  if (percentage < 30) {
    return '#f56c6c'
  } else if (percentage < 70) {
    return '#e6a23c'
  } else {
    return '#67c23a'
  }
}

const viewDetails = (project) => {
  currentProject.value = project
  detailDialogVisible.value = true
}

const showRiskWarning = (project) => {
  currentProject.value = project
  riskWarningDialogVisible.value = true
}

const handleRiskAction = () => {
  ElMessage.success('已记录您的处理意向，系统将持续监控此项目风险状态')
  riskWarningDialogVisible.value = false
}

// 生命周期
onMounted(() => {
  fetchProjects()
})

// 监听过滤条件变化
watchEffect(() => {
  total.value = filteredProjects.value.length
  updatePageData()
})
</script>

<style lang="scss" scoped>

@use './PolicyGuidance.scss';

</style>