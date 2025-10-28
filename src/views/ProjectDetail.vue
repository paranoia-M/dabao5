<template>
  <div class="project-detail-container">
    <!-- 项目基本信息 -->
    <el-card class="project-info-card" shadow="hover">
      <div class="project-header">
        <h1 class="project-title">航清噪音项目申报综合管理系统</h1>
        <div class="project-status">
          <el-tag type="success" size="large">进行中</el-tag>
          <span class="update-time">最后更新：2023-11-15</span>
        </div>
      </div>
      
      <el-divider />
      
      <div class="basic-info">
        <div class="info-grid">
          <div class="info-item">
            <label>项目编号：</label>
            <span>PROJ-2023-001</span>
          </div>
          <div class="info-item">
            <label>负责人：</label>
            <span>张主任</span>
          </div>
          <div class="info-item">
            <label>开始时间：</label>
            <span>2023-10-01</span>
          </div>
          <div class="info-item">
            <label>截止时间：</label>
            <span>2023-12-31</span>
          </div>
          <div class="info-item">
            <label>参与部门：</label>
            <span>政策研究室、财务处、技术部</span>
          </div>
          <div class="info-item">
            <label>当前进度：</label>
            <span>
              <el-progress :percentage="65" :show-text="false" style="width: 150px" />
              <span class="progress-text">65%</span>
            </span>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- 材料列表 -->
    <el-card class="materials-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2>申报材料清单</h2>
          <div class="header-actions">
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索材料名称" 
              style="width: 200px; margin-right: 10px" 
              clearable 
            >
              <template #prefix>
                <span class="custom-input-icon">🔍</span>
              </template>
            </el-input>
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable>
              <el-option label="未开始" value="pending" />
              <el-option label="进行中" value="processing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </div>
        </div>
      </template>
      
      <el-table :data="pagedMaterials" style="width: 100%" empty-text="暂无材料" stripe>
        <el-table-column prop="name" label="材料名称" min-width="200" />
        <el-table-column prop="department" label="负责部门" width="120" />
        <el-table-column prop="person" label="负责人" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="row.status === 'completed' ? 'success' : row.status === 'processing' ? 'warning' : 'info'">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="进度" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :status="row.status === 'completed' ? 'success' : ''" />
          </template>
        </el-table-column>
        <el-table-column prop="deadline" label="截止时间" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewMaterial(row)">查看</el-button>
            <el-button link type="primary" @click="editMaterial(row)" v-if="row.status !== 'completed'">编辑</el-button>
            <el-button link type="primary" @click="showCollaboration(row)" v-if="row.status === 'processing'">协作</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[5, 10, 20, 50]"
          :small="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredMaterials.length"
        />
      </div>
    </el-card>
    
    <!-- 协作动态 -->
    <el-card class="activities-card" shadow="hover">
      <template #header>
        <h2>协作动态</h2>
      </template>
      
      <el-timeline>
        <el-timeline-item
          v-for="(activity, index) in activities"
          :key="index"
          :timestamp="activity.time"
          :type="activity.type"
          placement="top"
        >
          <el-card shadow="never">
            <h4>{{ activity.title }}</h4>
            <p>{{ activity.content }}</p>
            <p class="activity-user">{{ activity.user }} · {{ activity.department }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 查看材料弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="`查看材料 - ${currentMaterial.name}`"
      width="60%"
    >
      <div class="material-view-content">
        <h3>材料详情</h3>
        <div class="material-info">
          <p><strong>材料名称：</strong>{{ currentMaterial.name }}</p>
          <p><strong>负责部门：</strong>{{ currentMaterial.department }}</p>
          <p><strong>负责人：</strong>{{ currentMaterial.person }}</p>
          <p><strong>截止时间：</strong>{{ currentMaterial.deadline }}</p>
          <p><strong>当前状态：</strong>{{ statusText(currentMaterial.status) }}</p>
          <p><strong>进度：</strong>{{ currentMaterial.progress }}%</p>
        </div>
        
        <el-divider />
        
        <h3>版本历史</h3>
        <el-timeline>
          <el-timeline-item
            v-for="(version, index) in materialVersions"
            :key="index"
            :timestamp="version.time"
            placement="top"
          >
            <p>{{ version.description }}</p>
            <p class="version-user">{{ version.user }} · {{ version.department }}</p>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="viewDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="downloadMaterial(currentMaterial)">下载最新版本</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑材料弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="`编辑材料 - ${currentMaterial.name}`"
      width="50%"
    >
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="材料名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="负责部门">
          <el-input v-model="editForm.department" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="editForm.person" />
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker
            v-model="editForm.deadline"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="当前进度">
          <el-slider v-model="editForm.progress" :step="10" show-stops />
          <span style="margin-left: 10px">{{ editForm.progress }}%</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="editForm.status" placeholder="请选择状态">
            <el-option label="未开始" value="pending" />
            <el-option label="进行中" value="processing" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新说明">
          <el-input
            v-model="editForm.updateNote"
            type="textarea"
            :rows="3"
            placeholder="请输入本次更新的说明"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMaterialEdit">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 协作弹窗 -->
    <el-dialog
      v-model="collaborationDialogVisible"
      :title="`协作 - ${currentMaterial.name}`"
      width="70%"
    >
      <div class="collaboration-content">
        <div class="collaboration-header">
          <h3>材料协作编辑</h3>
          <el-button type="primary" @click="addComment">添加评论</el-button>
        </div>
        
        <el-divider />
        
        <div class="collaboration-comments">
          <h4>协作记录</h4>
          
          <div v-for="(comment, index) in materialComments" :key="index" class="comment-item">
            <div class="comment-header">
              <span class="comment-user">{{ comment.user }}</span>
              <span class="comment-time">{{ comment.time }}</span>
            </div>
            <div class="comment-content">
              {{ comment.content }}
            </div>
            <el-divider v-if="index < materialComments.length - 1" />
          </div>
          
          <div v-if="materialComments.length === 0" class="no-comments">
            暂无协作记录
          </div>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="collaborationDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="uploadNewVersion">上传新版本</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索和筛选
const searchKeyword = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(5)

// 弹窗控制
const viewDialogVisible = ref(false)
const editDialogVisible = ref(false)
const collaborationDialogVisible = ref(false)
const currentMaterial = ref({})

// 编辑表单
const editForm = ref({
  name: '',
  department: '',
  person: '',
  deadline: '',
  progress: 0,
  status: '',
  updateNote: ''
})

// 假数据 - 申报材料列表
const materials = ref([
  { id: 1, name: '项目申报书', department: '政策研究室', person: '张三', status: 'completed', progress: 100, deadline: '2023-10-15' },
  { id: 2, name: '可行性研究报告', department: '政策研究室', person: '李四', status: 'completed', progress: 100, deadline: '2023-10-20' },
  { id: 3, name: '预算方案', department: '财务处', person: '王五', status: 'processing', progress: 80, deadline: '2023-11-20' },
  { id: 4, name: '技术实施方案', department: '技术部', person: '赵六', status: 'processing', progress: 50, deadline: '2023-11-30' },
  { id: 5, name: '风险评估报告', department: '政策研究室', person: '张三', status: 'pending', progress: 0, deadline: '2023-12-10' },
  { id: 6, name: '效益分析报告', department: '财务处', person: '王五', status: 'pending', progress: 0, deadline: '2023-12-15' },
  { id: 7, name: '附件材料', department: '政策研究室', person: '李四', status: 'processing', progress: 30, deadline: '2023-12-20' }
])

// 假数据 - 协作动态
const activities = ref([
  { 
    time: '2023-11-15 14:30', 
    type: 'primary', 
    title: '更新了技术实施方案', 
    content: '根据最新政策要求调整了技术实现路径', 
    user: '赵六', 
    department: '技术部' 
  },
  { 
    time: '2023-11-14 10:15', 
    type: 'success', 
    title: '完成了预算方案初稿', 
    content: '已完成预算方案的80%，等待相关部门审核', 
    user: '王五', 
    department: '财务处' 
  },
  { 
    time: '2023-11-10 16:45', 
    type: 'success', 
    title: '提交了可行性研究报告', 
    content: '研究报告已通过初审，等待最终审批', 
    user: '李四', 
    department: '政策研究室' 
  },
  { 
    time: '2023-11-05 09:20', 
    type: 'success', 
    title: '项目启动会议', 
    content: '召开了项目启动会，明确了各部门职责和时间节点', 
    user: '张主任', 
    department: '政策研究室' 
  }
])

// 假数据 - 材料版本历史
const materialVersions = ref([
  { time: '2023-11-15 14:30', description: '根据最新政策要求调整了技术实现路径', user: '赵六', department: '技术部' },
  { time: '2023-11-10 09:45', description: '初版技术实施方案提交', user: '赵六', department: '技术部' },
  { time: '2023-11-05 16:20', description: '创建技术实施方案文档', user: '赵六', department: '技术部' }
])

// 假数据 - 材料评论
const materialComments = ref([
  { time: '2023-11-15 14:30', content: '已根据最新政策要求调整了技术实现路径，请审核。', user: '赵六' },
  { time: '2023-11-12 10:15', content: '技术实施方案需要增加对数据安全的相关描述。', user: '张主任' },
  { time: '2023-11-10 09:45', content: '初版技术实施方案已完成，请各位同事审阅。', user: '赵六' }
])

// 计算属性 - 过滤材料
const filteredMaterials = computed(() => {
  let result = materials.value
  
  // 根据关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) || 
      item.department.toLowerCase().includes(keyword) ||
      item.person.toLowerCase().includes(keyword)
    )
  }
  
  // 根据状态筛选
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  return result
})

