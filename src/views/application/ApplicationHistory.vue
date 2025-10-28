<template>
  <div class="application-history-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>项目申报进度监控</h1>
      <p class="subtitle">实时跟踪项目申报进度，及时预警潜在风险</p>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card total-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total">
                <span class="icon-document">📋</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">128</div>
                <div class="stat-label">总申报项目</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card processing-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon processing">
                <span class="icon-time">⏱️</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">42</div>
                <div class="stat-label">审批中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card approved-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon approved">
                <span class="icon-success">✅</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">76</div>
                <div class="stat-label">已通过</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card risk-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon risk">
                <span class="icon-warning">⚠️</span>
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

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-card shadow="never" class="filter-card">
        <el-form :model="filterForm" label-width="80px">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="项目名称">
                <el-input
                  v-model="filterForm.keyword"
                  placeholder="请输入项目名称"
                  clearable
                  @clear="handleSearch"
                >
                  <template #append>
                    <el-button @click="handleSearch">
                      <span class="search-icon">🔍</span>
                    </el-button>
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="申报状态">
                <el-select
                  v-model="filterForm.status"
                  placeholder="请选择状态"
                  clearable
                  @change="handleSearch"
                >
                  <el-option
                    v-for="item in statusOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="申报日期">
                <el-date-picker
                  v-model="filterForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="YYYY-MM-DD"
                  @change="handleSearch"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-card>
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <el-card shadow="never" class="project-card">
        <template #header>
          <div class="table-header">
            <span>项目申报列表</span>
            <el-button type="primary" @click="refreshList" class="refresh-btn">
              <span class="refresh-icon">🔄</span>刷新
            </el-button>
          </div>
        </template>

        <el-table
          :data="projectList"
          v-loading="loading"
          style="width: 100%"
          :default-sort="{ prop: 'createTime', order: 'descending' }"
          class="project-table"
        >
          <el-table-column prop="projectName" label="项目名称" min-width="200" />
          <el-table-column prop="applicant" label="申报人" width="120" />
          <el-table-column prop="department" label="所属部门" width="120" />
          <el-table-column prop="createTime" label="申报时间" width="150" sortable />
          <el-table-column prop="deadline" label="截止日期" width="150" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                effect="light"
                class="status-tag"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="progress" label="进度" width="120">
            <template #default="{ row }">
              <div class="progress-container">
                <el-progress
                  :percentage="row.progress"
                  :color="getProgressColor(row.progress)"
                  :show-text="false"
                  class="custom-progress"
                />
                <span class="progress-text">{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="viewDetails(row)"
                class="detail-btn"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            class="custom-pagination"
          />
        </div>
      </el-card>
    </div>

    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentProject ? currentProject.projectName + ' - 项目详情' : '项目详情'"
      width="600px"
      class="detail-dialog"
    >
      <div v-if="currentProject" class="detail-content">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="项目名称">{{ currentProject.projectName }}</el-descriptions-item>
          <el-descriptions-item label="申报人">{{ currentProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentProject.department }}</el-descriptions-item>
          <el-descriptions-item label="申报时间">{{ currentProject.createTime }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentProject.deadline }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(currentProject.status)" effect="light">
              {{ getStatusText(currentProject.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="进度">
            <div class="detail-progress">
              <el-progress 
                :percentage="currentProject.progress" 
                :color="getProgressColor(currentProject.progress)" 
                :text-inside="true" 
                :stroke-width="20"
              />
              <span class="progress-percent">{{ currentProject.progress }}%</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="项目描述" v-if="currentProject.description">
            {{ currentProject.description }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="risk-assessment" v-if="currentProject.progress < 70 && calculateDaysLeft(currentProject.deadline) < 7">
          <el-alert
            title="风险预警"
            type="warning"
            :closable="false"
            description="该项目进度滞后，距离截止日期仅剩有限时间，存在无法按时完成的风险。"
            show-icon
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleFollowProject" v-if="currentProject && currentProject.status !== 'completed'">
            关注项目
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 风险预警弹窗 -->
    <el-dialog
      v-model="riskDialogVisible"
      title="风险预警提示"
      width="500px"
      class="risk-dialog"
    >
      <div class="risk-dialog-content">
        <el-alert
          title="检测到项目进度异常"
          type="warning"
          :closable="false"
          description="当前项目进度滞后，可能存在无法按时完成的风险，请及时处理。"
          show-icon
        />
        <div class="risk-details">
          <h4>风险项目：{{ currentProject?.projectName }}</h4>
          <p>申报人：{{ currentProject?.applicant }}</p>
          <p>所属部门：{{ currentProject?.department }}</p>
          <p>截止日期：{{ currentProject?.deadline }}</p>
          <p>剩余时间：{{ calculateDaysLeft(currentProject?.deadline) }}天</p>
          <p>当前进度：{{ currentProject?.progress }}%</p>
          <p class="risk-tip">建议：请尽快联系相关负责人，制定加速计划</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="riskDialogVisible = false">稍后处理</el-button>
          <el-button type="primary" @click="handleRiskConfirm">
            确认处理
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 状态选项
const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'completed', label: '已完成' }
]

// 筛选表单
const filterForm = reactive({
  keyword: '',
  status: '',
  dateRange: []
})

// 分页数据
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 对话框控制
const riskDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentProject = ref(null)

// 生成模拟数据
const generateMockData = () => {
  const projects = []
  const statuses = ['draft', 'submitted', 'reviewing', 'approved', 'rejected', 'completed']
  const departments = ['技术部', '市场部', '财务部', '人力资源部', '产品部', '运营部']
  const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
  const descriptions = [
    '新一代智能管理平台开发项目',
    '市场推广与品牌建设项目',
    '财务数字化转型升级项目',
    '人力资源优化与培训项目',
    '产品创新研发项目',
    '运营效率提升项目'
  ]
  
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const progress = status === 'completed' ? 100 : 
                    status === 'approved' ? 100 : 
                    status === 'rejected' ? 100 : 
                    Math.floor(Math.random() * 100)
    
    projects.push({
      id: i,
      projectName: `项目${i}：${['智能', '智慧', '数字', '创新', '科技'][i % 5]}${['平台', '系统', '应用', '解决方案', '服务'][i % 5]}`,
      applicant: names[i % 6],
      department: departments[i % 6],
      createTime: `2023-${String(Math.floor(i % 12) + 1).padStart(2, '0')}-${String(Math.floor(i % 28) + 1).padStart(2, '0')}`,
      deadline: `2023-${String(Math.floor((i % 12) + 2)).padStart(2, '0')}-${String(Math.floor(i % 28) + 1).padStart(2, '0')}`,
      status: status,
      progress: progress,
      description: descriptions[i % 6]
    })
  }
  
  return projects
}

// 项目列表数据
const mockData = generateMockData()
const projectList = ref([])

// 过滤后的项目列表
const filteredProjects = computed(() => {
  let result = [...mockData]
  
  if (filterForm.keyword) {
    result = result.filter(item => 
      item.projectName.includes(filterForm.keyword) ||
      item.applicant.includes(filterForm.keyword)
    )
  }
  
  if (filterForm.status) {
    result = result.filter(item => item.status === filterForm.status)
  }
  
  if (filterForm.dateRange && filterForm.dateRange.length === 2) {
    const [start, end] = filterForm.dateRange
    result = result.filter(item => 
      item.createTime >= start && item.createTime <= end
    )
  }
  
  return result
})

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    draft: 'info',
    submitted: '',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger',
    completed: 'success'
  }
  return types[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回',
    completed: '已完成'
  }
  return texts[status] || status
}

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) {
    return '#f56c6c'
  } else if (percentage < 70) {
    return '#e6a23c'
  } else {
    return '#67c23a'
  }
}

