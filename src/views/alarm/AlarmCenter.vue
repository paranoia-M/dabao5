<template>
  <div class="alarm-center-container">
    <!-- 顶部统计卡片区域 -->
    <div class="statistics-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon critical">
                <el-icon><WarningFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.critical }}</div>
                <div class="stat-label">紧急告警</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon major">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.major }}</div>
                <div class="stat-label">主要告警</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon minor">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.minor }}</div>
                <div class="stat-label">次要告警</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon normal">
                <el-icon><CircleCheckFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.normal }}</div>
                <div class="stat-label">正常设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="filter-section">
      <el-card shadow="never" class="filter-card">
        <el-form :model="filterForm" :inline="true">
          <el-form-item label="告警级别">
            <el-select v-model="filterForm.level" placeholder="请选择告警级别" clearable>
              <el-option label="紧急" value="critical" />
              <el-option label="主要" value="major" />
              <el-option label="次要" value="minor" />
              <el-option label="正常" value="normal" />
            </el-select>
          </el-form-item>
          <el-form-item label="设备类型">
            <el-select v-model="filterForm.deviceType" placeholder="请选择设备类型" clearable>
              <el-option label="空调系统" value="ac" />
              <el-option label="照明系统" value="lighting" />
              <el-option label="安防系统" value="security" />
              <el-option label="电梯系统" value="elevator" />
              <el-option label="消防系统" value="fire" />
            </el-select>
          </el-form-item>
          <el-form-item label="告警时间">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              clearable
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 告警列表区域 -->
    <div class="alarm-list-section">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>告警列表</span>
            <div class="header-actions">
              <el-button type="success" @click="handleAcknowledgeAll" :disabled="selectedAlarms.length === 0">
                <el-icon><Check /></el-icon>
                批量确认
              </el-button>
              <el-button type="danger" @click="handleClearAll" :disabled="selectedAlarms.length === 0">
                <el-icon><Delete /></el-icon>
                批量清除
              </el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="paginatedAlarms"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="deviceName" label="设备名称" width="180" />
          <el-table-column prop="deviceType" label="设备类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getDeviceTypeTag(row.deviceType)">
                {{ getDeviceTypeText(row.deviceType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="alarmLevel" label="告警级别" width="100">
            <template #default="{ row }">
              <el-tag :type="getLevelTag(row.alarmLevel)" effect="dark">
                {{ getLevelText(row.alarmLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="告警描述" min-width="200" />
          <el-table-column prop="location" label="位置" width="150" />
          <el-table-column prop="time" label="发生时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'danger' : 'success'">
                {{ row.status === 'active' ? '活跃' : '已确认' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="handleViewDetail(row)">详情</el-button>
              <el-button 
                size="small" 
                type="primary" 
                @click="handleAcknowledge(row)"
                :disabled="row.status !== 'active'"
              >
                确认
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 30, 50]"
            :total="filteredAlarms.length"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 告警详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="告警详情"
      width="600px"
    >
      <div v-if="currentAlarm" class="alarm-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="告警ID">{{ currentAlarm.id }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentAlarm.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">
            <el-tag :type="getDeviceTypeTag(currentAlarm.deviceType)">
              {{ getDeviceTypeText(currentAlarm.deviceType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警级别">
            <el-tag :type="getLevelTag(currentAlarm.alarmLevel)" effect="dark">
              {{ getLevelText(currentAlarm.alarmLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ currentAlarm.location }}</el-descriptions-item>
          <el-descriptions-item label="发生时间">{{ currentAlarm.time }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="currentAlarm.status === 'active' ? 'danger' : 'success'">
              {{ currentAlarm.status === 'active' ? '活跃' : '已确认' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="告警描述" :span="2">
            {{ currentAlarm.description }}
          </el-descriptions-item>
          <el-descriptions-item label="建议措施" :span="2">
            {{ currentAlarm.suggestion || '请及时检查设备状态并处理' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="handleAcknowledge(currentAlarm)"
            :disabled="!currentAlarm || currentAlarm.status !== 'active'"
          >
            确认告警
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  WarningFilled,
  Warning,
  InfoFilled,
  CircleCheckFilled,
  Search,
  Check,
  Delete
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const statistics = ref({
  critical: 5,
  major: 12,
  minor: 23,
  normal: 156
})

// 筛选表单
const filterForm = ref({
  level: '',
  deviceType: '',
  dateRange: []
})

// 告警数据
const alarms = ref([])
const loading = ref(false)
const selectedAlarms = ref([])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框控制
const detailDialogVisible = ref(false)
const currentAlarm = ref(null)

// 生成假数据
const generateMockData = () => {
  const deviceTypes = ['ac', 'lighting', 'security', 'elevator', 'fire']
  const deviceNames = [
    '中央空调主机', '新风机组', '照明控制器', '安防摄像头', 
    '电梯控制柜', '消防报警器', '温湿度传感器', '电力监控器'
  ]
  const locations = ['A栋1楼', 'A栋2楼', 'B栋3楼', 'C栋地下室', 'D栋天台']
  const levels = ['critical', 'major', 'minor', 'normal']
  const statuses = ['active', 'acknowledged']
  
  const mockData = []
  
  for (let i = 1; i <= 50; i++) {
    const deviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)]
    const level = levels[Math.floor(Math.random() * levels.length)]
    const status = Math.random() > 0.3 ? 'active' : 'acknowledged'
    
    mockData.push({
      id: i,
      deviceName: `${deviceNames[Math.floor(Math.random() * deviceNames.length)]} ${i}`,
      deviceType,
      alarmLevel: level,
      description: getAlarmDescription(deviceType, level),
      location: locations[Math.floor(Math.random() * locations.length)],
      time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
      status,
      suggestion: getSuggestion(deviceType, level)
    })
  }
  
  return mockData
}

// 获取告警描述
const getAlarmDescription = (deviceType, level) => {
  const descriptions = {
    ac: {
      critical: '空调主机压缩机故障，需要立即维修',
      major: '空调系统温度异常升高',
      minor: '空调滤网需要清洁',
      normal: '空调运行正常'
    },
    lighting: {
      critical: '照明电路短路，存在安全隐患',
      major: '照明控制器通信中断',
      minor: '部分灯具亮度异常',
      normal: '照明系统运行正常'
    },
    security: {
      critical: '安防系统被非法入侵',
      major: '摄像头画面丢失',
      minor: '门禁读卡器响应延迟',
      normal: '安防系统运行正常'
    },
    elevator: {
      critical: '电梯困人事件发生',
      major: '电梯运行异常震动',
      minor: '电梯门开关异常',
      normal: '电梯运行正常'
    },
    fire: {
      critical: '火灾报警触发',
      major: '烟雾探测器故障',
      minor: '消防水泵压力异常',
      normal: '消防系统运行正常'
    }
  }
  
  return descriptions[deviceType]?.[level] || '设备状态异常'
}

// 获取建议措施
const getSuggestion = (deviceType, level) => {
  if (level === 'normal') return '设备运行正常，无需处理'
  
  const suggestions = {
    ac: '请联系空调维保人员进行检查维修',
    lighting: '请电工检查电路和控制器',
    security: '请安防工程师检查设备和线路',
    elevator: '立即联系电梯维保单位处理',
    fire: '立即启动应急预案并检查设备'
  }
  
  return suggestions[deviceType] || '请相关技术人员检查处理'
}

// 获取设备类型标签样式
const getDeviceTypeTag = (type) => {
  const tagMap = {
    ac: 'primary',
    lighting: 'warning',
    security: 'success',
    elevator: 'info',
    fire: 'danger'
  }
  return tagMap[type] || ''
}

// 获取设备类型文本
const getDeviceTypeText = (type) => {
  const textMap = {
    ac: '空调系统',
    lighting: '照明系统',
    security: '安防系统',
    elevator: '电梯系统',
    fire: '消防系统'
  }
  return textMap[type] || '未知设备'
}

// 获取告警级别标签样式
const getLevelTag = (level) => {
  const tagMap = {
    critical: 'danger',
    major: 'warning',
    minor: 'info',
    normal: 'success'
  }
  return tagMap[level] || ''
}

// 获取告警级别文本
const getLevelText = (level) => {
  const textMap = {
    critical: '紧急',
    major: '主要',
    minor: '次要',
    normal: '正常'
  }
  return textMap[level] || '未知'
}

// 搜索处理
const handleSearch = () => {
  loading.value = true
  // 模拟搜索延迟
  setTimeout(() => {
    loading.value = false
    currentPage.value = 1
    ElMessage.success('搜索完成')
  }, 500)
}

// 重置筛选
const handleReset = () => {
  filterForm.value = {
    level: '',
    deviceType: '',
    dateRange: []
  }
  currentPage.value = 1
  ElMessage.info('筛选条件已重置')
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedAlarms.value = selection
}

// 查看详情
const handleViewDetail = (alarm) => {
  currentAlarm.value = alarm
  detailDialogVisible.value = true
}

// 确认单个告警
const handleAcknowledge = (alarm) => {
  if (!alarm) return
  
  ElMessageBox.confirm(
    `确认要标记告警 ${alarm.id} 为已处理吗？`,
    '确认告警',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    alarm.status = 'acknowledged'
    updateStatistics()
    ElMessage.success('告警已确认')
    detailDialogVisible.value = false
  }).catch(() => {
    // 用户取消操作
  })
}

// 批量确认
const handleAcknowledgeAll = () => {
  if (selectedAlarms.value.length === 0) return
  
  ElMessageBox.confirm(
    `确认要批量标记 ${selectedAlarms.value.length} 个告警为已处理吗？`,
    '批量确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    selectedAlarms.value.forEach(alarm => {
      alarm.status = 'acknowledged'
    })
    selectedAlarms.value = []
    updateStatistics()
    ElMessage.success(`已确认 ${selectedAlarms.value.length} 个告警`)
  }).catch(() => {
    // 用户取消操作
  })
}

// 批量清除
const handleClearAll = () => {
  if (selectedAlarms.value.length === 0) return
  
  ElMessageBox.confirm(
    `确认要清除 ${selectedAlarms.value.length} 个告警吗？此操作不可恢复。`,
    '批量清除',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'error'
    }
  ).then(() => {
    // 从数据中移除选中的告警
    alarms.value = alarms.value.filter(
      alarm => !selectedAlarms.value.some(selected => selected.id === alarm.id)
    )
    selectedAlarms.value = []
    updateStatistics()
    ElMessage.success(`已清除 ${selectedAlarms.value.length} 个告警`)
  }).catch(() => {
    // 用户取消操作
  })
}

// 更新统计数据
const updateStatistics = () => {
  const stats = { critical: 0, major: 0, minor: 0, normal: 0 }
  
  alarms.value.forEach(alarm => {
    if (alarm.status === 'active') {
      stats[alarm.alarmLevel] = (stats[alarm.alarmLevel] || 0) + 1
    }
  })
  
  // 计算正常设备数量（假设总设备数200）
  const totalActive = stats.critical + stats.major + stats.minor
  stats.normal = 200 - totalActive
  
  statistics.value = stats
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 计算过滤后的告警数据
const filteredAlarms = computed(() => {
  let result = alarms.value
  
  // 按级别筛选
  if (filterForm.value.level) {
    result = result.filter(alarm => alarm.alarmLevel === filterForm.value.level)
  }
  
  // 按设备类型筛选
  if (filterForm.value.deviceType) {
    result = result.filter(alarm => alarm.deviceType === filterForm.value.deviceType)
  }
  
  // 按时间范围筛选（简化处理）
  if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
    // 这里简化时间筛选逻辑
    result = result.filter(alarm => {
      const alarmTime = new Date(alarm.time).getTime()
      const startTime = filterForm.value.dateRange[0].getTime()
      const endTime = filterForm.value.dateRange[1].getTime()
      return alarmTime >= startTime && alarmTime <= endTime
    })
  }
  
  return result
})

// 计算分页后的数据
const paginatedAlarms = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredAlarms.value.slice(start, end)
})

// 初始化数据
onMounted(() => {
  loading.value = true
  // 模拟数据加载延迟
  setTimeout(() => {
    alarms.value = generateMockData()
    updateStatistics()
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './AlarmCenter.scss';

</style>