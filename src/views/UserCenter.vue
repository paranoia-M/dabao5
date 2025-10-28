<template>
  <div class="user-center">
    <div class="welcome-section">
      <h1>航清噪音项目申报综合管理系统</h1>
      <p>一站式政策项目申报解决方案，助力企业高效完成申报工作</p>
    </div>
    
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">28</div>
            <div class="stat-label">进行中项目</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">14</div>
            <div class="stat-label">待审核材料</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">7</div>
            <div class="stat-label">即将截止</div>
          </div>
        </el-col>
        <el-col :xs="12" :sm="6">
          <div class="stat-card">
            <div class="stat-value">36</div>
            <div class="stat-label">已完成项目</div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <div class="main-content">
      <el-row :gutter="20">
        <el-col :xs="24" :lg="16">
          <div class="card recent-projects">
            <div class="card-header">
              <h3>最近项目</h3>
              <el-input
                v-model="searchQuery"
                placeholder="搜索项目"
                class="search-input"
                clearable
              >
                <template #prefix>
                  <span class="custom-search-icon">🔍</span>
                </template>
              </el-input>
            </div>
            
            <el-table :data="filteredProjects" style="width: 100%" empty-text="暂无项目数据">
              <el-table-column prop="name" label="项目名称" min-width="200" />
              <el-table-column prop="type" label="项目类型" width="120" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <el-tag 
                    :type="row.status === '进行中' ? 'primary' : row.status === '已完成' ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="deadline" label="截止日期" width="120" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="viewProject(row)">
                    查看
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :page-sizes="[5, 10, 20, 50]"
                :small="true"
                :background="true"
                layout="total, sizes, prev, pager, next"
                :total="projects.length"
              />
            </div>
          </div>
        </el-col>
        
        <el-col :xs="24" :lg="8">
          <div class="card quick-actions">
            <h3>快捷操作</h3>
            <div class="action-buttons">
              <el-button type="primary" class="action-btn" @click="showCreateProjectDialog">
                <span class="btn-icon">📄</span>
                新建项目
              </el-button>
              <el-button class="action-btn" @click="showAllProjectsDialog">
                <span class="btn-icon">📋</span>
                查看所有项目
              </el-button>
              <el-button class="action-btn" @click="showMaterialsDialog">
                <span class="btn-icon">📁</span>
                材料管理
              </el-button>
              <el-button class="action-btn" @click="showTemplatesDialog">
                <span class="btn-icon">📝</span>
                申报模板
              </el-button>
            </div>
          </div>
          
          <div class="card deadlines">
            <h3>即将截止</h3>
            <ul class="deadline-list">
              <li v-for="item in deadlines" :key="item.id" class="deadline-item">
                <div class="deadline-info">
                  <div class="project-name">{{ item.name }}</div>
                  <div class="deadline-date">{{ item.date }}</div>
                </div>
                <el-button link type="primary" size="small" @click="handleDeadline(item)">
                  处理
                </el-button>
              </li>
            </ul>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleClose"
    >
      <div v-if="dialogType === 'createProject'">
        <p>新建项目功能将引导您创建新的政策申报项目。</p>
        <p>请准备以下材料：</p>
        <ul>
          <li>企业基本信息</li>
          <li>项目申报计划</li>
          <li>相关资质证明</li>
        </ul>
      </div>
      
      <div v-if="dialogType === 'allProjects'">
        <p>平台当前共有 {{ projects.length }} 个项目。</p>
        <p>项目类型分布：</p>
        <ul>
          <li v-for="type in projectTypes" :key="type.name">
            {{ type.name }}: {{ type.count }} 个
          </li>
        </ul>
      </div>
      
      <div v-if="dialogType === 'materials'">
        <p>材料管理中心可帮助您管理所有申报材料。</p>
        <p>主要功能：</p>
        <ul>
          <li>材料上传与分类</li>
          <li>版本控制</li>
          <li>协作编辑</li>
          <li>审核流程管理</li>
        </ul>
      </div>
      
      <div v-if="dialogType === 'templates'">
        <p>我们提供多种申报模板，帮助您快速准备材料：</p>
        <ul>
          <li>高新技术企业认定模板</li>
          <li>专项资金申请模板</li>
          <li>科研项目申报模板</li>
          <li>人才计划申请模板</li>
        </ul>
      </div>
      
      <div v-if="dialogType === 'deadline'">
        <p>项目「{{ selectedDeadline?.name }}」截止日期为 {{ selectedDeadline?.date }}。</p>
        <p>请及时完成以下工作：</p>
        <ul>
          <li>检查材料完整性</li>
          <li>提交审核</li>
          <li>确认申报状态</li>
        </ul>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmDialog">
            {{ dialogType === 'createProject' ? '开始创建' : '确定' }}
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
const projects = ref([
  { id: 1, name: '2023年高新技术企业认定', type: '资质认定', status: '进行中', deadline: '2023-08-15' },
  { id: 2, name: '省级专精特新中小企业申报', type: '项目申报', status: '进行中', deadline: '2023-09-01' },
  { id: 3, name: '市级研发费用补贴', type: '资金补贴', status: '待审核', deadline: '2023-07-25' },
  { id: 4, name: '国家级科技计划项目', type: '项目申报', status: '已完成', deadline: '2023-06-10' },
  { id: 5, name: '知识产权贯标认证', type: '资质认定', status: '进行中', deadline: '2023-08-30' },
  { id: 6, name: '数字化转型示范项目', type: '项目申报', status: '进行中', deadline: '2023-09-15' },
  { id: 7, name: '人才引进计划', type: '人才项目', status: '待审核', deadline: '2023-07-30' },
  { id: 8, name: '绿色制造体系示范', type: '项目申报', status: '已完成', deadline: '2023-05-20' }
])

