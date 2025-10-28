<template>
  <div class="system-settings">
    <div class="settings-container">
      <div class="settings-header">
        <h1 class="page-title">系统设置</h1>
        <p class="page-description">管理航清环境应急移动源管理软件的各项配置</p>
      </div>

      <div class="settings-content">
        <el-tabs v-model="activeTab" class="settings-tabs">
          <!-- 基本设置 -->
          <el-tab-pane label="基本设置" name="basic">
            <div class="tab-content">
              <el-form 
                :model="basicForm" 
                label-width="120px" 
                class="settings-form"
                :rules="basicRules"
              >
                <el-form-item label="系统名称" prop="systemName">
                  <el-input 
                    v-model="basicForm.systemName" 
                    placeholder="请输入系统名称"
                    maxlength="50"
                    show-word-limit
                  />
                </el-form-item>
                
                <el-form-item label="数据刷新频率" prop="refreshRate">
                  <el-select v-model="basicForm.refreshRate" placeholder="请选择刷新频率">
                    <el-option label="30秒" value="30"></el-option>
                    <el-option label="1分钟" value="60"></el-option>
                    <el-option label="5分钟" value="300"></el-option>
                    <el-option label="10分钟" value="600"></el-option>
                  </el-select>
                </el-form-item>
                
                <el-form-item label="数据保留天数" prop="dataRetention">
                  <el-input-number 
                    v-model="basicForm.dataRetention" 
                    :min="7" 
                    :max="365"
                    controls-position="right"
                  />
                  <span class="unit-text">天</span>
                </el-form-item>
                
                <el-form-item label="温度单位" prop="temperatureUnit">
                  <el-radio-group v-model="basicForm.temperatureUnit">
                    <el-radio label="celsius">摄氏度(℃)</el-radio>
                    <el-radio label="fahrenheit">华氏度(℉)</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="saveBasicSettings"
                    :loading="basicLoading"
                  >
                    保存设置
                  </el-button>
                  <el-button @click="resetBasicForm">重置</el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 设备管理 -->
          <el-tab-pane label="设备管理" name="devices">
            <div class="tab-content">
              <div class="device-toolbar">
                <el-input
                  v-model="deviceSearch"
                  placeholder="搜索设备名称或ID"
                  style="width: 300px"
                  clearable
                  @clear="handleSearchClear"
                >
                  <template #append>
                    <el-button :icon="Search" @click="handleDeviceSearch" />
                  </template>
                </el-input>
                
                <el-button type="primary" :icon="Plus" @click="handleAddDevice">
                  添加设备
                </el-button>
              </div>

              <el-table 
                :data="filteredDevices" 
                v-loading="deviceLoading"
                class="device-table"
              >
                <el-table-column prop="id" label="设备ID" width="120" />
                <el-table-column prop="name" label="设备名称" />
                <el-table-column prop="type" label="设备类型" width="120">
                  <template #default="{ row }">
                    <el-tag :type="getDeviceTypeTag(row.type)">
                      {{ getDeviceTypeText(row.type) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag 
                      :type="row.status === 'online' ? 'success' : 'danger'"
                      effect="light"
                    >
                      {{ row.status === 'online' ? '在线' : '离线' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="location" label="安装位置" />
                <el-table-column prop="lastUpdate" label="最后更新" width="180" />
                <el-table-column label="操作" width="150" fixed="right">
                  <template #default="{ row }">
                    <el-button 
                      size="small" 
                      @click="handleEditDevice(row)"
                    >
                      编辑
                    </el-button>
                    <el-button 
                      size="small" 
                      type="danger" 
                      @click="handleDeleteDevice(row)"
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
                  :page-sizes="[10, 20, 50, 100]"
                  :total="totalDevices"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleSizeChange"
                  @current-change="handleCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>

          <!-- 告警设置 -->
          <el-tab-pane label="告警设置" name="alerts">
            <div class="tab-content">
              <el-form 
                :model="alertForm" 
                label-width="150px" 
                class="alert-form"
              >
                <el-form-item label="温度告警阈值">
                  <div class="threshold-row">
                    <span class="threshold-label">最低温度：</span>
                    <el-input-number 
                      v-model="alertForm.minTemperature" 
                      :min="-20" 
                      :max="50"
                      :precision="1"
                      controls-position="right"
                    />
                    <span class="unit-text">℃</span>
                    
                    <span class="threshold-label">最高温度：</span>
                    <el-input-number 
                      v-model="alertForm.maxTemperature" 
                      :min="-20" 
                      :max="50"
                      :precision="1"
                      controls-position="right"
                    />
                    <span class="unit-text">℃</span>
                  </div>
                </el-form-item>
                
                <el-form-item label="湿度告警阈值">
                  <div class="threshold-row">
                    <span class="threshold-label">最低湿度：</span>
                    <el-input-number 
                      v-model="alertForm.minHumidity" 
                      :min="0" 
                      :max="100"
                      :precision="1"
                      controls-position="right"
                    />
                    <span class="unit-text">%</span>
                    
                    <span class="threshold-label">最高湿度：</span>
                    <el-input-number 
                      v-model="alertForm.maxHumidity" 
                      :min="0" 
                      :max="100"
                      :precision="1"
                      controls-position="right"
                    />
                    <span class="unit-text">%</span>
                  </div>
                </el-form-item>
                
                <el-form-item label="土壤湿度阈值">
                  <div class="threshold-row">
                    <span class="threshold-label">最低湿度：</span>
                    <el-input-number 
                      v-model="alertForm.minSoilMoisture" 
                      :min="0" 
                      :max="100"
                      :precision="1"
                      controls-position="right"
                    />
                    <span class="unit-text">%</span>
                  </div>
                </el-form-item>
                
                <el-form-item label="光照强度阈值">
                  <div class="threshold-row">
                    <span class="threshold-label">最低光照：</span>
                    <el-input-number 
                      v-model="alertForm.minLightIntensity" 
                      :min="0" 
                      :max="100000"
                      controls-position="right"
                    />
                    <span class="unit-text">lux</span>
                  </div>
                </el-form-item>
                
                <el-form-item label="告警通知方式">
                  <el-checkbox-group v-model="alertForm.notificationMethods">
                    <el-checkbox label="email">邮件通知</el-checkbox>
                    <el-checkbox label="sms">短信通知</el-checkbox>
                    <el-checkbox label="push">推送通知</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
                
                <el-form-item>
                  <el-button 
                    type="primary" 
                    @click="saveAlertSettings"
                    :loading="alertLoading"
                  >
                    保存告警设置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('basic')
const deviceSearch = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalDevices = ref(0)
const basicLoading = ref(false)
const alertLoading = ref(false)
const deviceLoading = ref(false)

// 基本设置表单
const basicForm = reactive({
  systemName: '航清环境应急移动源管理软件',
  refreshRate: '60',
  dataRetention: 30,
  temperatureUnit: 'celsius'
})

// 基本设置验证规则
const basicRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' }
  ],
  refreshRate: [
    { required: true, message: '请选择数据刷新频率', trigger: 'change' }
  ]
}

// 告警设置表单
const alertForm = reactive({
  minTemperature: 5,
  maxTemperature: 35,
  minHumidity: 30,
  maxHumidity: 80,
  minSoilMoisture: 20,
  minLightIntensity: 5000,
  notificationMethods: ['email', 'push']
})

// 设备数据
const devices = ref([
  {
    id: 'DEV001',
    name: '温室温度传感器',
    type: 'temperature',
    status: 'online',
    location: '1号温室-A区',
    lastUpdate: '2024-01-15 10:30:25'
  },
  {
    id: 'DEV002',
    name: '土壤湿度监测器',
    type: 'soil',
    status: 'online',
    location: '1号温室-B区',
    lastUpdate: '2024-01-15 10:28:45'
  },
  {
    id: 'DEV003',
    name: '光照强度传感器',
    type: 'light',
    status: 'offline',
    location: '2号温室-C区',
    lastUpdate: '2024-01-14 16:20:15'
  },
  {
    id: 'DEV004',
    name: '环境湿度传感器',
    type: 'humidity',
    status: 'online',
    location: '1号温室-A区',
    lastUpdate: '2024-01-15 10:29:30'
  }
])

// 计算属性
const filteredDevices = computed(() => {
  let filtered = devices.value
  
  if (deviceSearch.value) {
    const search = deviceSearch.value.toLowerCase()
    filtered = filtered.filter(device => 
      device.name.toLowerCase().includes(search) ||
      device.id.toLowerCase().includes(search)
    )
  }
  
  totalDevices.value = filtered.length
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filtered.slice(start, end)
})

// 方法
const getDeviceTypeTag = (type) => {
  const typeMap = {
    temperature: 'danger',
    humidity: 'primary',
    soil: 'success',
    light: 'warning'
  }
  return typeMap[type] || 'info'
}

const getDeviceTypeText = (type) => {
  const typeMap = {
    temperature: '温度传感器',
    humidity: '湿度传感器',
    soil: '土壤传感器',
    light: '光照传感器'
  }
  return typeMap[type] || '未知设备'
}

const saveBasicSettings = async () => {
  basicLoading.value = true
  
  // 模拟保存操作
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  ElMessage.success('基本设置保存成功')
  basicLoading.value = false
}

const resetBasicForm = () => {
  Object.assign(basicForm, {
    systemName: '航清环境应急移动源管理软件',
    refreshRate: '60',
    dataRetention: 30,
    temperatureUnit: 'celsius'
  })
  ElMessage.info('表单已重置')
}

const saveAlertSettings = async () => {
  alertLoading.value = true
  
  // 模拟保存操作
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  ElMessage.success('告警设置保存成功')
  alertLoading.value = false
}

const handleDeviceSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  currentPage.value = 1
}

const handleAddDevice = () => {
  ElMessage.info('添加设备功能开发中...')
}

const handleEditDevice = (device) => {
  ElMessage.info(`编辑设备: ${device.name}`)
}

const handleDeleteDevice = async (device) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备"${device.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = devices.value.findIndex(d => d.id === device.id)
    if (index > -1) {
      devices.value.splice(index, 1)
      ElMessage.success('设备删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const handleSizeChange = (newSize) => {
  pageSize.value = newSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage) => {
  currentPage.value = newPage
}

// 生命周期
onMounted(() => {
  totalDevices.value = devices.value.length
})
</script>

<style lang="scss" scoped>

@use './SystemSettings.scss';

</style>