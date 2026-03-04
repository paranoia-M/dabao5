<template>
  <div class="security-system">
    <!-- 顶部统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #409eff;">
                <el-icon><VideoCamera /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.cameras }}</div>
                <div class="stat-label">监控摄像头</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #67c23a;">
                <el-icon><Lock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.accessPoints }}</div>
                <div class="stat-label">门禁点位</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #e6a23c;">
                <el-icon><Bell /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.alarms }}</div>
                <div class="stat-label">报警设备</div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon" style="background-color: #f56c6c;">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.warnings }}</div>
                <div class="stat-label">今日告警</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 主要区域 -->
    <div class="main-content">
      <el-row :gutter="20">
        <!-- 左侧：监控列表 -->
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="monitor-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>实时监控</span>
                <div class="header-actions">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索摄像头"
                    style="width: 200px; margin-right: 10px;"
                    clearable
                    @input="handleSearch"
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select
                    v-model="filterStatus"
                    placeholder="状态筛选"
                    style="width: 120px;"
                    @change="handleFilter"
                  >
                    <el-option label="全部" value="all" />
                    <el-option label="在线" value="online" />
                    <el-option label="离线" value="offline" />
                    <el-option label="故障" value="error" />
                  </el-select>
                </div>
              </div>
            </template>
            
            <div class="monitor-list">
              <el-table
                :data="filteredCameras"
                style="width: 100%"
                :row-class-name="tableRowClassName"
                @row-click="handleCameraClick"
              >
                <el-table-column prop="name" label="摄像头名称" width="180" />
                <el-table-column prop="location" label="位置" width="150" />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="getStatusType(scope.row.status)"
                      size="small"
                    >
                      {{ getStatusText(scope.row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lastActive" label="最后活动时间" width="180" />
                <el-table-column label="操作" width="120">
                  <template #default="scope">
                    <el-button
                      type="primary"
                      size="small"
                      :disabled="scope.row.status === 'offline'"
                      @click.stop="handleViewLive(scope.row)"
                    >
                      查看
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="currentPage"
                  v-model:page-size="pageSize"
                  :page-sizes="[10, 20, 30, 50]"
                  :total="totalCameras"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </el-card>
        </el-col>
        
        <!-- 右侧：告警信息 -->
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card class="alarm-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span>实时告警</span>
                <el-button
                  type="danger"
                  size="small"
                  :loading="clearingAlarms"
                  @click="handleClearAlarms"
                >
                  清空告警
                </el-button>
              </div>
            </template>
            
            <div class="alarm-list">
              <el-timeline>
                <el-timeline-item
                  v-for="(alarm, index) in recentAlarms"
                  :key="index"
                  :timestamp="alarm.time"
                  :type="getAlarmType(alarm.level)"
                  placement="top"
                >
                  <el-card shadow="hover" class="alarm-item">
                    <div class="alarm-content">
                      <div class="alarm-title">
                        <el-icon :color="getAlarmColor(alarm.level)">
                          <Warning v-if="alarm.level === 'high'" />
                          <WarningFilled v-else-if="alarm.level === 'medium'" />
                          <InfoFilled v-else />
                        </el-icon>
                        <span>{{ alarm.title }}</span>
                      </div>
                      <div class="alarm-description">{{ alarm.description }}</div>
                      <div class="alarm-location">位置: {{ alarm.location }}</div>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              
              <div v-if="recentAlarms.length === 0" class="no-alarms">
                <el-empty description="暂无告警信息" />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 模拟视频弹窗 -->
    <el-dialog
      v-model="showVideoDialog"
      title="实时监控"
      width="70%"
      :before-close="handleCloseVideo"
    >
      <div class="video-container">
        <div class="video-placeholder">
          <el-icon size="60" color="#409eff">
            <VideoCamera />
          </el-icon>
          <div class="video-info">
            <h3>{{ selectedCamera?.name }}</h3>
            <p>位置: {{ selectedCamera?.location }}</p>
            <p>状态: {{ getStatusText(selectedCamera?.status || '') }}</p>
          </div>
        </div>
        <div class="video-controls">
          <el-button type="primary" :icon="VideoPlay" @click="toggleVideo">
            {{ isPlaying ? '暂停' : '播放' }}
          </el-button>
          <el-button :icon="FullScreen" @click="handleFullscreen">全屏</el-button>
          <el-button :icon="Camera" @click="handleCapture">截图</el-button>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseVideo">关闭</el-button>
          <el-button type="primary" @click="handleCloseVideo">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  VideoCamera,
  Lock,
  Bell,
  Warning,
  Search,
  VideoPlay,
  FullScreen,
  Camera,
  WarningFilled,
  InfoFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 统计数据
const stats = ref({
  cameras: 156,
  accessPoints: 89,
  alarms: 42,
  warnings: 7
})

// 摄像头数据
const cameras = ref([])
const searchKeyword = ref('')
const filterStatus = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCameras = ref(0)

// 告警数据
const recentAlarms = ref([])
const clearingAlarms = ref(false)

// 视频弹窗
const showVideoDialog = ref(false)
const selectedCamera = ref(null)
const isPlaying = ref(false)

// 模拟摄像头数据
const generateMockCameras = () => {
  const locations = ['A栋大厅', 'B栋电梯', 'C栋走廊', 'D栋停车场', 'E栋出入口', 'F栋机房', 'G栋仓库', 'H栋办公室']
  const statuses = ['online', 'offline', 'error']
  const mockCameras = []
  
  for (let i = 1; i <= 156; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const lastActive = new Date(Date.now() - Math.random() * 86400000).toLocaleString()
    
    mockCameras.push({
      id: i,
      name: `摄像头 ${i}`,
      location: locations[Math.floor(Math.random() * locations.length)],
      status: status,
      lastActive: status === 'online' ? lastActive : '--',
      ip: `192.168.1.${i % 255}`,
      resolution: ['1080P', '720P', '4K'][Math.floor(Math.random() * 3)],
      manufacturer: ['海康威视', '大华', '宇视', '华为'][Math.floor(Math.random() * 4)]
    })
  }
  
  return mockCameras
}

// 模拟告警数据
const generateMockAlarms = () => {
  const levels = ['high', 'medium', 'low']
  const titles = [
    '门禁异常开启',
    '摄像头离线',
    '非法入侵检测',
    '烟雾报警',
    '温度异常',
    '电力中断',
    '网络断开',
    '硬盘故障',
    '视频丢失',
    '移动侦测报警'
  ]
  const locations = ['A栋101室', 'B栋电梯间', 'C栋走廊', 'D栋停车场', 'E栋出入口', 'F栋机房', 'G栋仓库', 'H栋办公室']
  const descriptions = [
    '检测到异常情况，请及时处理',
    '设备连接中断，请检查网络',
    '发现可疑人员活动',
    '环境参数超出正常范围',
    '系统检测到安全威胁',
    '设备运行异常，需要维护'
  ]
  
  return Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    title: titles[Math.floor(Math.random() * titles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)], 
    level: levels[Math.floor(Math.random() * levels.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    time: new Date(Date.now() - i * 600000).toLocaleTimeString(),
    deviceId: `DEV${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
  }))
}

// 计算属性：过滤后的摄像头
const filteredCameras = computed(() => {
  let filtered = cameras.value
  
  // 搜索过滤
  if (searchKeyword.value) {
    filtered = filtered.filter(camera => 
      camera.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      camera.location.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      camera.ip.toLowerCase().includes(searchKeyword.value.toLowerCase())
    )
  }
  
  // 状态过滤
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(camera => camera.status === filterStatus.value)
  }
  
  // 分页
  totalCameras.value = filtered.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return filtered.slice(start, end)
})

// 表格行样式
const tableRowClassName = ({ row }) => {
  if (row.status === 'offline') return 'warning-row'
  if (row.status === 'error') return 'error-row'
  return ''
}

// 获取状态类型
const getStatusType = (status) => {
  switch (status) {
    case 'online': return 'success'
    case 'offline': return 'warning'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'online': return '在线'
    case 'offline': return '离线'
    case 'error': return '故障'
    default: return '未知'
  }
}

// 获取告警类型
const getAlarmType = (level) => {
  switch (level) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'primary'
    default: return 'info'
  }
}

// 获取告警颜色
const getAlarmColor = (level) => {
  switch (level) {
    case 'high': return '#f56c6c'
    case 'medium': return '#e6a23c'
    case 'low': return '#409eff'
    default: return '#909399'
  }
}

// 事件处理
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

const handleCameraClick = (row) => {
  console.log('点击摄像头:', row)
}

const handleViewLive = (camera) => {
  if (camera.status === 'offline') {
    ElMessage.warning('该摄像头已离线，无法查看')
    return
  }
  
  selectedCamera.value = camera
  showVideoDialog.value = true
  isPlaying.value = true
  
  ElMessage.success(`正在加载 ${camera.name} 的实时画面`)
}

const handleClearAlarms = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有告警信息吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    clearingAlarms.value = true
    
    // 模拟异步操作
    setTimeout(() => {
      recentAlarms.value = []
      stats.value.warnings = 0
      clearingAlarms.value = false
      ElMessage.success('告警信息已清空')
    }, 800)
  } catch {
    // 用户取消
  }
}

const toggleVideo = () => {
  isPlaying.value = !isPlaying.value
  ElMessage.info(isPlaying.value ? '视频已播放' : '视频已暂停')
}

const handleFullscreen = () => {
  ElMessage.info('全屏模式已激活')
}

const handleCapture = () => {
  ElMessage.success('截图已保存')
}

const handleCloseVideo = () => {
  showVideoDialog.value = false
  isPlaying.value = false
  selectedCamera.value = null
}

// 模拟实时更新
let updateInterval

const updateStats = () => {
  // 随机更新统计数据
  if (Math.random() > 0.7) {
    const change = Math.random() > 0.5 ? 1 : -1
    stats.value.warnings = Math.max(0, stats.value.warnings + change)
    
    // 如果有新增告警
    if (change > 0 && stats.value.warnings > 0) {
      const newAlarm = {
        id: Date.now(),
        title: '系统检测到新告警',
        description: '请及时查看处理',
        level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        location: ['A栋', 'B栋', 'C栋', 'D栋', 'E栋', 'F栋', 'G栋', 'H栋'][Math.floor(Math.random() * 8)],
        time: new Date().toLocaleTimeString(),
        deviceId: `DEV${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
      }
      
      recentAlarms.value.unshift(newAlarm)
      if (recentAlarms.value.length > 10) {
        recentAlarms.value.pop()
      }
    }
  }
  
  // 随机更新摄像头状态
  if (Math.random() > 0.8 && cameras.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * cameras.value.length)
    const oldStatus = cameras.value[randomIndex].status
    const newStatus = ['online', 'offline', 'error'][Math.floor(Math.random() * 3)]
    
    if (oldStatus !== newStatus) {
      cameras.value[randomIndex].status = newStatus
      cameras.value[randomIndex].lastActive = newStatus === 'online' ? new Date().toLocaleString() : '--'
      
      // 如果状态变为离线或故障，生成告警
      if (newStatus === 'offline' || newStatus === 'error') {
        const alarm = {
          id: Date.now(),
          title: `摄像头 ${cameras.value[randomIndex].name} ${newStatus === 'offline' ? '离线' : '故障'}`,
          description: `设备连接异常，请检查维护`,
          level: newStatus === 'error' ? 'high' : 'medium',
          location: cameras.value[randomIndex].location,
          time: new Date().toLocaleTimeString(),
          deviceId: `CAM${cameras.value[randomIndex].id.toString().padStart(3, '0')}`
        }
        
        recentAlarms.value.unshift(alarm)
        stats.value.warnings++
        if (recentAlarms.value.length > 10) {
          recentAlarms.value.pop()
        }
      }
    }
  }
}

// 生命周期
onMounted(() => {
  // 初始化数据
  cameras.value = generateMockCameras()
  recentAlarms.value = generateMockAlarms()
  totalCameras.value = cameras.value.length
  
  // 启动实时更新
  updateInterval = setInterval(updateStats, 5000)
  
  ElMessage.success('安全监控系统已加载完成')
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
})
</script>

<style lang="scss" scoped>

@use './SecuritySystem.scss';
.security-system {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      :deep(.el-card__body) {
        padding: 20px;
      }

      .stat-content {
        display: flex;
        align-items: center;

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;

          .el-icon {
            font-size: 28px;
            color: white;
          }
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 5px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .main-content {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: bold;
      font-size: 16px;
      color: #303133;

      .header-actions {
        display: flex;
        align-items: center;
      }
    }

    .monitor-card {
      margin-bottom: 20px;
      height: 100%;

      :deep(.el-card__body) {
        padding: 0;
      }

      .monitor-list {
        .el-table {
          :deep(.warning-row) {
            --el-table-tr-bg-color: var(--el-color-warning-light-9);
          }

          :deep(.error-row) {
            --el-table-tr-bg-color: var(--el-color-danger-light-9);
          }

          :deep(.el-table__row) {
            cursor: pointer;

            &:hover {
              background-color: var(--el-color-primary-light-9);
            }
          }
        }

        .pagination-container {
          padding: 20px;
          display: flex;
          justify-content: flex-end;
        }
      }
    }

    .alarm-card {
      height: 100%;

      :deep(.el-card__body) {
        padding: 0;
      }

      .alarm-list {
        padding: 20px;
        max-height: 600px;
        overflow-y: auto;

        .el-timeline {
          margin: 0;
          padding: 0;

          .el-timeline-item {
            :deep(.el-timeline-item__node) {
              width: 12px;
              height: 12px;
            }
          }
        }

        .alarm-item {
          margin-bottom: 10px;
          border-left: 4px solid;

          :deep(.el-card__body) {
            padding: 12px;
          }

          .alarm-content {
            .alarm-title {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
              font-weight: bold;

              .el-icon {
                margin-right: 8px;
              }
            }

            .alarm-description {
              font-size: 13px;
              color: #606266;
              margin-bottom: 5px;
            }

            .alarm-location {
              font-size: 12px;
              color: #909399;
            }
          }
        }

        .no-alarms {
          text-align: center;
          padding: 40px 0;
        }
      }
    }
  }

  .video-container {
    .video-placeholder {
      background-color: #f5f7fa;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      margin-bottom: 20px;
      border: 1px dashed #dcdfe6;

      .video-info {
        margin-top: 20px;

        h3 {
          margin: 10px 0;
          color: #303133;
        }

        p {
          margin: 5px 0;
          color: #606266;
        }
      }
    }

    .video-controls {
      display: flex;
      justify-content: center;
      gap: 10px;
      padding: 20px 0;
      border-top: 1px solid #ebeef5;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .security-system {
    padding: 10px;

    .stats-cards {
      .el-col {
        margin-bottom: 10px;
      }
    }

    .main-content {
      .card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;

        .header-actions {
          width: 100%;
          justify-content: space-between;
        }
      }
    }
  }
}

</style>