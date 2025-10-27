
<template>
  <div class="system-setting-container">
    <el-card class="setting-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">环境监测系统参数设置</span>
          <el-tag type="success" effect="light">实时数据校准</el-tag>
        </div>
      </template>
      
      <el-form :model="form" label-width="180px" label-position="left">
        <el-form-item label="数据采集频率" prop="collectionRate">
          <el-input-number 
            v-model="form.collectionRate" 
            :min="1" 
            :max="60" 
            controls-position="right"
            class="input-with-unit"
          />
          <span class="unit">分钟/次</span>
          <el-tooltip content="设置传感器数据采集间隔时间" placement="top">
            <span class="hint">?</span>
          </el-tooltip>
        </el-form-item>
        
        <el-form-item label="数据存储周期" prop="storagePeriod">
          <el-input-number 
            v-model="form.storagePeriod" 
            :min="1" 
            :max="365" 
            controls-position="right"
            class="input-with-unit"
          />
          <span class="unit">天</span>
          <el-tooltip content="设置历史数据保留天数" placement="top">
            <span class="hint">?</span>
          </el-tooltip>
        </el-form-item>
        
        <el-form-item label="报警阈值设置" prop="threshold">
          <div class="threshold-container">
            <el-slider 
              v-model="form.threshold" 
              :min="0" 
              :max="100" 
              :step="5" 
              show-stops
              :marks="{
                0: '0%',
                50: '50%',
                100: '100%'
              }"
            />
            <span class="unit">当前: {{ form.threshold }}%</span>
          </div>
        </el-form-item>
        
        <el-form-item label="自动校准" prop="autoCalibration">
          <el-switch 
            v-model="form.autoCalibration" 
            active-text="启用" 
            inactive-text="禁用"
            active-color="#13ce66"
          />
        </el-form-item>
        
        <el-form-item label="校准时间" prop="calibrationTime" v-if="form.autoCalibration">
          <el-time-picker 
            v-model="form.calibrationTime" 
            placeholder="选择时间"
            format="HH:mm"
            value-format="HH:mm"
            class="time-picker"
          />
          <el-button 
            type="text" 
            @click="showCalibrationHelp"
            class="help-btn"
          >
            校准说明
          </el-button>
        </el-form-item>
        
        <el-form-item class="action-btns">
          <el-button 
            type="primary" 
            @click="handleSubmit"
            :loading="submitting"
          >
            保存设置
          </el-button>
          <el-button @click="showResetConfirm">恢复默认</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    
    <el-card class="log-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="title">系统操作日志</span>
          <div class="log-filter">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索日志内容或类型" 
              clearable 
              class="search-input"
              @clear="handleSearchClear"
            >
              <template #prefix>
                <span class="search-icon">🔍</span>
              </template>
            </el-input>
            <el-button 
              type="primary" 
              @click="handleSearch"
              class="search-btn"
            >
              搜索
            </el-button>
            <el-button @click="exportLogs">导出日志</el-button>
          </div>
        </div>
      </template>
      
      <el-table 
        :data="filteredLogs" 
        height="300" 
        border 
        style="width: 100%" 
        v-loading="loading"
        :row-class-name="tableRowClassName"
      >
        <el-table-column 
          prop="time" 
          label="时间" 
          width="180" 
          sortable 
          :formatter="formatTime"
        />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getLogTypeTag(row.type)" 
              effect="light"
              :class="row.type"
            >
              {{ row.type.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              type="text" 
              size="small" 
              @click="showLogDetail(row)"
            >
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination 
          v-model:current-page="currentPage" 
          :page-size="pageSize" 
          :total="totalLogs" 
          layout="total, prev, pager, next, jumper"
          @current-change="handlePageChange"
          background
        />
      </div>
    </el-card>

    <!-- 校准说明弹窗 -->
    <el-dialog 
      v-model="calibrationHelpVisible" 
      title="自动校准说明" 
      width="500px"
    >
      <div class="dialog-content">
        <p>系统将在设定时间自动执行以下校准操作：</p>
        <ul>
          <li>检查所有传感器连接状态</li>
          <li>校准传感器基准值</li>
          <li>验证数据采集准确性</li>
          <li>生成校准报告</li>
        </ul>
        <p>建议将校准时间设置在监测数据量较少的时段。</p>
      </div>
      <template #footer>
        <el-button @click="calibrationHelpVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 日志详情弹窗 -->
    <el-dialog 
      v-model="logDetailVisible" 
      :title="`日志详情 - ${selectedLog?.type || ''}`" 
      width="600px"
    >
      <div class="log-detail-content">
        <div class="detail-row">
          <span class="label">时间：</span>
          <span>{{ selectedLog?.time || '' }}</span>
        </div>
        <div class="detail-row">
          <span class="label">类型：</span>
          <el-tag 
            :type="getLogTypeTag(selectedLog?.type)" 
            effect="light"
          >
            {{ selectedLog?.type?.toUpperCase() || '' }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="label">内容：</span>
          <span>{{ selectedLog?.content || '' }}</span>
        </div>
        <div class="detail-row" v-if="selectedLog?.details">
          <span class="label">详细信息：</span>
          <pre>{{ selectedLog.details }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="logDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 表单数据
const form = ref({
  collectionRate: 5,
  storagePeriod: 30,
  threshold: 80,
  autoCalibration: true,
  calibrationTime: '02:00'
})

// 日志相关数据
const logs = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const submitting = ref(false)
const calibrationHelpVisible = ref(false)
const logDetailVisible = ref(false)
const selectedLog = ref(null)

// 生成模拟日志数据
const generateMockLogs = () => {
  const types = ['info', 'warning', 'error', 'success']
  const contents = [
    'PM2.5传感器校准完成，偏差值: 0.3μg/m³',
    '温度传感器检测到异常波动，建议检查',
    '系统自动校准启动，预计完成时间02:30',
    '存储空间使用率达到85%，建议清理历史数据',
    'CO2传感器数据异常，已启用备用传感器',
    '用户修改了报警阈值设置从75%到80%',
    '数据库备份完成，大小: 2.3GB',
    '网络连接中断3分钟，已自动恢复',
    '系统性能优化完成，响应时间提升15%',
    '检测到异常数据值: PM10=320μg/m³'
  ]
  const details = [
    '校准过程顺利完成，所有传感器偏差值在允许范围内',
    '温度传感器在12:30-13:00期间出现3次异常读数',
    '校准包含12个传感器，耗时28分钟',
    '当前存储使用情况: 历史数据85GB，系统日志2GB',
    '主传感器读数异常，已切换至ID: S-023备用传感器',
    '阈值修改时间: 2023-05-15 14:30:25',
    '备份路径: /backup/system_20230515.db',
    '网络中断时间: 15:23:10-15:26:05，原因: 路由器重启',
    '优化内容包括数据库索引重建和缓存策略调整',
    '异常值位于传感器ID: PM10-07，位置: 东区监测点'
  ]
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    time: new Date(Date.now() - i * 3600000).toISOString(),
    type: types[Math.floor(Math.random() * types.length)],
    content: contents[Math.floor(Math.random() * contents.length)],
    details: details[Math.floor(Math.random() * details.length)]
  }))
}

// 计算属性
const filteredLogs = computed(() => {
  let result = logs.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      log => log.content.toLowerCase().includes(query) || 
             log.type.toLowerCase().includes(query) ||
             (log.details && log.details.toLowerCase().includes(query))
    )
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  
  return result.slice(start, end)
})

