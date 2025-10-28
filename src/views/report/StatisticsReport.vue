<template>
  <div class="statistics-report">
    <div class="header">
      <h1>航清智能项目实时追踪及进度提醒软件</h1>
      <p class="subtitle">实时监控项目申报状态，及时发现潜在风险</p>
    </div>
    
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
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
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon processing">
                <span class="icon-time">⏳</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">56</div>
                <div class="stat-label">进行中</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon completed">
                <span class="icon-success">✅</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">42</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <span class="icon-warning">⚠️</span>
              </div>
              <div class="stat-info">
                <div class="stat-value">30</div>
                <div class="stat-label">风险项目</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <span>项目状态分布</span>
                <el-select v-model="chartDateRange" size="small" style="width: 120px">
                  <el-option label="近一周" value="week"></el-option>
                  <el-option label="近一月" value="month"></el-option>
                  <el-option label="近一年" value="year"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="pie-chart-placeholder">
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="color-dot waiting"></span>
                    <span>待审核: 32</span>
                  </div>
                  <div class="legend-item">
                    <span class="color-dot processing"></span>
                    <span>审核中: 56</span>
                  </div>
                  <div class="legend-item">
                    <span class="color-dot approved"></span>
                    <span>已通过: 42</span>
                  </div>
                  <div class="legend-item">
                    <span class="color-dot rejected"></span>
                    <span>已驳回: 18</span>
                  </div>
                </div>
                <div class="pie-visual">
                  <div class="pie-slice waiting"></div>
                  <div class="pie-slice processing"></div>
                  <div class="pie-slice approved"></div>
                  <div class="pie-slice rejected"></div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <span>风险项目趋势</span>
                <el-select v-model="trendDateRange" size="small" style="width: 120px">
                  <el-option label="近一周" value="week"></el-option>
                  <el-option label="近一月" value="month"></el-option>
                  <el-option label="近一年" value="year"></el-option>
                </el-select>
              </div>
            </template>
            <div class="chart-container">
              <div class="bar-chart-placeholder">
                <div class="bar-chart">
                  <div class="bar-container">
                    <div 
                      v-for="(item, index) in riskTrendData" 
                      :key="index" 
                      class="bar-item"
                    >
                      <div 
                        class="bar" 
                        :style="{ height: item.value * 2 + 'px' }"
                        :class="{ high: item.value > 15, medium: item.value > 10 && item.value <= 15, low: item.value <= 10 }"
                      ></div>
                      <div class="bar-label">{{ item.month }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="recent-projects">
      <el-card shadow="never">
        <template #header>
          <div class="table-header">
            <span>最近申报项目</span>
            <div class="header-actions">
              <el-input 
                v-model="searchKeyword" 
                placeholder="搜索项目" 
                size="small" 
                style="width: 200px; margin-right: 10px"
                @input="handleSearch"
              >
                <template #suffix>
                  <span class="search-icon">🔍</span>
                </template>
              </el-input>
              <el-select 
                v-model="filterStatus" 
                placeholder="状态筛选" 
                size="small" 
                style="width: 120px"
                @change="handleFilter"
              >
                <el-option label="全部" value=""></el-option>
                <el-option label="待审核" value="waiting"></el-option>
                <el-option label="审核中" value="processing"></el-option>
                <el-option label="已通过" value="approved"></el-option>
                <el-option label="已驳回" value="rejected"></el-option>
              </el-select>
            </div>
          </div>
        </template>
        
        <el-table 
          :data="paginatedProjects" 
          style="width: 100%"
          v-loading="loading"
        >
          <el-table-column prop="name" label="项目名称" min-width="200">
            <template #default="{ row }">
              <div class="project-name">
                <span class="name-text">{{ row.name }}</span>
                <el-tag 
                  v-if="row.riskLevel" 
                  :type="row.riskLevel === 'high' ? 'danger' : row.riskLevel === 'medium' ? 'warning' : 'success'" 
                  size="small"
                >
                  {{ row.riskLevel === 'high' ? '高风险' : row.riskLevel === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="applicant" label="申报人" width="120"></el-table-column>
          <el-table-column prop="department" label="部门" width="120"></el-table-column>
          <el-table-column prop="submitDate" label="提交日期" width="120"></el-table-column>
          <el-table-column prop="deadline" label="截止日期" width="120"></el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag 
                :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : row.status === 'processing' ? 'warning' : 'info'"
                size="small"
              >
                {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已驳回' : row.status === 'processing' ? '审核中' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="进度" width="200">
            <template #default="{ row }">
              <el-progress 
                :percentage="row.progress" 
                :color="row.progress === 100 ? '#67c23a' : '#409eff'"
                :stroke-width="12"
                :format="formatProgress"
              ></el-progress>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button type="text" size="small" @click="openProjectDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredProjects.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="currentProject ? currentProject.name : '项目详情'"
      width="60%"
      :before-close="handleCloseDialog"
    >
      <div v-if="currentProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">{{ currentProject.name }}</el-descriptions-item>
          <el-descriptions-item label="申报人">{{ currentProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="所属部门">{{ currentProject.department }}</el-descriptions-item>
          <el-descriptions-item label="提交日期">{{ currentProject.submitDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentProject.deadline }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag 
              :type="currentProject.status === 'approved' ? 'success' : currentProject.status === 'rejected' ? 'danger' : currentProject.status === 'processing' ? 'warning' : 'info'"
            >
              {{ currentProject.status === 'approved' ? '已通过' : currentProject.status === 'rejected' ? '已驳回' : currentProject.status === 'processing' ? '审核中' : '待审核' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag 
              :type="currentProject.riskLevel === 'high' ? 'danger' : currentProject.riskLevel === 'medium' ? 'warning' : 'success'"
            >
              {{ currentProject.riskLevel === 'high' ? '高风险' : currentProject.riskLevel === 'medium' ? '中风险' : '低风险' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="项目进度" :span="2">
            <el-progress 
              :percentage="currentProject.progress" 
              :color="currentProject.progress === 100 ? '#67c23a' : '#409eff'"
              :stroke-width="16"
              :format="formatProgress"
            />
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="risk-warning" v-if="currentProject.riskLevel === 'high' || currentProject.riskLevel === 'medium'">
          <h3>⚠️ 风险预警</h3>
          <p v-if="currentProject.riskLevel === 'high'">
            该项目被标记为<strong>高风险</strong>，可能存在进度滞后、资源不足或审批受阻等问题，建议立即关注并采取应对措施。
          </p>
          <p v-else>
            该项目被标记为<strong>中风险</strong>，需要关注项目进展，防止风险升级。
          </p>
        </div>
        
        <div class="action-suggestions">
          <h3>建议操作</h3>
          <ul>
            <li v-if="currentProject.status === 'waiting'">联系相关部门加快审批流程</li>
            <li v-if="currentProject.progress < 50 && daysRemaining < 14">项目进度较慢，建议增加资源投入</li>
            <li v-if="currentProject.riskLevel === 'high'">召开项目风险评估会议，制定应对策略</li>
            <li>定期更新项目进度，确保信息透明</li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="handleFollowUp" v-if="currentProject && (currentProject.riskLevel === 'high' || currentProject.riskLevel === 'medium')">
            跟踪处理
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 假数据
const projectsData = ref([
  { id: 1, name: '人工智能技术研究项目', applicant: '张三', department: '研发部', submitDate: '2023-06-15', deadline: '2023-12-15', status: 'processing', progress: 65, riskLevel: 'medium' },
  { id: 2, name: '市场推广计划', applicant: '李四', department: '市场部', submitDate: '2023-07-02', deadline: '2023-09-30', status: 'waiting', progress: 20, riskLevel: 'low' },
  { id: 3, name: '新产品开发项目', applicant: '王五', department: '产品部', submitDate: '2023-05-20', deadline: '2023-11-20', status: 'approved', progress: 100, riskLevel: 'low' },
  { id: 4, name: '客户关系管理系统升级', applicant: '赵六', department: '技术部', submitDate: '2023-07-10', deadline: '2023-08-31', status: 'processing', progress: 40, riskLevel: 'high' },
  { id: 5, name: '财务数据分析平台', applicant: '钱七', department: '财务部', submitDate: '2023-06-28', deadline: '2023-10-15', status: 'rejected', progress: 0, riskLevel: 'medium' },
  { id: 6, name: '员工培训体系优化', applicant: '孙八', department: '人力资源部', submitDate: '2023-07-05', deadline: '2023-09-05', status: 'processing', progress: 30, riskLevel: 'low' },
  { id: 7, name: '供应链管理系统', applicant: '周九', department: '运营部', submitDate: '2023-06-10', deadline: '2023-12-10', status: 'processing', progress: 75, riskLevel: 'medium' },
  { id: 8, name: '品牌形象升级项目', applicant: '吴十', department: '品牌部', submitDate: '2023-07-12', deadline: '2023-11-30', status: 'waiting', progress: 10, riskLevel: 'low' },
  { id: 9, name: '数据中心扩容', applicant: '郑十一', department: 'IT部', submitDate: '2023-05-15', deadline: '2023-08-31', status: 'processing', progress: 85, riskLevel: 'high' },
  { id: 10, name: '移动应用开发', applicant: '陈十二', department: '移动开发部', submitDate: '2023-07-01', deadline: '2023-10-01', status: 'processing', progress: 50, riskLevel: 'medium' }
])

const riskTrendData = ref([
  { month: '1月', value: 8 },
  { month: '2月', value: 12 },
  { month: '3月', value: 9 },
  { month: '4月', value: 15 },
  { month: '5月', value: 18 },
  { month: '6月', value: 22 },
  { month: '7月', value: 30 }
])

// 搜索和筛选
const searchKeyword = ref('')
const filterStatus = ref('')
const loading = ref(false)

// 分页
const currentPage = ref(1)
const pageSize = ref(10)

// 图表日期范围
const chartDateRange = ref('month')
const trendDateRange = ref('month')

// 详情弹窗相关
const detailDialogVisible = ref(false)
const currentProject = ref(null)
const daysRemaining = ref(0)

// 计算属性
const filteredProjects = computed(() => {
  let result = projectsData.value
  
  // 根据关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) || 
      item.applicant.toLowerCase().includes(keyword) ||
      item.department.toLowerCase().includes(keyword)
    )
  }
  
  // 根据状态筛选
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  return result
})

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProjects.value.slice(start, end)
})

// 方法
const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    currentPage.value = 1
    loading.value = false
  }, 300)
}

const handleFilter = () => {
  loading.value = true
  setTimeout(() => {
    currentPage.value = 1
    loading.value = false
  }, 300)
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const openProjectDetail = (project) => {
  currentProject.value = project
  // 计算剩余天数（简单模拟）
  const deadline = new Date(project.deadline)
  const today = new Date()
  daysRemaining.value = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
  detailDialogVisible.value = true
}

const handleCloseDialog = (done) => {
  done()
}

const handleFollowUp = () => {
  ElMessage.success('已启动风险项目跟踪处理流程')
  detailDialogVisible.value = false
}

const formatProgress = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`
}

// 模拟数据加载
onMounted(() => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './StatisticsReport.scss';

</style>