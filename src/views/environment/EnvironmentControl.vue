<template>
  <div class="environment-control">
    <!-- 顶部概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="overview-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon temperature">
                <i class="el-icon-sunny"></i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overviewData.temperature }}°C</div>
                <div class="card-label">平均温度</div>
                <div class="card-trend" :class="{ 'up': overviewData.tempTrend === 'up', 'down': overviewData.tempTrend === 'down' }">
                  <i :class="overviewData.tempTrend === 'up' ? 'el-icon-top' : 'el-icon-bottom'"></i>
                  {{ overviewData.tempChange }}°C
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="overview-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon humidity">
                <i class="el-icon-watermelon"></i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overviewData.humidity }}%</div>
                <div class="card-label">平均湿度</div>
                <div class="card-trend" :class="{ 'up': overviewData.humidityTrend === 'up', 'down': overviewData.humidityTrend === 'down' }">
                  <i :class="overviewData.humidityTrend === 'up' ? 'el-icon-top' : 'el-icon-bottom'"></i>
                  {{ overviewData.humidityChange }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="overview-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon energy">
                <i class="el-icon-lightning"></i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overviewData.energyConsumption }} kWh</div>
                <div class="card-label">能耗统计</div>
                <div class="card-trend" :class="{ 'up': overviewData.energyTrend === 'up', 'down': overviewData.energyTrend === 'down' }">
                  <i :class="overviewData.energyTrend === 'up' ? 'el-icon-top' : 'el-icon-bottom'"></i>
                  {{ overviewData.energyChange }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="overview-card" shadow="hover">
            <div class="card-content">
              <div class="card-icon devices">
                <i class="el-icon-cpu"></i>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overviewData.onlineDevices }}/{{ overviewData.totalDevices }}</div>
                <div class="card-label">在线设备</div>
                <div class="card-status" :class="{ 'good': overviewData.deviceStatus === 'good', 'warning': overviewData.deviceStatus === 'warning' }">
                  {{ overviewData.deviceStatus === 'good' ? '运行正常' : '部分异常' }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 图表区域 -->
    <div class="chart-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <span>环境数据趋势</span>
                <div class="chart-controls">
                  <el-select v-model="chartTimeRange" size="small" style="width: 120px">
                    <el-option label="最近24小时" value="24h"></el-option>
                    <el-option label="最近7天" value="7d"></el-option>
                    <el-option label="最近30天" value="30d"></el-option>
                  </el-select>
                </div>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder">
                <div class="chart-mock">
                  <div class="chart-line temperature-line"></div>
                  <div class="chart-line humidity-line"></div>
                  <div class="chart-axis"></div>
                  <div class="chart-labels">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-color temperature"></span>
                    <span>温度 (°C)</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color humidity"></span>
                    <span>湿度 (%)</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
          <el-card class="chart-card" shadow="never">
            <template #header>
              <div class="chart-header">
                <span>能耗分布</span>
              </div>
            </template>
            <div class="chart-container">
              <div class="chart-placeholder pie-chart">
                <div class="pie-chart-mock">
                  <div class="pie-segment lighting"></div>
                  <div class="pie-segment hvac"></div>
                  <div class="pie-segment equipment"></div>
                  <div class="pie-segment other"></div>
                </div>
                <div class="chart-legend">
                  <div class="legend-item">
                    <span class="legend-color lighting"></span>
                    <span>照明系统 (35%)</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color hvac"></span>
                    <span>暖通空调 (40%)</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color equipment"></span>
                    <span>设备运行 (20%)</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color other"></span>
                    <span>其他 (5%)</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
    
    <!-- 设备控制面板 -->
    <div class="control-panel">
      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>设备控制</span>
            <div class="panel-actions">
              <el-button type="primary" size="small" @click="handleBatchControl('on')" :loading="batchLoading">
                批量开启
              </el-button>
              <el-button size="small" @click="handleBatchControl('off')" :loading="batchLoading">
                批量关闭
              </el-button>
            </div>
          </div>
        </template>
        
        <div class="device-list">
          <el-table :data="deviceList" style="width: 100%" :row-class-name="tableRowClassName">
            <el-table-column prop="name" label="设备名称" width="180">
              <template #default="{ row }">
                <div class="device-name">
                  <i :class="row.icon" class="device-icon"></i>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="120"></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'online' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'online' ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="currentValue" label="当前值" width="120">
              <template #default="{ row }">
                <span :class="{ 'warning-value': row.warning }">{{ row.currentValue }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="power" label="功率" width="100"></el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <div class="device-actions">
                  <el-switch
                    v-model="row.switchState"
                    :disabled="row.status === 'offline'"
                    @change="handleDeviceSwitch(row)"
                    active-color="#13ce66"
                    inactive-color="#ff4949"
                  ></el-switch>
                  <el-button
                    type="primary"
                    size="small"
                    @click="handleDeviceSettings(row)"
                    :disabled="row.status === 'offline'"
                  >
                    设置
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 30, 40]"
              :total="totalDevices"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            ></el-pagination>
          </div>
        </div>
      </el-card>
    </div>
    
    <!-- 环境参数设置对话框 -->
    <el-dialog
      v-model="settingsDialogVisible"
      title="环境参数设置"
      width="500px"
      :before-close="handleDialogClose"
    >
      <el-form :model="settingsForm" label-width="120px" :rules="settingsRules">
        <el-form-item label="目标温度" prop="targetTemperature">
          <el-slider
            v-model="settingsForm.targetTemperature"
            :min="16"
            :max="30"
            :step="0.5"
            show-input
            show-input-controls
          ></el-slider>
        </el-form-item>
        
        <el-form-item label="目标湿度" prop="targetHumidity">
          <el-slider
            v-model="settingsForm.targetHumidity"
            :min="30"
            :max="70"
            :step="1"
            show-input
            show-input-controls
          ></el-slider>
        </el-form-item>
        
        <el-form-item label="运行模式" prop="operationMode">
          <el-select v-model="settingsForm.operationMode" placeholder="请选择运行模式" style="width: 100%">
            <el-option label="自动模式" value="auto"></el-option>
            <el-option label="节能模式" value="energy_saving"></el-option>
            <el-option label="舒适模式" value="comfort"></el-option>
            <el-option label="手动模式" value="manual"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="定时开关" prop="scheduleEnabled">
          <el-switch v-model="settingsForm.scheduleEnabled"></el-switch>
          <div v-if="settingsForm.scheduleEnabled" class="schedule-time">
            <el-time-picker
              v-model="settingsForm.startTime"
              placeholder="开始时间"
              style="width: 48%; margin-right: 4%"
            ></el-time-picker>
            <el-time-picker
              v-model="settingsForm.endTime"
              placeholder="结束时间"
              style="width: 48%"
            ></el-time-picker>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="settingsDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSettingsSubmit" :loading="settingsLoading">
            确认设置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 概览数据
const overviewData = reactive({
  temperature: 23.5,
  tempTrend: 'up',
  tempChange: 0.5,
  humidity: 65,
  humidityTrend: 'down',
  humidityChange: 2,
  energyConsumption: 1250.8,
  energyTrend: 'down',
  energyChange: 8,
  onlineDevices: 42,
  totalDevices: 45,
  deviceStatus: 'good'
})

// 图表时间范围
const chartTimeRange = ref('24h')

// 设备列表数据
const deviceList = ref([
  { id: 1, name: '中央空调-1F', icon: 'el-icon-cold-drink', location: '一楼大厅', status: 'online', currentValue: '23°C', power: '5.2kW', switchState: true, warning: false },
  { id: 2, name: '新风系统', icon: 'el-icon-wind-power', location: '整栋楼', status: 'online', currentValue: '65%', power: '3.8kW', switchState: true, warning: false },
  { id: 3, name: '照明系统-走廊', icon: 'el-icon-light', location: '各层走廊', status: 'online', currentValue: '75%', power: '2.1kW', switchState: false, warning: false },
  { id: 4, name: '电梯控制系统', icon: 'el-icon-sort-up', location: '电梯间', status: 'online', currentValue: '运行中', power: '4.5kW', switchState: true, warning: false },
  { id: 5, name: '安防监控', icon: 'el-icon-video-camera', location: '各出入口', status: 'online', currentValue: '监控中', power: '1.2kW', switchState: true, warning: false },
  { id: 6, name: '消防系统', icon: 'el-icon-fire', location: '整栋楼', status: 'online', currentValue: '待机', power: '0.8kW', switchState: true, warning: false },
  { id: 7, name: '给排水系统', icon: 'el-icon-watermelon', location: '地下室', status: 'offline', currentValue: '--', power: '--', switchState: false, warning: true },
  { id: 8, name: '停车场照明', icon: 'el-icon-light', location: '地下停车场', status: 'online', currentValue: '30%', power: '3.2kW', switchState: true, warning: false },
])

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const totalDevices = ref(45)

// 批量控制加载状态
const batchLoading = ref(false)

// 设置对话框相关
const settingsDialogVisible = ref(false)
const settingsLoading = ref(false)
const currentDevice = ref(null)

// 设置表单
const settingsForm = reactive({
  targetTemperature: 24,
  targetHumidity: 60,
  operationMode: 'auto',
  scheduleEnabled: false,
  startTime: '',
  endTime: ''
})

// 表单验证规则
const settingsRules = {
  targetTemperature: [
    { required: true, message: '请输入目标温度', trigger: 'blur' }
  ],
  targetHumidity: [
    { required: true, message: '请输入目标湿度', trigger: 'blur' }
  ],
  operationMode: [
    { required: true, message: '请选择运行模式', trigger: 'change' }
  ]
}

// 表格行样式
const tableRowClassName = ({ row }) => {
  if (row.warning) {
    return 'warning-row'
  }
  return ''
}

// 设备开关控制
const handleDeviceSwitch = (device) => {
  ElMessage({
    message: `${device.name} ${device.switchState ? '已开启' : '已关闭'}`,
    type: 'success',
    duration: 2000
  })
}

// 设备设置
const handleDeviceSettings = (device) => {
  currentDevice.value = device
  settingsDialogVisible.value = true
  
  // 模拟加载设备当前设置
  settingsForm.targetTemperature = 24
  settingsForm.targetHumidity = 60
  settingsForm.operationMode = 'auto'
  settingsForm.scheduleEnabled = false
}

// 批量控制
const handleBatchControl = async (action) => {
  try {
    batchLoading.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    deviceList.value.forEach(device => {
      if (device.status === 'online') {
        device.switchState = action === 'on'
      }
    })
    
    ElMessage({
      message: `已${action === 'on' ? '开启' : '关闭'}所有在线设备`,
      type: 'success',
      duration: 3000
    })
  } catch (error) {
    ElMessage({
      message: '操作失败，请重试',
      type: 'error',
      duration: 3000
    })
  } finally {
    batchLoading.value = false
  }
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  // 这里可以添加加载数据的逻辑
}

// 当前页改变
const handleCurrentChange = (val) => {
  currentPage.value = val
  // 这里可以添加加载数据的逻辑
}

// 对话框关闭前的处理
const handleDialogClose = (done) => {
  ElMessageBox.confirm('确定要放弃修改吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done()
  }).catch(() => {
    // 取消关闭
  })
}

