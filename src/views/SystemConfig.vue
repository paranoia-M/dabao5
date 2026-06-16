
<template>
  <div class="system-config-container">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">网络安全配置中心</span>
          <el-button type="primary" @click="handleAdd" class="add-btn">
            <span class="btn-text">+ 新增安全配置</span>
          </el-button>
        </div>
      </template>

      <div class="filter-container">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索安全配置项" 
          class="search-input" 
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button class="search-btn" @click="handleSearch">
              <span class="search-icon">🔍</span>
            </el-button>
          </template>
        </el-input>

        <el-select 
          v-model="filterStatus" 
          placeholder="配置状态" 
          clearable 
          class="status-select"
          @change="handleFilterChange"
        >
          <el-option label="全部状态" value="" />
          <el-option label="已启用" value="active" />
          <el-option label="已禁用" value="inactive" />
        </el-select>
      </div>

      <el-table 
        :data="filteredConfigs" 
        border 
        class="config-table" 
        v-loading="loading"
      >
        <el-table-column prop="name" label="安全配置项" width="200" />
        <el-table-column prop="value" label="参数值" width="150" />
        <el-table-column prop="description" label="安全描述" />
        <el-table-column prop="status" label="运行状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" class="status-tag">
              {{ row.status === 'active' ? '运行中' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="最后更新" width="180" />
        <el-table-column label="安全操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" class="edit-btn" @click="handleEdit(row)">配置修改</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'active' ? 'danger' : 'success'" 
              class="toggle-btn"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'active' ? '立即停用' : '激活配置' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="security-pagination"
        />
      </div>
    </el-card>

    <!-- 安全配置编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="650px"
      :before-close="handleCloseDialog"
      class="config-dialog"
    >
      <el-form 
        :model="formData" 
        label-width="140px" 
        :rules="formRules"
        class="config-form"
      >
        <el-form-item label="安全配置名称" prop="name" class="form-item">
          <el-input v-model="formData.name" placeholder="请输入安全配置项名称" />
        </el-form-item>
        <el-form-item label="安全参数值" prop="value" class="form-item">
          <el-input v-model="formData.value" placeholder="请输入安全参数值" />
        </el-form-item>
        <el-form-item label="安全描述" prop="description" class="form-item">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入该安全配置的详细描述"
            class="desc-textarea"
          />
        </el-form-item>
        <el-form-item label="配置状态" prop="status" class="form-item">
          <el-switch 
            v-model="formData.status" 
            active-value="active" 
            inactive-value="inactive"
            active-text="启用" 
            inactive-text="禁用"
            class="status-switch"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCancelConfirm" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handleSubmit" class="confirm-btn">安全确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟网络安全配置数据
const mockData = [
  {
    id: 1,
    name: '防火墙日志保留',
    value: '90天',
    description: '网络安全防火墙日志保留周期，建议不少于90天',
    status: 'active',
    updateTime: '2023-05-15 10:30:22'
  },
  {
    id: 2,
    name: '入侵检测灵敏度',
    value: '高级',
    description: '网络入侵检测系统(IDS)的检测灵敏度设置',
    status: 'active',
    updateTime: '2023-05-16 14:12:45'
  },
  {
    id: 3,
    name: '漏洞扫描频率',
    value: '每周',
    description: '系统自动漏洞扫描的执行频率设置',
    status: 'inactive',
    updateTime: '2023-05-10 09:15:33'
  },
  {
    id: 4,
    name: '登录失败锁定',
    value: '5次',
    description: '登录失败次数达到阈值后账户自动锁定',
    status: 'active',
    updateTime: '2023-05-18 16:45:12'
  },
  {
    id: 5,
    name: '数据加密强度',
    value: 'AES-256',
    description: '敏感数据传输和存储的加密算法标准',
    status: 'active',
    updateTime: '2023-05-17 11:20:18'
  },
  {
    id: 6,
    name: '会话超时时间',
    value: '30分钟',
    description: '用户无操作后的会话自动超时时间',
    status: 'active',
    updateTime: '2023-05-19 09:45:22'
  },
  {
    id: 7,
    name: 'VPN访问限制',
    value: '启用',
    description: '限制非授权IP访问VPN网络',
    status: 'inactive',
    updateTime: '2023-05-12 13:30:15'
  }
]

// 响应式数据
const configList = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增安全配置')
const isEdit = ref(false)
const currentId = ref(null)

const formData = ref({
  name: '',
  value: '',
  description: '',
  status: 'active'
})

const formRules = {
  name: [
    { required: true, message: '安全配置名称不能为空', trigger: 'blur' },
    { min: 3, max: 50, message: '长度在3到50个字符', trigger: 'blur' }
  ],
  value: [
    { required: true, message: '安全参数值不能为空', trigger: 'blur' },
    { min: 1, max: 100, message: '长度在1到100个字符', trigger: 'blur' }
  ]
}

// 计算属性
const filteredConfigs = computed(() => {
  let result = configList.value
  
  if (searchQuery.value) {
    result = result.filter(item => 
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  total.value = result.length
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

// 生命周期钩子
onMounted(() => {
  fetchConfigList()
})

// 方法
const fetchConfigList = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    configList.value = [...mockData]
    total.value = configList.value.length
    loading.value = false
  }, 800)
}

const handleSearch = () => {
  currentPage.value = 1
  ElMessage.success('安全配置搜索完成')
}

const handleSearchClear = () => {
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleAdd = () => {
  dialogTitle.value = '新增安全配置'
  isEdit.value = false
  formData.value = {
    name: '',
    value: '',
    description: '',
    status: 'active'
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑安全配置'
  isEdit.value = true
  currentId.value = row.id
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleToggleStatus = (row) => {
  const newStatus = row.status === 'active' ? 'inactive' : 'active'
  const action = newStatus === 'active' ? '启用' : '禁用'
  
  ElMessageBox.confirm(
    `确定要${action}安全配置"${row.name}"吗?`,
    '安全操作确认',
    {
      confirmButtonText: '安全确认',
      cancelButtonText: '取消操作',
      type: 'warning',
      customClass: 'security-message-box'
    }
  ).then(() => {
    loading.value = true
    // 模拟请求
    setTimeout(() => {
      const index = configList.value.findIndex(item => item.id === row.id)
      if (index !== -1) {
        configList.value[index].status = newStatus
        configList.value[index].updateTime = new Date().toLocaleString()
        ElMessage.success(`安全配置已${action}`)
      }
      loading.value = false
    }, 500)
  }).catch(() => {
    ElMessage.info('已取消安全操作')
  })
}

const handleSubmit = () => {
  // 表单验证通过后
  loading.value = true
  if (isEdit.value) {
    // 模拟编辑
    setTimeout(() => {
      const index = configList.value.findIndex(item => item.id === currentId.value)
      if (index !== -1) {
        configList.value[index] = {
          ...formData.value,
          id: currentId.value,
          updateTime: new Date().toLocaleString()
        }
      }
      dialogVisible.value = false
      ElMessage.success('安全配置更新成功')
      loading.value = false
    }, 500)
  } else {
    // 模拟新增
    setTimeout(() => {
      const newId = configList.value.length > 0 ? Math.max(...configList.value.map(item => item.id)) + 1 : 1
      configList.value.unshift({
        ...formData.value,
        id: newId,
        updateTime: new Date().toLocaleString()
      })
      dialogVisible.value = false
      ElMessage.success('安全配置添加成功')
      loading.value = false
    }, 500)
  }
}

const showCancelConfirm = () => {
  ElMessageBox.confirm('确定要放弃当前编辑吗? 所有未保存的修改将会丢失', '安全操作确认', {
    confirmButtonText: '确认离开',
    cancelButtonText: '继续编辑',
    type: 'warning',
    customClass: 'security-message-box'
  }).then(() => {
    dialogVisible.value = false
  }).catch(() => {
    // 继续编辑
  })
}

const handleCloseDialog = (done) => {
  showCancelConfirm()
  done()
}
</script>

<style lang="scss" scoped>

@use './SystemConfig.scss';

</style>
