
<template>
  <div class="calibration-container">
    <el-card class="main-card">
      <div class="header">
        <h2 class="platform-title">航清环境、污染应急预案处理系统</h2>
        <div class="operation-area">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索监测点" 
            clearable 
            class="search-input"
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch">搜索</el-button>
            </template>
          </el-input>
          
          <el-select 
            v-model="filterStatus" 
            placeholder="状态筛选" 
            clearable 
            class="status-filter"
          >
            <el-option label="已校准" value="calibrated" />
            <el-option label="待校准" value="pending" />
            <el-option label="异常" value="abnormal" />
          </el-select>
          
          <el-button type="primary" class="add-btn" @click="showAddDialog">
            新增校准
          </el-button>
        </div>
      </div>
      
      <div class="data-overview">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-card success-card">
              <h3>已校准监测点</h3>
              <p class="stat-value">{{ calibratedCount }}</p>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card warning-card">
              <h3>待校准监测点</h3>
              <p class="stat-value">{{ pendingCount }}</p>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-card danger-card">
              <h3>异常监测点</h3>
              <p class="stat-value">{{ abnormalCount }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <el-table 
        :data="filteredData" 
        border 
        stripe 
        class="data-table"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="name" label="监测点名称" width="180" />
        <el-table-column prop="location" label="位置" width="180" />
        <el-table-column prop="currentValue" label="当前值" width="120" align="center">
          <template #default="{ row }">
            <span :class="{ 'warning-text': Math.abs(row.deviation) > 5 }">
              {{ row.currentValue }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="standardValue" label="标准值" width="120" align="center" />
        <el-table-column prop="deviation" label="偏差值" width="120" align="center">
          <template #default="{ row }">
            <span :class="{ 'warning-text': Math.abs(row.deviation) > 5 }">
              {{ row.deviation }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              size="small"
              class="status-tag"
            >
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCalibrated" label="上次校准时间" width="180" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              class="action-btn" 
              @click="handleEdit(row)"
            >编辑</el-button>
            <el-button 
              size="small" 
              type="danger" 
              class="action-btn" 
              @click="handleDelete(row.id)"
            >删除</el-button>
            <el-button 
              size="small" 
              type="success" 
              class="action-btn" 
              @click="handleCalibrate(row.id)"
              v-if="row.status !== 'calibrated'"
            >校准</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :small="small"
          :disabled="disabled"
          :background="background"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      :before-close="handleClose"
      class="calibration-dialog"
    >
      <el-form 
        :model="formData" 
        label-width="120px" 
        :rules="formRules"
        ref="formRef"
      >
        <el-form-item label="监测点名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入监测点名称" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="formData.location" placeholder="请输入监测点位置" />
        </el-form-item>
        <el-form-item label="当前值" prop="currentValue">
          <el-input-number 
            v-model="formData.currentValue" 
            :precision="2" 
            :step="0.1" 
            :min="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="标准值" prop="standardValue">
          <el-input-number 
            v-model="formData.standardValue" 
            :precision="2" 
            :step="0.1" 
            :min="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="已校准" value="calibrated" />
            <el-option label="待校准" value="pending" />
            <el-option label="异常" value="abnormal" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 校准确认弹窗 -->
    <el-dialog
      v-model="calibrationConfirmVisible"
      title="校准确认"
      width="400px"
    >
      <p>确定要对监测点 {{ currentCalibrationPoint }} 进行校准吗？</p>
      <template #footer>
        <el-button @click="calibrationConfirmVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCalibration">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据
const mockData = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `监测点 ${i + 1}`,
  location: `区域 ${Math.floor(i / 10) + 1}`,
  currentValue: +(Math.random() * 100).toFixed(2),
  standardValue: +(50 + Math.random() * 30).toFixed(2),
  deviation: 0,
  status: ['calibrated', 'pending', 'abnormal'][Math.floor(Math.random() * 3)],
  lastCalibrated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString()
}))

// 计算偏差值
mockData.forEach(item => {
  item.deviation = +(item.currentValue - item.standardValue).toFixed(2)
})

