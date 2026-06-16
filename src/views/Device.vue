
<template>
  <div class="device-management-container">
    <div class="header-area">
      <h2 class="system-title">智慧广播管理系统</h2>
      <div class="operation-panel">
        <div class="search-box">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索设备名称或ID" 
            clearable 
            class="search-input"
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch" class="search-btn">搜索</el-button>
            </template>
          </el-input>
        </div>
        <el-button type="primary" @click="showAddDialog" class="add-btn">
          <span class="btn-text">添加设备</span>
        </el-button>
      </div>
    </div>

    <div class="content-card">
      <el-table 
        :data="filteredDevices" 
        border 
        class="device-table"
        v-loading="loading"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
      >
        <el-table-column prop="id" label="设备ID" width="120" align="center" />
        <el-table-column prop="name" label="设备名称" width="180" />
        <el-table-column prop="type" label="设备类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getDeviceTypeTag(row.type)" class="type-tag">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : 'danger'" class="status-tag">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="安装位置" />
        <el-table-column prop="lastActive" label="最后活跃时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" class="edit-btn">编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row.id)"
              class="delete-btn"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-area">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalDevices"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 添加/编辑设备对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      class="device-dialog"
    >
      <el-form :model="deviceForm" label-width="100px" class="device-form">
        <el-form-item label="设备名称" required>
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" class="form-input" />
        </el-form-item>
        <el-form-item label="设备类型" required>
          <el-select v-model="deviceForm.type" placeholder="请选择设备类型" class="form-select">
            <el-option 
              v-for="item in deviceTypes" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" required>
          <el-input v-model="deviceForm.location" placeholder="请输入安装位置" class="form-input" />
        </el-form-item>
        <el-form-item label="状态" required>
          <el-radio-group v-model="deviceForm.status" class="status-radio">
            <el-radio label="在线">在线</el-radio>
            <el-radio label="离线">离线</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="handleSubmit" class="confirm-btn">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="设备详情"
      width="500px"
      class="detail-dialog"
    >
      <div class="device-detail">
        <div class="detail-item">
          <span class="detail-label">设备ID：</span>
          <span class="detail-value">{{ currentDeviceDetail.id }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">设备名称：</span>
          <span class="detail-value">{{ currentDeviceDetail.name }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">设备类型：</span>
          <el-tag :type="getDeviceTypeTag(currentDeviceDetail.type)" class="detail-tag">
            {{ currentDeviceDetail.type }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="detail-label">状态：</span>
          <el-tag :type="currentDeviceDetail.status === '在线' ? 'success' : 'danger'" class="detail-tag">
            {{ currentDeviceDetail.status }}
          </el-tag>
        </div>
        <div class="detail-item">
          <span class="detail-label">安装位置：</span>
          <span class="detail-value">{{ currentDeviceDetail.location }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">最后活跃时间：</span>
          <span class="detail-value">{{ currentDeviceDetail.lastActive }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="detailDialogVisible = false" class="close-btn">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据
const mockDevices = Array.from({ length: 50 }, (_, i) => ({
  id: `DEV${1000 + i}`,
  name: `广播设备${i + 1}`,
  type: ['音箱', '功放', '控制器', '麦克风'][Math.floor(Math.random() * 4)],
  status: Math.random() > 0.3 ? '在线' : '离线',
  location: ['教学楼A栋', '图书馆', '操场', '食堂', '行政楼'][Math.floor(Math.random() * 5)],
  lastActive: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleString()
}))

// 响应式数据
const devices = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEditMode = ref(false)
const currentDeviceId = ref('')
const currentDeviceDetail = ref({})

// 设备类型选项
const deviceTypes = [
  { value: '音箱', label: '音箱' },
  { value: '功放', label: '功放' },
  { value: '控制器', label: '控制器' },
  { value: '麦克风', label: '麦克风' },
]

// 设备表单
const deviceForm = ref({
  name: '',
  type: '',
  location: '',
  status: '在线'
})

// 计算属性
const totalDevices = computed(() => devices.value.length)
const filteredDevices = computed(() => {
  let result = devices.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      device => 
        device.name.toLowerCase().includes(query) || 
        device.id.toLowerCase().includes(query)
    )
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const dialogTitle = computed(() => isEditMode.value ? '编辑设备' : '添加设备')

// 方法
const getDeviceTypeTag = (type) => {
  switch (type) {
    case '音箱': return ''
    case '功放': return 'info'
    case '控制器': return 'warning'
    case '麦克风': return 'success'
    default: return ''
  }
}

const fetchDevices = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    devices.value = mockDevices
    loading.value = false
  }, 800)
}

const handleSearch = () => {
  currentPage.value = 1
  // 模拟搜索功能
  ElMessage.success('搜索完成')
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

const showAddDialog = () => {
  isEditMode.value = false
  deviceForm.value = {
    name: '',
    type: '',
    location: '',
    status: '在线'
  }
  dialogVisible.value = true
}

const showDeviceDetail = (device) => {
  currentDeviceDetail.value = device
  detailDialogVisible.value = true
}

const handleEdit = (row) => {
  isEditMode.value = true
  currentDeviceId.value = row.id
  deviceForm.value = {
    name: row.name,
    type: row.type,
    location: row.location,
    status: row.status
  }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除该设备吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    devices.value = devices.value.filter(device => device.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSubmit = () => {
  if (!deviceForm.value.name || !deviceForm.value.type || !deviceForm.value.location) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (isEditMode.value) {
    // 更新设备
    const index = devices.value.findIndex(device => device.id === currentDeviceId.value)
    if (index !== -1) {
      devices.value[index] = {
        ...devices.value[index],
        ...deviceForm.value
      }
    }
    ElMessage.success('设备更新成功')
  } else {
    // 添加设备
    const newId = `DEV${1000 + devices.value.length}`
    devices.value.unshift({
      id: newId,
      ...deviceForm.value,
      lastActive: new Date().toLocaleString()
    })
    ElMessage.success('设备添加成功')
  }
  
  dialogVisible.value = false
}

// 生命周期钩子
onMounted(() => {
  fetchDevices()
})
</script>

<style lang="scss" scoped>

@use './Device.scss';

</style>