// 计算属性 - 分页材料
const pagedMaterials = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMaterials.value.slice(start, end)
})

// 状态文本映射
const statusText = (status) => {
  const statusMap = {
    'pending': '未开始',
    'processing': '进行中',
    'completed': '已完成'
  }
  return statusMap[status] || '未知'
}

// 查看材料详情
const viewMaterial = (material) => {
  currentMaterial.value = material
  viewDialogVisible.value = true
}

// 编辑材料
const editMaterial = (material) => {
  currentMaterial.value = material
  
  // 填充编辑表单
  editForm.value = {
    name: material.name,
    department: material.department,
    person: material.person,
    deadline: material.deadline,
    progress: material.progress,
    status: material.status,
    updateNote: ''
  }
  
  editDialogVisible.value = true
}

// 保存材料编辑
const saveMaterialEdit = () => {
  // 更新材料数据
  const index = materials.value.findIndex(item => item.id === currentMaterial.value.id)
  if (index !== -1) {
    materials.value[index] = {
      ...materials.value[index],
      name: editForm.value.name,
      department: editForm.value.department,
      person: editForm.value.person,
      deadline: editForm.value.deadline,
      progress: editForm.value.progress,
      status: editForm.value.status
    }
    
    // 添加协作动态
    activities.value.unshift({
      time: new Date().toLocaleString(),
      type: 'primary',
      title: `更新了${editForm.value.name}`,
      content: editForm.value.updateNote || '无更新说明',
      user: '当前用户',
      department: editForm.value.department
    })
    
    ElMessage.success('材料信息更新成功')
    editDialogVisible.value = false
  }
}

// 显示协作弹窗
const showCollaboration = (material) => {
  currentMaterial.value = material
  collaborationDialogVisible.value = true
}

// 添加评论
const addComment = () => {
  ElMessageBox.prompt('请输入评论内容', '添加评论', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'textarea',
    inputValidator: (value) => {
      if (!value || value.trim().length === 0) {
        return '评论内容不能为空'
      }
      return true
    }
  }).then(({ value }) => {
    materialComments.value.unshift({
      time: new Date().toLocaleString(),
      content: value,
      user: '当前用户'
    })
    
    ElMessage.success('评论添加成功')
  }).catch(() => {
    // 用户取消
  })
}

// 上传新版本
const uploadNewVersion = () => {
  ElMessage.info('模拟上传新版本功能')
  // 实际项目中这里会有文件上传逻辑
}

// 下载材料
const downloadMaterial = (material) => {
  ElMessage.success(`开始下载: ${material.name}`)
  // 实际项目中这里会有文件下载逻辑
}

// 模拟数据加载
onMounted(() => {
  // 这里可以模拟异步数据加载
  ElMessage.success('项目详情加载完成')
})
</script>

<style lang="scss" scoped>

@use './ProjectDetail.scss';

</style>