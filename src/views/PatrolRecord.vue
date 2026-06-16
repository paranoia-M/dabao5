<template>
  <div class="page-patrol-record">
    <!-- 顶部筛选区 -->
    <div class="filter-bar">
      <div class="filter-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索执行人/区域/描述"
          clearable
          prefix-icon="Search"
          class="filter-item"
        />
        <el-select
          v-model="filterStatus"
          multiple
          placeholder="状态筛选"
          clearable
          class="filter-item"
        >
          <el-option label="草稿" value="草稿" />
          <el-option label="未审核" value="未审核" />
          <el-option label="已审核" value="已审核" />
          <el-option label="无效" value="无效" />
        </el-select>
        <el-select
          v-model="filterArea"
          multiple
          placeholder="区域筛选"
          clearable
          class="filter-item"
        >
          <el-option label="A区" value="A区" />
          <el-option label="B区" value="B区" />
          <el-option label="C区" value="C区" />
          <el-option label="D区" value="D区" />
          <el-option label="食堂" value="食堂" />
          <el-option label="走廊" value="走廊" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD HH:mm:ss"
          class="filter-item"
          clearable
        />
        <el-button @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 主内容区：地图+表格 -->
    <div class="main-content">
      <!-- 左侧地图 55% -->
      <div class="map-section">
        <div ref="mapContainer" class="map-container"></div>
      </div>
      <!-- 右侧表格 35% -->
      <div class="table-section">
        <div class="table-header">
          <span class="table-title">巡查记录列表</span>
          <div class="table-actions">
            <el-button type="primary" @click="openAddDialog">新增记录</el-button>
            <el-button @click="handleExport">导出台账</el-button>
          </div>
        </div>
        <el-table
          :data="filteredList"
          stripe
          highlight-current-row
          height="100%"
          style="width:100%"
          @row-click="onRowClick"
        >
          <el-table-column prop="patrolPerson" label="执行人" min-width="80" />
          <el-table-column prop="patrolTime" label="巡查时间" min-width="150">
            <template #default="{ row }">{{ formatTime(row.patrolTime) }}</template>
          </el-table-column>
          <el-table-column prop="area" label="区域" min-width="120" />
          <el-table-column prop="status" label="状态" min-width="80">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status).type" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="abnormal" label="异常" width="60" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.abnormal" type="danger" size="small">是</el-tag>
              <el-tag v-else type="success" size="small">否</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openDetailDrawer(row)">详情</el-button>
              <el-button
                link
                type="primary"
                size="small"
                :disabled="row.status === '已审核' || row.status === '已完成'"
                @click="openEditDialog(row)"
              >编辑</el-button>
              <el-button
                link
                type="danger"
                size="small"
                :disabled="row.status !== '草稿' && row.status !== '无效'"
                @click="handleDelete(row)"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 底部统计摘要 -->
    <div class="summary-bar">
      <div class="summary-item">
        <span class="summary-label">总记录</span>
        <span class="summary-value">{{ patrolStore.total }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">已审核</span>
        <span class="summary-value">{{ reviewedCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">异常记录</span>
        <span class="summary-value error">{{ abnormalCount }}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">草稿/无效</span>
        <span class="summary-value warning">{{ draftInvalidCount }}</span>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增巡查记录' : '编辑巡查记录'"
      width="min(640px, 92vw)"
      class="patrol-record-detail-dialog"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        style="max-height:65vh; overflow-y:auto;"
      >
        <el-form-item label="执行人" prop="patrolPerson">
          <el-input v-model="formData.patrolPerson" placeholder="请输入执行人姓名" />
        </el-form-item>
        <el-form-item label="巡查区域" prop="area">
          <el-input v-model="formData.area" placeholder="如A区监室-101" />
        </el-form-item>
        <el-form-item label="开始时间" prop="patrolTime">
          <el-date-picker
            v-model="formData.patrolTime"
            type="datetime"
            placeholder="选择巡查开始时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width:100%"
          />
        </el-form-item>
        <el-form-item label="是否异常">
          <el-switch v-model="formData.abnormal" active-text="是" inactive-text="否" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="选择状态" style="width:100%">
            <el-option label="草稿" value="草稿" />
            <el-option label="未审核" value="未审核" />
            <el-option label="已审核" value="已审核" />
            <el-option label="无效" value="无效" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="巡查情况描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitDialog">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="detailDrawerVisible"
      title="巡查记录详情"
      class="patrol-record-detail-drawer"
      direction="rtl"
      size="min(760px, 92vw)"
    >
      <template #default>
        <div v-if="detailRecord" class="detail-content">
          <div class="detail-field">
            <span class="field-label">执行人：</span>
            <span class="field-value">{{ detailRecord.patrolPerson }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">巡查时间：</span>
            <span class="field-value">{{ formatTime(detailRecord.patrolTime) }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">区域：</span>
            <span class="field-value">{{ detailRecord.area }}</span>
          </div>
          <div class="detail-field">
            <span class="field-label">是否异常：</span>
            <el-tag :type="detailRecord.abnormal ? 'danger' : 'success'" size="small">
              {{ detailRecord.abnormal ? '是' : '否' }}
            </el-tag>
          </div>
          <div class="detail-field">
            <span class="field-label">状态：</span>
            <el-tag :type="statusTag(detailRecord.status).type" size="small">
              {{ detailRecord.status }}
            </el-tag>
          </div>
          <div class="detail-field">
            <span class="field-label">描述：</span>
            <span class="field-value">{{ detailRecord.description || '无' }}</span>
          </div>
          <el-divider />
          <div class="detail-field">
            <span class="field-label">关联任务：</span>
            <span class="field-value">{{ relatedTaskName || '无关联任务' }}</span>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { usePatrolRecordStore } from '@/stores/patrolRecord'
import { usePatrolTaskStore } from '@/stores/patrolTask'
import { ElMessage, ElMessageBox } from 'element-plus'
// import L from 'leaflet'
// import 'leaflet/dist/leaflet.css'
import * as XLSX from 'xlsx'

// 修复 Leaflet 默认图标
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

const patrolStore = usePatrolRecordStore()
const taskStore = usePatrolTaskStore()

/* 筛选 */
const searchKeyword = ref('')
const filterStatus = ref([])
const filterArea = ref([])
const dateRange = ref([])

/* 区域→坐标模拟 */
const areaCoords = {
  'A区': [31.2304, 121.4737],
  'B区': [31.2320, 121.4750],
  'C区': [31.2335, 121.4720],
  'D区': [31.2280, 121.4760],
  '食堂': [31.2310, 121.4780],
  '走廊': [31.2295, 121.4740]
}
function getCoordsFromArea(area) {
  for (const key of Object.keys(areaCoords)) {
    if (area.startsWith(key)) {
      const base = areaCoords[key]
      const offsetLat = (Math.random() - 0.5) * 0.001
      const offsetLng = (Math.random() - 0.5) * 0.001
      return [base[0] + offsetLat, base[1] + offsetLng]
    }
  }
  return [31.230, 121.474]
}

/* 过滤列表 */
const filteredList = computed(() => {
  let list = patrolStore.patrolRecordList
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(r =>
      (r.patrolPerson && r.patrolPerson.toLowerCase().includes(kw)) ||
      (r.area && r.area.toLowerCase().includes(kw)) ||
      (r.description && r.description.toLowerCase().includes(kw))
    )
  }
  if (filterStatus.value.length) {
    list = list.filter(r => filterStatus.value.includes(r.status))
  }
  if (filterArea.value.length) {
    list = list.filter(r =>
      filterArea.value.some(pref => r.area.startsWith(pref))
    )
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime()
    list = list.filter(r => {
      const t = new Date(r.patrolTime).getTime()
      return t >= start && t <= end
    })
  }
  return list
})

/* 统计 */
const reviewedCount = computed(() => patrolStore.patrolRecordList.filter(r => r.status === '已审核').length)
const abnormalCount = computed(() => patrolStore.patrolRecordList.filter(r => r.abnormal).length)
const draftInvalidCount = computed(() => patrolStore.patrolRecordList.filter(r => r.status === '草稿' || r.status === '无效').length)

/* 地图 */
const mapContainer = ref(null)
let mapInstance = null
let markersLayer = null
let polylineLayer = null

function initMap() {
  if (!mapContainer.value) return
  mapInstance = L.map(mapContainer.value, {
    center: [31.2310, 121.4745],
    zoom: 15,
    zoomControl: true,
    attributionControl: false
  })
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(mapInstance)
  markersLayer = L.layerGroup().addTo(mapInstance)
  polylineLayer = L.layerGroup().addTo(mapInstance)
  updateMapMarkers()
}

function updateMapMarkers() {
  markersLayer.clearLayers()
  polylineLayer.clearLayers()
  const list = filteredList.value
  if (!list.length) return
  const points = []
  list.forEach(r => {
    const coords = getCoordsFromArea(r.area)
    points.push(coords)
    const color = r.abnormal ? '#dc2626' : '#4B5563'
    const marker = L.circleMarker(coords, {
      radius: 8,
      fillColor: color,
      color: 'white',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    })
    marker.bindTooltip(`${r.patrolPerson} - ${r.area}`, { direction: 'top' })
    marker.on('click', () => openDetailDrawer(r))
    markersLayer.addLayer(marker)
  })
  const sorted = [...list].sort((a, b) => new Date(a.patrolTime) - new Date(b.patrolTime))
  const sortedCoords = sorted.map(r => getCoordsFromArea(r.area))
  if (sortedCoords.length >= 2) {
    const polyline = L.polyline(sortedCoords, {
      color: '#4B5563',
      weight: 2,
      opacity: 0.6,
      dashArray: '10, 5'
    })
    polylineLayer.addLayer(polyline)
  }
  if (points.length) {
    mapInstance.fitBounds(L.latLngBounds(points))
  }
}

watch(filteredList, () => { updateMapMarkers() })

onMounted(() => nextTick(() => initMap()))
onBeforeUnmount(() => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }
})

/* 详情抽屉 */
const detailDrawerVisible = ref(false)
const detailRecord = ref(null)
const relatedTaskName = ref('')
function openDetailDrawer(record) {
  detailRecord.value = record
  const task = taskStore.findById(record.taskId)
  relatedTaskName.value = task ? task.taskName : '无关联任务'
  detailDrawerVisible.value = true
}

/* 表格行点击 → 地图焦点 */
function onRowClick(row) {
  const coords = getCoordsFromArea(row.area)
  if (mapInstance) mapInstance.flyTo(coords, 16, { duration: 0.5 })
}

/* 新增/编辑弹窗 */
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const formData = ref({
  patrolPerson: '',
  area: '',
  patrolTime: '',
  abnormal: false,
  status: '草稿',
  description: ''
})
const formRules = {
  patrolPerson: [{ required: true, message: '请输入执行人', trigger: 'blur' }],
  area: [{ required: true, message: '请输入巡查区域', trigger: 'blur' }],
  patrolTime: [{ required: true, message: '请选择巡查时间', trigger: 'change' }]
}
function openAddDialog() {
  dialogType.value = 'add'
  formData.value = { patrolPerson: '', area: '', patrolTime: '', abnormal: false, status: '草稿', description: '' }
  dialogVisible.value = true
}
function openEditDialog(row) {
  dialogType.value = 'edit'
  formData.value = { ...row }
  dialogVisible.value = true
}
function submitDialog() {
  formRef.value.validate(valid => {
    if (!valid) return
    if (dialogType.value === 'add') {
      patrolStore.add({ ...formData.value, id: 'patrolrecord_' + Date.now(), taskId: '' })
      ElMessage.success('新增巡查记录成功')
    } else {
      patrolStore.update(formData.value.id, { ...formData.value })
      ElMessage.success('更新巡查记录成功')
    }
    dialogVisible.value = false
  })
}

/* 删除 */
function handleDelete(row) {
  let msg = '确认删除该巡查记录？'
  if (row.abnormal) {
    msg = '该记录关联报警事件，删除后报警信息将保留但取消关联，是否继续？'
  }
  ElMessageBox.confirm(msg, '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    patrolStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

/* 导出台账 */
function handleExport() {
  const list = filteredList.value
  if (!list.length) {
    ElMessage.warning('当前无数据可导出')
    return
  }
  if (list.length > 10000) {
    ElMessage.warning('数据量过大，请缩小范围后再导出')
    return
  }
  const data = list.map(r => ({
    执行人: r.patrolPerson,
    巡查时间: r.patrolTime,
    区域: r.area,
    是否异常: r.abnormal ? '是' : '否',
    状态: r.status,
    描述: r.description
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '巡查记录')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `巡查记录_${Date.now()}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

/* 重置 */
function handleReset() {
  searchKeyword.value = ''
  filterStatus.value = []
  filterArea.value = []
  dateRange.value = []
}

/* 辅助 */
function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', { hour12: false })
}
function statusTag(status) {
  const map = { '草稿': { type: 'info' }, '未审核': { type: 'warning' }, '已审核': { type: 'success' }, '无效': { type: 'danger' } }
  return map[status] || { type: 'info' }
}
</script>

<style scoped lang="scss">
@use './PatrolRecord.scss' as *;
</style>