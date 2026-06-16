<template>
  <div class="log-management-container">
    <el-card class="search-card" shadow="hover">
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="日志类型" class="form-item-enhanced">
            <el-select v-model="searchForm.type" placeholder="请选择日志类型" clearable>
              <el-option label="系统日志" value="system" />
              <el-option label="安全日志" value="security" />
              <el-option label="操作日志" value="operation" />
              <el-option label="网络日志" value="network" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="时间范围" class="form-item-enhanced">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          
          <el-form-item label="关键词" class="form-item-enhanced">
            <el-input v-model="searchForm.keyword" placeholder="请输入关键词" clearable />
          </el-form-item>
          
          <el-form-item class="form-item-enhanced">
            <el-button type="primary" @click="handleSearch" class="action-button">查询</el-button>
            <el-button @click="resetSearch" class="action-button">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    
    <el-card class="table-card" shadow="hover">
      <div class="table-header">
        <div class="table-title">
          <span class="title-icon">📊</span>
          <span>日志列表</span>
        </div>
        <div class="table-actions">
          <el-button type="primary" @click="exportLogs" class="action-button">导出日志</el-button>
          <el-button type="danger" @click="clearLogs" :disabled="!hasSelection" class="action-button">批量删除</el-button>
        </div>
      </div>
      
      <el-table
        :data="tableData"
        border
        style="width: 100%"
        @selection-change="handleSelectionChange"
        v-loading="loading"
        class="log-table"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="type" label="日志类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTagType(row.type)" class="log-tag">{{ getTypeName(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="日志内容" min-width="200" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="time" label="时间" width="180" />
        <el-table-column prop="user" label="操作人" width="120" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)" class="detail-button">详情</el-button>
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
          class="log-pagination"
        />
      </div>
    </el-card>
    
    <!-- 日志详情对话框 -->
    <el-dialog v-model="dialogVisible" title="日志详情" width="50%" class="log-detail-dialog">
      <div class="log-detail">
        <el-descriptions :column="1" border class="detail-descriptions">
          <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
          <el-descriptions-item label="日志类型">
            <el-tag :type="getTagType(currentLog.type)" class="log-tag">{{ getTypeName(currentLog.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentLog.user }}</el-descriptions-item>
          <el-descriptions-item label="操作时间">{{ currentLog.time }}</el-descriptions-item>
          <el-descriptions-item label="详细内容">
            <div class="log-content">{{ currentLog.content }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false" class="action-button">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 导出日志确认弹窗 -->
    <el-dialog v-model="exportDialogVisible" title="导出日志" width="30%" class="export-dialog">
      <div class="export-options">
        <el-form label-position="top">
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportFormat">
              <el-radio label="csv">CSV</el-radio>
              <el-radio label="excel">Excel</el-radio>
              <el-radio label="json">JSON</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="导出范围">
            <el-radio-group v-model="exportScope">
              <el-radio label="current">当前页</el-radio>
              <el-radio label="all">全部数据</el-radio>
              <el-radio label="selected" :disabled="!hasSelection">选中项</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false" class="action-button">取消</el-button>
        <el-button type="primary" @click="confirmExport" class="action-button">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索表单
const searchForm = reactive({
  type: '',
  dateRange: [],
  keyword: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const selection = ref([])
const dialogVisible = ref(false)
const currentLog = ref({})
const exportDialogVisible = ref(false)
const exportFormat = ref('csv')
const exportScope = ref('current')

// 计算属性
const hasSelection = computed(() => selection.value.length > 0)

// 获取标签类型
const getTagType = (type) => {
  const typeMap = {
    system: '',
    security: 'danger',
    operation: 'warning',
    network: 'success'
  }
  return typeMap[type] || ''
}

// 获取类型名称
const getTypeName = (type) => {
  const nameMap = {
    system: '系统日志',
    security: '安全日志',
    operation: '操作日志',
    network: '网络日志'
  }
  return nameMap[type] || '未知类型'
}

// 生成假数据
const generateMockData = () => {
  const types = ['system', 'security', 'operation', 'network']
  const users = ['admin', 'user1', 'user2', 'operator', 'auditor']
  const ips = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '192.168.0.100']
  const actions = [
    '登录系统',
    '修改密码',
    '访问敏感数据',
    '配置网络参数',
    '系统重启',
    '防火墙规则更新',
    '用户权限变更',
    '安全策略调整'
  ]
  
  const data = []
  for (let i = 1; i <= 50; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const user = users[Math.floor(Math.random() * users.length)]
    const ip = ips[Math.floor(Math.random() * ips.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const hoursAgo = Math.floor(Math.random() * 72)
    const minutesAgo = Math.floor(Math.random() * 60)
    const date = new Date()
    date.setHours(date.getHours() - hoursAgo)
    date.setMinutes(date.getMinutes() - minutesAgo)
    
    data.push({
      id: i,
      type,
      content: `${user} ${action}`,
      ip,
      time: date.toLocaleString(),
      user,
      fullContent: `详细日志内容：用户 ${user} (IP: ${ip}) 于 ${date.toLocaleString()} ${action}。此操作${type === 'security' ? '涉及安全变更' : '为常规操作'}。`
    })
  }
  return data
}

// 获取日志数据
const fetchLogs = () => {
  loading.value = true
  // 模拟异步请求
  setTimeout(() => {
    const allData = generateMockData()
    
    // 模拟筛选
    let filteredData = [...allData]
    
    if (searchForm.type) {
      filteredData = filteredData.filter(item => item.type === searchForm.type)
    }
    
    if (searchForm.dateRange && searchForm.dateRange.length === 2) {
      const [start, end] = searchForm.dateRange
      filteredData = filteredData.filter(item => {
        const logDate = new Date(item.time).toISOString().split('T')[0]
        return logDate >= start && logDate <= end
      })
    }
    
    if (searchForm.keyword) {
      const keyword = searchForm.keyword.toLowerCase()
      filteredData = filteredData.filter(item => 
        item.content.toLowerCase().includes(keyword) || 
        item.user.toLowerCase().includes(keyword) ||
        item.ip.includes(keyword)
      )
    }
    
    total.value = filteredData.length
    
    // 模拟分页
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    tableData.value = filteredData.slice(start, end)
    
    loading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchLogs()
}

// 重置搜索
const resetSearch = () => {
  searchForm.type = ''
  searchForm.dateRange = []
  searchForm.keyword = ''
  handleSearch()
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchLogs()
}

// 当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchLogs()
}

// 表格选择变化
const handleSelectionChange = (val) => {
  selection.value = val
}

// 查看详情
const viewDetail = (row) => {
  currentLog.value = {
    ...row,
    content: row.fullContent
  }
  dialogVisible.value = true
}

// 导出日志
const exportLogs = () => {
  exportDialogVisible.value = true
}

// 确认导出
const confirmExport = () => {
  exportDialogVisible.value = false
  let exportData = []
  
  if (exportScope.value === 'current') {
    exportData = tableData.value
  } else if (exportScope.value === 'all') {
    exportData = generateMockData()
  } else if (exportScope.value === 'selected') {
    exportData = selection.value
  }
  
  // 模拟导出功能
  const format = exportFormat.value
  const count = exportData.length
  
  ElMessage.success(`成功导出${count}条日志数据，格式为${format.toUpperCase()}`)
  
  // 模拟导出操作
  console.log(`导出数据:`, {
    format,
    data: exportData
  })
}

// 清除日志
const clearLogs = () => {
  ElMessageBox.confirm('确定要删除选中的日志吗？此操作将永久删除日志记录且不可恢复！', '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'delete-confirm-dialog'
  }).then(() => {
    // 模拟删除操作
    const ids = selection.value.map(item => item.id).join(',')
    console.log(`删除日志ID: ${ids}`)
    
    ElMessage.success(`成功删除${selection.value.length}条日志记录`)
    fetchLogs()
  }).catch(() => {
    ElMessage.info('已取消删除操作')
  })
}

// 初始化数据
onMounted(() => {
  fetchLogs()
})
</script>

<style lang="scss" scoped>

@use './LogManagement.scss';

</style>