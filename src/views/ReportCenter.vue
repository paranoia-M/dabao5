<template>
  <div class="page-report_center">
    <!-- 顶部：类型选择+时间+操作按钮 -->
    <div class="top-bar">
      <div class="top-left">
        <span class="label">报表类型</span>
        <el-select v-model="reportType" placeholder="请选择" style="width:150px">
          <el-option label="生产报表" value="production" />
          <el-option label="质量报表" value="quality" />
          <el-option label="设备报表" value="equipment" />
          <el-option label="综合报表" value="composite" />
        </el-select>
        <span class="label" style="margin-left:20px">时间范围</span>
        <el-select v-model="timeRangePreset" placeholder="请选择" style="width:140px" @change="onTimePresetChange">
          <el-option label="最近7天" value="7d" />
          <el-option label="最近30天" value="30d" />
          <el-option label="自定义" value="custom" />
        </el-select>
        <el-date-picker
          v-if="timeRangePreset==='custom'"
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="margin-left:10px;width:240px"
          value-format="YYYY-MM-DD"
        />
      </div>
      <div class="top-right">
        <el-button type="primary" @click="handleGenerate">生成报表</el-button>
        <el-button plain @click="handleSaveConfig">保存配置</el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-input v-model="keyword" placeholder="搜索报表名称" clearable style="width:220px" />
      <el-select v-model="statusFilter" placeholder="创建人" style="width:150px;margin-left:12px">
        <el-option label="全部" value="" />
        <el-option label="我的创建" value="mine" />
        <el-option label="共享给我" value="shared" />
      </el-select>
      <el-date-picker
        v-model="filterDateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="筛选开始"
        end-placeholder="筛选结束"
        style="margin-left:12px;width:240px"
        value-format="YYYY-MM-DD"
      />
    </div>

    <!-- 主舞台：饼图 + KPI数字 -->
    <div class="main-area">
      <div class="chart-section">
        <div class="section-title">报警严重程度饼图</div>
        <div class="pie-container">
          <div class="pie-ring" :style="pieStyle" @mouseenter="pieHovered=true" @mouseleave="pieHovered=false">
            <div class="pie-hole">{{ pieTotal }}</div>
          </div>
          <div class="pie-legend">
            <div v-for="item in pieData" :key="item.label" class="legend-item">
              <span class="dot" :style="{background:item.color}"></span>
              <span>{{ item.label }}</span>
              <span class="num">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="kpi-section">
        <div class="kpi-card" v-for="kpi in kpiList" :key="kpi.label">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-value">{{ kpi.value }}</div>
        </div>
      </div>
    </div>

    <!-- 已保存配置列表 -->
    <div class="config-section">
      <div class="section-title">已保存配置列表</div>
      <el-table :data="filteredConfigs" stripe style="width:100%" @row-click="handleRowClick">
        <el-table-column prop="name" label="报表名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="typeName" label="类型" width="100" />
        <el-table-column prop="createdBy" label="创建人" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click.stop="handleDetail(row)">详情</el-button>
            <el-button
              link
              type="primary"
              :disabled="row.createdBy !== currentUser"
              @click.stop="handleEdit(row)"
            >编辑</el-button>
            <el-button link type="danger" @click.stop="handleDelete(row)">删除</el-button>
            <el-button link type="primary" @click.stop="handleExport(row)">导出</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 保存配置 Dialog -->
    <el-dialog v-model="saveDialogVisible" :title="isEdit?'编辑配置':'保存配置'" width="min(640px,92vw)" destroy-on-close>
      <el-form ref="saveForm" :model="saveForm" label-width="100px" :rules="saveRules">
        <el-form-item label="报表名称" prop="name">
          <el-input v-model="saveForm.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="报表类型" prop="type">
          <el-select v-model="saveForm.type" style="width:100%">
            <el-option label="生产报表" value="production" />
            <el-option label="质量报表" value="quality" />
            <el-option label="设备报表" value="equipment" />
            <el-option label="综合报表" value="composite" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围" prop="timeRange">
          <el-select v-model="saveForm.timeRange" style="width:100%">
            <el-option label="最近7天" value="7d" />
            <el-option label="最近30天" value="30d" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        <el-form-item label="筛选条件" prop="filters">
          <div class="filter-tags">
            <el-tag
              v-for="(tag,index) in saveForm.filters"
              :key="index"
              closable
              @close="saveForm.filters.splice(index,1)"
            >{{ tag }}</el-tag>
            <el-button size="small" @click="addFilterTag">+添加筛选</el-button>
          </div>
        </el-form-item>
        <el-form-item label="图表类型" prop="chartType">
          <el-select v-model="saveForm.chartType" style="width:100%">
            <el-option label="饼图" value="pie" />
            <el-option label="折线图" value="line" />
            <el-option label="柱状图" value="bar" />
            <el-option label="表格" value="table" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveDialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="报表详情"
      size="min(800px,90vw)"
      destroy-on-close
    >
      <template v-if="detailData">
        <div class="drawer-layout">
          <div class="drawer-left">
            <div class="detail-summary">
              <div class="summary-item"><span class="label">报表名称</span><span>{{ detailData.name }}</span></div>
              <div class="summary-item"><span class="label">报表类型</span><span>{{ typeLabel(detailData.type) }}</span></div>
              <div class="summary-item"><span class="label">时间范围</span><span>{{ detailData.timeRange==='custom'?'自定义':'最近'+detailData.timeRange }}</span></div>
              <div class="summary-item"><span class="label">筛选条件</span><span>{{ detailData.filters.join(', ') || '无' }}</span></div>
              <div class="summary-item"><span class="label">图表类型</span><span>{{ chartTypeLabel(detailData.chartType) }}</span></div>
            </div>
            <div class="export-area">
              <el-button type="primary" @click="handleExport(detailData)">导出PDF</el-button>
              <el-button plain @click="handleExportExcel(detailData)">导出Excel</el-button>
            </div>
          </div>
          <div class="drawer-right">
            <!-- 根据 chartType 渲染不同图表 -->
            <div v-if="detailData.chartType==='pie'" class="drawer-chart">
              <div class="pie-ring" :style="pieStyle" style="width:200px;height:200px">
                <div class="pie-hole">{{ pieTotal }}</div>
              </div>
              <div class="pie-legend">
                <div v-for="item in pieData" :key="item.label" class="legend-item">
                  <span class="dot" :style="{background:item.color}"></span>
                  <span>{{ item.label }}</span>
                  <span class="num">{{ item.value }}</span>
                </div>
              </div>
            </div>
            <div v-else-if="detailData.chartType==='line'" class="drawer-chart">
              <svg width="100%" height="200" viewBox="0 0 300 200" preserveAspectRatio="none">
                <polyline :points="linePoints" fill="none" stroke="var(--page-primary)" stroke-width="2" />
              </svg>
            </div>
            <div v-else-if="detailData.chartType==='bar'" class="drawer-chart">
              <div class="bar-chart">
                <div v-for="(bar,i) in barData" :key="i" class="bar-item">
                  <div class="bar-label">{{ bar.label }}</div>
                  <div class="bar-track"><div class="bar-fill" :style="{width:(bar.value/maxBarValue*100)+'%'}"></div></div>
                  <div class="bar-value">{{ bar.value }}</div>
                </div>
              </div>
            </div>
            <div v-else class="drawer-chart">
              <el-table :data="tableData" stripe style="width:100%">
                <el-table-column prop="label" label="维度" />
                <el-table-column prop="value" label="数值" />
              </el-table>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useProductionLineStore } from '@/stores/productionLine'
