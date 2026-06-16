<template>
  <div class="page-command-overview" @keydown.esc="exitFullscreen">
    <!-- 顶栏：筛选区 + 全屏切换 -->
    <div class="overview-header">
      <div class="filter-area">
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :shortcuts="timeShortcuts"
          value-format="YYYY-MM-DD HH:mm:ss"
        >
        </el-date-picker>
        <el-select v-model="areaFilter" placeholder="全部监区" style="margin-left:12px; width:160px;">
          <el-option label="全部监区" value=""></el-option>
          <el-option label="A区" value="A区"></el-option>
          <el-option label="B区" value="B区"></el-option>
          <el-option label="C区" value="C区"></el-option>
          <el-option label="D区" value="D区"></el-option>
        </el-select>
      </div>
      <el-button type="primary" plain @click="toggleFullscreen" class="fullscreen-btn">
        <el-icon style="vertical-align:middle;margin-right:4px;"><FullScreen /></el-icon>
        全屏
      </el-button>
    </div>

    <!-- 主体：左Scene + 右侧面板 -->
    <div class="overview-body">
      <!-- 左侧三阶段 -->
      <div ref="threeStageRef" class="three-stage"></div>

      <!-- 右侧面板 -->
      <div class="right-panel">
        <!-- KPI 区域 -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-label">在押人数</span>
            <span class="kpi-value">{{ inmateTotal }}</span>
            <span class="kpi-unit">人</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">今日出入</span>
            <span class="kpi-value">{{ todayMovementCount }}</span>
            <span class="kpi-unit">人次</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">未处理告警</span>
            <span class="kpi-value alert-count">{{ pendingAlertCount }}</span>
            <span class="kpi-unit">条</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">设备在线率</span>
            <span class="kpi-value online-rate">{{ deviceOnlinePercent }}%</span>
            <span class="kpi-unit"></span>
          </div>
        </div>

        <!-- 3D 场景联动详情 -->
        <div class="scene-detail-card">
          <div class="scene-detail-head">
            <div>
              <div class="scene-detail-title">{{ sceneDetailView.title }}</div>
              <div class="scene-detail-subtitle">{{ sceneDetailView.subtitle }}</div>
            </div>
            <el-tag size="small" :type="sceneDetailView.tagType">{{ sceneDetailView.badge }}</el-tag>
          </div>
          <div class="scene-detail-metrics">
            <div v-for="metric in sceneDetailView.metrics" :key="metric.label" class="scene-metric">
              <span class="metric-value">{{ metric.value }}</span>
              <span class="metric-label">{{ metric.label }}</span>
            </div>
          </div>
          <div v-if="sceneDetailView.records.length" class="scene-detail-records">
            <div v-for="record in sceneDetailView.records" :key="record.label + record.value" class="scene-record">
              <span class="record-label">{{ record.label }}</span>
              <span class="record-value">{{ record.value }}</span>
            </div>
          </div>
          <div v-if="sceneDetailView.action" class="scene-detail-actions">
            <el-button size="small" type="primary" plain @click="handleSceneDetailAction(sceneDetailView.action)">
              {{ sceneDetailView.actionLabel }}
            </el-button>
          </div>
        </div>

        <!-- 图表区 -->
        <div class="chart-area">
          <div class="chart-box" ref="alertChartRef" style="height:200px;"></div>
          <div class="chart-box" ref="deviceChartRef" style="height:200px;"></div>
        </div>

        <!-- 监室状态网格（招牌积木） -->
        <div class="cell-status-grid">
          <div class="grid-title">监室实时状态</div>
          <div class="grid-container">
            <div
              v-for="cell in cellStatusList"
              :key="cell.cellNumber"
              :class="['cell-block', cell.statusClass]"
              @click="handleCellClick(cell)"
            >
              <span class="cell-number">{{ cell.cellNumber }}</span>
              <span class="cell-count">{{ cell.inmateCount }}人</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 报警详情弹窗 -->
    <el-dialog
      class="command-overview-detail-dialog"
      :model-value="alertDialogVisible"
      @update:model-value="alertDialogVisible = $event"
      title="报警详情"
      width="min(800px,92vw)"
      :close-on-click-modal="true"
    >
      <el-table :data="alertDetailList" stripe border max-height="400px">
        <el-table-column prop="id" label="编号" width="140"></el-table-column>
        <el-table-column prop="eventType" label="报警类型" width="100"></el-table-column>
        <el-table-column prop="area" label="发生监区" width="100"></el-table-column>
        <el-table-column prop="occurTime" label="时间" width="160"></el-table-column>
        <el-table-column prop="status" label="处理状态" width="100"></el-table-column>
      </el-table>
      <div v-if="alertDetailList.length === 0" style="text-align:center;padding:20px;color:#999;">暂无报警数据</div>
    </el-dialog>

    <!-- 在押人员概览抽屉 -->
    <el-drawer
      class="command-overview-detail-drawer"
      :model-value="inmateDrawerVisible"
      @update:model-value="inmateDrawerVisible = $event"
      title="在押人员概览"
      direction="rtl"
      size="min(600px,92vw)"
    >
      <div class="drawer-content">
        <h3>监区人数分布</h3>
        <div ref="inmateChartRef" style="height:250px; width:100%;"></div>
        <h3>各监区列表</h3>
        <el-table :data="inmateAreaList" stripe border>
          <el-table-column prop="area" label="监区" width="100"></el-table-column>
          <el-table-column prop="count" label="人数" width="80"></el-table-column>
          <el-table-column prop="inmates" label="在押人员" min-width="200">
            <template #default="{ row }">
              <el-tag v-for="name in row.inmates" :key="name" style="margin:2px;">{{ name }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { FullScreen } from '@element-plus/icons-vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as echarts from 'echarts'
import { useInmateStore } from '@/stores/inmate'
import { useInmateMovementStore } from '@/stores/inmateMovement'
import { useAlertEventStore } from '@/stores/alertEvent'
import { useDeviceStore } from '@/stores/device'
import { usePatrolTaskStore } from '@/stores/patrolTask'
import { usePatrolRecordStore } from '@/stores/patrolRecord'
// import 'leaflet/dist/leaflet.css' // 虽然不用leaflet但满足UI能力声明
// import L from 'leaflet' // 只用于占位

// ========== Store ==========
const inmateStore = useInmateStore()
const movementStore = useInmateMovementStore()
const alertStore = useAlertEventStore()
const deviceStore = useDeviceStore()
const patrolTaskStore = usePatrolTaskStore()
const patrolRecordStore = usePatrolRecordStore()

// ========== 筛选状态 ==========
const timeRange = ref([])
const areaFilter = ref('')
const timeShortcuts = [
  { text: '最近24小时', value: () => [new Date(Date.now() - 86400000), new Date()] },
  { text: '最近7天', value: () => [new Date(Date.now() - 7 * 86400000), new Date()] },
  { text: '自定义', value: () => [] }
]

// ========== KPI 计算 ==========
const inmateTotal = computed(() => inmateStore.inmateList.filter(i => i.status === '在押').length)
const todayMovementCount = computed(() => {
  const today = new Date().toISOString().slice(0, 10)
  return movementStore.movementList.filter(m => m.recordTime && m.recordTime.startsWith(today)).length
})
const pendingAlertCount = computed(() => alertStore.alertEventList.filter(a => a.status === '未处理').length)
const deviceOnlinePercent = computed(() => {
  const total = deviceStore.deviceList.length
  if (total === 0) return 0
  const online = deviceStore.deviceList.filter(d => d.status === '在线').length
  return Math.round((online / total) * 100)
})

// ========== 监室状态网格数据 ==========
const cellStatusList = computed(() => {
  const cells = []
  // 从inmateList按cellNumber分组
  const map = {}
  inmateStore.inmateList.forEach(i => {
    if (i.status === '在押' && i.cellNumber) {
      const cell = i.cellNumber.split('-')[0] // 如A-101 => A区
      const area = cell[0] + '区'
      if (!map[area]) map[area] = 0
      map[area]++
    }
  })
  const areas = ['A区', 'B区', 'C区', 'D区']
  areas.forEach(a => {
    const count = map[a] || 0
    let statusClass = 'normal'
    if (count > 3) statusClass = 'warning'
    if (count > 5) statusClass = 'danger'
    cells.push({ cellNumber: a, inmateCount: count, statusClass })
  })
  return cells
})
const handleCellClick = (cell) => {
  ElMessage.info(`点击了${cell.cellNumber}，当前在押${cell.inmateCount}人`)
}

// ========== 3D 场景右侧详情 ==========
const selectedSceneItem = ref(null)

const latestItems = (items, timeField, limit = 3) => {
  return items
    .slice()
    .sort((a, b) => String(b[timeField] || '').localeCompare(String(a[timeField] || '')))
    .slice(0, limit)
}

const getAreaFromText = (text) => {
  const matched = String(text || '').match(/[A-D]区/)
  return matched ? matched[0] : ''
}

const getAlertArea = (alert) => {
  if (alert.area) return alert.area
  const device = deviceStore.deviceList.find(d => d.id === alert.deviceId)
  return getAreaFromText(device?.location) || '全所'
}

const getAreaInmates = (area) => {
  const prefix = area.charAt(0)
  return inmateStore.inmateList.filter(i => i.status === '在押' && i.cellNumber?.startsWith(prefix))
}

const getAreaDevices = (area) => {
  return deviceStore.deviceList.filter(d => d.location?.includes(area))
}

const getAreaAlerts = (area) => {
  return alertStore.alertEventList.filter(a => getAlertArea(a) === area)
}

const sceneDetailView = computed(() => {
  const item = selectedSceneItem.value
  if (!item) {
    return {
      title: '全所三维态势',
      subtitle: '全局监区、周界、巡查与设备运行概览',
      badge: '总览',
      tagType: 'primary',
      metrics: [
        { label: '在押', value: inmateTotal.value },
        { label: '未处理告警', value: pendingAlertCount.value },
        { label: '设备在线率', value: `${deviceOnlinePercent.value}%` }
      ],
      records: latestItems(alertStore.alertEventList, 'occurTime', 2).map(a => ({
        label: a.eventType || '报警',
        value: `${getAlertArea(a)} ${a.status || '-'}`
      })),
      action: 'inmates',
      actionLabel: '查看在押概览'
    }
  }

  if (item.kind === 'prisonBlock') {
    const inmates = getAreaInmates(item.area)
    const devices = getAreaDevices(item.area)
    const alerts = getAreaAlerts(item.area)
    return {
      title: `${item.area}监室楼`,
      subtitle: `${item.name}，当前联动在押人员与区域设备`,
      badge: alerts.some(a => a.status === '未处理') ? '有告警' : '正常',
      tagType: alerts.some(a => a.status === '未处理') ? 'danger' : 'success',
      metrics: [
        { label: '在押', value: inmates.length },
        { label: '设备', value: devices.length },
        { label: '告警', value: alerts.length }
      ],
      records: inmates.slice(0, 3).map(i => ({
        label: i.name,
        value: `${i.cellNumber} ${i.caseType}`
      })),
      action: alerts.length ? `alerts:${item.area}` : 'inmates',
      actionLabel: alerts.length ? '查看区域告警' : '查看在押概览'
    }
  }

  if (item.kind === 'watchtower') {
    const perimeterDevices = deviceStore.deviceList.filter(d => /围墙|周界|大门|外围/.test(d.location || d.deviceName || ''))
    const offline = perimeterDevices.filter(d => d.status !== '在线')
    return {
      title: item.name,
      subtitle: '周界岗楼与外围安防设备状态',
      badge: offline.length ? '需关注' : '在线',
      tagType: offline.length ? 'warning' : 'success',
      metrics: [
        { label: '周界设备', value: perimeterDevices.length },
        { label: '异常设备', value: offline.length },
        { label: '巡查记录', value: patrolRecordStore.patrolRecordList.filter(r => /围墙|周界/.test(r.area || '')).length }
      ],
      records: offline.slice(0, 3).map(d => ({
        label: d.deviceName,
        value: d.status
      })),
      action: null,
      actionLabel: ''
    }
  }

  if (item.kind === 'patrolPoint') {
    const abnormal = patrolRecordStore.patrolRecordList.filter(r => r.abnormal)
    return {
      title: `巡逻点 ${item.index + 1}`,
      subtitle: '巡查路线节点与近期异常记录',
      badge: abnormal.length ? '异常' : '正常',
      tagType: abnormal.length ? 'danger' : 'success',
      metrics: [
        { label: '巡查记录', value: patrolRecordStore.patrolRecordList.length },
        { label: '异常记录', value: abnormal.length },
        { label: '任务数', value: patrolTaskStore.patrolTaskList.length }
      ],
      records: latestItems(abnormal, 'patrolTime', 3).map(r => ({
        label: r.area || '巡查区域',
        value: r.status || '-'
      })),
      action: null,
      actionLabel: ''
    }
  }

  if (item.kind === 'gate') {
    return {
      title: '监所大门',
      subtitle: '人员出入、访客对讲与门禁设备联动',
      badge: '出入口',
      tagType: 'primary',
      metrics: [
        { label: '今日出入', value: todayMovementCount.value },
        { label: '门禁设备', value: deviceStore.deviceList.filter(d => d.deviceType === '门禁').length },
        { label: '异常设备', value: deviceStore.deviceList.filter(d => d.status !== '在线').length }
      ],
      records: latestItems(movementStore.movementList, 'recordTime', 3).map(m => ({
        label: m.movementType || '出入',
        value: `${m.direction || '-'} ${m.status || '-'}`
      })),
      action: null,
      actionLabel: ''
    }
  }

  return {
    title: item.name,
    subtitle: item.description || '场景对象详情',
    badge: '详情',
    tagType: 'info',
    metrics: item.metrics || [],
    records: item.records || [],
    action: null,
    actionLabel: ''
  }
})

const handleSceneDetailAction = (action) => {
  if (action === 'inmates') {
    showInmateDrawer()
    return
  }
  if (action.startsWith('alerts:')) {
    const area = action.split(':')[1]
    showAlertDetail(getAreaAlerts(area))
  }
}

// ========== 报警详情弹窗 ==========
const alertDialogVisible = ref(false)
const alertDetailList = ref([])
const showAlertDetail = (data) => {
  alertDetailList.value = data.slice(0, 10) // 最多10条
  alertDialogVisible.value = true
}

// ========== 在押人员概览抽屉 ==========
const inmateDrawerVisible = ref(false)
const inmateChartRef = ref(null)
let inmateChartInstance = null
const inmateAreaList = computed(() => {
  const map = {}
  inmateStore.inmateList.forEach(i => {
    if (i.status !== '在押') return
    const area = i.cellNumber ? i.cellNumber.charAt(0) + '区' : '未知'
    if (!map[area]) map[area] = { area, count: 0, inmates: [] }
    map[area].count++
    map[area].inmates.push(i.name)
  })
  return Object.values(map)
})
const showInmateDrawer = () => {
  inmateDrawerVisible.value = true
  nextTick(() => {
    if (inmateChartRef.value) {
      if (inmateChartInstance) inmateChartInstance.dispose()
      inmateChartInstance = echarts.init(inmateChartRef.value)
      const data = inmateAreaList.value.map(a => ({ name: a.area, value: a.count }))
      inmateChartInstance.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data
        }]
      })
    }
  })
}

