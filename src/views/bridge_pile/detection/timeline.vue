<template>
  <div class="bridge-pile-inspection">
    <!-- 搜索区 -->
    <div class="search-area">
      <el-form :model="searchForm" inline>
        <el-form-item label="桩号">
          <el-input v-model="searchForm.pileNo" placeholder="请输入桩号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="检测中" value="检测中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="待检测" value="待检测" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" :icon="Plus" @click="openAddDialog">新增检测记录</el-button>
    </div>

    <!-- 时间线日志流 -->
    <div class="timeline-section" v-loading="loading">
      <div class="timeline-header">
        <h3>检测动态时间线</h3>
      </div>
      <div class="timeline-container" v-if="timelineData.length > 0">
        <div class="timeline-item" v-for="(item, index) in timelineData" :key="index">
          <div class="timeline-dot" :class="{ active: item.active }">
            <el-icon v-if="item.active"><CircleCheck /></el-icon>
            <el-icon v-else><CircleClose /></el-icon>
          </div>
          <div class="timeline-content" @click="handleViewDetail(item)">
            <div class="timeline-time">{{ item.time }}</div>
            <div class="timeline-title">{{ item.title }}</div>
            <div class="timeline-desc">{{ item.description }}</div>
            <div class="timeline-actions">
              <el-button text type="primary" :icon="Edit" @click.stop="handleEdit(item)">编辑</el-button>
              <el-button text type="danger" :icon="Delete" @click.stop="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <el-empty description="暂无检测记录">
          <el-button type="primary" :icon="Plus" @click="openAddDialog">创建首个检测任务</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 时间轴列表 -->
    <div class="list-section" v-loading="loading">
      <el-table :data="tableData" border stripe>
        <el-table-column prop="pileNo" label="桩号" min-width="120" />
        <el-table-column prop="inspectionTime" label="检测时间" min-width="180" />
        <el-table-column prop="status" label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" min-width="100" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" :icon="View" @click="handleViewDetail(row)">查看</el-button>
            <el-button text type="primary" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button text type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 新增/编辑/查看弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-form-item label="桩号" prop="pileNo">
          <el-input v-model="formData.pileNo" placeholder="请输入桩号" />
        </el-form-item>
        <el-form-item label="检测时间" prop="inspectionTime">
          <el-date-picker
            v-model="formData.inspectionTime"
            type="datetime"
            placeholder="选择检测时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态">
            <el-option label="检测中" value="检测中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="待检测" value="待检测" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人" prop="operator">
          <el-input v-model="formData.operator" placeholder="请输入操作人" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ dialogMode === 'add' ? '提交' : '保存' }}
        </el-button>
        <el-button v-if="dialogMode === 'view'" @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Edit,
  Delete,
  CircleCheck,
  CircleClose,
  View
} from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive({
  pileNo: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const timelineData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 弹窗相关
const dialogVisible = ref(false)
const dialogMode = ref('add')
const dialogTitle = computed(() => {
  const titles = { add: '新增检测记录', edit: '编辑检测记录', view: '查看检测记录' }
  return titles[dialogMode.value]
})
const submitLoading = ref(false)

const formData = reactive({
  pileNo: '',
  inspectionTime: '',
  status: '',
  operator: ''
})

const formRules = {
  pileNo: [{ required: true, message: '请输入桩号', trigger: 'blur' }],
  inspectionTime: [{ required: true, message: '请选择检测时间', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  operator: [{ required: true, message: '请输入操作人', trigger: 'blur' }]
}

// 模拟数据
const mockData = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  pileNo: `桩基-${String(i + 1).padStart(3, '0')}`,
  inspectionTime: `2024-01-${String(i + 1).padStart(2, '0')} 10:00:00`,
  status: ['检测中', '已完成', '待检测'][i % 3],
  operator: `操作员${(i % 5) + 1}`
}))

const mockTimeline = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  time: `2024-01-${String(i + 1).padStart(2, '0')} 10:00:00`,
  title: `检测任务${i + 1}`,
  description: `桩基-${String(i + 1).padStart(3, '0')} 检测完成`,
  active: i < 3
}))

// 获取状态类型
const getStatusType = (status) => {
  const map = { '检测中': 'warning', '已完成': 'success', '待检测': 'info' }
  return map[status] || 'info'
}

// 加载数据
const loadData = () => {
  loading.value = true
  setTimeout(() => {
    const filtered = mockData.filter(item => {
      if (searchForm.pileNo && !item.pileNo.includes(searchForm.pileNo)) return false
      if (searchForm.status && item.status !== searchForm.status) return false
      return true
    })
    total.value = filtered.length
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = filtered.slice(start, end)
    timelineData.value = mockTimeline
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.pileNo = ''
  searchForm.status = ''
  currentPage.value = 1
  loadData()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  loadData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadData()
}

// 新增
const openAddDialog = () => {
  dialogMode.value = 'add'
  formData.pileNo = '桩基-001'
  formData.inspectionTime = new Date()
  formData.status = '待检测'
  formData.operator = '操作员1'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 查看
const handleViewDetail = (row) => {
  dialogMode.value = 'view'
  Object.assign(formData, row)
  dialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm('确认删除该记录？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    loadData()
  }).catch(() => {})
}

// 提交
const handleSubmit = () => {
  const errors = []
  if (!formData.pileNo) errors.push('桩号')
  if (!formData.inspectionTime) errors.push('检测时间')
  if (!formData.status) errors.push('状态')
  if (!formData.operator) errors.push('操作人')

  if (errors.length > 0) {
    ElMessage.warning(`请填写：${errors.join('、')}`)
    return
  }

  submitLoading.value = true
  setTimeout(() => {
    submitLoading.value = false
    dialogVisible.value = false
    ElMessage.success(dialogMode.value === 'add' ? '新增成功' : '编辑成功')
    loadData()
  }, 1000)
}

onMounted(() => {
  loadData()
})
</script>

<style lang='scss' scoped>
@use './timeline.scss';
</style>