import { useEquipmentStore } from '@/stores/equipment'
import { useAlarmRecordStore } from '@/stores/alarmRecord'
import { useInspectionTaskStore } from '@/stores/inspectionTask'
import { useInspectionStandardStore } from '@/stores/inspectionStandard'
import { useMaintenancePlanStore } from '@/stores/maintenancePlan'
import { useMaintenanceOrderStore } from '@/stores/maintenanceOrder'
import { ElMessage, ElMessageBox } from 'element-plus'

// 假设当前用户
const currentUser = '张伟'

// Store
const productionLineStore = useProductionLineStore()
const equipmentStore = useEquipmentStore()
const alarmRecordStore = useAlarmRecordStore()
const inspectionTaskStore = useInspectionTaskStore()
const inspectionStandardStore = useInspectionStandardStore()
const maintenancePlanStore = useMaintenancePlanStore()
const maintenanceOrderStore = useMaintenanceOrderStore()

// 报表配置列表（本地持久化）
const reportConfigs = ref(loadConfigs())
function loadConfigs() {
  try {
    const raw = localStorage.getItem('report_configs')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function saveConfigs() {
  localStorage.setItem('report_configs', JSON.stringify(reportConfigs.value))
}

// 顶部
const reportType = ref('production')
const timeRangePreset = ref('7d')
const customDateRange = ref(null) // 自定义范围

// 筛选
const keyword = ref('')
const statusFilter = ref('')
const filterDateRange = ref([])

// 当前用户配置过滤
const filteredConfigs = computed(() => {
  let list = reportConfigs.value
  if (keyword.value) {
    list = list.filter(c => c.name.includes(keyword.value))
  }
  if (statusFilter.value === 'mine') {
    list = list.filter(c => c.createdBy === currentUser)
  } else if (statusFilter.value === 'shared') {
    // 共享机制简化，假设任何非自己创建的为共享
    list = list.filter(c => c.createdBy !== currentUser)
  }
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const [start, end] = filterDateRange.value
    list = list.filter(c => {
      const t = new Date(c.createTime)
      return t >= new Date(start) && t <= new Date(end + ' 23:59:59')
    })
  }
  return list
})

// 饼图数据
const pieData = computed(() => {
  const map = { 低级: 0, 中级: 0, 高级: 0, 紧急: 0 }
  alarmRecordStore.alarmRecordList.forEach(r => {
    if (map.hasOwnProperty(r.severity)) map[r.severity]++
  })
  const colors = { 低级: '#22c55e', 中级: '#eab308', 高级: '#f97316', 紧急: '#ef4444' }
  const total = Object.values(map).reduce((a,b)=>a+b,0)
  return Object.entries(map).map(([label, value]) => ({
    label, value, color: colors[label], ratio: total > 0 ? value / total : 0
  }))
})
const pieTotal = computed(() => pieData.value.reduce((a,b)=>a+b.value,0))
const pieStyle = computed(() => {
  const parts = pieData.value.map(d => {
    const deg = d.ratio * 360
    return `${d.color} ${d.ratio*360}deg`
  })
  if (parts.length === 0) return {}
  // conic-gradient
  // 累积百分比
  let current = 0
  const stops = pieData.value.map(d => {
    const start = current
    const end = current + d.ratio * 360
    current = end
    if (d.ratio === 0) return null
    return `${d.color} ${start}deg ${end}deg`
  }).filter(Boolean)
  if (stops.length === 0) return { background: '#eee' }
  return {
    background: `conic-gradient(${stops.join(', ')})`
  }
})

// KPI 数字
const kpiList = computed(() => {
  const equipAvg = equipmentStore.equipmentList.length > 0
    ? (equipmentStore.equipmentList.reduce((s,e)=>s+e.healthScore,0) / equipmentStore.equipmentList.length).toFixed(1)
    : 0
  const failCount = inspectionTaskStore.inspectionTaskList.filter(t => t.result === '不合格').length
  return [
    { label: '报警总数', value: alarmRecordStore.alarmRecordList.length },
    { label: '设备健康均分', value: equipAvg },
    { label: '质检不合格数', value: failCount },
    { label: '维护工单数', value: maintenanceOrderStore.maintenanceOrderList.length }
  ]
})

// 生成报表 || 详情 drawer 内数据
const detailDrawerVisible = ref(false)
const detailData = ref(null)
const linePoints = ref('')
const barData = ref([])
const maxBarValue = ref(1)
const tableData = ref([])

function typeLabel(t) {
  const map = { production:'生产报表', quality:'质量报表', equipment:'设备报表', composite:'综合报表' }
  return map[t] || t
}
function chartTypeLabel(c) {
  const map = { pie:'饼图', line:'折线图', bar:'柱状图', table:'表格' }
  return map[c] || c
}

// 生成报表时计算图表数据
function computeChartData(config) {
  // 折线图：按天统计报警数
  const dayMap = {}
  alarmRecordStore.alarmRecordList.forEach(r => {
    if (r.triggerTime) {
      const day = r.triggerTime.slice(0, 10)
      if (!day) return
      dayMap[day] = (dayMap[day] || 0) + 1
    }
  })
  const sortedDays = Object.keys(dayMap).sort()
  const points = sortedDays.map((d, i) => {
    const x = (i / (sortedDays.length - 1 || 1)) * 300
    const y = 200 - (dayMap[d] / (Math.max(...Object.values(dayMap), 1))) * 180
    return `${x},${y}`
  }).join(' ')
  linePoints.value = points

  // 柱状图：按设备ID统计维护工单数
  const eqMap = {}
  maintenanceOrderStore.maintenanceOrderList.forEach(o => {
    const eid = o.equipmentId
    eqMap[eid] = (eqMap[eid] || 0) + 1
  })
  const sorted = Object.entries(eqMap).sort((a,b)=>b[1]-a[1]).slice(0, 10)
  const max = Math.max(...sorted.map(s=>s[1]), 1)
  maxBarValue.value = max
  // 获取设备名称
  const eqNameMap = {}
  equipmentStore.equipmentList.forEach(e => { eqNameMap[e.id] = e.name })
  barData.value = sorted.map(([id, v]) => ({
    label: eqNameMap[id] || id,
    value: v
  }))

  // 表格：报警类型统计
  const typeMap = {}
  alarmRecordStore.alarmRecordList.forEach(r => {
    typeMap[r.alarmType] = (typeMap[r.alarmType] || 0) + 1
  })
  tableData.value = Object.entries(typeMap).map(([label, value]) => ({ label, value }))
}

// 点击生成报表
function handleGenerate() {
  if (!reportType.value) {
    reportType.value = 'production'
    ElMessage.info('已自动选择生产报表')
  }
  // 构建临时配置用于展现
  const config = {
    name: '临时报表',
    type: reportType.value,
    timeRange: timeRangePreset.value,
    customDateRange: customDateRange.value,
    filters: [],
    chartType: 'pie', // 默认饼图
    createdBy: currentUser,
    createTime: new Date().toLocaleString()
  }
  computeChartData(config)
  detailData.value = config
  detailDrawerVisible.value = true
}

// 点击详情
function handleDetail(row) {
  computeChartData(row)
  detailData.value = row
  detailDrawerVisible.value = true
}

// 导出PDF/Excel
function handleExport(row) {
  ElMessageBox.confirm('导出为PDF格式？', '导出', {
    confirmButtonText: 'PDF',
    cancelButtonText: 'Excel',
    distinguishCancelAndClose: true,
    type: 'info'
  }).then(() => {
    simulateExport('PDF', row)
  }).catch(action => {
    if (action === 'cancel') {
      simulateExport('Excel', row)
    }
  })
}
function handleExportExcel(row) {
  simulateExport('Excel', row)
}
function simulateExport(format, row) {
  ElMessage.info(`开始导出 ${format}...`)
  // 模拟异步
  setTimeout(() => {
    ElMessage.success(`导出 ${format} 成功`)
  }, 1500)
}

// 保存配置相关
const saveDialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const saveForm = ref({
  name: '',
  type: 'production',
  timeRange: '7d',
  filters: [],
  chartType: 'pie'
})
const saveRules = {
  name: [
    { required: true, message: '请输入报表名称', trigger: 'blur' },
    { max: 50, message: '名称不能超过50字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && reportConfigs.value.some(c => c.name === value && c.id !== editingId.value)) {
        callback(new Error('名称已存在，请使用唯一名称'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}
const saving = ref(false)
const saveFormRef = ref(null)

function handleSaveConfig() {
  isEdit.value = false
  editingId.value = null
  saveForm.value = {
    name: '',
    type: 'production',
    timeRange: '7d',
    filters: [],
    chartType: 'pie'
  }
  saveDialogVisible.value = true
  nextTick(() => {
    saveFormRef.value?.clearValidate()
  })
}
function handleEdit(row) {
  if (row.createdBy !== currentUser) {
    ElMessage.warning('只可编辑自己创建的报表配置')
    return
  }
  isEdit.value = true
  editingId.value = row.id
  saveForm.value = { ...row, filters: [...row.filters] }
  saveDialogVisible.value = true
}
function confirmSave() {
  saveFormRef.value.validate(valid => {
    if (!valid) return
    saving.value = true
    const form = saveForm.value
    if (!isEdit.value) {
      const id = Date.now().toString()
      reportConfigs.value.unshift({
        id,
        name: form.name,
        type: form.type,
        timeRange: form.timeRange,
        filters: form.filters,
        chartType: form.chartType,
        createdBy: currentUser,
        createTime: new Date().toLocaleString()
      })
    } else {
      const idx = reportConfigs.value.findIndex(c => c.id === editingId.value)
      if (idx !== -1) {
        reportConfigs.value[idx] = {
          ...reportConfigs.value[idx],
          name: form.name,
          type: form.type,
          timeRange: form.timeRange,
          filters: form.filters,
          chartType: form.chartType
        }
      }
    }
    saveConfigs()
    saving.value = false
    saveDialogVisible.value = false
    ElMessage.success(isEdit.value ? '配置已更新' : '配置已保存')
  })
}

function addFilterTag() {
  const tag = prompt('请输入筛选标签（如：产线A）')
  if (tag && tag.trim()) {
    if (saveForm.value.filters.length < 5) {
      saveForm.value.filters.push(tag.trim())
    } else {
      ElMessage.warning('最多5个筛选条件')
    }
  }
}

// 删除
function handleDelete(row) {
  ElMessageBox.confirm(
    '确认删除该报表配置吗？',
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idx = reportConfigs.value.findIndex(c => c.id === row.id)
    if (idx !== -1) {
      reportConfigs.value.splice(idx, 1)
      saveConfigs()
      ElMessage.success('删除成功')
    }
  }).catch(() => {})
}

// 时间预设改变
function onTimePresetChange(val) {
  if (val !== 'custom') {
    customDateRange.value = null
  }
}

// 行点击详情
function handleRowClick(row) {
  handleDetail(row)
}
</script>

<style scoped lang="scss">
@use './ReportCenter.scss' as *;
</style>