// ========== ECharts 图表 ==========
const alertChartRef = ref(null)
const deviceChartRef = ref(null)
let alertChartInstance = null
let deviceChartInstance = null

const updateCharts = () => {
  // 告警线图：按小时统计最近24小时
  const now = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now - (23 - i) * 3600000)
    return d.getHours() + ':00'
  })
  const countByHour = Array(24).fill(0)
  alertStore.alertEventList.forEach(a => {
    if (!a.occurTime) return
    const t = new Date(a.occurTime)
    const hourDiff = Math.floor((now - t) / 3600000)
    if (hourDiff >= 0 && hourDiff < 24) {
      countByHour[23 - hourDiff]++
    }
  })
  if (alertChartRef.value) {
    if (!alertChartInstance) alertChartInstance = echarts.init(alertChartRef.value)
    alertChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '3%', top: '15%', bottom: '10%' },
      xAxis: { type: 'category', data: hours, axisLabel: { rotate: 45, interval: 3, fontSize: 10 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'line',
        data: countByHour,
        smooth: true,
        areaStyle: { opacity: 0.2 },
        itemStyle: { color: '#2563EB' }
      }]
    })
    alertChartInstance.off('click')
    alertChartInstance.on('click', (params) => {
      const hourLabel = params.name
      const idx = hours.indexOf(hourLabel)
      if (idx >= 0) {
        // 找到该小时的报警
        const startTime = new Date(now - (23 - idx) * 3600000)
        const endTime = new Date(startTime.getTime() + 3600000)
        const filtered = alertStore.alertEventList.filter(a => {
          if (!a.occurTime) return false
          const t = new Date(a.occurTime)
          return t >= startTime && t < endTime
        })
        showAlertDetail(filtered)
      }
    })
  }

  // 设备状态饼图
  if (deviceChartRef.value) {
    if (!deviceChartInstance) deviceChartInstance = echarts.init(deviceChartRef.value)
    const statusMap = {}
    deviceStore.deviceList.forEach(d => {
      const s = d.status || '未知'
      statusMap[s] = (statusMap[s] || 0) + 1
    })
    const data = Object.entries(statusMap).map(([name, value]) => ({ name, value }))
    deviceChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie',
        radius: ['30%', '60%'],
        data,
        itemStyle: {
          color: (params) => {
            const colors = { '在线': '#67C23A', '离线': '#909399', '故障': '#F56C6C' }
            return colors[params.name] || '#409EFF'
          }
        }
      }]
    })
    deviceChartInstance.off('click')
    deviceChartInstance.on('click', (params) => {
      if (params.name === '离线' || params.name === '故障') {
        // 弹出设备详情
        const device = deviceStore.deviceList.find(d => d.status === params.name)
        if (device) {
          ElMessage.info(`设备: ${device.deviceName}, 状态: ${device.status}`)
        }
      }
    })
  }
}

