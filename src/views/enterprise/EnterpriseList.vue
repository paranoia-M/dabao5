<template>
  <div class="enterprise-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>企业项目管理</h1>
      <p>监控项目申报进度与风险预警</p>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索企业名称或项目"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">
                <span class="custom-search-icon">🔍</span>
              </el-button>
            </template>
          </el-input>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="filterStatus"
            placeholder="项目状态"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="filterRisk"
            placeholder="风险等级"
            clearable
            @change="handleFilter"
          >
            <el-option
              v-for="item in riskOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-button type="primary" @click="handleAdd">
            <span class="custom-plus-icon">+</span> 新增项目
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 数据表格 -->
    <div class="table-section">
      <el-table
        :data="paginatedData"
        v-loading="loading"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="enterpriseName" label="企业名称" min-width="150" />
        <el-table-column prop="projectName" label="项目名称" min-width="180" />
        <el-table-column prop="projectType" label="项目类型" width="120" />
        <el-table-column label="申报进度" width="120">
          <template #default="{ row }">
            <div class="progress-container">
              <el-progress 
                :percentage="row.progress" 
                :status="getProgressStatus(row.progress)" 
                :show-text="row.progress < 100"
              />
              <span v-if="row.progress === 100" class="completed-text">已完成</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getRiskType(row.riskLevel)"
              effect="light"
              class="risk-tag"
            >
              {{ row.riskLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitDate" label="提交日期" width="120" />
        <el-table-column label="截止日期" width="120">
          <template #default="{ row }">
            <span :class="{ 'deadline-warning': isDeadlineWarning(row.deadline) }">
              {{ row.deadline }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button 
              size="small" 
              @click="handleView(row)"
              class="view-btn"
            >
              <span class="custom-view-icon">👁️</span> 详情
            </el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleEdit(row)"
              class="edit-btn"
            >
              <span class="custom-edit-icon">✏️</span> 编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页控件 -->
      <div class="pagination-section">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :small="true"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredData.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 添加/编辑项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      class="project-dialog"
    >
      <el-form 
        :model="formData" 
        label-width="100px"
        :rules="formRules"
      >
        <el-form-item label="企业名称" prop="enterpriseName">
          <el-input v-model="formData.enterpriseName" />
        </el-form-item>
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="formData.projectName" />
        </el-form-item>
        <el-form-item label="项目类型" prop="projectType">
          <el-select v-model="formData.projectType" placeholder="请选择项目类型">
            <el-option 
              v-for="item in projectTypeOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申报进度" prop="progress">
          <el-slider v-model="formData.progress" :step="10" show-stops />
          <span class="progress-value">{{ formData.progress }}%</span>
        </el-form-item>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="formData.riskLevel" placeholder="请选择风险等级">
            <el-option 
              v-for="item in riskOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期" prop="deadline">
          <el-date-picker 
            v-model="formData.deadline" 
            type="date" 
            placeholder="选择日期" 
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="项目详情"
      width="700px"
      class="detail-dialog"
    >
      <div v-if="currentProject" class="project-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>企业名称：</label>
                <span>{{ currentProject.enterpriseName }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>项目名称：</label>
                <span>{{ currentProject.projectName }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>项目类型：</label>
                <span>{{ currentProject.projectType }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>提交日期：</label>
                <span>{{ currentProject.submitDate }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>截止日期：</label>
                <span :class="{ 'deadline-warning': isDeadlineWarning(currentProject.deadline) }">
                  {{ currentProject.deadline }}
                </span>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="detail-section">
          <h3>进度与风险</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>申报进度：</label>
                <div class="progress-detail">
                  <el-progress 
                    :percentage="currentProject.progress" 
                    :status="getProgressStatus(currentProject.progress)"
                    :show-text="currentProject.progress < 100"
                  />
                  <span v-if="currentProject.progress === 100" class="completed-text">已完成</span>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>风险等级：</label>
                <el-tag 
                  :type="getRiskType(currentProject.riskLevel)"
                  effect="light"
                  class="risk-tag"
                >
                  {{ currentProject.riskLevel }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="detail-section" v-if="currentProject.riskLevel === '高'">
          <h3>风险预警</h3>
          <div class="risk-warning">
            <div class="warning-icon">⚠️</div>
            <div class="warning-content">
              <p class="warning-title">高风险项目预警</p>
              <p class="warning-desc">该项目存在较高风险，建议加强监控并及时采取应对措施。</p>
              <ul class="warning-suggestions">
                <li>增加项目进度检查频率</li>
                <li>分配专人负责风险监控</li>
                <li>准备应急预案</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="detail-section" v-else-if="isDeadlineWarning(currentProject.deadline)">
          <h3>截止日期提醒</h3>
          <div class="deadline-reminder">
            <div class="reminder-icon">⏰</div>
            <div class="reminder-content">
              <p>该项目距离截止日期仅剩 {{ getDaysUntilDeadline(currentProject.deadline) }} 天</p>
              <p class="reminder-suggestion">请加快进度以确保按时完成。</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟数据
const mockData = [
  {
    id: 1,
    enterpriseName: '科技有限公司',
    projectName: '人工智能研发项目',
    projectType: '技术创新',
    progress: 30,
    riskLevel: '高',
    submitDate: '2023-10-15',
    deadline: '2023-12-30'
  },
  {
    id: 2,
    enterpriseName: '制造有限公司',
    projectName: '生产线自动化改造',
    projectType: '技术改造',
    progress: 80,
    riskLevel: '中',
    submitDate: '2023-09-20',
    deadline: '2023-11-15'
  },
  {
    id: 3,
    enterpriseName: '生物制药公司',
    projectName: '新药研发项目',
    projectType: '研发',
    progress: 50,
    riskLevel: '低',
    submitDate: '2023-11-01',
    deadline: '2024-03-30'
  },
  {
    id: 4,
    enterpriseName: '新能源企业',
    projectName: '太阳能电池研发',
    projectType: '新能源',
    progress: 100,
    riskLevel: '无',
    submitDate: '2023-07-10',
    deadline: '2023-10-30'
  },
  {
    id: 5,
    enterpriseName: '互联网科技',
    projectName: '电商平台升级',
    projectType: '互联网',
    progress: 20,
    riskLevel: '高',
    submitDate: '2023-11-05',
    deadline: '2023-12-20'
  }
]

// 响应式数据
const searchKeyword = ref('')
const filterStatus = ref('')
const filterRisk = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const currentProject = ref(null)
const formData = reactive({
  id: null,
  enterpriseName: '',
  projectName: '',
  projectType: '',
  progress: 0,
  riskLevel: '',
  deadline: ''
})

// 选项数据
const statusOptions = [
  { value: 'inprogress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'notstarted', label: '未开始' }
]

const riskOptions = [
  { value: '高', label: '高风险' },
  { value: '中', label: '中等风险' },
  { value: '低', label: '低风险' },
  { value: '无', label: '无风险' }
]

const projectTypeOptions = [
  { value: '技术创新', label: '技术创新' },
  { value: '技术改造', label: '技术改造' },
  { value: '研发', label: '研发' },
  { value: '新能源', label: '新能源' },
  { value: '互联网', label: '互联网' }
]

// 表单验证规则
const formRules = {
  enterpriseName: [
    { required: true, message: '请输入企业名称', trigger: 'blur' }
  ],
  projectName: [
    { required: true, message: '请输入项目名称', trigger: 'blur' }
  ],
  projectType: [
    { required: true, message: '请选择项目类型', trigger: 'change' }
  ],
  riskLevel: [
    { required: true, message: '请选择风险等级', trigger: 'change' }
  ]
}

// 计算属性
const filteredData = computed(() => {
  return mockData.filter(item => {
    const matchesSearch = !searchKeyword.value || 
      item.enterpriseName.includes(searchKeyword.value) || 
      item.projectName.includes(searchKeyword.value)
    
    const matchesStatus = !filterStatus.value || 
      (filterStatus.value === 'inprogress' && item.progress > 0 && item.progress < 100) ||
      (filterStatus.value === 'completed' && item.progress === 100) ||
      (filterStatus.value === 'notstarted' && item.progress === 0)
    
    const matchesRisk = !filterRisk.value || item.riskLevel === filterRisk.value
    
    return matchesSearch && matchesStatus && matchesRisk
  })
})

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredData.value.slice(start, end)
})

const dialogTitle = computed(() => {
  return dialogType.value === 'add' ? '新增项目' : '编辑项目'
})

// 方法
const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

const handleAdd = () => {
  dialogType.value = 'add'
  // 重置表单数据
  Object.assign(formData, {
    id: null,
    enterpriseName: '',
    projectName: '',
    projectType: '',
    progress: 0,
    riskLevel: '',
    deadline: ''
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogType.value = 'edit'
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

const handleView = (row) => {
  currentProject.value = { ...row }
  detailDialogVisible.value = true
}

const handleSubmit = () => {
  // 表单验证
  if (!formData.enterpriseName || !formData.projectName || !formData.projectType || !formData.riskLevel) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (dialogType.value === 'add') {
    // 模拟添加操作
    const newId = Math.max(...mockData.map(item => item.id)) + 1
    mockData.push({ ...formData, id: newId })
    ElMessage.success('添加成功')
  } else {
    // 模拟编辑操作
    const index = mockData.findIndex(item => item.id === formData.id)
    if (index !== -1) {
      mockData.splice(index, 1, { ...formData })
      ElMessage.success('更新成功')
    }
  }
  dialogVisible.value = false
}

const getProgressStatus = (progress) => {
  if (progress === 100) return 'success'
  if (progress >= 70) return 'warning'
  return ''
}

const getRiskType = (riskLevel) => {
  switch (riskLevel) {
    case '高': return 'danger'
    case '中': return 'warning'
    case '低': return 'info'
    default: return 'success'
  }
}

const isDeadlineWarning = (deadline) => {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= 7 && diffDays >= 0
}

const getDaysUntilDeadline = (deadline) => {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const tableRowClassName = ({ row }) => {
  if (row.riskLevel === '高') return 'high-risk-row'
  if (row.riskLevel === '中') return 'medium-risk-row'
  return ''
}

// 生命周期
onMounted(() => {
  // 可以在这里模拟数据加载
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
})
</script>

<style lang="scss" scoped>

@use './EnterpriseList.scss';

</style>