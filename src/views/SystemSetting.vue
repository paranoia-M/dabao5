<template>
  <div class="policy-platform-dashboard">
    <div class="header">
      <h1>航清噪音项目申报综合管理系统</h1>
      <p>一站式政策项目申报材料管理与协作解决方案</p>
    </div>
    
    <div class="dashboard">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #e6f7ff;">
                <span class="custom-icon document-icon" style="color: #1890ff;">📄</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.ongoingProjects }}</h3>
                <p>进行中的项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #f6ffed;">
                <span class="custom-icon check-icon" style="color: #52c41a;">✅</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.completedProjects }}</h3>
                <p>已完成的项目</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #fff7e6;">
                <span class="custom-icon user-icon" style="color: #fa8c16;">👥</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.collaborators }}</h3>
                <p>协作成员</p>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #f9f0ff;">
                <span class="custom-icon message-icon" style="color: #722ed1;">💬</span>
              </div>
              <div class="stat-info">
                <h3>{{ stats.pendingMessages }}</h3>
                <p>待处理消息</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <div class="recent-projects">
      <el-card>
        <template #header>
          <div class="card-header">
            <h2>最近项目</h2>
            <el-button type="primary" @click="showCreateProjectDialog">
              <span class="custom-icon">➕</span>新建项目
            </el-button>
          </div>
        </template>
        
        <el-table :data="paginatedProjects" style="width: 100%" empty-text="暂无项目数据">
          <el-table-column prop="name" label="项目名称" min-width="200">
            <template #default="{ row }">
              <div class="project-name">
                <span :class="row.icon" :style="{ color: row.color }" class="project-icon">{{ getProjectIcon(row.type) }}</span>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="项目类型" width="120"></el-table-column>
          <el-table-column prop="progress" label="进度" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.progress" :color="progressColor(row.progress)"></el-progress>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="180"></el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="showProjectDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination">
          <el-pagination
            :page-size="pageSize"
            :current-page="currentPage"
            :total="total"
            layout="prev, pager, next"
            @current-change="handlePageChange"
          ></el-pagination>
        </div>
      </el-card>
    </div>
    
    <div class="quick-actions">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-card>
            <template #header>
              <h3>快速导航</h3>
            </template>
            <div class="action-list">
              <div 
                v-for="action in quickActions" 
                :key="action.name" 
                class="action-item"
                @click="handleAction(action)"
              >
                <div class="action-icon" :style="{ backgroundColor: action.bgColor }">
                  <span :class="action.icon" :style="{ color: action.color }" class="custom-icon">{{ getActionIcon(action.name) }}</span>
                </div>
                <div class="action-info">
                  <h4>{{ action.name }}</h4>
                  <p>{{ action.desc }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="8">
          <el-card>
            <template #header>
              <h3>通知公告</h3>
            </template>
            <div class="notice-list">
              <div v-for="notice in notices" :key="notice.id" class="notice-item">
                <div class="notice-dot" :style="{ backgroundColor: notice.color }"></div>
                <div class="notice-content">
                  <p class="notice-title">{{ notice.title }}</p>
                  <p class="notice-time">{{ notice.time }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="24" :md="8">
          <el-card>
            <template #header>
              <h3>待办事项</h3>
            </template>
            <div class="todo-list">
              <div v-for="todo in todos" :key="todo.id" class="todo-item">
                <el-checkbox v-model="todo.completed" @change="updateTodoStatus(todo)">{{ todo.content }}</el-checkbox>
                <span class="todo-tag">
                  <el-tag :type="todoTagType(todo)" size="mini">{{ todo.tag }}</el-tag>
                </span>
              </div>
            </div>
            <div class="todo-input">
              <el-input 
                v-model="newTodo" 
                placeholder="添加新的待办事项"
                @keyup.enter="addTodo"
              >
                <template #append>
                  <el-button @click="addTodo">
                    <span class="custom-icon">➕</span>
                  </el-button>
                </template>
              </el-input>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 新建项目弹窗 -->
    <el-dialog
      v-model="createProjectDialogVisible"
      title="新建项目"
      width="500px"
      :before-close="handleCloseCreateProjectDialog"
    >
      <el-form :model="newProjectForm" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="newProjectForm.name" placeholder="请输入项目名称"></el-input>
        </el-form-item>
        <el-form-item label="项目类型">
          <el-select v-model="newProjectForm.type" placeholder="请选择项目类型">
            <el-option 
              v-for="type in projectTypes" 
              :key="type.value" 
              :label="type.label" 
              :value="type.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input 
            v-model="newProjectForm.description" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入项目描述"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createProjectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createNewProject">创建</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="projectDetailDialogVisible"
      :title="selectedProject ? selectedProject.name : '项目详情'"
      width="600px"
    >
      <div v-if="selectedProject" class="project-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="项目名称">{{ selectedProject.name }}</el-descriptions-item>
          <el-descriptions-item label="项目类型">{{ selectedProject.type }}</el-descriptions-item>
          <el-descriptions-item label="项目进度">
            <el-progress 
              :percentage="selectedProject.progress" 
              :color="progressColor(selectedProject.progress)"
            ></el-progress>
          </el-descriptions-item>
          <el-descriptions-item label="项目状态">
            <el-tag :type="statusType(selectedProject.status)">{{ selectedProject.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ selectedProject.updateTime }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="project-actions" style="margin-top: 20px;">
          <el-button type="primary" @click="openProject(selectedProject)">打开项目</el-button>
          <el-button @click="showCollaborators(selectedProject)">协作成员</el-button>
          <el-button @click="showProjectMaterials(selectedProject)">申报材料</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="projectDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 快速操作弹窗 -->
    <el-dialog
      v-model="actionDialogVisible"
      :title="selectedAction ? selectedAction.name : '操作'"
      width="500px"
    >
      <div v-if="selectedAction" class="action-detail">
        <p>{{ selectedAction.desc }}</p>
        <div style="margin-top: 20px;">
          <p>此功能将引导您完成{{ selectedAction.name.toLowerCase() }}流程。</p>
          <p>平台提供智能引导和模板支持，帮助您高效完成政策项目申报。</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="actionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAction">开始</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const stats = ref({
  ongoingProjects: 12,
  completedProjects: 8,
  collaborators: 5,
  pendingMessages: 23
})

// 项目数据
const projects = ref([
  {
    id: 1,
    name: '2023年科技创新基金申报',
    type: '科技创新',
    progress: 65,
    status: '进行中',
    updateTime: '2023-06-15 14:30',
    icon: 'trophy-icon',
    color: '#ff4d4f',
    description: '申报2023年度科技创新基金项目，重点支持人工智能、大数据等领域的技术研发'
  },
  {
    id: 2,
    name: '中小企业发展专项资金',
    type: '企业发展',
    progress: 100,
    status: '已完成',
    updateTime: '2023-06-10 09:15',
    icon: 'building-icon',
    color: '#1890ff',
    description: '中小企业发展专项资金申报，支持企业技术创新和转型升级'
  },
  {
    id: 3,
    name: '文化创意产业扶持计划',
    type: '文化创意',
    progress: 30,
    status: '进行中',
    updateTime: '2023-06-14 16:45',
    icon: 'film-icon',
    color: '#52c41a',
    description: '文化创意产业扶持计划申报，支持文创产品开发和IP打造'
  },
  {
    id: 4,
    name: '绿色能源技术研发项目',
    type: '能源环保',
    progress: 80,
    status: '进行中',
    updateTime: '2023-06-13 11:20',
    icon: 'leaf-icon',
    color: '#52c41a',
    description: '绿色能源技术研发项目申报，支持太阳能、风能等可再生能源技术研发'
  },
  {
    id: 5,
    name: '数字经济示范区建设',
    type: '数字经济',
    progress: 45,
    status: '进行中',
    updateTime: '2023-06-12 09:30',
    icon: 'data-icon',
    color: '#722ed1',
    description: '数字经济示范区建设项目申报，推动数字技术与实体经济深度融合'
  }
])

// 分页相关
const pageSize = ref(5)
const currentPage = ref(1)
const total = computed(() => projects.value.length)

const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return projects.value.slice(start, end)
})

// 快速操作
const quickActions = ref([
  {
    name: '新建项目',
    desc: '创建新的政策申报项目',
    icon: 'plus-icon',
    bgColor: '#e6f7ff',
    color: '#1890ff'
  },
  {
    name: '模板库',
    desc: '使用模板快速创建',
    icon: 'template-icon',
    bgColor: '#f6ffed',
    color: '#52c41a'
  },
  {
    name: '协作管理',
    desc: '管理项目成员与权限',
    icon: 'user-icon',
    bgColor: '#fff7e6',
    color: '#fa8c16'
  },
  {
    name: '材料库',
    desc: '管理常用申报材料',
    icon: 'folder-icon',
    bgColor: '#f9f0ff',
    color: '#722ed1'
  }
])

// 通知公告
const notices = ref([
  {
    id: 1,
    title: '系统将于本周六凌晨进行维护升级',
    time: '2小时前',
    color: '#ff4d4f'
  },
  {
    id: 2,
    title: '新增5个政策申报模板',
    time: '昨天',
    color: '#1890ff'
  },
  {
    id: 3,
    title: '2023年第二季度政策解读培训通知',
    time: '3天前',
    color: '#52c41a'
  }
])

// 待办事项
const todos = ref([
  { id: 1, content: '审核科技创新基金申报材料', completed: false, tag: '紧急', deadline: '今天' },
  { id: 2, content: '准备项目进度汇报文档', completed: false, tag: '重要', deadline: '明天' },
  { id: 3, content: '联系张主任确认申报要求', completed: true, tag: '一般', deadline: '本周' }
])

const newTodo = ref('')

// 弹窗控制
const createProjectDialogVisible = ref(false)
const projectDetailDialogVisible = ref(false)
const actionDialogVisible = ref(false)

// 选中的项目和操作
const selectedProject = ref(null)
const selectedAction = ref(null)

// 新建项目表单
const newProjectForm = ref({
  name: '',
  type: '',
  description: ''
})

// 项目类型选项
const projectTypes = ref([
  { value: '科技创新', label: '科技创新' },
  { value: '企业发展', label: '企业发展' },
  { value: '文化创意', label: '文化创意' },
  { value: '能源环保', label: '能源环保' },
  { value: '数字经济', label: '数字经济' }
])

// 方法
const progressColor = (progress) => {
  if (progress < 30) return '#ff4d4f'
  if (progress < 70) return '#faad14'
  return '#52c41a'
}

const statusType = (status) => {
  const statusMap = {
    '进行中': 'primary',
    '已完成': 'success',
    '已暂停': 'warning',
    '已取消': 'danger'
  }
  return statusMap[status] || 'info'
}

const todoTagType = (todo) => {
  const tagMap = {
    '紧急': 'danger',
    '重要': 'warning',
    '一般': 'info'
  }
  return tagMap[todo.tag] || 'info'
}

const getProjectIcon = (type) => {
  const iconMap = {
    '科技创新': '🔬',
    '企业发展': '🏢',
    '文化创意': '🎨',
    '能源环保': '🌿',
    '数字经济': '💻'
  }
  return iconMap[type] || '📋'
}

const getActionIcon = (actionName) => {
  const iconMap = {
    '新建项目': '➕',
    '模板库': '📋',
    '协作管理': '👥',
    '材料库': '📁'
  }
  return iconMap[actionName] || '⚡'
}

const showProjectDetail = (project) => {
  selectedProject.value = project
  projectDetailDialogVisible.value = true
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const handleAction = (action) => {
  selectedAction.value = action
  
  if (action.name === '新建项目') {
    showCreateProjectDialog()
  } else {
    actionDialogVisible.value = true
  }
}

const addTodo = () => {
  if (!newTodo.value.trim()) {
    ElMessage.warning('请输入待办事项内容')
    return
  }
  
  todos.value.unshift({
    id: Date.now(),
    content: newTodo.value,
    completed: false,
    tag: '一般',
    deadline: '未设定'
  })
  
  ElMessage.success('待办事项已添加')
  newTodo.value = ''
}

const updateTodoStatus = (todo) => {
  const status = todo.completed ? '完成' : '待办'
  ElMessage.success(`标记为${status}: ${todo.content}`)
}

const showCreateProjectDialog = () => {
  newProjectForm.value = { name: '', type: '', description: '' }
  createProjectDialogVisible.value = true
}

const handleCloseCreateProjectDialog = (done) => {
  ElMessageBox.confirm('确定要取消创建项目吗?')
    .then(() => {
      done()
    })
    .catch(() => {
      // 取消关闭
    })
}

const createNewProject = () => {
  if (!newProjectForm.value.name || !newProjectForm.value.type) {
    ElMessage.warning('请填写项目名称和类型')
    return
  }
  
  const newProject = {
    id: Date.now(),
    name: newProjectForm.value.name,
    type: newProjectForm.value.type,
    progress: 0,
    status: '进行中',
    updateTime: new Date().toLocaleString(),
    icon: 'new-icon',
    color: '#1890ff',
    description: newProjectForm.value.description
  }
  
  projects.value.unshift(newProject)
  createProjectDialogVisible.value = false
  
  ElMessage.success(`项目"${newProjectForm.value.name}"创建成功`)
}

const openProject = (project) => {
  ElMessage.info(`打开项目: ${project.name}`)
  projectDetailDialogVisible.value = false
}

const showCollaborators = (project) => {
  ElMessage.info(`查看项目"${project.name}"的协作成员`)
}

const showProjectMaterials = (project) => {
  ElMessage.info(`查看项目"${project.name}"的申报材料`)
}

const confirmAction = () => {
  if (selectedAction.value) {
    ElMessage.success(`开始${selectedAction.value.name}`)
    actionDialogVisible.value = false
  }
}

// 模拟数据加载
onMounted(() => {
  ElMessage.success('政策项目申报平台已加载完成')
})
</script>

<style lang="scss" scoped>

@use './SystemSetting.scss';

</style>