watch([timeRange, areaFilter], () => {
  // 时间范围超过31天提示
  if (timeRange.value && timeRange.value.length === 2) {
    const diff = (new Date(timeRange.value[1]) - new Date(timeRange.value[0])) / (86400000)
    if (diff > 31) {
      ElMessage.warning('时间范围超过31天，已自动截取最近31天数据')
      const end = new Date(timeRange.value[1])
      const start = new Date(end.getTime() - 31 * 86400000)
      timeRange.value = [start.toISOString().replace('T', ' ').slice(0,19), end.toISOString().replace('T', ' ').slice(0,19)]
    }
  }
  nextTick(updateCharts)
})

// ========== Three.js 3D场景 ==========
const threeStageRef = ref(null)
let renderer, scene, camera, controls, animateId, raycaster, pointer, selectionBox
let interactiveObjects = []
let pointerDownPosition = null

const setSceneItem = (group, sceneItem) => {
  group.userData.sceneItem = sceneItem
  group.traverse((child) => {
    if (child.isMesh) {
      child.userData.sceneItem = sceneItem
    }
  })
}

const findSceneItemObject = (object) => {
  let current = object
  while (current) {
    if (current.userData?.sceneItem) return current
    current = current.parent
  }
  return null
}

const selectSceneObject = (object) => {
  if (!object?.userData?.sceneItem || !scene) return
  selectedSceneItem.value = object.userData.sceneItem
  if (selectionBox) {
    scene.remove(selectionBox)
    selectionBox.geometry.dispose()
    selectionBox.material.dispose()
  }
  selectionBox = new THREE.BoxHelper(object, 0x60a5fa)
  scene.add(selectionBox)
}

