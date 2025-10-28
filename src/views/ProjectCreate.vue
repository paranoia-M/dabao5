<template>
  <div class="project-create-container">
    <div class="page-header">
      <h1>航清噪音项目申报综合管理系统</h1>
      <p>一站式完成项目申报材料的创建、管理与协作</p>
    </div>
    
    <div class="create-content">
      <el-card class="create-card">
        <template #header>
          <div class="card-header">
            <span class="card-title">创建新项目</span>
            <span class="card-subtitle">开始您的项目申报之旅</span>
          </div>
        </template>
        
        <el-form 
          :model="formData" 
          :rules="formRules" 
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="项目名称" prop="name">
            <el-input 
              v-model="formData.name" 
              placeholder="请输入项目名称"
              size="large"
            />
          </el-form-item>
          
          <el-form-item label="项目类型" prop="type">
            <el-select 
              v-model="formData.type" 
              placeholder="请选择项目类型"
              size="large"
              style="width: 100%"
            >
              <el-option 
                v-for="item in projectTypes" 
                :key="item.value" 
                :label="item.label" 
                :value="item.value" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="项目描述" prop="description">
            <el-input 
              v-model="formData.description" 
              type="textarea" 
              :rows="4"
              placeholder="请输入项目详细描述"
            />
          </el-form-item>
          
          <el-form-item label="申报截止日期" prop="deadline">
            <el-date-picker
              v-model="formData.deadline"
              type="date"
              placeholder="选择截止日期"
              style="width: 100%"
              size="large"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              :loading="submitting"
              @click="handleSubmit"
              style="width: 100%"
              class="create-btn"
            >
              创建项目
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <div class="recent-projects">
        <div class="section-header">
          <h2>最近项目</h2>
          <el-button type="text" @click="showAllProjects">查看全部</el-button>
        </div>
        <el-table :data="recentProjects" style="width: 100%" empty-text="暂无项目" class="project-table">
          <el-table-column prop="name" label="项目名称" />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              <el-tag :type="getTagType(scope.row.type)" class="type-tag">{{ scope.row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="scope">
              <el-tag 
                :type="scope.row.status === '已完成' ? 'success' : 'warning'"
                class="status-tag"
              >
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="deadline" label="截止日期" width="120" />
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button link type="primary" size="small" @click="viewProject(scope.row)" class="action-btn">
                查看详情
              </el-button>
              <el-button link type="primary" size="small" @click="collaborateProject(scope.row)" class="action-btn">
                协同编辑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <!-- 项目详情弹窗 -->
    <el-dialog 
      v-model="projectDetailVisible" 
      :title="selectedProject ? selectedProject.name : '项目详情'"
      width="50%"
      custom-class="project-dialog"
    >
      <div v-if="selectedProject" class="project-detail">
        <div class="detail-item">
          <label>项目类型：</label>
          <span>{{ selectedProject.type }}</span>
        </div>
        <div class="detail-item">
          <label>项目状态：</label>
          <el-tag :type="selectedProject.status === '已完成' ? 'success' : 'warning'">
            {{ selectedProject.status }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>截止日期：</label>
          <span>{{ selectedProject.deadline }}</span>
        </div>
        <div class="detail-item full-width">
          <label>项目描述：</label>
          <p>{{ selectedProject.description || '暂无描述' }}</p>
        </div>
        <div class="detail-item full-width">
          <label>协作成员：</label>
          <div class="collaborators">
            <div class="collaborator" v-for="(member, index) in collaborators" :key="index">
              <span class="avatar">{{ member.name.charAt(0) }}</span>
              <span class="name">{{ member.name }}</span>
              <span class="role">{{ member.role }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="projectDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="editProject(selectedProject)">编辑项目</el-button>
      </template>
    </el-dialog>
    
    <!-- 协同编辑弹窗 -->
    <el-dialog 
      v-model="collaborateVisible" 
      title="项目协同编辑"
      width="60%"
      custom-class="collaborate-dialog"
    >
      <div v-if="selectedProject" class="collaborate-content">
        <h3>{{ selectedProject.name }} - 材料协同编辑</h3>
        <div class="document-list">
          <div class="document-item" v-for="(doc, index) in documents" :key="index">
            <div class="doc-icon">📄</div>
            <div class="doc-info">
              <div class="doc-name">{{ doc.name }}</div>
              <div class="doc-meta">最后更新: {{ doc.updatedAt }} · 由 {{ doc.updatedBy }} 编辑</div>
            </div>
            <div class="doc-actions">
              <el-button size="small" @click="editDocument(doc)">编辑</el-button>
              <el-button size="small" @click="viewDocument(doc)">预览</el-button>
            </div>
          </div>
        </div>
        <div class="add-document">
          <el-button type="primary" @click="addDocument">添加申报材料</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="collaborateVisible = false">关闭</el-button>
        <el-button type="primary" @click="inviteCollaborator">邀请协作者</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表单数据
const formData = reactive({
  name: '',
  type: '',
  description: '',
  deadline: ''
})

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择项目类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' },
    { min: 10, message: '至少输入10个字符', trigger: 'blur' }
  ],
  deadline: [
    { required: true, message: '请选择截止日期', trigger: 'change' }
  ]
})

// 项目类型选项
const projectTypes = ref([
  { label: '科技创新类', value: '科技创新类' },
  { label: '产业发展类', value: '产业发展类' },
  { label: '人才引进类', value: '人才引进类' },
  { label: '文化教育类', value: '文化教育类' },
  { label: '医疗卫生类', value: '医疗卫生类' }
])

// 最近项目数据
const recentProjects = ref([
  { 
    id: 1, 
    name: '人工智能产业扶持项目', 
    type: '产业发展类', 
    status: '进行中', 
    deadline: '2023-12-15',
    description: '针对人工智能领域的产业扶持项目，旨在推动AI技术在各行业的应用和发展。'
  },
  { 
    id: 2, 
    name: '高层次人才引进计划', 
    type: '人才引进类', 
    status: '已完成', 
    deadline: '2023-11-20',
    description: '引进海内外高层次人才，促进本地科技创新和产业升级。'
  },
  { 
    id: 3, 
    name: '智慧医疗创新平台', 
    type: '医疗卫生类', 
    status: '进行中', 
    deadline: '2024-01-10',
    description: '构建智慧医疗创新平台，整合医疗资源，提升医疗服务效率和质量。'
  }
])

const submitting = ref(false)
const projectDetailVisible = ref(false)
const collaborateVisible = ref(false)
const selectedProject = ref(null)

// 模拟协作者数据
const collaborators = ref([
  { name: '张三', role: '项目负责人' },
  { name: '李四', role: '材料撰写' },
  { name: '王五', role: '资料收集' }
])

// 模拟文档数据
const documents = ref([
  { 
    id: 1, 
    name: '项目申报书.docx', 
    updatedAt: '2023-11-05 14:30', 
    updatedBy: '张三',
    content: '项目申报书内容...'
  },
  { 
    id: 2, 
    name: '可行性研究报告.pdf', 
    updatedAt: '2023-11-04 10:15', 
    updatedBy: '李四',
    content: '可行性研究报告内容...'
  },
  { 
    id: 3, 
    name: '预算明细表.xlsx', 
    updatedAt: '2023-11-03 16:45', 
    updatedBy: '王五',
    content: '预算明细表内容...'
  }
])

// 获取标签类型
const getTagType = (type) => {
  const typeMap = {
    '科技创新类': 'success',
    '产业发展类': 'primary',
    '人才引进类': 'warning',
    '文化教育类': 'info',
    '医疗卫生类': 'danger'
  }
  return typeMap[type] || ''
}

// 提交表单
const handleSubmit = () => {
  // 模拟表单验证和提交
  submitting.value = true
  
  setTimeout(() => {
    // 这里应该是API调用，但根据要求使用假数据
    const newProject = {
      id: recentProjects.value.length + 1,
      name: formData.name,
      type: formData.type,
      description: formData.description,
      status: '进行中',
      deadline: formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''
    }
    
    recentProjects.value.unshift(newProject)
    
    // 重置表单
    Object.keys(formData).forEach(key => {
      formData[key] = ''
    })
    
    submitting.value = false
    ElMessage.success('项目创建成功！')
    
    // 显示项目创建成功提示
    showCreateSuccess(newProject)
  }, 1500)
}

// 查看项目
const viewProject = (project) => {
  selectedProject.value = project
  projectDetailVisible.value = true
}

// 协同编辑项目
const collaborateProject = (project) => {
  selectedProject.value = project
  collaborateVisible.value = true
}

// 显示所有项目
const showAllProjects = () => {
  ElMessage.info('功能开发中，即将展示全部项目列表')
}

// 编辑项目
const editProject = (project) => {
  ElMessageBox.prompt('请输入新的项目名称', '编辑项目', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: project.name
  }).then(({ value }) => {
    project.name = value
    ElMessage.success('项目名称已更新')
  }).catch(() => {
    ElMessage.info('取消编辑')
  })
}

