<template>
  <div class="broadcast-container">
    <div class="header">
      <h2 class="system-title">智慧广播管理系统</h2>
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="搜索广播内容"
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
          class="search-input"
        >
          <template #append>
            <el-button @click="handleSearch" class="search-btn">搜索</el-button>
          </template>
        </el-input>
        <el-button type="primary" @click="showAddDialog" class="add-btn">
          添加广播
        </el-button>
      </div>
    </div>

    <div class="filter-section">
      <el-select v-model="filterStatus" placeholder="状态筛选" clearable class="status-filter">
        <el-option label="全部" value="" />
        <el-option label="播放中" value="playing" />
        <el-option label="已暂停" value="paused" />
        <el-option label="已结束" value="finished" />
      </el-select>

      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        class="date-picker"
      />
    </div>

    <el-table :data="filteredBroadcasts" style="width: 100%" border stripe class="broadcast-table">
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="title" label="广播标题" min-width="150" />
      <el-table-column prop="content" label="广播内容" min-width="200" />
      <el-table-column prop="status" label="状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" class="status-tag">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="180" align="center" />
      <el-table-column prop="endTime" label="结束时间" width="180" align="center" />
      <el-table-column label="操作" width="180" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="handleEdit(row)" class="edit-btn">编辑</el-button>
          <el-button
            size="small"
            :type="row.status === 'paused' ? 'success' : 'warning'"
            @click="toggleBroadcastStatus(row)"
            class="toggle-btn"
          >
            {{ row.status === 'paused' ? '播放' : '暂停' }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 30, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>

    <!-- 添加/编辑广播对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="50%" class="broadcast-dialog">
      <el-form :model="broadcastForm" label-width="100px" class="broadcast-form">
        <el-form-item label="广播标题" required>
          <el-input v-model="broadcastForm.title" />
        </el-form-item>
        <el-form-item label="广播内容" required>
          <el-input v-model="broadcastForm.content" type="textarea" rows="4" />
        </el-form-item>
        <el-form-item label="开始时间" required>
          <el-date-picker
            v-model="broadcastForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
          />
        </el-form-item>
        <el-form-item label="结束时间" required>
          <el-date-picker
            v-model="broadcastForm.endTime"
            type="datetime"
            placeholder="选择结束时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 广播播放确认弹窗 -->
    <el-dialog v-model="playConfirmVisible" title="广播播放确认" width="30%" class="confirm-dialog">
      <p>确定要{{ currentBroadcastAction === 'play' ? '播放' : '暂停' }}这条广播吗？</p>
      <template #footer>
        <el-button @click="playConfirmVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBroadcastAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 假数据生成
const generateMockData = () => {
  const statuses = ['playing', 'paused', 'finished']
  const broadcasts = []
  
  for (let i = 1; i <= 50; i++) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + i)
    
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + 2)
    
    broadcasts.push({
      id: i,
      title: `广播通知 ${i}`,
      content: `这是第 ${i} 条广播通知内容，用于测试智慧广播管理系统的功能展示。`,
      status: statuses[i % 3],
      startTime: startDate.toLocaleString(),
      endTime: endDate.toLocaleString()
    })
  }
  
  return broadcasts
}

// 数据状态
const broadcasts = ref([])
const searchQuery = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentBroadcastId = ref(null)
const playConfirmVisible = ref(false)
const currentBroadcastAction = ref('play')
const currentBroadcastRow = ref(null)

// 表单数据
const broadcastForm = ref({
  title: '',
  content: '',
  startTime: '',
  endTime: ''
})

// 计算属性
const total = computed(() => broadcasts.value.length)

const filteredBroadcasts = computed(() => {
  let result = [...broadcasts.value]
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
    )
  }
  
  // 状态过滤
  if (filterStatus.value) {
    result = result.filter(item => item.status === filterStatus.value)
  }
  
  // 日期范围过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(item => {
      const itemDate = new Date(item.startTime)
      return itemDate >= start && itemDate <= end
    })
  }
  
  // 分页
  const startIndex = (currentPage.value - 1) * pageSize.value
  return result.slice(startIndex, startIndex + pageSize.value)
})