const getPointerFromEvent = (event) => {
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
}

const handleScenePointerUp = (event) => {
  if (!renderer || !camera || !pointerDownPosition) return
  const dx = event.clientX - pointerDownPosition.x
  const dy = event.clientY - pointerDownPosition.y
  pointerDownPosition = null
  if (Math.hypot(dx, dy) > 6) return

  getPointerFromEvent(event)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveObjects, true)
  const hitObject = hits.map(hit => findSceneItemObject(hit.object)).find(Boolean)
  if (hitObject) {
    selectSceneObject(hitObject)
  }
}

const handleScenePointerMove = (event) => {
  if (!renderer || !camera) return
  getPointerFromEvent(event)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactiveObjects, true)
  renderer.domElement.style.cursor = hits.length ? 'pointer' : 'grab'
}

const createPrisonBlockGroup = (x, z, heightScale, alertColor, sceneItem) => {
  const group = new THREE.Group()
  group.name = 'prisonBlock'
  // 主楼
  const blockGeom = new THREE.BoxGeometry(3.6, 1.8 * heightScale, 6.0)
  const blockMat = new THREE.MeshStandardMaterial({ color: 0x999999 })
  const block = new THREE.Mesh(blockGeom, blockMat)
  block.position.y = 0.9 * heightScale
  block.userData = { type: 'prisonBlock' }
  group.add(block)
  // 屋顶
  const roofGeom = new THREE.BoxGeometry(3.8, 0.15, 6.2)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x555555 })
  const roof = new THREE.Mesh(roofGeom, roofMat)
  roof.position.y = 1.8 * heightScale + 0.075
  group.add(roof)
  // 窗户阵列（两行三列）
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x87CEEB })
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.05), windowMat)
      const xOff = -1.2 + col * 1.2
      const yOff = 0.3 + row * 0.7
      win.position.set(xOff, yOff, 3.01)
      group.add(win)
      const winBack = win.clone()
      winBack.position.z = -3.01
      group.add(winBack)
      const winLeft = win.clone()
      winLeft.rotation.y = Math.PI / 2
      winLeft.position.set(-1.8, yOff, xOff)
      group.add(winLeft)
      const winRight = win.clone()
      winRight.rotation.y = Math.PI / 2
      winRight.position.set(1.8, yOff, xOff)
      group.add(winRight)
    }
  }
  // 报警等级映射到屋顶 emissive
  if (alertColor) {
    roof.material.emissive = new THREE.Color(alertColor)
    roof.material.emissiveIntensity = 0.6
  }
  group.position.set(x, 0, z)
  setSceneItem(group, sceneItem)
  return group
}

