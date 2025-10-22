<template>
  <div class="equipment-management">
    <div class="page-header">
      <h1 class="page-title">设备管理</h1>
      <p class="page-description">应急无线电通信设备信息管理与维护</p>
    </div>

    <div class="operation-bar">
      <el-row :gutter="20" align="middle">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设备名称、型号或编号"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="filterStatus"
            placeholder="设备状态"
            clearable
            @change="handleFilter"
          >
            <el-option label="正常" value="normal" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="故障" value="fault" />
            <el-option label="停用" value="disabled" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="filterType"
            placeholder="设备类型"
            clearable
            @change="handleFilter"
          >
            <el-option label="手持电台" value="handheld" />
            <el-option label="车载电台" value="vehicle" />
            <el-option label="基站设备" value="base" />
            <el-option label="中继设备" value="repeater" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-button type="primary" @click="handleAddEquipment">
            <el-icon><Plus /></el-icon>
            新增设备
          </el-button>
        </el-col>
      </el-row>
    </div>

    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="id" label="设备编号" width="120" />
        <el-table-column prop="name" label="设备名称" min-width="150" />
        <el-table-column prop="type" label="设备类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="model" label="设备型号" width="150" />
        <el-table-column prop="frequency" label="工作频率" width="120" />
        <el-table-column prop="status" label="设备状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="部署位置" min-width="180" />
        <el-table-column prop="lastMaintenance" label="最后维护" width="120" />
        <el-table-column prop="maintainer" label="维护人员" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="row.status === 'disabled' ? 'success' : 'warning'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 'disabled' ? '启用' : '停用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑设备对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :before-close="handleDialogClose"
    >
      <el-form
        :model="form"
        :rules="rules"
        label-width="100px"
        :disabled="isViewMode"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="type">
              <el-select v-model="form.type" placeholder="请选择设备类型">
                <el-option label="手持电台" value="handheld" />
                <el-option label="车载电台" value="vehicle" />
                <el-option label="基站设备" value="base" />
                <el-option label="中继设备" value="repeater" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备型号" prop="model">
              <el-input v-model="form.model" placeholder="请输入设备型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作频率" prop="frequency">
              <el-input v-model="form.frequency" placeholder="请输入工作频率">
                <template #append>MHz</template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="部署位置" prop="location">
          <el-input 
            v-model="form.location" 
            type="textarea" 
            :rows="2" 
            placeholder="请输入设备部署位置" 
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备状态" prop="status">
              <el-select v-model="form.status" placeholder="请选择设备状态">
                <el-option label="正常" value="normal" />
                <el-option label="维护中" value="maintenance" />
                <el-option label="故障" value="fault" />
                <el-option label="停用" value="disabled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维护人员" prop="maintainer">
              <el-input v-model="form.maintainer" placeholder="请输入维护人员" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注信息" prop="remark">
          <el-input 
            v-model="form.remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入设备备注信息" 
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button 
            v-if="!isViewMode" 
            type="primary" 
            :loading="submitting"
            @click="handleSubmit"
          >
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// 响应式数据
const searchKeyword = ref('')
const filterStatus = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const isViewMode = ref(false)
const submitting = ref(false)

// 表单数据
const form = reactive({
  id: '',
  name: '',
  type: '',
  model: '',
  frequency: '',
  location: '',
  status: '',
  maintainer: '',
  remark: ''
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择设备类型', trigger: 'change' }
  ],
  model: [
    { required: true, message: '请输入设备型号', trigger: 'blur' }
  ],
  frequency: [
    { required: true, message: '请输入工作频率', trigger: 'blur' }
  ],
  location: [
    { required: true, message: '请输入部署位置', trigger: 'blur' }
  ]
}

