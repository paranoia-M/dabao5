<template>
  <div class="audit-management">
    <div class="page-header">
      <h1>航清智能项目实时追踪及进度提醒软件</h1>
      <p>实时监控项目申报状态，及时发现潜在风险</p>
    </div>
    
    <div class="dashboard-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon pending">
                <span class="custom-icon">📋</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.pending }}</h3>
                <p>待审核项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon approved">
                <span class="custom-icon">✅</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.approved }}</h3>
                <p>已通过项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon rejected">
                <span class="custom-icon">❌</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.rejected }}</h3>
                <p>已拒绝项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon risk">
                <span class="custom-icon">⚠️</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.risk }}</h3>
                <p>风险项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="main-content">
      <el-card class="filter-card">
        <div class="filter-header">
          <h3>项目筛选</h3>
          <div class="filter-actions">
            <el-button type="primary" @click="refreshData">
              <span class="custom-icon">🔄</span>刷新
            </el-button>
          </div>
        </div>
        
        <el-form :model="filterForm" label-width="100px">
          <el-row :gutter="20">
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="项目名称">
                <el-input 
                  v-model="filterForm.name" 
                  placeholder="请输入项目名称" 
                  clearable
                ></el-input>
              </el-form-item>
            </el-col>
            
            <el-col :xs="24" :sm="12" :md="8">
              <el-form-item label="申报状态">
                <el-select 
                  v-model="filterForm.status" 
                  placeholder="请选择状态" 
                  clearable
                >
                  <el-option 
                    v-for="item in statusOptions" 
                    :key="item.value" 
                    :label="item.label" 
                    :value="item.value"
                  ></el-option>
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
                  value-format="yyyy-MM-dd"
                ></el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
          
          <div class="form-actions">
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </div>
        </el-form>
      </el-card>
      
      <el-card class="table-card">
        <div class="table-header">
          <h3>项目申报列表</h3>
          <div class="table-actions">
            <el-button 
              type="primary" 
              @click="showCreateDialog"
            >
              <span class="custom-icon">➕</span>新建项目
            </el-button>
          </div>
        </div>
        
        <el-table 
          :data="tableData" 
          v-loading="loading"
          style="width: 100%"
        >
          <el-table-column 
            prop="id" 
            label="项目编号" 
            width="100"
          ></el-table-column>
          
          <el-table-column 
            prop="name" 
            label="项目名称" 
            min-width="150"
          ></el-table-column>
          
          <el-table-column 
            prop="applicant" 
            label="申报人" 
            width="120"
          ></el-table-column>
          
          <el-table-column 
            prop="date" 
            label="申报日期" 
            width="120"
          ></el-table-column>
          
          <el-table-column 
            prop="deadline" 
            label="截止日期" 
            width="120"
          ></el-table-column>
          
          <el-table-column 
            label="当前进度" 
            width="120"
          >
            <template #default="{ row }">
              <div class="progress-container">
                <el-progress 
                  :percentage="row.progress" 
                  :color="getProgressColor(row.progress)"
                  :show-text="false"
                ></el-progress>
                <span class="progress-text">{{ row.progress }}%</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="状态" 
            width="100"
          >
            <template #default="{ row }">
              <el-tag 
                :type="getStatusType(row.status)"
                size="small"
              >{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="风险等级" 
            width="100"
          >
            <template #default="{ row }">
              <el-tag 
                :type="getRiskType(row.riskLevel)"
                size="small"
              >{{ getRiskText(row.riskLevel) }}</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column 
            label="操作" 
            width="180"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button 
                type="text" 
                size="small" 
                @click="showDetailDialog(row)"
              >查看</el-button>
              <el-button 
                type="text" 
                size="small" 
                @click="showEditDialog(row)"
              >编辑</el-button>
              <el-button 
                type="text" 
                size="small" 
                @click="handleDelete(row)"
                :disabled="row.status === 2"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination">
          <el-pagination
            :current-page="pagination.current"
            :page-size="pagination.size"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
      </el-card>
    </div>
    
    <!-- 项目详情弹窗 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="'项目详情 - ' + currentProject.name"
      width="60%"
    >
      <div class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目编号">{{ currentProject.id }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ currentProject.name }}</el-descriptions-item>
          <el-descriptions-item label="申报人">{{ currentProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申报日期">{{ currentProject.date }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentProject.deadline }}</el-descriptions-item>
          <el-descriptions-item label="当前进度">
            <el-progress 
              :percentage="currentProject.progress" 
              :color="getProgressColor(currentProject.progress)"
            />
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentProject.status)">
              {{ getStatusText(currentProject.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskType(currentProject.riskLevel)">
              {{ getRiskText(currentProject.riskLevel) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="risk-warning" v-if="currentProject.riskLevel === 2">
          <h4>⚠️ 高风险预警</h4>
          <p>此项目存在高风险因素，请尽快处理并制定应对措施。</p>
        </div>
        
        <div class="timeline-section">
          <h4>审核进度时间线</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in projectTimeline"
              :key="index"
              :timestamp="activity.timestamp"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>
    
    <!-- 编辑项目弹窗 -->
    <el-dialog 
      v-model="editDialogVisible" 
      :title="'编辑项目 - ' + currentProject.name"
      width="50%"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="项目名称">
          <el-input v-model="editForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="申报人">
          <el-input v-model="editForm.applicant" placeholder="请输入申报人" />
        </el-form-item>
        <el-form-item label="申报日期">
          <el-date-picker
            v-model="editForm.date"
            type="date"
            placeholder="选择申报日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="editForm.deadline"
            type="date"
            placeholder="选择截止日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="进度">
          <el-slider v-model="editForm.progress" :marks="progressMarks" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option 
              v-for="item in statusOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select v-model="editForm.riskLevel" placeholder="请选择风险等级">
            <el-option label="低风险" :value="0" />
            <el-option label="中风险" :value="1" />
            <el-option label="高风险" :value="2" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEditConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新建项目弹窗 -->
    <el-dialog 
      v-model="createDialogVisible" 
      title="新建项目"
      width="50%"
    >
      <el-form :model="createForm" label-width="100px" :rules="formRules" ref="createFormRef">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="申报人" prop="applicant">
          <el-input v-model="createForm.applicant" placeholder="请输入申报人" />
        </el-form-item>
        <el-form-item label="申报日期" prop="date">
          <el-date-picker
            v-model="createForm.date"
            type="date"
            placeholder="选择申报日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker
            v-model="createForm.deadline"
            type="date"
            placeholder="选择截止日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="初始进度">
          <el-slider v-model="createForm.progress" :marks="progressMarks" />
        </el-form-item>
        <el-form-item label="初始状态">
          <el-select v-model="createForm.status" placeholder="请选择状态">
            <el-option 
              v-for="item in statusOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateConfirm">创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const stats = reactive({
  pending: 12,
  approved: 45,
  rejected: 8,
  risk: 5
})

// 筛选表单
const filterForm = reactive({
  name: '',
  status: '',
  dateRange: []
})

// 状态选项
const statusOptions = [
  { value: 0, label: '待审核' },
  { value: 1, label: '审核中' },
  { value: 2, label: '已通过' },
  { value: 3, label: '已拒绝' }
]

// 进度标记
const progressMarks = reactive({
  0: '0%',
  25: '25%',
  50: '50%',
  75: '75%',
  100: '100%'
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页信息
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 弹窗控制
const detailDialogVisible = ref(false)
const editDialogVisible = ref(false)
const createDialogVisible = ref(false)

// 当前操作的项目
const currentProject = reactive({
  id: '',
  name: '',
  applicant: '',
  date: '',
  deadline: '',
  progress: 0,
  status: 0,
  riskLevel: 0
})

// 编辑表单
const editForm = reactive({
  name: '',
  applicant: '',
  date: '',
  deadline: '',
  progress: 0,
  status: 0,
  riskLevel: 0
})

// 创建表单
const createForm = reactive({
  name: '',
  applicant: '',
  date: '',
  deadline: '',
  progress: 0,
  status: 0
})

// 表单验证规则
const formRules = reactive({
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  applicant: [{ required: true, message: '请输入申报人', trigger: 'blur' }],
  date: [{ required: true, message: '请选择申报日期', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
})

// 项目时间线数据
const projectTimeline = ref([
  {
    content: '项目创建成功',
    timestamp: '2023-06-01 09:30'
  },
  {
    content: '项目初审通过',
    timestamp: '2023-06-05 14:20'
  },
  {
    content: '项目进入详细审核阶段',
    timestamp: '2023-06-10 10:45'
  },
  {
    content: '项目风险评估完成',
    timestamp: '2023-06-15 16:30'
  }
])

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    0: '待审核',
    1: '审核中',
    2: '已通过',
    3: '已拒绝'
  }
  return statusMap[status] || '未知'
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    0: 'warning',
    1: 'info',
    2: 'success',
    3: 'danger'
  }
  return typeMap[status] || ''
}

// 获取风险文本
const getRiskText = (level) => {
  const riskMap = {
    0: '低风险',
    1: '中风险',
    2: '高风险'
  }
  return riskMap[level] || '未知'
}

// 获取风险类型
const getRiskType = (level) => {
  const typeMap = {
    0: 'success',
    1: 'warning',
    2: 'danger'
  }
  return typeMap[level] || ''
}

// 获取进度颜色
const getProgressColor = (percentage) => {
  if (percentage < 30) {
    return '#f56c6c'
  } else if (percentage < 70) {
    return '#e6a23c'
  } else {
    return '#67c23a'
  }
}

// 加载数据
const loadData = () => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    // 生成假数据
    const mockData = []
    for (let i = 0; i < 10; i++) {
      mockData.push({
        id: `PROJ${1000 + i}`,
        name: `项目${i + 1}号`,
        applicant: `申请人${i + 1}`,
        date: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
        deadline: `2023-${((i + 3) % 12) + 1}-${((i + 10) % 28) + 1}`,
        progress: Math.floor(Math.random() * 100),
        status: Math.floor(Math.random() * 4),
        riskLevel: Math.floor(Math.random() * 3)
      })
    }
    
    tableData.value = mockData
    pagination.total = 42
    loading.value = false
  }, 800)
}

// 搜索处理
const handleSearch = () => {
  pagination.current = 1
  loadData()
  ElMessage.success('查询成功')
}

// 重置筛选
const resetFilter = () => {
  filterForm.name = ''
  filterForm.status = ''
  filterForm.dateRange = []
  handleSearch()
}

// 刷新数据
const refreshData = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

// 分页大小改变
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.current = 1
  loadData()
}

// 当前页改变
const handleCurrentChange = (current) => {
  pagination.current = current
  loadData()
}

// 显示详情弹窗
const showDetailDialog = (row) => {
  Object.assign(currentProject, row)
  detailDialogVisible.value = true
}

// 显示编辑弹窗
const showEditDialog = (row) => {
  Object.assign(currentProject, row)
  Object.assign(editForm, row)
  editDialogVisible.value = true
}

// 确认编辑
const handleEditConfirm = () => {
  // 在实际应用中，这里应该调用API更新数据
  const index = tableData.value.findIndex(item => item.id === currentProject.id)
  if (index !== -1) {
    Object.assign(tableData.value[index], editForm)
    ElMessage.success('项目信息更新成功')
  }
  editDialogVisible.value = false
}

// 显示新建项目弹窗
const showCreateDialog = () => {
  // 重置表单
  Object.keys(createForm).forEach(key => {
    if (key !== 'progress' && key !== 'status') {
      createForm[key] = ''
    } else {
      createForm[key] = 0
    }
  })
  createDialogVisible.value = true
}

// 确认创建
const handleCreateConfirm = () => {
  // 在实际应用中，这里应该调用API创建新项目
  const newProject = {
    id: `PROJ${1000 + tableData.value.length}`,
    name: createForm.name,
    applicant: createForm.applicant,
    date: createForm.date,
    deadline: createForm.deadline,
    progress: createForm.progress,
    status: createForm.status,
    riskLevel: 0 // 新建项目默认低风险
  }
  
  tableData.value.unshift(newProject)
  pagination.total += 1
  
  // 更新统计数据
  stats.pending += 1
  if (createForm.status === 0) stats.pending += 1
  
  ElMessage.success('项目创建成功')
  createDialogVisible.value = false
}

// 删除项目
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除项目"${row.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    // 在实际应用中，这里应该调用API删除数据
    const index = tableData.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      pagination.total -= 1
      
      // 更新统计数据
      if (row.status === 0) stats.pending -= 1
      else if (row.status === 2) stats.approved -= 1
      else if (row.status === 3) stats.rejected -= 1
      if (row.riskLevel === 2) stats.risk -= 1
      
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 初始化加载数据
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>

@use './AuditManagement.scss';

</style>