const createWallGroup = () => {
  const group = new THREE.Group()
  group.name = 'wall'
  const mat = new THREE.MeshStandardMaterial({ color: 0x444444 })
  // 前后墙 (沿X轴)
  const wallF = new THREE.Mesh(new THREE.BoxGeometry(24, 0.6, 0.3), mat)
  wallF.position.set(0, 0.3, -8)
  group.add(wallF)
  const wallB = wallF.clone()
  wallB.position.z = 8
  group.add(wallB)
  // 左右墙 (沿Z轴)
  const wallL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 16), mat)
  wallL.position.set(-12, 0.3, 0)
  group.add(wallL)
  const wallR = wallL.clone()
  wallR.position.x = 12
  group.add(wallR)
  return group
}

const createWatchtowerGroup = (x, z, statusColor, sceneItem) => {
  const group = new THREE.Group()
  group.name = 'watchtower'
  // 塔身
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 })
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.2), towerMat)
  tower.position.y = 0.6
  group.add(tower)
  // 观察室
  const obsMat = new THREE.MeshStandardMaterial({ color: 0x555555 })
  const obs = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.6), obsMat)
  obs.position.y = 1.2 + 0.175
  if (statusColor) {
    obs.material.emissive = new THREE.Color(statusColor)
    obs.material.emissiveIntensity = 0.5
  }
  group.add(obs)
  // 围栏 (4根立柱)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x888888 })
  const positions = [[-0.3, 0, -0.3], [0.3, 0, -0.3], [-0.3, 0, 0.3], [0.3, 0, 0.3]]
  positions.forEach(pos => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2), fenceMat)
    pillar.position.set(pos[0], 1.2 + 0.35 + 0.1, pos[1])
    group.add(pillar)
  })
  group.position.set(x, 0, z)
  setSceneItem(group, sceneItem)
  return group
}