// 模拟数据
const mockData = Array.from({ length: 45 }, (_, index) => ({
  id: `EQ${String(index + 1).padStart(4, '0')}`,
  name: `应急无线电设备${index + 1}`,
  type: ['handheld', 'vehicle', 'base', 'repeater'][index % 4],
  model: `MODEL-${String(index + 1).padStart(3, '0')}`,
  frequency: `${400 + (index % 50)}.${index % 10}`,
  location: `应急指挥中心${index % 5 + 1}号楼${index % 10 + 1}层`,
  status: ['normal', 'maintenance', 'fault', 'disabled'][index % 4],
  lastMaintenance: `2024-${String((index % 12) + 1).padStart(2, '0')}-${String((index % 28) + 1).padStart(2, '0')}`,
  maintainer: `维护员${String.fromCharCode(65 + (index % 5))}`,
  remark: `设备备注信息${index + 1}`
}))

// 计算属性
const tableData = computed(() => {
  let data = [...mockData]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    data = data.filter(item => 
      item.name.toLowerCase().includes(keyword) ||
      item.model.toLowerCase().includes(keyword) ||
      item.id.toLowerCase().includes(keyword)
    )
  }
  
  // 状态过滤
  if (filterStatus.value) {
    data = data.filter(item => item.status === filterStatus.value)
  }
  
  // 类型过滤
  if (filterType.value) {
    data = data.filter(item => item.type === filterType.value)
  }
  
  // 分页
  total.value = data.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

const dialogTitle = computed(() => {
  if (isViewMode.value) return '查看设备'
  return form.id ? '编辑设备' : '新增设备'
})

// 方法
const getTypeText = (type) => {
  const typeMap = {
    handheld: '手持电台',
    vehicle: '车载电台',
    base: '基站设备',
    repeater: '中继设备'
  }
  return typeMap[type] || type
}

const getStatusText = (status) => {
  const statusMap = {
    normal: '正常',
    maintenance: '维护中',
    fault: '故障',
    disabled: '停用'
  }
  return statusMap[status] || status
}

const getTypeTagType = (type) => {
  const typeMap = {
    handheld: 'success',
    vehicle: 'primary',
    base: 'warning',
    repeater: 'info'
  }
  return typeMap[type] || ''
}

const getStatusTagType = (status) => {
  const statusMap = {
    normal: 'success',
    maintenance: 'warning',
    fault: 'danger',
    disabled: 'info'
  }
  return statusMap[status] || ''
}

const tableRowClassName = ({ row }) => {
  if (row.status === 'fault') {
    return 'warning-row'
  } else if (row.status === 'disabled') {
    return 'disabled-row'
  }
  return ''
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleFilter = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleAddEquipment = () => {
  isViewMode.value = false
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  isViewMode.value = true
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isViewMode.value = false
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

const handleToggleStatus = async (row) => {
  const action = row.status === 'disabled' ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(
      `确定要${action}设备 ${row.name} 吗？`,
      `${action}设备`,
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟状态切换
    const index = mockData.findIndex(item => item.id === row.id)
    if (index !== -1) {
      mockData[index].status = row.status === 'disabled' ? 'normal' : 'disabled'
      ElMessage.success(`${action}成功`)
    }
  } catch {
    // 用户取消操作
  }
}

const handleDialogClose = () => {
  dialogVisible.value = false
  submitting.value = false
}

const handleSubmit = async () => {
  submitting.value = true
  
  try {
    // 模拟提交延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (form.id) {
      // 编辑设备
      const index = mockData.findIndex(item => item.id === form.id)
      if (index !== -1) {
        Object.assign(mockData[index], { ...form })
      }
      ElMessage.success('设备信息更新成功')
    } else {
      // 新增设备
      const newId = `EQ${String(mockData.length + 1).padStart(4, '0')}`
      const newEquipment = {
        ...form,
        id: newId,
        lastMaintenance: new Date().toISOString().split('T')[0]
      }
      mockData.unshift(newEquipment)
      ElMessage.success('设备添加成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(() => {
  total.value = mockData.length
})
</script>

<style lang="scss" scoped>


@use './EquipmentManagement.scss';


</style>