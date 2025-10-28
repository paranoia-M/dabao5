<template>
  <div class="home-container">
    <!-- 顶部横幅 -->
    <div class="hero-banner">
      <div class="hero-content">
        <h1 class="hero-title">航清噪音项目申报综合管理系统</h1>
        <p class="hero-subtitle">一站式政策项目申报解决方案，高效协同，智能管理</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="showCreateProjectDialog">
            新建项目
          </el-button>
          <el-button size="large" @click="showGuideDialog">
            查看申报指南
          </el-button>
        </div>
      </div>
    </div>

    <!-- 数据统计 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalProjects }}</div>
            <div class="stat-label">总项目数</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.teamMembers }}</div>
            <div class="stat-label">团队成员</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 功能特性展示 -->
    <div class="features-section">
      <h2 class="section-title">平台核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon document-icon">
            <span class="icon-text">📄</span>
          </div>
          <h3>材料智能管理</h3>
          <p>统一管理申报材料，版本清晰，随时调用</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon user-icon">
            <span class="icon-text">👥</span>
          </div>
          <h3>多角色协同</h3>
          <p>申报人、审核人、管理员高效协作</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon time-icon">
            <span class="icon-text">⏱️</span>
          </div>
          <h3>进度实时追踪</h3>
          <p>申报进度一目了然，关键节点及时提醒</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon policy-icon">
            <span class="icon-text">📋</span>
          </div>
          <h3>政策精准匹配</h3>
          <p>智能推荐适合申报的政策项目</p>
        </div>
      </div>
    </div>

    <!-- 最近项目 -->
    <div class="recent-projects">
      <div class="section-header">
        <h2 class="section-title">最近项目</h2>
        <el-button type="text" @click="showAllProjects">查看全部</el-button>
      </div>
      
      <el-table :data="recentProjects" style="width: 100%" empty-text="暂无项目数据" stripe>
        <el-table-column prop="name" label="项目名称" min-width="200" />
        <el-table-column prop="policy" label="政策类型" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" width="120" />
        <el-table-column prop="lastUpdate" label="最后更新" width="140" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showProjectDetail(row)">
              查看
            </el-button>
            <el-button link type="primary" size="small" @click="showEditProject(row)">
              编辑
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog v-model="createProjectDialogVisible" title="新建项目" width="500px">
      <el-form :model="newProjectForm" label-width="80px">
        <el-form-item label="项目名称">
          <el-input v-model="newProjectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="政策类型">
          <el-select v-model="newProjectForm.policy" placeholder="请选择政策类型">
            <el-option label="科技创新" value="科技创新" />
            <el-option label="产业扶持" value="产业扶持" />
            <el-option label="绿色发展" value="绿色发展" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker v-model="newProjectForm.deadline" type="date" placeholder="选择截止日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createProjectDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createNewProject">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="guideDialogVisible" title="申报指南" width="700px">
      <div class="guide-content">
        <h3>政策项目申报流程</h3>
        <ol>
          <li>选择适合的政策项目类型</li>
          <li>准备相关申报材料</li>
          <li>填写项目基本信息</li>
          <li>上传所需证明文件</li>
          <li>提交申报并等待审核</li>
          <li>根据反馈修改完善材料</li>
        </ol>
        <h3>常见问题</h3>
        <p>1. 如何选择适合的政策项目？</p>
        <p>2. 申报材料需要准备哪些？</p>
        <p>3. 申报截止时间是什么时候？</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="guideDialogVisible = false">我知道了</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="projectDetailDialogVisible" :title="'项目详情 - ' + currentProject.name" width="600px">
      <div class="project-detail">
        <p><strong>项目名称：</strong>{{ currentProject.name }}</p>
        <p><strong>政策类型：</strong>{{ currentProject.policy }}</p>
        <p><strong>当前状态：</strong>{{ currentProject.status }}</p>
        <p><strong>截止日期：</strong>{{ currentProject.deadline }}</p>
        <p><strong>最后更新：</strong>{{ currentProject.lastUpdate }}</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="projectDetailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="allProjectsDialogVisible" title="全部项目" width="80%">
      <el-table :data="allProjects" stripe>
        <el-table-column prop="name" label="项目名称" min-width="200" />
        <el-table-column prop="policy" label="政策类型" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止日期" width="120" />
        <el-table-column prop="lastUpdate" label="最后更新" width="140" />
      </el-table>
      <template #footer>
        <el-button @click="allProjectsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'

