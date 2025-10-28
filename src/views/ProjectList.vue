<template>
  <div class="project-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>政策项目申报材料协同平台</h2>
      <p>一站式申报材料管理与协作解决方案</p>
    </div>
    
    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-card class="filter-card">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索项目名称或编号"
              :suffix-icon="Search"
              clearable
              @clear="handleSearch"
              @keyup.enter="handleSearch"
            />
          </el-col>
          <el-col :xs="24" :sm="12" :md="8" :lg="6" :xl="6">
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
          <el-col :xs="24" :sm="24" :md="8" :lg="12" :xl="12" class="text-right">
            <el-button type="primary" :icon="Plus" @click="showCreateDialog">
              新建项目
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 项目列表 -->
    <div class="project-list">
      <el-card>
        <el-table
          :data="paginatedProjects"
          style="width: 100%"
          empty-text="暂无项目数据"
          v-loading="loading"
          :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        >
          <el-table-column prop="id" label="项目编号" width="120" />
          <el-table-column prop="name" label="项目名称" min-width="200" />
          <el-table-column prop="department" label="申报部门" width="150" />
          <el-table-column prop="applicant" label="申报人" width="120" />
          <el-table-column prop="date" label="申报日期" width="120" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag
                :type="getStatusType(row.status)"
                size="small"
                :class="`status-tag status-${row.status}`"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="showViewDialog(row)"
                class="action-btn"
              >
                查看详情
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                @click="showEditDialog(row)"
                :disabled="row.status === 'approved' || row.status === 'rejected'"
                class="action-btn"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(row)"
                :disabled="row.status !== 'draft'"
                class="action-btn"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :small="true"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredProjects.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新建项目弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建项目"
      width="600px"
      :before-close="handleCloseCreateDialog"
    >
      <el-form :model="newProjectForm" label-width="100px">
        <el-form-item label="项目名称" required>
          <el-input v-model="newProjectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="申报部门" required>
          <el-select v-model="newProjectForm.department" placeholder="请选择申报部门">
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申报人" required>
          <el-input v-model="newProjectForm.applicant" placeholder="请输入申报人姓名" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input
            v-model="newProjectForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目简要描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreate">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看项目弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="`项目详情 - ${selectedProject?.name || ''}`"
      width="700px"
    >
      <div v-if="selectedProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目编号">{{ selectedProject.id }}</el-descriptions-item>
          <el-descriptions-item label="项目名称">{{ selectedProject.name }}</el-descriptions-item>
          <el-descriptions-item label="申报部门">{{ selectedProject.department }}</el-descriptions-item>
          <el-descriptions-item label="申报人">{{ selectedProject.applicant }}</el-descriptions-item>
          <el-descriptions-item label="申报日期">{{ selectedProject.date }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="getStatusType(selectedProject.status)">
              {{ getStatusText(selectedProject.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="协作成员" :span="2">
            <div class="collaborators">
              <el-tag 
                v-for="(member, index) in selectedProject.collaborators || []" 
                :key="index"
                size="small"
                class="member-tag"
              >
                {{ member }}
              </el-tag>
              <span v-if="!selectedProject.collaborators || selectedProject.collaborators.length === 0">
                暂无协作成员
              </span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="项目进度" :span="2">
            <el-steps :active="getProgressStep(selectedProject.status)" simple>
              <el-step title="草稿" />
              <el-step title="已提交" />
              <el-step title="审核中" />
              <el-step :title="selectedProject.status === 'approved' ? '已通过' : '已驳回'" />
            </el-steps>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="action-buttons" style="margin-top: 20px;">
          <el-button 
            type="primary" 
            v-if="selectedProject.status === 'draft'"
            @click="showSubmitConfirm(selectedProject)"
          >
            提交审核
          </el-button>
          <el-button 
            v-if="selectedProject.status === 'rejected'"
            @click="showEditDialog(selectedProject)"
          >
            重新编辑
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑项目弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑项目 - ${selectedProject?.name || ''}`"
      width="600px"
    >
      <el-form 
        v-if="selectedProject" 
        :model="editProjectForm" 
        label-width="100px"
      >
        <el-form-item label="项目名称" required>
          <el-input v-model="editProjectForm.name" />
        </el-form-item>
        <el-form-item label="申报部门" required>
          <el-select v-model="editProjectForm.department" placeholder="请选择申报部门">
            <el-option
              v-for="dept in departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申报人" required>
          <el-input v-model="editProjectForm.applicant" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input
            v-model="editProjectForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="协作成员">
          <el-select
            v-model="editProjectForm.collaborators"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入协作成员姓名"
          >
            <el-option
              v-for="item in potentialCollaborators"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// 假数据生成
const generateMockData = () => {
  const statuses = ['draft', 'submitted', 'reviewing', 'approved', 'rejected']
  const statusTexts = {
    draft: '草稿',
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  
  const departments = ['技术部', '市场部', '财务部', '人力资源部', '研发中心']
  const names = ['科技创新', '产业升级', '人才培养', '基础设施建设', '环保节能']
  const collaborators = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
  
  const projects = []
  
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const department = departments[Math.floor(Math.random() * departments.length)]
    const name = names[Math.floor(Math.random() * names.length)]
    
    // 随机生成协作成员
    const projectCollaborators = []
    const numCollaborators = Math.floor(Math.random() * 4)
    for (let j = 0; j < numCollaborators; j++) {
      const collaborator = collaborators[Math.floor(Math.random() * collaborators.length)]
      if (!projectCollaborators.includes(collaborator)) {
        projectCollaborators.push(collaborator)
      }
    }
    
    projects.push({
      id: `PROJ-${1000 + i}`,
      name: `${name}项目申报`,
      department: department,
      applicant: `申请人${i}`,
      date: `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      status: status,
      statusText: statusTexts[status],
      description: `这是${name}项目的详细描述，用于申报相关政策支持。`,
      collaborators: projectCollaborators
    })
  }
  
  return projects
}