// 计算剩余天数
const calculateDaysLeft = (deadline) => {
  if (!deadline) return 0
  
  const today = new Date()
  const targetDate = new Date(deadline)
  const timeDiff = targetDate.getTime() - today.getTime()
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
  
  return daysDiff > 0 ? daysDiff : 0
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 刷新列表
const refreshList = () => {
  loading.value = true
  // 模拟API请求
  setTimeout(() => {
    loadData()
    ElMessage.success('数据已刷新')
  }, 800)
}

// 加载数据
const loadData = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    
    projectList.value = filteredProjects.value.slice(start, end)
    total.value = filteredProjects.value.length
    loading.value = false
    
    // 模拟风险预警
    checkRiskProjects()
  }, 500)
}

// 检查风险项目
const checkRiskProjects = () => {
  const today = new Date()
  const riskProjects = mockData.filter(project => {
    const deadline = new Date(project.deadline)
    const timeDiff = deadline.getTime() - today.getTime()
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24))
    
    return daysDiff < 7 && project.progress < 70 && project.status !== 'completed'
  })
  
  if (riskProjects.length > 0 && Math.random() > 0.5) {
    currentProject.value = riskProjects[0]
    riskDialogVisible.value = true
  }
}

// 查看详情
const viewDetails = (row) => {
  currentProject.value = row
  detailDialogVisible.value = true
}

// 处理风险确认
const handleRiskConfirm = () => {
  riskDialogVisible.value = false
  ElMessage.success('已标记风险项目为处理中，相关人员将收到通知')
  
  // 模拟处理风险项目的操作
  setTimeout(() => {
    ElMessage.info('已为您创建风险处理任务，请及时跟进')
  }, 1000)
}

// 关注项目
const handleFollowProject = () => {
  if (currentProject.value) {
    ElMessage.success(`已关注项目: ${currentProject.value.projectName}`)
    detailDialogVisible.value = false
  }
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  loadData()
}

// 当前页改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  loadData()
}

// 初始化加载数据
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>

@use './ApplicationHistory.scss';

</style>