// 表格数据相关
const tableData = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const small = ref(false)
const disabled = ref(false)
const background = ref(true)
const total = ref(0)
const formRef = ref(null)

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增校准')
const formData = ref({
  id: null,
  name: '',
  location: '',
  currentValue: 0,
  standardValue: 0,
  status: 'pending'
})

// 校准确认相关
const calibrationConfirmVisible = ref(false)
const currentCalibrationPoint = ref('')
const currentCalibrationId = ref(null)

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入监测点名称', trigger: 'blur' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }],
  currentValue: [{ required: true, message: '请输入当前值', trigger: 'blur' }],
  standardValue: [{ required: true, message: '请输入标准值', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 计算属性
const filteredData = computed(() => {
  let data = tableData.value
  
  // 搜索过滤
  if (searchQuery.value) {
    data = data.filter(item => 
      item.name.includes(searchQuery.value) || 
      item.location.includes(searchQuery.value)
    )
  }
  
  // 状态过滤
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }
  
  // 分页
  total.value = data.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

const calibratedCount = computed(() => {
  return tableData.value.filter(item => item.status === 'calibrated').length
})

const pendingCount = computed(() => {
  return tableData.value.filter(item => item.status === 'pending').length
})

const abnormalCount = computed(() => {
  return tableData.value.filter(item => item.status === 'abnormal').length
})

// 方法
const loadData = () => {
  loading.value = true
  // 模拟异步加载
  setTimeout(() => {
    tableData.value = mockData
    loading.value = false
  }, 500)
}

const handleSearch = () => {
  currentPage.value = 1
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
  dialogTitle.value = '新增校准'
  formData.value = {
    id: null,
    name: '',
    location: '',
    currentValue: 0,
    standardValue: 0,
    status: 'pending'
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑校准信息'
  formData.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除此监测点吗?', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    tableData.value = tableData.value.filter(item => item.id !== id)
    ElMessage.success('删除成功')
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleCalibrate = (id) => {
  const point = tableData.value.find(item => item.id === id)
  if (point) {
    currentCalibrationPoint.value = point.name
    currentCalibrationId.value = id
    calibrationConfirmVisible.value = true
  }
}

const confirmCalibration = () => {
  loading.value = true
  // 模拟校准操作
  setTimeout(() => {
    const index = tableData.value.findIndex(item => item.id === currentCalibrationId.value)
    if (index !== -1) {
      tableData.value[index].status = 'calibrated'
      tableData.value[index].lastCalibrated = new Date().toLocaleString()
      tableData.value[index].currentValue = tableData.value[index].standardValue
      tableData.value[index].deviation = 0
      ElMessage.success('校准成功')
    }
    loading.value = false
    calibrationConfirmVisible.value = false
  }, 800)
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    
    // 计算偏差
    formData.value.deviation = +(formData.value.currentValue - formData.value.standardValue).toFixed(2)
    
    if (formData.value.id) {
      // 编辑
      const index = tableData.value.findIndex(item => item.id === formData.value.id)
      if (index !== -1) {
        tableData.value[index] = { ...formData.value }
        ElMessage.success('更新成功')
      }
    } else {
      // 新增
      const newId = Math.max(...tableData.value.map(item => item.id)) + 1
      formData.value.id = newId
      formData.value.lastCalibrated = new Date().toLocaleString()
      tableData.value.unshift({ ...formData.value })
      ElMessage.success('添加成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const handleClose = (done) => {
  ElMessageBox.confirm('确定要关闭吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done()
  }).catch(() => {
    // 取消关闭
  })
}

const getStatusType = (status) => {
  switch (status) {
    case 'calibrated': return 'success'
    case 'pending': return 'warning'
    case 'abnormal': return 'danger'
    default: return ''
  }
}

const formatStatus = (status) => {
  switch (status) {
    case 'calibrated': return '已校准'
    case 'pending': return '待校准'
    case 'abnormal': return '异常'
    default: return status
  }
}

// 生命周期钩子
onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>

@use './Calibration.scss';

</style>
