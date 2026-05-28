<template>
  <div class="page-dashboard_overview">
    <div class="toolbar">
      <el-button type="primary" @click="uploadDialogVisible = true">
        <el-icon><Upload /></el-icon> 上传模型
      </el-button>
      <el-dropdown @command="handleExport">
        <el-button><el-icon><Download /></el-icon> 导出概览</el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="Excel">导出 Excel</el-dropdown-item>
            <el-dropdown-item command="PDF">导出 PDF</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- KPI 卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :span="6" v-for="kpi in kpis" :key="kpi.label">
        <el-card class="kpi-card" :style="{ '--card-color': kpi.color }" shadow="never" @click="handleKpiClick(kpi)">
          <div class="kpi-value">{{ formatNumber(kpi.value) }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-unit">{{ kpi.unit }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选区 -->
    <el-row class="filter-row" :gutter="16">
      <el-col :span="12">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" :shortcuts="shortcuts" style="width:100%" />
      </el-col>
      <el-col :span="12">
        <el-select v-model="filterCategories" multiple placeholder="资产类型" clearable style="width:100%">
          <el-option v-for="cat in categoryOptions" :key="cat.value" :label="cat.label" :value="cat.value" />
        </el-select>
      </el-col>
    </el-row>

    <!-- 主舞台：花冠图 + 待办 + 饼图 + 折线图 -->
    <el-row class="main-stage" :gutter="16">
      <!-- 左侧：花冠图 + 待办 -->
      <el-col :span="14">
        <el-card class="corolla-card" shadow="never">
          <div class="card-header">格式分布</div>
          <div class="corolla-wrapper">
            <svg viewBox="0 0 300 300" width="300" height="300">
              <g v-for="(slice, index) in piePaths" :key="index">
                <path :d="slice.path" :fill="slice.color" @mouseenter="hoveredFormat = slice.label" @mouseleave="hoveredFormat = null" class="corolla-slice" />
                <title>{{ slice.label }}: {{ slice.count }}</title>
              </g>
              <text x="150" y="150" text-anchor="middle" dominant-baseline="middle" font-size="24" font-weight="bold" fill="#333">{{ totalModels }}</text>
            </svg>
            <div class="corolla-legend" v-if="hoveredFormat">{{ hoveredFormat }}</div>
          </div>
        </el-card>
        <!-- 待办事项 -->
        <el-card class="pending-card" shadow="never">
          <div class="card-header">待审批共享 ({{ pendingShareCount }})</div>
          <div v-if="pendingRequests.length === 0" class="empty-tip">暂无待办</div>
          <div v-for="req in pendingRequests" :key="req.id" class="pending-item">
            <div class="pending-info">
              <span class="pending-applicant">{{ req.applicantName }}</span>
              <span class="pending-model">{{ getModelName(req.modelId) }}</span>
              <span class="pending-time">{{ req.createdAt.slice(0,10) }}</span>
            </div>
            <el-button type="primary" size="small" @click="openApproval(req)">审批</el-button>
          </div>
        </el-card>
      </el-col>
      <!-- 右侧：饼图 + 折线图 -->
      <el-col :span="10">
        <el-card class="chart-card" shadow="never">
          <div class="card-header">模型分类分布</div>
          <div ref="pieChartRef" class="echart-container" style="height:280px"></div>
        </el-card>
        <el-card class="chart-card" shadow="never" style="margin-top:16px">
          <div class="card-header">每日上传趋势</div>
          <div ref="lineChartRef" class="echart-container" style="height:280px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部：最新模型 + 近期操作 -->
    <el-row class="bottom-row" :gutter="16">
      <el-col :span="12">
        <el-card class="bottom-card" shadow="never">
          <div class="card-header">最新模型</div>
          <div v-for="m in latestModels" :key="m.id" class="latest-model-item" @click="showModelDetail(m)">
            <el-tag size="small" :type="m.status === '已发布' ? 'success' : 'warning'">{{ m.status }}</el-tag>
            <span class="model-name">{{ m.name }}</span>
            <span class="model-size">{{ (m.fileSize).toFixed(1) }}MB</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="bottom-card" shadow="never">
          <div class="card-header">近期操作记录</div>
          <div v-for="rec in recentRecords" :key="rec.id" class="record-item">
            <el-tag size="small">{{ rec.action }}</el-tag>
            <span>{{ rec.description }}</span>
            <span class="record-time">{{ rec.time }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 上传模型对话框 -->
    <el-dialog v-model="uploadDialogVisible" title="上传新模型" width="min(640px,92vw)" :close-on-click-modal="false">
      <el-form :model="uploadForm" label-position="top">
        <el-form-item label="模型名称" required>
          <el-input v-model="uploadForm.name" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="文件上传">
          <el-upload ref="uploadRef" :auto-upload="false" :limit="1" :on-change="handleFileChange" accept=".fbx,.obj,.max,.blend,.png,.jpg">
            <el-button>选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">支持格式：FBX/OBJ/MAX/BLEND/PNG/JPG，单个文件不超过2GB</div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="资产类别">
          <el-select v-model="uploadForm.categoryId" placeholder="选择类别">
            <el-option v-for="cat in categoryOptions" :key="cat.value" :label="cat.label" :value="cat.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="uploadForm.tags" multiple filterable allow-create default-first-option placeholder="输入标签后回车">
            <el-option v-for="tag in modelTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="权限设置">
          <el-radio-group v-model="uploadForm.permission">
            <el-radio value="公开">公开</el-radio>
            <el-radio value="团队">团队</el-radio>
            <el-radio value="指定成员">指定成员</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!canSubmitUpload" @click="submitUpload">提交</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approvalDialogVisible" title="审批共享请求" width="min(480px,90vw)" :close-on-click-modal="false">
      <div style="margin-bottom:16px">
        <p>申请人：{{ currentRequest?.applicantName }}</p>
        <p>模型：{{ getModelName(currentRequest?.modelId) }}</p>
        <p>申请理由：{{ currentRequest?.reason }}</p>
      </div>
      <el-form>
        <el-form-item label="审批意见">
          <el-input v-model="approvalComment" type="textarea" :rows="3" placeholder="请输入审批备注（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="handleApprove('驳回')">驳回</el-button>
        <el-button type="success" @click="handleApprove('通过')">通过</el-button>
      </template>
    </el-dialog>

    <!-- 卡片列表弹窗（点击KPI卡片触发） -->
    <el-dialog v-model="listDialogVisible" :title="listDialogTitle" width="min(800px,90vw)">
      <el-table :data="listDialogData" stripe v-if="listDialogType==='model'" style="width:100%">
        <el-table-column prop="name" label="模型名称" />
        <el-table-column prop="format" label="格式" width="80" />
        <el-table-column prop="status" label="状态" width="80" />
        <el-table-column prop="createdAt" label="上传时间" width="180" />
      </el-table>
      <el-table :data="listDialogData" stripe v-else-if="listDialogType==='pending'" style="width:100%">
        <el-table-column prop="applicantName" label="申请人" />
        <el-table-column label="模型" prop="modelId">
          <template #default="{row}">{{ getModelName(row.modelId) }}</template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{row}">
            <el-button size="small" type="primary" @click="openApproval(row)">审批</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-table :data="listDialogData" stripe v-else-if="listDialogType==='export'" style="width:100%">
        <el-table-column prop="module" label="模块" />
        <el-table-column prop="format" label="格式" />
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="createdAt" label="导出时间" width="180" />
      </el-table>
      <el-table :data="listDialogData" stripe v-else-if="listDialogType==='upload'" style="width:100%">
        <el-table-column prop="fileName" label="文件名" />
        <el-table-column prop="format" label="格式" />
        <el-table-column prop="status" label="状态" />
        <el-table-column prop="createdAt" label="上传时间" width="180" />
      </el-table>
    </el-dialog>

    <!-- 模型详情弹窗 -->
    <el-dialog v-model="modelDetailVisible" title="模型详情" width="min(500px,90vw)">
      <div v-if="detailModel">
        <p><strong>名称：</strong>{{ detailModel.name }}</p>
        <p><strong>编号：</strong>{{ detailModel.code }}</p>
        <p><strong>格式：</strong>{{ detailModel.format }}</p>
        <p><strong>状态：</strong><el-tag :type="detailModel.status==='已发布'?'success':'warning'">{{ detailModel.status }}</el-tag></p>
        <p><strong>标签：</strong><el-tag v-for="tag in detailModel.tags" :key="tag" style="margin-right:4px">{{ tag }}</el-tag></p>
        <p><strong>描述：</strong>{{ detailModel.description || '暂无描述' }}</p>
        <p><strong>文件大小：</strong>{{ (detailModel.fileSize).toFixed(1) }} MB</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useModelStore } from '@/stores/model'
import { useModelCategoryStore } from '@/stores/modelCategory'
import { useShareRequestStore } from '@/stores/shareRequest'
import { useApprovalRecordStore } from '@/stores/approvalRecord'
import { useExportRecordStore } from '@/stores/exportRecord'
import { useUploadRecordStore } from '@/stores/uploadRecord'

const modelStore = useModelStore()
const categoryStore = useModelCategoryStore()
const shareRequestStore = useShareRequestStore()
const approvalRecordStore = useApprovalRecordStore()
const exportRecordStore = useExportRecordStore()
const uploadRecordStore = useUploadRecordStore()

// ========== KPI 计算 ==========
const totalModels = computed(() => modelStore.modelList.length)
const todayUploads = computed(() => {
  const today = new Date().toDateString()
  return uploadRecordStore.uploadRecordList.filter(r => new Date(r.createdAt).toDateString() === today).length
})
const pendingShareCount = computed(() => shareRequestStore.shareRequestList.filter(s => s.status === '待审批').length)
const thisMonthExports = computed(() => {
  const now = new Date()
  return exportRecordStore.exportRecordList.filter(r => {
    const d = new Date(r.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
})
const kpis = computed(() => [
  { label: '模型总数', value: totalModels.value, unit: '个', color: '#2563EB' },
  { label: '今日上传', value: todayUploads.value, unit: '个', color: '#10B981' },
  { label: '待审批共享', value: pendingShareCount.value, unit: '项', color: '#F59E0B' },
  { label: '本月导出', value: thisMonthExports.value, unit: '次', color: '#6366F1' }
])

function formatNumber(num) {
  return (num || 0).toLocaleString()
}

// ========== 筛选 ==========
const dateRange = ref([])
const filterCategories = ref([])
const shortcuts = [
  { text: '近7天', value: () => [new Date(Date.now() - 7*24*60*60*1000), new Date()] },
  { text: '近30天', value: () => [new Date(Date.now() - 30*24*60*60*1000), new Date()] },
  { text: '近90天', value: () => [new Date(Date.now() - 90*24*60*60*1000), new Date()] },
]
const categoryOptions = computed(() => categoryStore.categoryList.map(c => ({ label: c.name, value: c.id })))

// ========== 花冠图 ==========
const hoveredFormat = ref(null)
const colorMap = { 'FBX': '#3B82F6', 'OBJ': '#10B981', 'glTF': '#F59E0B', '3DS': '#EF4444', 'STL': '#8B5CF6', '其他': '#6B7280' }
const formatCounts = computed(() => {
  const counts = {}
  modelStore.modelList.forEach(m => {
    const f = m.format || '其他'
    counts[f] = (counts[f] || 0) + 1
  })
  return Object.entries(counts).map(([format, count]) => ({ format, count }))
})
const piePaths = computed(() => {
  const total = totalModels.value
  if (total === 0) return []
  let startAngle = -90
  return formatCounts.value.map(item => {
    const angle = (item.count / total) * 360
    const endAngle = startAngle + angle
    const start = polarToCartesian(150, 150, 120, startAngle)
    const end = polarToCartesian(150, 150, 120, endAngle)
    const largeArcFlag = angle > 180 ? 1 : 0
    const path = `M 150 150 L ${start.x} ${start.y} A 120 120 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`
    startAngle = endAngle
    return { path, color: colorMap[item.format] || '#ccc', label: item.format, count: item.count }
  })
})
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = angleDeg * Math.PI / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad)
  }
}

// ========== 待办 ==========
const pendingRequests = computed(() => shareRequestStore.shareRequestList.filter(s => s.status === '待审批').slice(0,10))
const modelMap = computed(() => {
  const map = {}
  modelStore.modelList.forEach(m => map[m.id] = m.name)
  return map
})
function getModelName(modelId) {
  return modelMap.value[modelId] || '未知模型'
}
const approvalDialogVisible = ref(false)
const currentRequest = ref(null)
const approvalComment = ref('')
function openApproval(req) {
  currentRequest.value = req
  approvalComment.value = ''
  approvalDialogVisible.value = true
}
function handleApprove(action) {
  const req = currentRequest.value
  if (!req) return
  const comment = approvalComment.value
  const now = new Date().toISOString().slice(0,19).replace('T',' ')
  shareRequestStore.update(req.id, {
    status: action === '通过' ? '已通过' : '已驳回',
    approverId: 'A001',
    approvedAt: now
  })
  approvalRecordStore.add({
    id: 'ar_' + Date.now(),
    shareRequestId: req.id,
    approverId: 'A001',
    action: action,
    comment: comment,
    createdAt: now
  })
  ElMessage.success(`${action}成功`)
  approvalDialogVisible.value = false
}

// ========== 上传 ==========
const uploadDialogVisible = ref(false)
const uploadForm = ref({
  name: '',
  categoryId: '',
  tags: [],
  permission: '公开'
})
const uploadFile = ref(null)
const uploadRef = ref()
const modelTags = ['建筑','结构','机械','人物','场景','其他']
function handleFileChange(file) {
  uploadFile.value = file.raw
  const ext = file.name.split('.').pop().toLowerCase()
  const supported = ['fbx','obj','max','blend','png','jpg']
  if (!supported.includes(ext)) {
    ElMessage.error('不支持的文件格式')
    uploadRef.value?.clearFiles()
    uploadFile.value = null
    return
  }
  if (file.size > 2*1024*1024*1024) {
    ElMessage.error('单个文件不得超过2GB')
    uploadRef.value?.clearFiles()
    uploadFile.value = null
    return
  }
}
const canSubmitUpload = computed(() => uploadForm.value.name.trim() !== '' && uploadFile.value !== null)
function submitUpload() {
  if (!uploadForm.value.name.trim()) {
    ElMessage.warning('模型名称必填')
    return
  }
  if (!uploadFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  const ext = uploadFile.value.name.split('.').pop().toLowerCase()
  const now = new Date().toISOString().slice(0,19).replace('T',' ')
  const newModel = {
    id: 'model_' + Date.now(),
    name: uploadForm.value.name,
    code: 'BLD-' + Date.now().toString().slice(-6),
    categoryId: uploadForm.value.categoryId || 'modelcategory_1000',
    format: ext.toUpperCase(),
    status: '草稿',
    tags: uploadForm.value.tags,
    description: '',
    fileSize: (uploadFile.value.size / (1024*1024)).toFixed(2),
    uploaderId: 'U001',
    createdAt: now,
    updatedAt: now
  }
  modelStore.add(newModel)
  uploadRecordStore.add({
    id: 'upload_' + Date.now(),
    modelId: newModel.id,
    userId: 'U001',
    fileName: uploadFile.value.name,
    fileSize: uploadFile.value.size,
    format: ext.toUpperCase(),
    status: '完成',
    versionNumber: 'v1.0',
    createdAt: now
  })
  ElMessage.success('模型上传成功')
  uploadDialogVisible.value = false
  uploadForm.value = { name: '', categoryId: '', tags: [], permission: '公开' }
  uploadRef.value?.clearFiles()
  uploadFile.value = null
}

// ========== 导出 ==========
function handleExport(format) {
  const now = new Date().toISOString().slice(0,19).replace('T',' ')
  const record = {
    id: 'export_' + Date.now(),
    userId: 'U001',
    module: '概览报表',
    format: format,
    status: '完成',
    filePath: `/exports/${now.slice(0,10).replace(/-/g,'')}/概览报表_${format}.${format.toLowerCase()}`,
    createdAt: now
  }
  exportRecordStore.add(record)
  ElMessage.success(`${format}报表导出成功`)
}

// ========== KPI 卡片点击 ==========
const listDialogVisible = ref(false)
const listDialogTitle = ref('')
const listDialogData = ref([])
const listDialogType = ref('')
function handleKpiClick(kpi) {
  if (kpi.label === '模型总数') {
    listDialogType.value = 'model'
    listDialogTitle.value = '所有模型'
    listDialogData.value = modelStore.modelList.slice()
    listDialogVisible.value = true
  } else if (kpi.label === '待审批共享') {
    listDialogType.value = 'pending'
    listDialogTitle.value = '待审批共享请求'
    listDialogData.value = shareRequestStore.shareRequestList.filter(s => s.status === '待审批')
    listDialogVisible.value = true
  } else if (kpi.label === '本月导出') {
    listDialogType.value = 'export'
    listDialogTitle.value = '本月导出记录'
    listDialogData.value = exportRecordStore.exportRecordList.filter(r => {
      const d = new Date(r.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    listDialogVisible.value = true
  } else if (kpi.label === '今日上传') {
    listDialogType.value = 'upload'
    listDialogTitle.value = '今日上传记录'
    const today = new Date().toDateString()
    listDialogData.value = uploadRecordStore.uploadRecordList.filter(r => new Date(r.createdAt).toDateString() === today)
    listDialogVisible.value = true
  }
}

// ========== 最新模型和近期操作 ==========
const latestModels = computed(() => {
  return modelStore.modelList.slice().sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0,5)
})
const recentRecords = computed(() => {
  const records = []
  uploadRecordStore.uploadRecordList.forEach(r => {
    records.push({
      id: r.id,
      action: '上传',
      description: `${r.fileName} (${r.format})`,
      time: r.createdAt
    })
  })
  approvalRecordStore.approvalRecordList.forEach(r => {
    const action = r.action === '通过' ? '审批通过' : '审批驳回'
    records.push({
      id: r.id,
      action: action,
      description: `共享请求 ${r.shareRequestId}`,
      time: r.createdAt
    })
  })
  records.sort((a,b) => new Date(b.time) - new Date(a.time))
  return records.slice(0,10)
})

// ========== 模型详情弹窗 ==========
const modelDetailVisible = ref(false)
const detailModel = ref(null)
function showModelDetail(model) {
  detailModel.value = model
  modelDetailVisible.value = true
}

// ========== ECharts ==========
const pieChartRef = ref(null)
const lineChartRef = ref(null)
let pieChart = null
let lineChart = null

const filteredModelList = computed(() => {
  let list = modelStore.modelList
  if (filterCategories.value.length > 0) {
    list = list.filter(m => filterCategories.value.includes(m.categoryId))
  }
  return list
})

function initCharts() {
  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value)
  }
  if (lineChartRef.value) {
    lineChart = echarts.init(lineChartRef.value)
  }
}

function updateCharts() {
  // 饼图
  if (pieChart) {
    const categoryCounts = {}
    filteredModelList.value.forEach(m => {
      const catName = categoryStore.findById(m.categoryId)?.name || '未分类'
      categoryCounts[catName] = (categoryCounts[catName] || 0) + 1
    })
    const data = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { show: true, orient: 'vertical', left: 'left' },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.5)' } }
      }]
    })
  }
  // 折线图
  if (lineChart) {
    let uploads = uploadRecordStore.uploadRecordList
    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      const start = new Date(dateRange.value[0]).getTime()
      const end = new Date(dateRange.value[1]).getTime() + 86400000
      uploads = uploads.filter(r => {
        const t = new Date(r.createdAt).getTime()
        return t >= start && t <= end
      })
    }
    const dayMap = {}
    uploads.forEach(r => {
      const day = r.createdAt.slice(0,10)
      dayMap[day] = (dayMap[day] || 0) + 1
    })
    const sortedDays = Object.keys(dayMap).sort()
    const data = sortedDays.map(day => ({ day, count: dayMap[day] }))
    lineChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map(d => d.day) },
      yAxis: { type: 'value' },
      series: [{ type: 'line', data: data.map(d => d.count), smooth: true, areaStyle: {} }]
    })
  }
}

onMounted(() => {
  nextTick(() => {
    initCharts()
    updateCharts()
  })
})

watch([filteredModelList, dateRange, () => uploadRecordStore.uploadRecordList.length], () => {
  nextTick(updateCharts)
}, { deep: true })

onBeforeUnmount(() => {
  pieChart?.dispose()
  lineChart?.dispose()
})
</script>

<style scoped lang="scss">
@use './Dashboard.scss' as *;
</style>