// 模拟数据
const recentProjects = ref([
  {
    id: 1,
    name: '2023年度高新技术企业认定',
    policy: '科技创新',
    status: '审核中',
    deadline: '2023-10-15',
    lastUpdate: '2023-09-20'
  },
  {
    id: 2,
    name: '中小企业发展专项资金申报',
    policy: '产业扶持',
    status: '草稿',
    deadline: '2023-11-30',
    lastUpdate: '2023-09-18'
  },
  {
    id: 3,
    name: '节能减排技术改造项目',
    policy: '绿色发展',
    status: '已提交',
    deadline: '2023-12-05',
    lastUpdate: '2023-09-15'
  }
])

const stats = ref({
  totalProjects: 15,
  inProgress: 8,
  completed: 5,
  teamMembers: 12
})

// 弹窗控制
const createProjectDialogVisible = ref(false)
const guideDialogVisible = ref(false)
const projectDetailDialogVisible = ref(false)
const allProjectsDialogVisible = ref(false)
const currentProject = ref({})

// 表单数据
const newProjectForm = reactive({
  name: '',
  policy: '',
  deadline: ''
})

// 模拟全部项目数据
const allProjects = ref([
  ...recentProjects.value,
  {
    id: 4,
    name: '文化产业发展专项资金',
    policy: '文化创意',
    status: '审核通过',
    deadline: '2023-08-30',
    lastUpdate: '2023-08-15'
  },
  {
    id: 5,
    name: '农业产业化重点项目',
    policy: '农业发展',
    status: '审核驳回',
    deadline: '2023-09-10',
    lastUpdate: '2023-09-05'
  }
])

// 状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    '草稿': 'info',
    '已提交': '',
    '审核中': 'warning',
    '审核通过': 'success',
    '审核驳回': 'danger'
  }
  return statusMap[status] || ''
}

// 交互处理函数
const showCreateProjectDialog = () => {
  createProjectDialogVisible.value = true
}

const showGuideDialog = () => {
  guideDialogVisible.value = true
}

const showAllProjects = () => {
  allProjectsDialogVisible.value = true
}

const showProjectDetail = (project) => {
  currentProject.value = project
  projectDetailDialogVisible.value = true
}

const showEditProject = (project) => {
  ElMessage.info(`即将编辑项目: ${project.name}`)
  // 这里可以打开编辑项目的弹窗
}

const createNewProject = () => {
  if (!newProjectForm.name || !newProjectForm.policy || !newProjectForm.deadline) {
    ElMessage.warning('请填写完整项目信息')
    return
  }
  
  // 模拟创建新项目
  const newProject = {
    id: Date.now(),
    name: newProjectForm.name,
    policy: newProjectForm.policy,
    status: '草稿',
    deadline: newProjectForm.deadline,
    lastUpdate: new Date().toLocaleDateString()
  }
  
  recentProjects.value.unshift(newProject)
  stats.value.totalProjects += 1
  stats.value.inProgress += 1
  
  ElMessage.success('项目创建成功')
  createProjectDialogVisible.value = false
  
  // 重置表单
  newProjectForm.name = ''
  newProjectForm.policy = ''
  newProjectForm.deadline = ''
}

// 模拟数据加载
onMounted(() => {
  // 模拟异步加载数据
  setTimeout(() => {
    ElMessage.success('数据加载完成')
  }, 500)
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>