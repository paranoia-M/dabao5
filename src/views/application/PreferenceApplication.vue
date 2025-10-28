<template>
  <div class="preference-application">
    <div class="page-header">
      <h1>航清智能项目实时追踪及进度提醒软件</h1>
      <p>实时监控项目申报进度，及时发现潜在风险</p>
    </div>
    
    <div class="dashboard-grid">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stats-row">
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card total-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon total">
                <span class="custom-icon">📋</span>
              </div>
              <div class="stat-info">
                <h3>128</h3>
                <p>总申报项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card processing-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon processing">
                <span class="custom-icon">⏳</span>
              </div>
              <div class="stat-info">
                <h3>56</h3>
                <p>进行中项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card completed-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon completed">
                <span class="custom-icon">✅</span>
              </div>
              <div class="stat-info">
                <h3>42</h3>
                <p>已完成项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card warning-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon warning">
                <span class="custom-icon">⚠️</span>
              </div>
              <div class="stat-info">
                <h3>12</h3>
                <p>风险预警项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 搜索和筛选 -->
      <el-card class="filter-card">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="项目名称">
            <el-input v-model="filterForm.name" placeholder="请输入项目名称" clearable />
          </el-form-item>
          <el-form-item label="申报状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
              <el-option label="待审核" value="pending" />
              <el-option label="审核中" value="reviewing" />
              <el-option label="已通过" value="approved" />
              <el-option label="已拒绝" value="rejected" />
            </el-select>
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select v-model="filterForm.riskLevel" placeholder="请选择风险等级" clearable>
              <el-option label="低风险" value="low" />
              <el-option label="中风险" value="medium" />
              <el-option label="高风险" value="high" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <!-- 项目列表 -->
      <el-card>
        <div class="table-header">
          <h3>项目申报列表</h3>
          <el-button type="primary" @click="showCreateDialog">新建项目</el-button>
        </div>
        
        <el-table :data="projectList" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="项目ID" width="100" />
          <el-table-column prop="name" label="项目名称" min-width="180" />
          <el-table-column prop="applicant" label="申报人" width="120" />
          <el-table-column prop="department" label="申报部门" width="150" />
          <el-table-column label="申报日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.applicationDate) }}
            </template>
          </el-table-column>
          <el-table-column label="当前进度" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :color="getProgressColor(row.progress)" :show-text="false" />
              <span class="progress-text">{{ row.progress }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="风险等级" width="100">
            <template #default="{ row }">
              <el-tag :type="getRiskType(row.riskLevel)" size="small">
                {{ getRiskText(row.riskLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="mini" @click="handleView(row)">查看</el-button>
              <el-button size="mini" type="primary" @click="handleEdit(row)">编辑</el-button>
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
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 查看项目详情弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="项目详情"
      width="50%"
      :before-close="handleCloseViewDialog"
    >
      <div v-if="selectedProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目ID">{{ selectedProject.id }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ selectedProject.name }}</el-descriptions-item>
          <el-descriptions-item label="申报人">{{ selectedProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申报部门">{{ selectedProject.department }}</el-descriptions-item>
          <el-descriptions-item label="申报日期">{{ formatDate(selectedProject.applicationDate) }}</el-descriptions-item>
          <el-descriptions-item label="当前进度">
            <el-progress :percentage="selectedProject.progress" :color="getProgressColor(selectedProject.progress)" />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedProject.status)">
              {{ getStatusText(selectedProject.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskType(selectedProject.riskLevel)">
              {{ getRiskText(selectedProject.riskLevel) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="risk-analysis" v-if="selectedProject.riskLevel !== 'low'">
          <h4>风险分析</h4>
          <p v-if="selectedProject.riskLevel === 'medium'">
            该项目存在中等风险，建议加强进度监控，定期检查项目里程碑完成情况。
          </p>
          <p v-else-if="selectedProject.riskLevel === 'high'">
            <span class="high-risk-warning">⚠️ 高风险警告：</span>
            该项目存在高风险，进度严重滞后或存在重大技术难题，建议立即组织专家评审并制定应对措施。
          </p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑项目弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑项目"
      width="50%"
      :before-close="handleCloseEditDialog"
    >
      <el-form :model="editForm" label-width="100px" v-if="editForm">
        <el-form-item label="项目名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="申报人">
          <el-input v-model="editForm.applicant" />
        </el-form-item>
        <el-form-item label="申报部门">
          <el-select v-model="editForm.department" placeholder="请选择部门">
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="人力资源部" value="人力资源部" />
            <el-option label="研发中心" value="研发中心" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前进度">
          <el-slider v-model="editForm.progress" :marks="{0: '0%', 50: '50%', 100: '100%'}" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option label="待审核" value="pending" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="editForm.riskLevel" placeholder="请选择风险等级">
            <el-option label="低风险" value="low" />
            <el-option label="中风险" value="medium" />
            <el-option label="高风险" value="high" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新建项目弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建项目"
      width="50%"
      :before-close="handleCloseCreateDialog"
    >
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="申报人" prop="applicant">
          <el-input v-model="createForm.applicant" placeholder="请输入申报人姓名" />
        </el-form-item>
        <el-form-item label="申报部门" prop="department">
          <el-select v-model="createForm.department" placeholder="请选择部门">
            <el-option label="技术部" value="技术部" />
            <el-option label="市场部" value="市场部" />
            <el-option label="财务部" value="财务部" />
            <el-option label="人力资源部" value="人力资源部" />
            <el-option label="研发中心" value="研发中心" />
          </el-select>
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input 
            type="textarea" 
            v-model="createForm.description" 
            :rows="3" 
            placeholder="请输入项目描述" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// 假数据生成
const generateMockData = () => {
  const statuses = ['pending', 'reviewing', 'approved', 'rejected']
  const riskLevels = ['low', 'medium', 'high']
  const departments = ['技术部', '市场部', '财务部', '人力资源部', '研发中心']
  const names = ['人工智能平台', '大数据分析系统', '云计算迁移', '移动应用开发', '物联网解决方案']
  
  const data = []
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)]
    const progress = status === 'approved' ? 100 : 
                    status === 'rejected' ? 0 : 
                    Math.floor(Math.random() * 100)
    
    data.push({
      id: `PROJ-${1000 + i}`,
      name: `${names[Math.floor(Math.random() * names.length)]} V${i % 5 + 1}.0`,
      applicant: `用户${i}`,
      department: departments[Math.floor(Math.random() * departments.length)],
      applicationDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
      progress: progress,
      status: status,
      riskLevel: riskLevel
    })
  }
  
  return data
}

// 响应式数据
const projectList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filterForm = reactive({
  name: '',
  status: '',
  riskLevel: ''
})

// 弹窗相关数据
const viewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)
const selectedProject = ref(null)
const editForm = ref(null)

const createForm = reactive({
  name: '',
  applicant: '',
  department: '',
  description: ''
})

const createRules = reactive({
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  applicant: [{ required: true, message: '请输入申报人姓名', trigger: 'blur' }],
  department: [{ required: true, message: '请选择申报部门', trigger: 'change' }]
})

// 格式化日期
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 获取状态标签类型
const getStatusType = (status) => {
  const types = {
    'pending': 'info',
    'reviewing': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return types[status] || ''
}

// 获取状态文本
const getStatusText = (status) => {
  const texts = {
    'pending': '待审核',
    'reviewing': '审核中',
    'approved': '已通过',
    'rejected': '已拒绝'
  }
  return texts[status] || status
}

// 获取风险标签类型
const getRiskType = (riskLevel) => {
  const types = {
    'low': 'success',
    'medium': 'warning',
    'high': 'danger'
  }
  return types[riskLevel] || ''
}

// 获取风险文本
const getRiskText = (riskLevel) => {
  const texts = {
    'low': '低风险',
    'medium': '中风险',
    'high': '高风险'
  }
  return texts[riskLevel] || riskLevel
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

// 处理搜索
const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    // 模拟搜索过滤
    const filteredData = allProjects.value.filter(project => {
      return (!filterForm.name || project.name.includes(filterForm.name)) &&
             (!filterForm.status || project.status === filterForm.status) &&
             (!filterForm.riskLevel || project.riskLevel === filterForm.riskLevel)
    })
    
    total.value = filteredData.length
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    projectList.value = filteredData.slice(start, end)
    loading.value = false
  }, 500)
}

// 重置筛选
const resetFilter = () => {
  filterForm.name = ''
  filterForm.status = ''
  filterForm.riskLevel = ''
  handleSearch()
}

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
  handleSearch()
}

// 处理当前页变化
const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
  handleSearch()
}

// 查看项目详情
const handleView = (row) => {
  selectedProject.value = row
  viewDialogVisible.value = true
}

// 编辑项目
const handleEdit = (row) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

// 关闭查看弹窗
const handleCloseViewDialog = () => {
  viewDialogVisible.value = false
}

// 关闭编辑弹窗
const handleCloseEditDialog = () => {
  editDialogVisible.value = false
}

// 提交编辑
const submitEdit = () => {
  // 在实际应用中，这里应该发送API请求更新数据
  const index = allProjects.value.findIndex(p => p.id === editForm.value.id)
  if (index !== -1) {
    allProjects.value[index] = { ...editForm.value }
    handleSearch() // 刷新列表
    ElMessage.success('项目信息更新成功')
  }
  editDialogVisible.value = false
}

// 显示新建项目弹窗
const showCreateDialog = () => {
  createDialogVisible.value = true
}

// 关闭新建项目弹窗
const handleCloseCreateDialog = () => {
  createDialogVisible.value = false
}

// 提交新建项目
const submitCreate = () => {
  // 在实际应用中，这里应该发送API请求创建新项目
  const newProject = {
    id: `PROJ-${1000 + allProjects.value.length + 1}`,
    name: createForm.name,
    applicant: createForm.applicant,
    department: createForm.department,
    applicationDate: new Date(),
    progress: 0,
    status: 'pending',
    riskLevel: 'low',
    description: createForm.description
  }
  
  allProjects.value.unshift(newProject)
  total.value = allProjects.value.length
  handleSearch() // 刷新列表
  
  // 重置表单
  createForm.name = ''
  createForm.applicant = ''
  createForm.department = ''
  createForm.description = ''
  
  createDialogVisible.value = false
  ElMessage.success('项目创建成功')
}

// 初始化数据
const allProjects = ref([])

onMounted(() => {
  loading.value = true
  setTimeout(() => {
    allProjects.value = generateMockData()
    total.value = allProjects.value.length
    handleSearch()
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './PreferenceApplication.scss';

</style>