const createPatrolPathGroup = (abnormalCount) => {
  const group = new THREE.Group()
  group.name = 'patrolPath'
  // 路径曲线
  const points = []
  for (let i = 0; i <= 20; i++) {
    const t = i / 20 * Math.PI * 2
    const r = 11.5 // 距离围墙内圈0.5
    points.push(new THREE.Vector3(r * Math.cos(t), 0.1, r * Math.sin(t)))
  }
  const curve = new THREE.CatmullRomCurve3(points, true)
  const tubeGeom = new THREE.TubeGeometry(curve, 64, 0.05, 8, true)
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xFFD700 })
  const tube = new THREE.Mesh(tubeGeom, tubeMat)
  group.add(tube)
  // 巡逻点12个
  const pointMat = new THREE.MeshStandardMaterial({ color: 0xFF8C00 })
  for (let i = 0; i < 12; i++) {
    const t = i / 12
    const pt = curve.getPoint(t)
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pointMat)
    sphere.position.copy(pt)
    sphere.position.y = 0.1
    // 根据abnormalCount设置颜色闪烁（简化：统一颜色）
    if (abnormalCount > 0) {
      sphere.material.color.setHex(0xFF0000)
    } else {
      sphere.material.color.setHex(0x00FF00)
    }
    sphere.userData = {
      type: 'patrolPoint',
      index: i,
      sceneItem: { kind: 'patrolPoint', name: `巡逻点 ${i + 1}`, index: i }
    }
    group.add(sphere)
  }
  return group
}