const totalLogs = computed(() => {
  if (searchQuery.value) {
    return logs.value.filter(
      log => log.content.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
             log.type.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
             (log.details && log.details.toLowerCase().includes(searchQuery.value.toLowerCase()))
    ).length
  }
  return logs.value.length
})

// 方法
const getLogTypeTag = (type) => {
  const map = {
    info: 'info',
    warning: 'warning',
    error: 'danger',
    success: 'success'
  }
  return map[type] || ''
}

const formatTime = (row) => {
  return new Date(row.time).toLocaleString()
}

const tableRowClassName = ({ row }) => {
  return `log-row-${row.type}`
}

const handleSubmit = () => {
  submitting.value = true
  
  // 模拟异步提交
  setTimeout(() => {
    submitting.value = false
    ElMessage.success('系统设置保存成功')
    
    // 添加日志记录
    logs.value.unshift({
      id: logs.value.length + 1,
      time: new Date().toISOString(),
      type: 'success',
      content: '系统参数已更新',
      details: `采集频率: ${form.value.collectionRate}分钟, 存储周期: ${form.value.storagePeriod}天, 阈值: ${form.value.threshold}%, 自动校准: ${form.value.autoCalibration ? '开启' : '关闭'}${form.value.autoCalibration ? `, 校准时间: ${form.value.calibrationTime}` : ''}`
    })
  }, 1500)
}

const showResetConfirm = () => {
  ElMessageBox.confirm(
    '确定要恢复默认设置吗？所有自定义设置将被重置。',
    '恢复默认确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    resetForm()
  }).catch(() => {
    ElMessage.info('已取消重置操作')
  })
}

const resetForm = () => {
  form.value = {
    collectionRate: 5,
    storagePeriod: 30,
    threshold: 80,
    autoCalibration: true,
    calibrationTime: '02:00'
  }
  ElMessage.success('已恢复默认设置')
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handlePageChange = (page) => {
  currentPage.value = page
}

const showCalibrationHelp = () => {
  calibrationHelpVisible.value = true
}

const showLogDetail = (log) => {
  selectedLog.value = log
  logDetailVisible.value = true
}

const exportLogs = () => {
  loading.value = true
  // 模拟导出操作
  setTimeout(() => {
    loading.value = false
    ElMessage.success('日志导出成功，已生成下载文件')
    
    // 添加日志记录
    logs.value.unshift({
      id: logs.value.length + 1,
      time: new Date().toISOString(),
      type: 'info',
      content: '系统日志导出操作',
      details: `导出时间: ${new Date().toLocaleString()}, 导出记录数: ${filteredLogs.value.length}`
    })
  }, 2000)
}

// 生命周期钩子
onMounted(() => {
  loading.value = true
  
  // 模拟异步加载
  setTimeout(() => {
    logs.value = generateMockLogs()
    loading.value = false
  }, 800)
})
</script>

<style lang="scss" scoped>

@use './SystemSetting.scss';

</style>
    