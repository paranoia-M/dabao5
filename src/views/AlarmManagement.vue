
<template>
  <div class="alarm-management">
    <el-card class="filter-card" shadow="hover">
      <div class="filter-container">
        <el-input 
          v-model="searchQuery" 
          placeholder="搜索告警内容" 
          class="search-input" 
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <span class="search-icon">🔍</span>
            </el-button>
          </template>
        </el-input>
        
        <el-select 
          v-model="alarmLevel" 
          placeholder="告警级别" 
          class="level-select"
          clearable
          @change="handleFilterChange"
        >
          <el-option 
            v-for="level in alarmLevels" 
            :key="level.value" 
            :label="level.label" 
            :value="level.value"
          />
        </el-select>
        
        <el-select 
          v-model="alarmStatus" 
          placeholder="告警状态" 
          class="status-select"
          clearable
          @change="handleFilterChange"
        >
          <el-option 
            v-for="status in alarmStatuses" 
            :key="status.value" 
            :label="status.label" 
            :value="status.value"
          />
        </el-select>
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          class="date-picker"
          @change="handleDateChange"
        />
      </div>
    </el-card>
    
    <el-card class="table-card" shadow="hover">
      <div class="table-header">
        <h3>网络安全告警列表</h3>
        <el-button 
          type="primary" 
          @click="handleExport" 
          class="export-btn"
        >
          导出报表
        </el-button>
      </div>
      
      <el-table 
        :data="filteredAlarms" 
        style="width: 100%" 
        v-loading="loading"
        :default-sort="{ prop: 'time', order: 'descending' }"
        @sort-change="handleSortChange"
        stripe
        border
      >
        <el-table-column 
          prop="id" 
          label="ID" 
          width="80" 
          sortable
          align="center"
        />
        <el-table-column 
          prop="title" 
          label="告警标题" 
          min-width="180"
        />
        <el-table-column 
          prop="content" 
          label="告警内容" 
          min-width="250"
        />
        <el-table-column 
          prop="level" 
          label="级别" 
          width="100"
          sortable
          align="center"
        >
          <template #default="{ row }">
            <el-tag 
              :type="getLevelTagType(row.level)"
              effect="light"
              class="level-tag"
            >
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="status" 
          label="状态" 
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag 
              :type="row.status === '已处理' ? 'success' : 'danger'" 
              effect="light"
              class="status-tag"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column 
          prop="time" 
          label="时间" 
          width="180"
          sortable
        />
        <el-table-column 
          prop="source" 
          label="来源" 
          width="120"
        />
        <el-table-column 
          label="操作" 
          width="120"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <el-button 
              size="small" 
              type="primary" 
              plain
              @click="handleDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalAlarms"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 告警详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      :title="`告警详情 - ${currentAlarm.title}`" 
      width="50%"
      class="alarm-detail-dialog"
    >
      <div class="alarm-detail">
        <el-descriptions 
          :column="1" 
          border
        >
          <el-descriptions-item label="告警ID">
            <span class="detail-value">{{ currentAlarm.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="告警标题">
            <span class="detail-value">{{ currentAlarm.title }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="告警内容">
            <span class="detail-value">{{ currentAlarm.content }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="告警级别">
            <el-tag :type="getLevelTagType(currentAlarm.level)" effect="light" class="level-tag">
              {{ currentAlarm.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警状态">
            <el-tag :type="currentAlarm.status === '已处理' ? 'success' : 'danger'" effect="light" class="status-tag">
              {{ currentAlarm.status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警时间">
            <span class="detail-value">{{ currentAlarm.time }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="告警来源">
            <span class="detail-value">{{ currentAlarm.source }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="详细描述">
            <div class="description-content">{{ currentAlarm.description }}</div>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="action-buttons" v-if="currentAlarm.status === '未处理'">
          <el-button 
            type="success" 
            @click="handleProcessAlarm"
            class="process-btn"
          >
            标记为已处理
          </el-button>
          <el-button 
            type="warning" 
            @click="handleIgnoreAlarm"
            class="ignore-btn"
          >
            忽略此告警
          </el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 导出确认对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出告警报表"
      width="30%"
    >
      <div class="export-dialog">
        <el-form label-width="100px">
          <el-form-item label="导出格式">
            <el-radio-group v-model="exportFormat">
              <el-radio label="csv">CSV</el-radio>
              <el-radio label="excel">Excel</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="exportDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 假数据生成
const generateMockAlarms = () => {
  const levels = ['紧急', '严重', '警告', '提示']
  const statuses = ['未处理', '已处理']
  const sources = ['防火墙', '入侵检测', '漏洞扫描', '日志审计', '网络流量']
  const titles = [
    '网络攻击告警',
    '异常流量检测',
    '系统漏洞告警',
    '登录异常告警',
    '配置变更告警',
    '设备离线告警',
    '病毒检测告警',
    '数据泄露告警'
  ]
  
  const alarms = []
  for (let i = 1; i <= 50; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const title = titles[Math.floor(Math.random() * titles.length)]
    
    alarms.push({
      id: i,
      title: `${title} #${i}`,
      content: `检测到${source}${title}`,
      level,
      status,
      time: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleString(),
      source,
      description: `这是关于${title}的详细描述。告警级别为${level}，当前状态为${status}。需要相关人员及时${status === '未处理' ? '处理' : '确认'}。`
    })
  }
  
  return alarms
}

// 数据状态
const alarms = ref([])
const loading = ref(true)
const searchQuery = ref('')
const alarmLevel = ref('')
const alarmStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const sortProp = ref('time')
const sortOrder = ref('descending')
const detailDialogVisible = ref(false)
const currentAlarm = ref({})
const exportDialogVisible = ref(false)
const exportFormat = ref('csv')
const exportDateRange = ref([])

// 选项数据
const alarmLevels = ref([
  { value: '紧急', label: '紧急' },
  { value: '严重', label: '严重' },
  { value: '警告', label: '警告' },
  { value: '提示', label: '提示' }
])

const alarmStatuses = ref([
  { value: '未处理', label: '未处理' },
  { value: '已处理', label: '已处理' }
])

// 计算属性
const filteredAlarms = computed(() => {
  let result = alarms.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(alarm => 
      alarm.title.toLowerCase().includes(query) || 
      alarm.content.toLowerCase().includes(query) ||
      alarm.source.toLowerCase().includes(query)
    )
  }
  
  // 级别过滤
  if (alarmLevel.value) {
    result = result.filter(alarm => alarm.level === alarmLevel.value)
  }
  
  // 状态过滤
  if (alarmStatus.value) {
    result = result.filter(alarm => alarm.status === alarmStatus.value)
  }
  
  // 日期过滤
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(alarm => {
      const alarmDate = new Date(alarm.time)
      return alarmDate >= start && alarmDate <= end
    })
  }
  
  // 排序
  if (sortProp.value && sortOrder.value) {
    result = [...result].sort((a, b) => {
      // 特殊处理时间排序
      if (sortProp.value === 'time') {
        const timeA = new Date(a.time).getTime()
        const timeB = new Date(b.time).getTime()
        return sortOrder.value === 'ascending' ? timeA - timeB : timeB - timeA
      }
      
      // 普通排序
      if (a[sortProp.value] < b[sortProp.value]) {
        return sortOrder.value === 'ascending' ? -1 : 1
      }
      if (a[sortProp.value] > b[sortProp.value]) {
        return sortOrder.value === 'ascending' ? 1 : -1
      }
      return 0
    })
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const totalAlarms = computed(() => {
  let result = alarms.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(alarm => 
      alarm.title.toLowerCase().includes(query) || 
      alarm.content.toLowerCase().includes(query) ||
      alarm.source.toLowerCase().includes(query)
    )
  }
  
  if (alarmLevel.value) {
    result = result.filter(alarm => alarm.level === alarmLevel.value)
  }
  
  if (alarmStatus.value) {
    result = result.filter(alarm => alarm.status === alarmStatus.value)
  }
  
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    result = result.filter(alarm => {
      const alarmDate = new Date(alarm.time)
      return alarmDate >= start && alarmDate <= end
    })
  }
  
  return result.length
})

// 方法
const getLevelTagType = (level) => {
  switch (level) {
    case '紧急': return 'danger'
    case '严重': return 'warning'
    case '警告': return 'info'
    case '提示': return ''
    default: return ''
  }
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleFilterChange = () => {
  currentPage.value = 1
}

const handleDateChange = () => {
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleSortChange = ({ prop, order }) => {
  sortProp.value = prop
  sortOrder.value = order
}

const handleDetail = (alarm) => {
  currentAlarm.value = alarm
  detailDialogVisible.value = true
}

const handleProcessAlarm = () => {
  const index = alarms.value.findIndex(a => a.id === currentAlarm.value.id)
  if (index !== -1) {
    alarms.value[index].status = '已处理'
    currentAlarm.value.status = '已处理'
    ElMessage.success('告警已标记为已处理')
  }
}

const handleIgnoreAlarm = () => {
  ElMessageBox.confirm(
    '确定要忽略此告警吗？忽略后该告警将不再显示',
    '忽略告警确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = alarms.value.findIndex(a => a.id === currentAlarm.value.id)
    if (index !== -1) {
      alarms.value.splice(index, 1)
      detailDialogVisible.value = false
      ElMessage.success('告警已忽略')
    }
  }).catch(() => {
    // 取消操作
  })
}

const handleExport = () => {
  exportDialogVisible.value = true
  exportDateRange.value = dateRange.value.length === 2 ? [...dateRange.value] : []
}

const confirmExport = () => {
  exportDialogVisible.value = false
  ElMessage.success(`告警数据已导出为${exportFormat.value.toUpperCase()}格式`)
}

// 生命周期
onMounted(() => {
  setTimeout(() => {
    alarms.value = generateMockAlarms()
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './AlarmManagement.scss';

</style>
