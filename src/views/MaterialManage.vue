<template>
  <div class="material-manage">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>政策项目申报材料管理</h1>
      <p>在线协同编辑与管理申报材料</p>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索材料名称或编号"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <span class="input-prefix-icon">🔍</span>
            </template>
          </el-input>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8">
          <el-select
            v-model="filterStatus"
            placeholder="按状态筛选"
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
        <el-col :xs="24" :sm="24" :md="8" class="text-right">
          <el-button type="primary" @click="handleCreate" class="create-btn">
            <span class="btn-icon">+</span>
            新建材料
          </el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 材料列表 -->
    <div class="material-list">
      <el-table
        :data="paginatedMaterials"
        style="width: 100%"
        empty-text="暂无申报材料"
        v-loading="loading"
        class="material-table"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="材料名称" min-width="200" />
        <el-table-column prop="projectName" label="所属项目" min-width="180" />
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column prop="updateTime" label="更新时间" width="160" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
              class="status-tag"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              size="small"
              @click="handleEdit(row)"
              class="action-btn edit-btn"
            >
              <span class="btn-icon">✏️</span>
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
              class="action-btn delete-btn"
            >
              <span class="btn-icon">🗑️</span>
              删除
            </el-button>
            <el-button
              size="small"
              @click="handleCollaborate(row)"
              class="action-btn collaborate-btn"
            >
              <span class="btn-icon">👥</span>
              协同
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页控件 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="filteredMaterials.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新建/编辑材料对话框 -->
    <el-dialog
      :title="isEditing ? '编辑材料' : '新建材料'"
      v-model="dialogVisible"
      width="600px"
      class="material-dialog"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="材料名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入材料名称"
          />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectName">
          <el-input
            v-model="formData.projectName"
            placeholder="请输入所属项目名称"
          />
        </el-form-item>
        <el-form-item label="材料描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入材料描述"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="formData.status"
            placeholder="请选择状态"
          >
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
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handleSubmit" class="submit-btn">
            {{ isEditing ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      title="确认删除"
      v-model="deleteDialogVisible"
      width="400px"
      class="delete-dialog"
    >
      <p>确定要删除材料 "{{ currentMaterial?.name }}" 吗？此操作不可恢复。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="deleteDialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">确认删除</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 协同编辑弹窗 -->
    <el-dialog
      title="材料协同编辑"
      v-model="collaborateDialogVisible"
      width="800px"
      class="collaborate-dialog"
    >
      <div class="collaborate-content">
        <h3>《{{ currentMaterial?.name }}》协同编辑</h3>
        <div class="collaborators-list">
          <h4>当前协作者</h4>
          <div class="collaborators">
            <div class="collaborator" v-for="(user, index) in collaborators" :key="index">
              <span class="user-avatar">👤</span>
              <span class="user-name">{{ user.name }}</span>
              <span class="user-role" :class="user.role">{{ user.role === 'owner' ? '负责人' : '编辑者' }}</span>
            </div>
          </div>
        </div>
        <div class="version-history">
          <h4>版本历史</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(version, index) in versionHistory"
              :key="index"
              :timestamp="version.time"
            >
              {{ version.user }} {{ version.action }}
            </el-timeline-item>
          </el-timeline>
        </div>
        <div class="invite-section">
          <h4>邀请协作者</h4>
          <el-input
            v-model="inviteEmail"
            placeholder="输入邮箱地址邀请协作者"
            class="invite-input"
          >
            <template #append>
              <el-button @click="handleInvite" class="invite-btn">发送邀请</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 假数据生成
const generateMockData = () => {
  const statuses = ['draft', 'reviewing', 'approved', 'rejected']
  const statusTexts = {
    draft: '草稿',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  
  const materials = []
  for (let i = 1; i <= 45; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    materials.push({
      id: i,
      name: `申报材料_${i}`,
      projectName: `政策项目_${Math.ceil(i / 5)}`,
      creator: `用户${Math.ceil(Math.random() * 10)}`,
      createTime: `2023-${Math.ceil(Math.random() * 12).toString().padStart(2, '0')}-${Math.ceil(Math.random() * 28).toString().padStart(2, '0')}`,
      updateTime: `2023-${Math.ceil(Math.random() * 12).toString().padStart(2, '0')}-${Math.ceil(Math.random() * 28).toString().padStart(2, '0')}`,
      status: status,
      description: `这是第${i}个政策项目申报材料的描述信息，包含项目相关的内容和要求。`
    })
  }
  return materials
}

// 状态选项
const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' }
]

// 响应式数据
const materials = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const deleteDialogVisible = ref(false)
const collaborateDialogVisible = ref(false)
const isEditing = ref(false)
const currentMaterial = ref(null)
const inviteEmail = ref('')

// 协同相关数据
const collaborators = ref([
  { name: '当前用户', role: 'owner' },
  { name: '张三', role: 'editor' },
  { name: '李四', role: 'editor' }
])

const versionHistory = ref([
  { time: '2023-10-15 14:30', user: '当前用户', action: '创建了文档' },
  { time: '2023-10-16 09:15', user: '张三', action: '更新了项目背景' },
  { time: '2023-10-16 16:45', user: '李四', action: '添加了附件' }
])

// 表单数据
const formData = reactive({
  name: '',
  projectName: '',
  description: '',
  status: 'draft'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入材料名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  projectName: [
    { required: true, message: '请输入所属项目名称', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 计算属性
const filteredMaterials = computed(() => {
  let result = materials.value
  
  // 根据关键词筛选
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(keyword) || 
      item.id.toString().includes(keyword) ||
      item.projectName.toLowerCase().includes(keyword)
    )
  }
  
  // 根据状态筛选
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  return result
})

const paginatedMaterials = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredMaterials.value.slice(start, end)
})

// 方法
const getStatusType = (status) => {
  const types = {
    draft: '',
    reviewing: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || ''
}

const getStatusText = (status) => {
  const texts = {
    draft: '草稿',
    reviewing: '审核中',
    approved: '已通过',
    rejected: '已驳回'
  }
  return texts[status] || '未知'
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleCreate = () => {
  isEditing.value = false
  // 重置表单数据
  Object.assign(formData, {
    name: '',
    projectName: '',
    description: '',
    status: 'draft'
  })
  dialogVisible.value = true
}

const handleEdit = (material) => {
  isEditing.value = true
  currentMaterial.value = material
  // 填充表单数据
  Object.assign(formData, {
    name: material.name,
    projectName: material.projectName,
    description: material.description || '',
    status: material.status
  })
  dialogVisible.value = true
}

const handleDelete = (material) => {
  currentMaterial.value = material
  deleteDialogVisible.value = true
}

const handleCollaborate = (material) => {
  currentMaterial.value = material
  collaborateDialogVisible.value = true
}

const handleInvite = () => {
  if (!inviteEmail.value) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  
  // 模拟发送邀请
  ElMessage.success(`已向 ${inviteEmail.value} 发送协同编辑邀请`)
  inviteEmail.value = ''
}

const handleSubmit = () => {
  // 这里应该有表单验证，但由于没有ref，我们手动触发验证
  if (!formData.name.trim()) {
    ElMessage.warning('请输入材料名称')
    return
  }
  
  if (!formData.projectName.trim()) {
    ElMessage.warning('请输入所属项目名称')
    return
  }
  
  if (isEditing.value) {
    // 更新现有材料
    const index = materials.value.findIndex(item => item.id === currentMaterial.value.id)
    if (index !== -1) {
      materials.value[index] = {
        ...materials.value[index],
        name: formData.name,
        projectName: formData.projectName,
        description: formData.description,
        status: formData.status,
        updateTime: new Date().toLocaleDateString()
      }
      ElMessage.success('材料更新成功')
    }
  } else {
    // 添加新材料
    const newId = materials.value.length > 0 ? Math.max(...materials.value.map(item => item.id)) + 1 : 1
    materials.value.unshift({
      id: newId,
      name: formData.name,
      projectName: formData.projectName,
      description: formData.description,
      status: formData.status,
      creator: '当前用户',
      createTime: new Date().toLocaleDateString(),
      updateTime: new Date().toLocaleDateString()
    })
    ElMessage.success('材料创建成功')
  }
  
  dialogVisible.value = false
}

const confirmDelete = () => {
  if (currentMaterial.value) {
    const index = materials.value.findIndex(item => item.id === currentMaterial.value.id)
    if (index !== -1) {
      materials.value.splice(index, 1)
      ElMessage.success('材料删除成功')
    }
  }
  deleteDialogVisible.value = false
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

// 生命周期
onMounted(() => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    materials.value = generateMockData()
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './MaterialManage.scss';

</style>