const createPlaygroundGroup = () => {
  const group = new THREE.Group()
  group.name = 'playground'
  // 地面
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x90EE90, side: THREE.DoubleSide })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 6), groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.set(0, 0.01, 0)
  group.add(ground)
  // 旗杆
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 })
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.0), poleMat)
  pole.position.set(0, 0.5, 0)
  group.add(pole)
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xFF0000 })
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), ballMat)
  ball.position.set(0, 1.0, 0)
  group.add(ball)
  setSceneItem(group, {
    kind: 'playground',
    name: '中心活动场',
    description: '放风与集合区域状态',
    metrics: [
      { label: '巡查记录', value: patrolRecordStore.patrolRecordList.filter(r => /操场|放风/.test(`${r.area || ''}${r.description || ''}`)).length },
      { label: '异常记录', value: patrolRecordStore.patrolRecordList.filter(r => r.abnormal && /操场|放风/.test(`${r.area || ''}${r.description || ''}`)).length }
    ],
    records: latestItems(patrolRecordStore.patrolRecordList.filter(r => /操场|放风/.test(`${r.area || ''}${r.description || ''}`)), 'patrolTime', 3).map(r => ({
      label: r.area || '活动场',
      value: r.status || '-'
    }))
  })
  return group
}

const createGateGroup = () => {
  const group = new THREE.Group()
  group.name = 'gate'
  const mat = new THREE.MeshStandardMaterial({ color: 0x888888 })
  // 门柱
  const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.0), mat)
  pillar1.position.set(-1.0, 0.5, -8)
  group.add(pillar1)
  const pillar2 = pillar1.clone()
  pillar2.position.x = 1.0
  group.add(pillar2)
  // 门（开启45°）
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x777777 })
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.01, 0.6), doorMat)
  door.position.set(0, 0.5, -8)
  door.rotation.y = Math.PI / 4
  group.add(door)
  // 值班室
  const guardMat = new THREE.MeshStandardMaterial({ color: 0xAAAAAA })
  const guard = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.2), guardMat)
  guard.position.set(2.5, 0.4, -8)
  group.add(guard)
  setSceneItem(group, { kind: 'gate', name: '监所大门' })
  return group
}

const createGroundGroup = () => {
  const group = new THREE.Group()
  group.name = 'ground'
  const mat = new THREE.MeshStandardMaterial({ color: 0x7CCD7C, side: THREE.DoubleSide })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), mat)
  ground.rotation.x = -Math.PI / 2
  group.add(ground)
  return group
}