// 响应式数据
const projects = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const createDialogVisible = ref(false)
const viewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const selectedProject = ref(null)

// 表单数据
const newProjectForm = reactive({
  name: '',
  department: '',
  applicant: '',
  description: ''
})

const editProjectForm = reactive({
  name: '',
  department: '',
  applicant: '',
  description: '',
  collaborators: []
})

// 状态选项
const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' }
]

const departments = ['技术部', '市场部', '财务部', '人力资源部', '研发中心']
const potentialCollaborators = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']

// 计算属性
const filteredProjects = computed(() => {
  let result = projects.value
  
  // 根据搜索关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      item => 
        item.name.toLowerCase().includes(keyword) || 
        item.id.toLowerCase().includes(keyword)
    )
  }
  
  // 根据状态过滤
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
const getStatusType = (status) => {
  const types = {
    draft: 'info',
    submitted: '',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    submitted: '已提交',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  return texts[status] || '未知状态'
}

const getProgressStep = (status) => {
  const steps = {
    draft: 1,
    submitted: 2,
    reviewing: 3,
    approved: 4,
    rejected: 4
  }
  return steps[status] || 1
}

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

const showCreateDialog = () => {
  // 重置表单
  Object.assign(newProjectForm, {
    name: '',
    department: '',
    applicant: '',
    description: ''
  })
  createDialogVisible.value = true
}

const handleCloseCreateDialog = (done) => {
  ElMessageBox.confirm('确定要关闭吗？已填写的信息将不会保存')
    .then(() => {
      done()
    })
    .catch(() => {
      // 取消关闭
    })
}

const handleCreate = () => {
  // 表单验证
  if (!newProjectForm.name || !newProjectForm.department || !newProjectForm.applicant) {
    ElMessage.warning('请填写必填字段')
    return
  }
  
  // 生成新项目
  const newProject = {
    id: `PROJ-${1000 + projects.value.length + 1}`,
    name: newProjectForm.name,
    department: newProjectForm.department,
    applicant: newProjectForm.applicant,
    date: new Date().toLocaleDateString(),
    status: 'draft',
    description: newProjectForm.description,
    collaborators: []
  }
  
  // 添加到项目列表
  projects.value.unshift(newProject)
  createDialogVisible.value = false
  ElMessage.success('项目创建成功')
}

const showViewDialog = (project) => {
  selectedProject.value = project
  viewDialogVisible.value = true
}

const showEditDialog = (project) => {
  selectedProject.value = project
  
  // 填充表单
  Object.assign(editProjectForm, {
    name: project.name,
    department: project.department,
    applicant: project.applicant,
    description: project.description || '',
    collaborators: project.collaborators || []
  })
  
  editDialogVisible.value = true
}

const handleEdit = () => {
  // 表单验证
  if (!editProjectForm.name || !editProjectForm.department || !editProjectForm.applicant) {
    ElMessage.warning('请填写必填字段')
    return
  }
  
  // 更新项目信息
  const index = projects.value.findIndex(p => p.id === selectedProject.value.id)
  if (index !== -1) {
    projects.value[index] = {
      ...projects.value[index],
      name: editProjectForm.name,
      department: editProjectForm.department,
      applicant: editProjectForm.applicant,
      description: editProjectForm.description,
      collaborators: editProjectForm.collaborators
    }
    
    ElMessage.success('项目更新成功')
    editDialogVisible.value = false
  }
}

const showSubmitConfirm = (project) => {
  ElMessageBox.confirm(
    `确定要提交项目"${project.name}"进行审核吗？提交后将无法直接编辑。`,
    '提交确认',
    {
      confirmButtonText: '确定提交',
      cancelButtonText: '再检查一下',
      type: 'warning',
    }
  ).then(() => {
    // 更新项目状态为已提交
    const index = projects.value.findIndex(p => p.id === project.id)
    if (index !== -1) {
      projects.value[index].status = 'submitted'
      ElMessage.success('项目已提交，等待审核')
      viewDialogVisible.value = false
    }
  }).catch(() => {
    // 取消提交
  })
}

const handleDelete = (project) => {
  ElMessageBox.confirm(
    `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 在实际应用中这里会调用API
    projects.value = projects.value.filter(p => p.id !== project.id)
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('取消删除')
  })
}

// 生命周期
onMounted(() => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    projects.value = generateMockData()
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './ProjectList.scss';

</style>