const dialogTitle = computed(() => {
  return isEditMode.value ? '编辑广播' : '添加广播'
})

// 方法
const getStatusText = status => {
  const map = {
    playing: '播放中',
    paused: '已暂停',
    finished: '已结束'
  }
  return map[status] || status
}

const getStatusType = status => {
  const map = {
    playing: 'success',
    paused: 'warning',
    finished: 'info'
  }
  return map[status] || ''
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const showAddDialog = () => {
  isEditMode.value = false
  broadcastForm.value = {
    title: '',
    content: '',
    startTime: '',
    endTime: ''
  }
  dialogVisible.value = true
}

const handleEdit = row => {
  isEditMode.value = true
  currentBroadcastId.value = row.id
  broadcastForm.value = {
    title: row.title,
    content: row.content,
    startTime: new Date(row.startTime),
    endTime: new Date(row.endTime)
  }
  dialogVisible.value = true
}

const toggleBroadcastStatus = row => {
  currentBroadcastRow.value = row
  currentBroadcastAction.value = row.status === 'paused' ? 'play' : 'pause'
  playConfirmVisible.value = true
}

const confirmBroadcastAction = () => {
  const row = currentBroadcastRow.value
  const index = broadcasts.value.findIndex(item => item.id === row.id)
  if (index !== -1) {
    if (currentBroadcastAction.value === 'play') {
      broadcasts.value[index].status = 'playing'
      ElMessage.success('广播已开始播放')
    } else {
      broadcasts.value[index].status = 'paused'
      ElMessage.warning('广播已暂停')
    }
  }
  playConfirmVisible.value = false
}

const handleSubmit = () => {
  if (!broadcastForm.value.title || !broadcastForm.value.content || 
      !broadcastForm.value.startTime || !broadcastForm.value.endTime) {
    ElMessage.error('请填写完整信息')
    return
  }
  
  if (broadcastForm.value.startTime >= broadcastForm.value.endTime) {
    ElMessage.error('结束时间必须晚于开始时间')
    return
  }
  
  if (isEditMode.value) {
    // 编辑模式
    const index = broadcasts.value.findIndex(item => item.id === currentBroadcastId.value)
    if (index !== -1) {
      broadcasts.value[index] = {
        ...broadcasts.value[index],
        title: broadcastForm.value.title,
        content: broadcastForm.value.content,
        startTime: broadcastForm.value.startTime.toLocaleString(),
        endTime: broadcastForm.value.endTime.toLocaleString()
      }
    }
    ElMessage.success('广播信息更新成功')
  } else {
    // 添加模式
    const newId = broadcasts.value.length > 0 
      ? Math.max(...broadcasts.value.map(item => item.id)) + 1 
      : 1
    
    broadcasts.value.unshift({
      id: newId,
      title: broadcastForm.value.title,
      content: broadcastForm.value.content,
      status: 'paused',
      startTime: broadcastForm.value.startTime.toLocaleString(),
      endTime: broadcastForm.value.endTime.toLocaleString()
    })
    ElMessage.success('广播添加成功')
  }
  
  dialogVisible.value = false
}

// 生命周期
onMounted(() => {
  broadcasts.value = generateMockData()
})
</script>

<style lang="scss" scoped>
.broadcast-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .system-title {
      color: #303133;
      font-size: 24px;
      margin: 0;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 10px;

      .search-input {
        width: 300px;
      }

      .add-btn {
        margin-left: 10px;
      }
    }
  }

  .filter-section {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;

    .status-filter {
      width: 150px;
    }

    .date-picker {
      width: 350px;
    }
  }

  .broadcast-table {
    margin-bottom: 20px;

    .status-tag {
      font-size: 12px;
      padding: 0 8px;
      height: 24px;
      line-height: 24px;
    }
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
  }

  .broadcast-dialog {
    .broadcast-form {
      padding: 0 20px;
    }
  }

  .confirm-dialog {
    p {
      margin: 0;
      font-size: 16px;
      color: #606266;
    }
  }
}
</style>