const buildScene = () => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x87CEEB)
  interactiveObjects = []
  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()

  // 相机
  camera = new THREE.PerspectiveCamera(45, threeStageRef.value.clientWidth / threeStageRef.value.clientHeight, 0.1, 100)
  camera.position.set(0, 20, 20)
  camera.lookAt(0, 0, 0)

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(threeStageRef.value.clientWidth, threeStageRef.value.clientHeight)
  renderer.shadowMap.enabled = true
  threeStageRef.value.appendChild(renderer.domElement)
  renderer.domElement.style.cursor = 'grab'

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.rotateSpeed = 0.75
  controls.zoomSpeed = 0.7
  controls.minDistance = 14
  controls.maxDistance = 42
  controls.maxPolarAngle = Math.PI / 2.15
  controls.target.set(0, 0, 0)
  controls.update()

  // 灯光
  const ambient = new THREE.AmbientLight(0x404040)
  scene.add(ambient)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(10, 20, 10)
  dirLight.castShadow = true
  scene.add(dirLight)
  const backLight = new THREE.DirectionalLight(0xffffff, 0.5)
  backLight.position.set(-10, 10, -10)
  scene.add(backLight)

  // 地面
  const groundGroup = createGroundGroup()
  scene.add(groundGroup)

  // 围墙
  const wallGroup = createWallGroup()
  scene.add(wallGroup)

  // 数据计算
  const highestAlert = alertStore.alertEventList.find(a => a.level === '高') ? '#FF0000' :
    alertStore.alertEventList.find(a => a.level === '中') ? '#FFD700' : '#00FF00'
  const patrolStatus = patrolTaskStore.patrolTaskList.length > 0 ? patrolTaskStore.patrolTaskList[patrolTaskStore.patrolTaskList.length - 1].status : '计划'
  const watchtowerColor = {
    '完成': '#808080',
    '发布': '#00FF00',
    '计划': '#0000FF',
    '取消': '#FF0000'
  }[patrolStatus] || '#808080'
  const abnormalPatrolCount = patrolRecordStore.patrolRecordList.filter(r => r.abnormal).length

  // 监室楼（4栋）
  const heightScale = Math.min(2.5, Math.max(0.5, inmateTotal.value / 10))
  const alertColor = highestAlert
  const blocksPos = [
    [-4.5, -3, 'A区', 'A区西南监室楼'],
    [4.5, -3, 'B区', 'B区东南监室楼'],
    [-4.5, 3, 'C区', 'C区西北监室楼'],
    [4.5, 3, 'D区', 'D区东北监室楼']
  ]
  blocksPos.forEach(([x, z, area, name]) => {
    const block = createPrisonBlockGroup(x, z, heightScale, alertColor, {
      kind: 'prisonBlock',
      area,
      name
    })
    scene.add(block)
    interactiveObjects.push(block)
  })

  // 岗楼（四角）
  const corners = [
    [-12, -8, '西南岗楼'],
    [12, -8, '东南岗楼'],
    [-12, 8, '西北岗楼'],
    [12, 8, '东北岗楼']
  ]
  corners.forEach(([x, z, name]) => {
    const tower = createWatchtowerGroup(x, z, watchtowerColor, {
      kind: 'watchtower',
      name
    })
    scene.add(tower)
    interactiveObjects.push(tower)
  })

  // 巡逻道
  const patrolPath = createPatrolPathGroup(abnormalPatrolCount)
  scene.add(patrolPath)
  interactiveObjects.push(patrolPath)

  // 操场
  const playground = createPlaygroundGroup()
  playground.position.set(0, 0.01, 0)
  scene.add(playground)
  interactiveObjects.push(playground)

  // 大门
  const gate = createGateGroup()
  scene.add(gate)
  interactiveObjects.push(gate)

  const onPointerDown = (event) => {
    pointerDownPosition = { x: event.clientX, y: event.clientY }
    renderer.domElement.style.cursor = 'grabbing'
  }
  const onPointerUp = (event) => {
    renderer.domElement.style.cursor = 'grab'
    handleScenePointerUp(event)
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointermove', handleScenePointerMove)

  // 动画
  const animate = () => {
    animateId = requestAnimationFrame(animate)
    if (controls) controls.update()
    if (selectionBox) selectionBox.update()
    renderer.render(scene, camera)
  }
  animate()

  // Resize
  const resize = () => {
    const w = threeStageRef.value.clientWidth
    const h = threeStageRef.value.clientHeight
    renderer.setSize(w, h)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  window.addEventListener('resize', resize)
  return () => {
    window.removeEventListener('resize', resize)
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointermove', handleScenePointerMove)
  }
}

// ========== 全屏 ==========
const toggleFullscreen = () => {
  if (document.fullscreenEnabled) {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  } else {
    ElMessage.warning('当前浏览器不支持全屏')
  }
}
const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

// ========== 生命周期 ==========
let cleanResize = null
onMounted(() => {
  cleanResize = buildScene()
  nextTick(updateCharts)
})
onBeforeUnmount(() => {
  if (animateId) cancelAnimationFrame(animateId)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  if (controls) controls.dispose()
  if (cleanResize) cleanResize()
  if (alertChartInstance) alertChartInstance.dispose()
  if (deviceChartInstance) deviceChartInstance.dispose()
  if (inmateChartInstance) inmateChartInstance.dispose()
})
</script>

<style scoped lang="scss">
@use './CommandOverview.scss' as *;
</style>
