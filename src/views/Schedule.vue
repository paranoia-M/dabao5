
<template>
  <div class="schedule-container">
    <el-card class="broadcast-card">
      <div class="header">
        <h2 class="title">智慧广播管理系统 - 今日排期</h2>
        <div class="actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索节目名称或内容"
            clearable
            class="search-input"
            @clear="handleSearchClear"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button @click="handleSearch" class="search-btn">搜索</el-button>
            </template>
          </el-input>
          <el-button type="primary" @click="handleAddSchedule" class="add-btn">
            <span class="btn-text">新增广播排期</span>
          </el-button>
        </div>
      </div>

      <el-table
        :data="filteredSchedules"
        border
        class="schedule-table"
        v-loading="loading"
        :default-sort="{ prop: 'time', order: 'ascending' }"
      >
        <el-table-column prop="time" label="播放时间" width="120" sortable align="center" />
        <el-table-column prop="title" label="节目名称" width="180" />
        <el-table-column prop="content" label="内容简介" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" class="status-tag">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="handleEdit(row)" class="edit-btn">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="handleDelete(row)"
              class="delete-btn"
            >
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
      width="50%" 
      class="schedule-dialog"
      :before-close="handleClose"
    >
      <el-form :model="form" label-width="100px" :rules="rules">
        <el-form-item label="节目名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入节目名称" class="form-input" />
        </el-form-item>
        <el-form-item label="播放时间" prop="time">
          <el-time-picker
            v-model="form.time"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
            class="time-picker"
          />
        </el-form-item>
        <el-form-item label="内容简介" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="3"
            placeholder="请输入内容简介"
            class="content-textarea"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" class="status-select">
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
          <el-button type="primary" @click="handleSubmit" class="confirm-btn">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 模拟API请求
const fetchSchedules = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          time: '08:00',
          title: '早安新闻',
          content: '播报国内外最新新闻资讯',
          status: '已播'
        },
        {
          id: 2,
          time: '09:30',
          title: '音乐时光',
          content: '播放经典音乐作品',
          status: '待播'
        },
        {
          id: 3,
          time: '12:00',
          title: '午间快报',
          content: '午间新闻速递',
          status: '待播'
        },
        {
          id: 4,
          time: '15:00',
          title: '健康讲座',
          content: '邀请专家讲解健康知识',
          status: '取消'
        },
        {
          id: 5,
          time: '18:00',
          title: '晚间新闻',
          content: '总结一天重要新闻',
          status: '待播'
        },
        {
          id: 6,
          time: '20:00',
          title: '电影原声',
          content: '播放经典电影原声音乐',
          status: '待播'
        }
      ])
    }, 800)
  })
}

// 状态选项
const statusOptions = [
  { value: '待播', label: '待播' },
  { value: '已播', label: '已播' },
  { value: '取消', label: '取消' }
]

// 搜索相关
const searchQuery = ref('')
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const small = ref(false)
const disabled = ref(false)
const background = ref(true)
const total = ref(0)
const schedules = ref([])

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新增广播排期')
const isEdit = ref(false)
const currentId = ref(null)

// 表单数据
const form = ref({
  title: '',
  time: '',
  content: '',
  status: '待播'
})

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入节目名称', trigger: 'blur' }],
  time: [{ required: true, message: '请选择播放时间', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容简介', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 获取状态标签类型
const getStatusType = (status) => {
  switch (status) {
    case '已播':
      return 'success'
    case '待播':
      return 'warning'
    case '取消':
      return 'danger'
    default:
      return ''
  }
}

// 过滤后的排期数据
const filteredSchedules = computed(() => {
  let result = [...schedules.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
    )
  }
  
  // 分页处理
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  total.value = result.length
  return result.slice(start, end)
})

// 搜索处理
const handleSearch = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    currentPage.value = 1
  }, 500)
}

// 清除搜索
const handleSearchClear = () => {
  currentPage.value = 1
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 新增排期
const handleAddSchedule = () => {
  dialogTitle.value = '新增广播排期'
  isEdit.value = false
  form.value = {
    title: '',
    time: '',
    content: '',
    status: '待播'
  }
  dialogVisible.value = true
}

// 编辑排期
const handleEdit = (row) => {
  dialogTitle.value = '编辑广播排期'
  isEdit.value = true
  currentId.value = row.id
  form.value = { ...row }
  dialogVisible.value = true
}

// 删除排期
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除这条广播排期吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      const index = schedules.value.findIndex((item) => item.id === row.id)
      if (index !== -1) {
        schedules.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 对话框关闭
const handleClose = (done) => {
  ElMessageBox.confirm('确定要关闭吗? 未保存的更改将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      done()
    })
    .catch(() => {})
}

// 表单提交
const handleSubmit = () => {
  if (!form.value.title || !form.value.time || !form.value.content) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (isEdit.value) {
    // 编辑逻辑
    const index = schedules.value.findIndex((item) => item.id === currentId.value)
    if (index !== -1) {
      schedules.value[index] = {
        id: currentId.value,
        ...form.value
      }
      ElMessage.success('更新成功')
    }
  } else {
    // 新增逻辑
    const newId = schedules.value.length > 0 
      ? Math.max(...schedules.value.map((item) => item.id)) + 1 
      : 1
    schedules.value.push({
      id: newId,
      ...form.value
    })
    ElMessage.success('新增成功')
  }

  dialogVisible.value = false
}

// 初始化数据
onMounted(async () => {
  loading.value = true
  try {
    const data = await fetchSchedules()
    schedules.value = data
    total.value = data.length
  } catch (error) {
    ElMessage.error('获取广播排期数据失败')
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>

@use './Schedule.scss';

</style>
    