// 编辑文档
const editDocument = (doc) => {
  ElMessage.info(`开始编辑文档: ${doc.name}`)
}

// 查看文档
const viewDocument = (doc) => {
  ElMessage.info(`预览文档: ${doc.name}`)
}

// 添加文档
const addDocument = () => {
  ElMessageBox.prompt('请输入新文档名称', '添加申报材料', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPlaceholder: '文档名称'
  }).then(({ value }) => {
    if (value) {
      const newDoc = {
        id: documents.value.length + 1,
        name: value,
        updatedAt: new Date().toLocaleString(),
        updatedBy: '当前用户',
        content: ''
      }
      documents.value.push(newDoc)
      ElMessage.success('文档添加成功')
    }
  }).catch(() => {
    ElMessage.info('取消添加')
  })
}

// 邀请协作者
const inviteCollaborator = () => {
  ElMessageBox.prompt('请输入协作者邮箱', '邀请协作者', {
    confirmButtonText: '发送邀请',
    cancelButtonText: '取消',
    inputPlaceholder: 'email@example.com',
    inputPattern: /\S+@\S+\.\S+/,
    inputErrorMessage: '邮箱格式不正确'
  }).then(({ value }) => {
    ElMessage.success(`邀请已发送至: ${value}`)
  }).catch(() => {
    ElMessage.info('取消邀请')
  })
}

// 显示创建成功提示
const showCreateSuccess = (project) => {
  ElMessageBox.alert(`项目"${project.name}"创建成功！您可以开始添加申报材料并邀请团队成员协作。`, '创建成功', {
    confirmButtonText: '开始协作',
    callback: () => {
      collaborateProject(project)
    }
  })
}

onMounted(() => {
  // 组件挂载时可以执行的操作
})
</script>

<style lang="scss" scoped>

@use './ProjectCreate.scss';

</style>