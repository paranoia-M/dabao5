<template>
  <div class="user-management-container">
    <div class="header">
      <h2 class="system-title">网络安全用户管理系统</h2>
      <div class="operation-area">
        <el-input
          v-model="searchQuery"
          placeholder="搜索用户名或邮箱"
          clearable
          style="width: 300px"
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
          class="security-search"
        >
          <template #append>
            <el-button @click="handleSearch" class="search-btn">
              <span class="search-icon">🔍</span>
            </el-button>
          </template>
        </el-input>
        <el-button type="primary" @click="showAddDialog = true" class="add-user-btn">
          <span class="btn-icon">+</span> 添加用户
        </el-button>
      </div>
    </div>

    <el-table
      :data="filteredUsers"
      border
      style="width: 100%"
      v-loading="loading"
      :row-class-name="tableRowClassName"
      class="security-table"
    >
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="email" label="邮箱" width="200" />
      <el-table-column prop="role" label="角色" width="120">
        <template #default="scope">
          <el-tag :type="getRoleTagType(scope.row.role)" effect="light">
            {{ scope.row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="禁用"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="lastLogin" label="最后登录" width="180" />
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="scope">
          <el-button
            size="small"
            @click="handleEdit(scope.row)"
            class="edit-btn"
          >✏️ 编辑</el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(scope.row)"
            class="delete-btn"
          >🗑️ 删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalUsers"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="security-pagination"
      />
    </div>

    <!-- 添加用户对话框 -->
    <el-dialog v-model="showAddDialog" title="添加新用户" width="500" class="security-dialog">
      <el-form :model="newUserForm" label-width="100px" label-position="left">
        <el-form-item label="用户名" required>
          <el-input v-model="newUserForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="newUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="newUserForm.password" type="password" show-password placeholder="请输入密码" />
          <div class="password-strength">
            <span :class="{'weak': passwordStrength === 'weak'}">弱</span>
            <span :class="{'medium': passwordStrength === 'medium'}">中</span>
            <span :class="{'strong': passwordStrength === 'strong'}">强</span>
          </div>
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="newUserForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="审计员" value="auditor" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddDialog = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handleAddUser" class="confirm-btn">确认添加</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑用户对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑用户信息" width="500" class="security-dialog">
      <el-form :model="editUserForm" label-width="100px" label-position="left">
        <el-form-item label="用户名">
          <el-input v-model="editUserForm.username" disabled />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="editUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="editUserForm.password" type="password" show-password placeholder="留空则不修改" />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="editUserForm.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="审计员" value="auditor" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" required>
          <el-switch
            v-model="editUserForm.status"
            active-value="active"
            inactive-value="inactive"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditDialog = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handleEditSubmit" class="confirm-btn">确认修改</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 安全审计日志弹窗 -->
    <el-dialog v-model="showAuditLog" title="安全审计日志" width="700" class="audit-log-dialog">
      <el-table :data="auditLogs" border style="width: 100%">
        <el-table-column prop="time" label="时间" width="150" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="target" label="目标用户" width="120" />
        <el-table-column prop="details" label="详细信息" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据
const mockUsers = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  username: `user${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ['admin', 'operator', 'auditor'][Math.floor(Math.random() * 3)],
  status: Math.random() > 0.3 ? 'active' : 'inactive',
  lastLogin: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleString(),
}))

// 模拟审计日志
const mockAuditLogs = [
  {
    time: new Date().toLocaleString(),
    action: '添加用户',
    operator: 'admin',
    target: 'user51',
    details: '添加了新用户user51，角色为操作员'
  },
  {
    time: new Date(Date.now() - 1000 * 60 * 5).toLocaleString(),
    action: '修改状态',
    operator: 'admin',
    target: 'user12',
    details: '将用户user12状态修改为禁用'
  },
  {
    time: new Date(Date.now() - 1000 * 60 * 30).toLocaleString(),
    action: '删除用户',
    operator: 'auditor1',
    target: 'user7',
    details: '删除了用户user7'
  }
]

// 状态管理
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalUsers = ref(0)
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showAuditLog = ref(false)
const auditLogs = ref(mockAuditLogs)

// 表单数据
const newUserForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'operator',
})

const editUserForm = ref({
  id: 0,
  username: '',
  email: '',
  password: '',
  role: '',
  status: 'active',
})

// 密码强度计算
const passwordStrength = computed(() => {
  if (!newUserForm.value.password) return ''
  if (newUserForm.value.password.length < 6) return 'weak'
  if (newUserForm.value.password.length < 10) return 'medium'
  return 'strong'
})

// 计算属性
const filteredUsers = computed(() => {
  let result = users.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      user =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    )
  }
  
  totalUsers.value = result.length
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return result.slice(start, end)
})

// 方法
const fetchUsers = () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    users.value = mockUsers
    totalUsers.value = mockUsers.length
    loading.value = false
    // 记录审计日志
    addAuditLog('查看用户列表', '系统', '', '加载了所有用户数据')
  }, 800)
}

const handleSearch = () => {
  currentPage.value = 1
  addAuditLog('搜索用户', '系统', '', `搜索关键词: ${searchQuery.value}`)
}

const handleSearchClear = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleAddUser = () => {
  if (!newUserForm.value.username || !newUserForm.value.email || !newUserForm.value.password) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  // 检查用户名是否已存在
  if (users.value.some(user => user.username === newUserForm.value.username)) {
    ElMessage.warning('用户名已存在')
    return
  }
  
  // 检查邮箱是否已存在
  if (users.value.some(user => user.email === newUserForm.value.email)) {
    ElMessage.warning('邮箱已被注册')
    return
  }
  
  const newUser = {
    id: users.value.length + 1,
    username: newUserForm.value.username,
    email: newUserForm.value.email,
    role: newUserForm.value.role,
    status: 'active',
    lastLogin: new Date().toLocaleString(),
  }
  
  users.value.unshift(newUser)
  showAddDialog.value = false
  ElMessage.success('添加用户成功')
  
  // 记录审计日志
  addAuditLog('添加用户', 'admin', newUser.username, `添加了新用户: ${newUser.username}, 角色: ${newUser.role}`)
  
  // 重置表单
  newUserForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'operator',
  }
}

const handleEdit = (user) => {
  editUserForm.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
    status: user.status,
  }
  showEditDialog.value = true
}

const handleEditSubmit = () => {
  if (!editUserForm.value.email) {
    ElMessage.warning('请填写邮箱')
    return
  }
  
  const index = users.value.findIndex(user => user.id === editUserForm.value.id)
  if (index !== -1) {
    const oldData = {...users.value[index]}
    users.value[index].email = editUserForm.value.email
    users.value[index].role = editUserForm.value.role
    users.value[index].status = editUserForm.value.status
    
    if (editUserForm.value.password) {
      // 模拟密码更新
      ElMessage.success('密码已更新')
    }
    
    showEditDialog.value = false
    ElMessage.success('用户信息已更新')
    
    // 记录审计日志
    let changes = []
    if (oldData.email !== editUserForm.value.email) changes.push(`邮箱从 ${oldData.email} 改为 ${editUserForm.value.email}`)
    if (oldData.role !== editUserForm.value.role) changes.push(`角色从 ${oldData.role} 改为 ${editUserForm.value.role}`)
    if (oldData.status !== editUserForm.value.status) changes.push(`状态从 ${oldData.status} 改为 ${editUserForm.value.status}`)
    if (editUserForm.value.password) changes.push('密码已修改')
    
    if (changes.length > 0) {
      addAuditLog('修改用户', 'admin', editUserForm.value.username, changes.join('; '))
    }
  }
}

const handleDelete = (user) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.username} 吗？此操作不可恢复。`,
    '安全警告',
    {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'security-confirm'
    }
  ).then(() => {
    users.value = users.value.filter(u => u.id !== user.id)
    ElMessage.success('用户已删除')
    addAuditLog('删除用户', 'admin', user.username, `删除了用户 ${user.username}`)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleStatusChange = (user) => {
  ElMessage.success(`用户 ${user.username} 状态已更新为 ${user.status === 'active' ? '启用' : '禁用'}`)
  addAuditLog('修改状态', 'admin', user.username, `将用户状态修改为 ${user.status}`)
}

const getRoleTagType = (role) => {
  switch (role) {
    case 'admin': return 'danger'
    case 'operator': return 'primary'
    case 'auditor': return 'warning'
    default: return 'info'
  }
}

const tableRowClassName = ({ row }) => {
  return row.status === 'inactive' ? 'inactive-row' : ''
}

const addAuditLog = (action, operator, target, details) => {
  auditLogs.value.unshift({
    time: new Date().toLocaleString(),
    action,
    operator,
    target,
    details
  })
}

const showAuditLogDialog = () => {
  showAuditLog.value = true
}

// 生命周期钩子
onMounted(() => {
  fetchUsers()
})

// 监听密码变化
watch(() => newUserForm.value.password, (newVal) => {
  if (newVal && newVal.length > 0) {
    // 这里可以添加密码强度检查逻辑
  }
})
</script>

<style lang="scss" scoped>
@use './UserManagement.scss';
</style>