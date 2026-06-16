
<template>
  <div class="broadcast-management">
    <el-card class="management-card" shadow="hover">
      <div class="header">
        <h2 class="system-title">智慧广播管理系统</h2>
        <div class="actions">
          <el-input 
            v-model="searchQuery" 
            placeholder="搜索广播内容" 
            clearable 
            class="search-input"
            @clear="handleSearch" 
            @keyup.enter="handleSearch" />
          <el-button type="primary" class="add-button" @click="showAddDialog">
            <span class="button-icon">+</span>
            新增广播
          </el-button>
        </div>
      </div>
      
      <el-table 
        :data="filteredBroadcasts" 
        class="broadcast-table"
        border 
        stripe
        v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="title" label="广播标题" min-width="150" />
        <el-table-column prop="content" label="广播内容" min-width="200" />
        <el-table-column prop="schedule" label="计划时间" width="180" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              class="status-tag"
              effect="light">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button 
              size="small" 
              class="edit-button"
              @click="editBroadcast(row)">
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              class="delete-button"
              @click="confirmDelete(row.id)">
              删除
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
          @current-change="handleCurrentChange" />
      </div>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      class="broadcast-dialog">
      <el-form :model="form" label-width="100px" class="broadcast-form">
        <el-form-item label="广播标题" required>
          <el-input 
            v-model="form.title" 
            placeholder="请输入广播标题" 
            class="form-input" />
        </el-form-item>
        <el-form-item label="广播内容" required>
          <el-input 
            v-model="form.content" 
            type="textarea" 
            :rows="4" 
            placeholder="请输入广播内容" 
            class="form-textarea" />
        </el-form-item>
        <el-form-item label="计划时间" required>
          <el-date-picker 
            v-model="form.schedule" 
            type="datetime" 
            placeholder="选择日期时间" 
            value-format="YYYY-MM-DD HH:mm:ss" 
            class="form-datepicker" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select 
            v-model="form.status" 
            placeholder="请选择状态" 
            class="form-select">
            <el-option 
              v-for="item in statusOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-button">取消</el-button>
          <el-button type="primary" @click="submitForm" class="confirm-button">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟数据
const mockBroadcasts = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `广播标题${i + 1}`,
  content: `这是第${i + 1}条广播的内容，用于测试展示效果。广播内容包含智慧校园管理系统相关信息。`,
  schedule: `2023-05-${String(Math.floor(i / 10) + 15).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00:00`,
  status: ['待执行', '执行中', '已完成', '已取消'][Math.floor(Math.random() * 4)]
}))

const broadcasts = ref([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('新增广播')
const isEdit = ref(false)
const currentId = ref(null)

const form = ref({
  title: '',
  content: '',
  schedule: '',
  status: '待执行'
})

const statusOptions = [
  { value: '待执行', label: '待执行' },
  { value: '执行中', label: '执行中' },
  { value: '已完成', label: '已完成' },
  { value: '已取消', label: '已取消' }
]

const filteredBroadcasts = computed(() => {
  let result = broadcasts.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    )
  }
  
  total.value = result.length
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return result.slice(start, end)
})

const getStatusType = (status) => {
  const map = {
    '待执行': 'info',
    '执行中': 'primary',
    '已完成': 'success',
    '已取消': 'danger'
  }
  return map[status] || ''
}

const fetchBroadcasts = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    broadcasts.value = mockBroadcasts
    loading.value = false
  }, 500)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const showAddDialog = () => {
  dialogTitle.value = '新增广播'
  isEdit.value = false
  form.value = {
    title: '',
    content: '',
    schedule: '',
    status: '待执行'
  }
  dialogVisible.value = true
}

const editBroadcast = (row) => {
  dialogTitle.value = '编辑广播'
  isEdit.value = true
  currentId.value = row.id
  form.value = { ...row }
  dialogVisible.value = true
}

const submitForm = () => {
  if (!form.value.title || !form.value.content || !form.value.schedule) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  if (isEdit.value) {
    // 模拟编辑
    const index = broadcasts.value.findIndex(item => item.id === currentId.value)
    if (index !== -1) {
      broadcasts.value[index] = { ...form.value, id: currentId.value }
    }
    ElMessage.success('广播修改成功')
  } else {
    // 模拟新增
    const newId = Math.max(...broadcasts.value.map(item => item.id)) + 1
    broadcasts.value.unshift({
      ...form.value,
      id: newId
    })
    ElMessage.success('广播添加成功')
  }
  
  dialogVisible.value = false
}

const confirmDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条广播吗？', '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'delete-confirm-dialog'
  }).then(() => {
    // 模拟删除
    broadcasts.value = broadcasts.value.filter(item => item.id !== id)
    ElMessage.success('广播删除成功')
  }).catch(() => {
    // 取消操作
  })
}

onMounted(() => {
  fetchBroadcasts()
})
</script>

<style lang="scss" scoped>

@use './Broadcast.scss';

</style>
    