// 提交设置
const handleSettingsSubmit = async () => {
  try {
    settingsLoading.value = true
    
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    ElMessage({
      message: '环境参数设置已更新',
      type: 'success',
      duration: 3000
    })
    
    settingsDialogVisible.value = false
  } catch (error) {
    ElMessage({
      message: '设置失败，请重试',
      type: 'error',
      duration: 3000
    })
  } finally {
    settingsLoading.value = false
  }
}

// 初始化数据
onMounted(() => {
  // 模拟数据加载
  console.log('环境控制页面已加载')
})
</script>

<style lang="scss" scoped>



@use './EnvironmentControl.scss';
.environment-control {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .overview-cards {
    margin-bottom: 20px;

    .overview-card {
      margin-bottom: 20px;
      border-radius: 8px;
      border: none;

      .card-content {
        display: flex;
        align-items: center;
        padding: 10px 0;

        .card-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 24px;
          color: white;

          &.temperature {
            background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
          }

          &.humidity {
            background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%);
          }

          &.energy {
            background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
          }

          &.devices {
            background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
          }
        }

        .card-info {
          flex: 1;

          .card-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 5px;
          }

          .card-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 5px;
          }

          .card-trend {
            font-size: 12px;
            display: flex;
            align-items: center;

            &.up {
              color: #f56c6c;
            }

            &.down {
              color: #67c23a;
            }

            i {
              margin-right: 3px;
            }
          }

          .card-status {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 10px;
            display: inline-block;

            &.good {
              background-color: #f0f9eb;
              color: #67c23a;
            }

            &.warning {
              background-color: #fef0f0;
              color: #f56c6c;
            }
          }
        }
      }
    }
  }

  .chart-section {
    margin-bottom: 20px;

    .chart-card {
      border-radius: 8px;
      border: none;
      margin-bottom: 20px;

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        color: #303133;
      }

      .chart-container {
        height: 300px;
        padding: 20px 0;

        .chart-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;

          &.pie-chart {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;

            .pie-chart-mock {
              width: 200px;
              height: 200px;
              border-radius: 50%;
              position: relative;
              background: conic-gradient(
                #ff9a9e 0% 35%,
                #a1c4fd 35% 75%,
                #f6d365 75% 95%,
                #84fab0 95% 100%
              );
            }
          }

          .chart-mock {
            flex: 1;
            position: relative;
            background-color: #f8f9fa;
            border-radius: 4px;
            padding: 20px;

            .chart-line {
              position: absolute;
              height: 2px;
              border-radius: 1px;
              animation: pulse 2s infinite;

              &.temperature-line {
                width: 80%;
                top: 40%;
                left: 10%;
                background: linear-gradient(90deg, #ff9a9e, #fad0c4);
              }

              &.humidity-line {
                width: 70%;
                top: 60%;
                left: 15%;
                background: linear-gradient(90deg, #a1c4fd, #c2e9fb);
              }
            }

            .chart-axis {
              position: absolute;
              bottom: 30px;
              left: 30px;
              right: 30px;
              height: 2px;
              background-color: #dcdfe6;
            }

            .chart-labels {
              position: absolute;
              bottom: 10px;
              left: 30px;
              right: 30px;
              display: flex;
              justify-content: space-between;
              color: #909399;
              font-size: 12px;
            }
          }

          .chart-legend {
            margin-top: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;

            .legend-item {
              display: flex;
              align-items: center;
              font-size: 14px;
              color: #606266;

              .legend-color {
                width: 12px;
                height: 12px;
                border-radius: 2px;
                margin-right: 8px;

                &.temperature {
                  background-color: #ff9a9e;
                }

                &.humidity {
                  background-color: #a1c4fd;
                }

                &.lighting {
                  background-color: #ff9a9e;
                }

                &.hvac {
                  background-color: #a1c4fd;
                }

                &.equipment {
                  background-color: #f6d365;
                }

                &.other {
                  background-color: #84fab0;
                }
              }
            }
          }
        }
      }
    }
  }

  .control-panel {
    .panel-card {
      border-radius: 8px;
      border: none;

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: bold;
        color: #303133;
      }

      .device-list {
        .device-name {
          display: flex;
          align-items: center;

          .device-icon {
            margin-right: 8px;
            font-size: 18px;
            color: #409eff;
          }
        }

        .warning-value {
          color: #f56c6c;
          font-weight: bold;
        }

        .device-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pagination-container {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
        }
      }
    }
  }

  .schedule-time {
    margin-top: 10px;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

:deep(.el-table .warning-row) {
  background-color: #fef0f0;
}

:deep(.el-dialog) {
  border-radius: 8px;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 15px;
  margin-bottom: 20px;
}



</style>