const deadlines = ref([
  { id: 1, name: '市级研发费用补贴', date: '2023-07-25' },
  { id: 2, name: '人才引进计划', date: '2023-07-30' },
  { id: 3, name: '高新技术企业认定', date: '2023-08-15' }
])

// 搜索和分页
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

// 弹窗相关状态
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref('')
const selectedDeadline = ref(null)

// 计算属性：过滤后的项目列表
const filteredProjects = computed(() => {
  let result = projects.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.type.toLowerCase().includes(query)
    )
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 计算属性：项目类型统计
const projectTypes = computed(() => {
  const types = {}
  projects.value.forEach(project => {
    if (!types[project.type]) {
      types[project.type] = 0
    }
    types[project.type]++
  })
  
  return Object.keys(types).map(key => ({
    name: key,
    count: types[key]
  }))
})

// 交互方法
const viewProject = (project) => {
  ElMessage.info(`查看项目: ${project.name}`)
  // 实际项目中这里会跳转到项目详情页
}

const showCreateProjectDialog = () => {
  dialogTitle.value = '新建项目'
  dialogType.value = 'createProject'
  dialogVisible.value = true
}

const showAllProjectsDialog = () => {
  dialogTitle.value = '所有项目'
  dialogType.value = 'allProjects'
  dialogVisible.value = true
}

const showMaterialsDialog = () => {
  dialogTitle.value = '材料管理'
  dialogType.value = 'materials'
  dialogVisible.value = true
}

const showTemplatesDialog = () => {
  dialogTitle.value = '申报模板'
  dialogType.value = 'templates'
  dialogVisible.value = true
}

const handleDeadline = (item) => {
  dialogTitle.value = '处理截止项目'
  dialogType.value = 'deadline'
  selectedDeadline.value = item
  dialogVisible.value = true
}

const handleClose = (done) => {
  done()
}

const confirmDialog = () => {
  dialogVisible.value = false
  
  if (dialogType.value === 'createProject') {
    ElMessage.success('开始创建新项目')
  } else {
    ElMessage.success('操作成功')
  }
}

// 模拟数据加载
onMounted(() => {
  // 这里可以模拟异步数据加载
  ElMessage.success('首页数据加载完成')
})
</script>

<style lang="scss" scoped>

@use './UserCenter.scss';

</style>