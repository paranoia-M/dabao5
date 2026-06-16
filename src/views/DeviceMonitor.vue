<template>
  <div class="page-device-monitor">
    <!-- 顶部概览卡片 -->
    <div class="overview-row">
      <div class="overview-card overview-card--online">
        <span class="overview-number">{{ onlineCount }}</span>
        <span class="overview-label">在线设备</span>
        <el-tag size="small" type="success">{{ onlineRate }}%</el-tag>
      </div>
      <div class="overview-card overview-card--offline">
        <span class="overview-number">{{ offlineCount }}</span>
        <span class="overview-label">离线设备</span>
      </div>
      <div class="overview-card overview-card--fault">
        <span class="overview-number">{{ faultCount }}</span>
        <span class="overview-label">故障设备</span>
      </div>
      <div class="overview-card overview-card--total">
        <span class="overview-number">{{ totalCount }}</span>
        <span class="overview-label">设备总数</span>
      </div>
      <div class="overview-actions">
        <el-button type="primary" @click="showAddDialog = true">新增设备</el-button>
        <el-button @click="handleExport">导出清单</el-button>
        <el-button type="warning" @click="handleOneKeyInspect">一键巡检</el-button>
      </div>
    </div>

    <!-- 筛选区 -->
    <div class="filter-row">
      <el-input v-model="keyword" placeholder="搜索设备名称/编号" clearable style="width:220px" @input="onFilter" />
      <el-select v-model="filterType" placeholder="设备类型" clearable style="width:150px" @change="onFilter">
        <el-option label="全部" value="" />
        <el-option label="门禁" value="门禁" />
        <el-option label="摄像头" value="摄像头" />
        <el-option label="对讲" value="对讲" />
        <el-option label="报警器" value="报警器" />
        <el-option label="电子围栏" value="电子围栏" />
      </el-select>
      <el-select v-model="filterStatus" placeholder="状态" clearable style="width:140px" @change="onFilter">
        <el-option label="全部" value="" />
        <el-option label="在线" value="在线" />
        <el-option label="离线" value="离线" />
        <el-option label="故障" value="故障" />
      </el-select>
    </div>

    <!-- 主舞台区域：3D场景 + 右侧设备状态矩阵 -->
    <div class="main-area">
      <div class="three-wrapper">
        <div ref="threeStageRef" class="three-stage"></div>
        <!-- 场景图例 -->
        <div class="three-legend">
          <div><span class="dot dot-online"></span> 在线</div>
          <div><span class="dot dot-offline"></span> 离线</div>
          <div><span class="dot dot-fault"></span> 故障</div>
        </div>
      </div>
      <div class="matrix-panel">
        <div class="matrix-title">设备状态矩阵</div>
        <div class="matrix-grid">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="matrix-item"
            :class="'matrix-item--' + item.status"
            @click="handleMatrixClick(item)"
          >
            <div class="matrix-icon">
              <el-icon :size="24">
                <Monitor v-if="item.deviceType === '摄像头'" />
                <Lock v-else-if="item.deviceType === '门禁'" />
                <Phone v-else-if="item.deviceType === '对讲'" />
                <WarningFilled v-else-if="item.deviceType === '报警器'" />
                <Grid v-else-if="item.deviceType === '电子围栏'" />
                <Tools v-else />
              </el-icon>
            </div>
            <div class="matrix-name">{{ item.deviceName }}</div>
            <div class="matrix-status">{{ item.status }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 辅助表格 -->
    <div class="table-section">
      <el-table :data="filteredList" stripe style="width:100%" @row-click="handleRowClick" max-height="400">
        <el-table-column prop="deviceName" label="设备名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="deviceType" label="类型" width="100" />
        <el-table-column prop="location" label="位置" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : row.status === '离线' ? 'warning' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click.stop="handleEdit(row)">编辑</el-button>
            <el-button link size="small" type="danger" @click.stop="handleDelete(row)">删除</el-button>
            <el-button link size="small" @click.stop="handleInspectSingle(row)">巡检</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="showAddDialog" :title="isEdit ? '编辑设备' : '新增设备'" width="min(600px,92vw)" destroy-on-close @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="设备编号" prop="deviceId">
          <el-input v-model="form.deviceId" placeholder="请输入设备编号" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="设备名称" prop="deviceName">
          <el-input v-model="form.deviceName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="deviceType">
          <el-select v-model="form.deviceType" placeholder="请选择设备类型">
            <el-option label="门禁" value="门禁" />
            <el-option label="摄像头" value="摄像头" />
            <el-option label="对讲" value="对讲" />
            <el-option label="报警器" value="报警器" />
            <el-option label="电子围栏" value="电子围栏" />
          </el-select>
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="form.location" placeholder="如 A区-1楼-101" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="form.ip" placeholder="192.168.1.1" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input-number v-model="form.port" :min="1" :max="65535" style="width:100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="状态" :disabled="isEdit && originalStatus === '在线'">
            <el-option label="在线" value="在线" />
            <el-option label="离线" value="离线" />
            <el-option label="故障" value="故障" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="showDetailDrawer"
      direction="rtl"
      size="min(760px,92vw)"
      class="device-monitor-detail-drawer"
      title="设备详情"
    >
      <template v-if="currentDetail">
        <div class="detail-grid">
          <div class="detail-field"><span>设备编号</span><span>{{ currentDetail.deviceId }}</span></div>
          <div class="detail-field"><span>设备名称</span><span>{{ currentDetail.deviceName }}</span></div>
          <div class="detail-field"><span>设备类型</span><span>{{ currentDetail.deviceType }}</span></div>
          <div class="detail-field"><span>位置</span><span>{{ currentDetail.location }}</span></div>
          <div class="detail-field"><span>IP</span><span>{{ currentDetail.ip }}</span></div>
          <div class="detail-field"><span>端口</span><span>{{ currentDetail.port }}</span></div>
          <div class="detail-field"><span>状态</span><span><el-tag :type="statusTagType(currentDetail.status)">{{ currentDetail.status }}</el-tag></span></div>
          <div class="detail-field"><span>供应商</span><span>{{ currentDetail.manufacturer }}</span></div>
          <div class="detail-field"><span>安装日期</span><span>{{ currentDetail.installDate }}</span></div>
          <div class="detail-field"><span>最近维保</span><span>{{ currentDetail.lastMaintenanceDate }}</span></div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">最近告警记录</div>
          <div v-if="alertList.length === 0" class="empty-tip">暂无告警</div>
          <div v-for="alert in alertList" :key="alert.id" class="alert-item">
            <el-tag :type="alert.level === '高' ? 'danger' : alert.level === '中' ? 'warning' : 'info'" size="small">{{ alert.level }}</el-tag>
            <span>{{ alert.eventType }} — {{ alert.description }}</span>
            <span class="time">{{ alert.occurTime }}</span>
          </div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">运行曲线（近7天）</div>
          <svg width="100%" height="120" viewBox="0 0 480 120" preserveAspectRatio="none" style="margin-top:8px">
            <polyline :points="trendPoints" fill="none" stroke="var(--page-primary, #1A4B6E)" stroke-width="2" />
          </svg>
        </div>
      </template>
      <template #footer>
        <el-button @click="showDetailDrawer = false">关闭</el-button>
      </template>
    </el-drawer>

    <!-- 一键巡检结果区 -->
    <div v-if="inspectResult" class="inspect-result">
      <el-alert
        :title="inspectResult.title"
        :type="inspectResult.type"
        :closable="true"
        show-icon
        @close="inspectResult = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Lock, Phone, WarningFilled, Grid, Tools } from '@element-plus/icons-vue'
import { useDeviceStore } from '@/stores/device'
import { useAlertEventStore } from '@/stores/alertEvent'
import * as THREE from 'three'

// --- Store ---
const deviceStore = useDeviceStore()
const alertStore = useAlertEventStore()

// --- 状态与计算 ---
const deviceList = computed(() => deviceStore.deviceList || [])
const keyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filteredList = computed(() => {
  let list = deviceList.value
  if (keyword.value) {
    const kw = keyword.value.toLowerCase()
    list = list.filter(d => d.deviceName.toLowerCase().includes(kw) || d.deviceId.toLowerCase().includes(kw))
  }
  if (filterType.value) list = list.filter(d => d.deviceType === filterType.value)
  if (filterStatus.value) list = list.filter(d => d.status === filterStatus.value)
  return list
})

const totalCount = computed(() => deviceList.value.length)
const onlineCount = computed(() => deviceList.value.filter(d => d.status === '在线').length)
const offlineCount = computed(() => deviceList.value.filter(d => d.status === '离线').length)
const faultCount = computed(() => deviceList.value.filter(d => d.status === '故障').length)
const onlineRate = computed(() => totalCount.value ? Math.round(onlineCount.value / totalCount.value * 100) : 0)

// --- 新增/编辑弹窗 ---
const showAddDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const originalStatus = ref('')
const form = ref({
  deviceId: '',
  deviceName: '',
  deviceType: '',
  location: '',
  ip: '',
  port: 8080,
  status: '在线'
})
const formRules = {
  deviceId: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  deviceType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  location: [{ required: true, message: '请输入安装位置', trigger: 'blur' }],
  ip: [{ required: true, message: '请输入IP地址', trigger: 'blur' },
       { pattern: /^(\d{1,3}\.){3}\d{1,3}$/, message: 'IP格式不正确', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

function resetForm() {
  form.value = { deviceId: '', deviceName: '', deviceType: '', location: '', ip: '', port: 8080, status: '在线' }
  isEdit.value = false
  originalStatus.value = ''
}

function handleEdit(row) {
  isEdit.value = true
  originalStatus.value = row.status
  form.value = {
    deviceId: row.deviceId,
    deviceName: row.deviceName,
    deviceType: row.deviceType,
    location: row.location,
    ip: row.ip,
    port: row.port,
    status: row.status
  }
  showAddDialog.value = true
}

function submitForm() {
  formRef.value.validate(valid => {
    if (!valid) return
    // 唯一性校验
    if (!isEdit.value && deviceList.value.some(d => d.deviceId === form.value.deviceId)) {
      ElMessage.error('编号重复，请重新输入')
      return
    }
    // 状态变更限制（在线→离线需先停用）
    if (isEdit.value && originalStatus.value === '在线' && form.value.status === '离线') {
      ElMessage.warning('在线设备不能直接修改为离线，请先执行远程停用')
      return
    }
    const item = {
      ...form.value,
      id: isEdit.value ? currentEditId.value : 'device_' + Date.now(),
      manufacturer: '未知',
      installDate: new Date().toISOString().slice(0,10),
      lastMaintenanceDate: ''
    }
    if (isEdit.value) {
      deviceStore.update(currentEditId.value, item)
      ElMessage.success('设备已更新')
    } else {
      deviceStore.add(item)
      ElMessage.success('设备已添加')
    }
    showAddDialog.value = false
  })
}

const currentEditId = ref('')
watch(showAddDialog, (val) => {
  if (!val) {
    currentEditId.value = ''
  } else if (isEdit.value) {
    currentEditId.value = form.value.id || ''
  }
})

// --- 删除 ---
function handleDelete(row) {
  ElMessageBox.confirm(
    `确定删除设备"${row.deviceName}"？${
      alertStore.alertEventList.filter(a => a.deviceId === row.id).length
        ? `该设备关联${alertStore.alertEventList.filter(a => a.deviceId === row.id).length}条告警规则，删除后规则失效。`
        : ''
    }`,
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    deviceStore.remove(row.id)
    ElMessage.success('已删除')
  }).catch(() => {})
}

// --- 筛选触发 ---
function onFilter() { /* computed already reacts */ }

// --- 导出 ---
function handleExport() {
  const rows = filteredList.value
  if (!rows.length) { ElMessage.warning('无数据可导出'); return }
  const headers = ['设备编号','设备名称','设备类型','位置','状态','IP','端口']
  const csv = [headers.join(','), ...rows.map(r => `"${r.deviceId}","${r.deviceName}","${r.deviceType}","${r.location}","${r.status}","${r.ip}","${r.port}"`)].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `设备清单_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// --- 一键巡检 ---
const inspectResult = ref(null)
function handleOneKeyInspect() {
  inspectResult.value = { title: '一键巡检已启动，正在探测设备...', type: 'info' }
  setTimeout(() => {
    // 模拟结果
    const offlineDevs = deviceList.value.filter(d => d.status !== '在线')
    if (offlineDevs.length) {
      inspectResult.value = { title: `巡检超时：${offlineDevs.map(d => d.deviceName).join('、')}`, type: 'warning' }
    } else {
      inspectResult.value = { title: '所有设备响应正常。', type: 'success' }
    }
    setTimeout(() => { inspectResult.value = null }, 15000)
  }, 3000)
}

function handleInspectSingle(row) {
  inspectResult.value = { title: `正在巡检 ${row.deviceName}...`, type: 'info' }
  setTimeout(() => {
    if (row.status === '在线') {
      inspectResult.value = { title: `${row.deviceName} 响应正常。`, type: 'success' }
    } else {
      inspectResult.value = { title: `${row.deviceName} 巡检超时。`, type: 'warning' }
    }
    setTimeout(() => { inspectResult.value = null }, 15000)
  }, 2000)
}

// --- 详情抽屉 ---
const showDetailDrawer = ref(false)
const currentDetail = ref(null)
const alertList = computed(() => {
  if (!currentDetail.value) return []
  return alertStore.alertEventList.filter(a => a.deviceId === currentDetail.value.id).slice(0, 10)
})
const trendPoints = computed(() => {
  // 模拟近7天心跳数据（从0到1生成随机值）
  const pts = []
  for (let i = 0; i < 24 * 7; i+=2) {
    const x = (i / (24*7)) * 480
    const y = 120 - (Math.random() * 90 + 10)
    pts.push(`${x},${y}`)
  }
  return pts.join(' ')
})

function handleMatrixClick(item) {
  currentDetail.value = item
  showDetailDrawer.value = true
}
function handleRowClick(row) {
  currentDetail.value = row
  showDetailDrawer.value = true
}
function statusTagType(status) {
  if (status === '在线') return 'success'
  if (status === '离线') return 'warning'
  return 'danger'
}

// --- Three.js 三维场景 ---
const threeStageRef = ref(null)
let renderer, scene, camera, animationId
const clickableMeshes = []

function initThree() {
  const container = threeStageRef.value
  if (!container) return

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x111827)

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100)
  camera.position.set(0, 2.5, 6.5)
  camera.lookAt(0, 1.5, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  // 灯光
  const ambient = new THREE.AmbientLight(0x404060, 0.8)
  scene.add(ambient)
  const dir = new THREE.DirectionalLight(0xffffff, 1.2)
  dir.position.set(2, 5, 3)
  scene.add(dir)
  const back = new THREE.DirectionalLight(0x8888ff, 0.3)
  back.position.set(-2, 0, -5)
  scene.add(back)

  // 构建场景
  buildScene()

  // 点击检测
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  container.addEventListener('click', (event) => {
    const rect = container.getBoundingClientRect()
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(clickableMeshes)
    if (intersects.length > 0) {
      const obj = intersects[0].object
      const id = obj.userData?.deviceId
      if (id) {
        const dev = deviceList.value.find(d => d.id === id)
        if (dev) {
          currentDetail.value = dev
          showDetailDrawer.value = true
        }
      }
    }
  })

  animate()
}

function buildScene() {
  // 1. 走廊结构
  const corridorGroup = new THREE.Group()
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 6), floorMat)
  floor.position.set(0, 0, 0)
  corridorGroup.add(floor)

  const wallMat = new THREE.MeshStandardMaterial({ color: 0xF5F5DC })
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 6), wallMat)
  leftWall.position.set(-3, 1.4, 0)
  corridorGroup.add(leftWall)

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.8, 6), wallMat)
  rightWall.position.set(3, 1.4, 0)
  corridorGroup.add(rightWall)

  const top = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 6), new THREE.MeshStandardMaterial({ color: 0xbbbbbb }))
  top.position.set(0, 2.8, 0)
  corridorGroup.add(top)

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(6, 2.8, 0.1), wallMat)
  backWall.position.set(0, 1.4, -3)
  corridorGroup.add(backWall)

  scene.add(corridorGroup)

  // 2. 监室门 (3扇)
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x666666 })
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x444444 })
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc })
  for (let i = 0; i < 3; i++) {
    const cellDoorGroup = new THREE.Group()
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.05), doorMat)
    door.position.set(0, 1.05, 0)
    cellDoorGroup.add(door)

    // 门框
    const frameParts = [
      { pos: [0, 1.15, 0], scale: [0.92, 0.03, 0.03] },
      { pos: [0.46, 1.05, 0], scale: [0.03, 2.2, 0.03] },
      { pos: [0, 0, 0], scale: [0.92, 0.03, 0.03] },
      { pos: [-0.46, 1.05, 0], scale: [0.03, 2.2, 0.03] }
    ]
    frameParts.forEach(p => {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(...p.scale), frameMat)
      frame.position.set(...p.pos)
      cellDoorGroup.add(frame)
    })

    // 把手
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.01, 8, 16), handleMat)
    handle.position.set(0.35, 1.05, 0.03)
    handle.rotation.y = Math.PI / 2
    cellDoorGroup.add(handle)

    cellDoorGroup.position.set(3, 0, -1.5 + i * 1.5)
    cellDoorGroup.name = 'cellDoor'
    // 设置 userData 映射到门禁设备
    const doorDevices = deviceList.value.filter(d => d.deviceType === '门禁')
    if (doorDevices[i]) {
      const dev = doorDevices[i]
      cellDoorGroup.userData = { deviceId: dev.id }
      clickableMeshes.push(door)
      // 根据状态着色
      if (dev.status === '在线') door.material.color.setHex(0x22c55e)
      else if (dev.status === '离线') door.material.color.setHex(0x9ca3af)
      else door.material.color.setHex(0xef4444)
    }
    scene.add(cellDoorGroup)
  }

  // 3. 球形摄像头 (4个)
  for (let i = 0; i < 4; i++) {
    const cameraGroup = new THREE.Group()
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff }))
    base.position.y = 0.025
    cameraGroup.add(base)

    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12), sphereMat)
    sphere.position.y = 0.1
    cameraGroup.add(sphere)

    const lens = new THREE.Mesh(new THREE.SphereGeometry(0.04), new THREE.MeshStandardMaterial({ color: 0x000000 }))
    lens.position.set(0, 0.1, 0.12)
    cameraGroup.add(lens)

    const camDevices = deviceList.value.filter(d => d.deviceType === '摄像头')
    if (camDevices[i]) {
      const dev = camDevices[i]
      cameraGroup.userData = { deviceId: dev.id }
      // 状态颜色映射到球体emissive
      if (dev.status === '在线') sphereMat.emissive = new THREE.Color(0x22c55e)
      else if (dev.status === '离线') sphereMat.emissive = new THREE.Color(0x9ca3af)
      else sphereMat.emissive = new THREE.Color(0xef4444)
      sphereMat.emissiveIntensity = 0.3
      clickableMeshes.push(sphere)
    }

    // 位置：2个天花板，2个左墙
    if (i < 2) {
      cameraGroup.position.set(-1 + i * 2, 2.75, -1)
      cameraGroup.rotation.x = 0.25
    } else {
      cameraGroup.position.set(-2.9, 2.0, -1.5 + i * 2)
      cameraGroup.rotation.y = -Math.PI / 2
    }
    scene.add(cameraGroup)
  }

  // 4. 声光报警器 (2个)
  for (let i = 0; i < 2; i++) {
    const alarmGroup = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.15), new THREE.MeshStandardMaterial({ color: 0xdc2626 }))
    body.position.y = 0.075
    alarmGroup.add(body)

    const domeMat = new THREE.MeshStandardMaterial({ color: 0xff0000, transparent: true, opacity: 0.6 })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.06), domeMat)
    dome.position.y = 0.15
    alarmGroup.add(dome)

    // 内部发光小球
    const inner = new THREE.Mesh(new THREE.SphereGeometry(0.03), new THREE.MeshStandardMaterial({ color: 0xffffff }))
    inner.position.y = 0.15
    alarmGroup.add(inner)

    // 报警器设备映射
    const alarmDevices = deviceList.value.filter(d => d.deviceType === '报警器')
    if (alarmDevices[i]) {
      const dev = alarmDevices[i]
      alarmGroup.userData = { deviceId: dev.id }
      clickableMeshes.push(body)
      // 根据告警级别调整颜色（后端可能有级别字段，这里简化）
      const alertLevel = alertStore.alertEventList.find(a => a.deviceId === dev.id)?.level
      if (alertLevel === '高') domeMat.emissive = new THREE.Color(0xff0000)
      else if (alertLevel === '中') domeMat.emissive = new THREE.Color(0xffff00)
      else domeMat.emissive = new THREE.Color(0x00ff00)
      domeMat.emissiveIntensity = 0.5
    }

    alarmGroup.position.set(-2.8 + i * 5.6, 2.7, -2.8)
    alarmGroup.rotation.x = Math.PI
    scene.add(alarmGroup)
  }

  // 5. 门禁读卡器 (3个)
  for (let i = 0; i < 3; i++) {
    const readerGroup = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff }))
    readerGroup.add(body)

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.01), new THREE.MeshStandardMaterial({ color: 0x000000 }))
    screen.position.set(0, 0, 0.03)
    readerGroup.add(screen)

    const indicator = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshStandardMaterial({ color: 0x22c55e }))
    indicator.position.set(0.04, 0.03, 0.03)
    readerGroup.add(indicator)

    // 读卡器设备（类型可能是门禁，这里复用门禁设备）
    const doorDevices = deviceList.value.filter(d => d.deviceType === '门禁')
    if (doorDevices[i]) {
      const dev = doorDevices[i]
      readerGroup.userData = { deviceId: dev.id }
      clickableMeshes.push(body)
      if (dev.status === '在线') indicator.material.color.setHex(0x22c55e)
      else if (dev.status === '离线') indicator.material.color.setHex(0x9ca3af)
      else indicator.material.color.setHex(0xef4444)
    }

    readerGroup.position.set(3.05, 1.3, -1.5 + i * 1.5)
    readerGroup.rotation.y = -Math.PI / 2
    scene.add(readerGroup)
  }

  // 6. 紧急对讲机 (2个)
  for (let i = 0; i < 2; i++) {
    const intercomGroup = new THREE.Group()
    const host = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }))
    intercomGroup.add(host)

    // 扬声器格栅：3x2小圆柱
    const gridMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const grille = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.02, 6), gridMat)
        grille.position.set(-0.02 + c * 0.02, -0.02 + r * 0.02, 0.025)
        grille.rotation.x = Math.PI / 2
        intercomGroup.add(grille)
      }
    }

    const button = new THREE.Mesh(new THREE.SphereGeometry(0.01), new THREE.MeshStandardMaterial({ color: 0xef4444 }))
    button.position.set(0, -0.04, 0.025)
    intercomGroup.add(button)

    const intercomDevices = deviceList.value.filter(d => d.deviceType === '对讲')
    if (intercomDevices[i]) {
      const dev = intercomDevices[i]
      intercomGroup.userData = { deviceId: dev.id }
      clickableMeshes.push(host)
      if (dev.status === '在线') host.material.emissive = new THREE.Color(0x22c55e)
      else if (dev.status === '离线') host.material.emissive = new THREE.Color(0x9ca3af)
      else host.material.emissive = new THREE.Color(0xef4444)
      host.material.emissiveIntensity = 0.3
    }

    intercomGroup.position.set(-2.9, 1.5, -1 + i * 2)
    intercomGroup.rotation.y = Math.PI / 2
    scene.add(intercomGroup)
  }

  // 7. 电子围栏光柱与巡逻标记线
  const fenceGroup = new THREE.Group()
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xff6666, transparent: true, opacity: 0.4 })
  const pillar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.5), pillarMat)
  pillar1.position.set(-2.9, 1.25, 3)
  fenceGroup.add(pillar1)
  const pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.5), pillarMat)
  pillar2.position.set(2.9, 1.25, 3)
  fenceGroup.add(pillar2)

  // 巡逻标记线
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.5, 0.02, -2),
    new THREE.Vector3(-1, 0.02, 0),
    new THREE.Vector3(1, 0.02, 1),
    new THREE.Vector3(2.5, 0.02, 2.5)
  ])
  const tubeGeo = new THREE.TubeGeometry(curve, 64, 0.015, 8, false)
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 })
  const tube = new THREE.Mesh(tubeGeo, tubeMat)
  fenceGroup.add(tube)

  scene.add(fenceGroup)

  // 辅助网格（可选）
  const gridHelper = new THREE.GridHelper(8, 16, 0x444444, 0x555555)
  gridHelper.position.y = 0.03
  scene.add(gridHelper)
}

function animate() {
  animationId = requestAnimationFrame(animate)
  renderer.render(scene, camera)
}

function onResize() {
  if (!renderer || !threeStageRef.value) return
  const container = threeStageRef.value
  const w = container.clientWidth
  const h = container.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h)
}

onMounted(() => {
  nextTick(() => {
    initThree()
    window.addEventListener('resize', onResize)
  })
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  if (renderer) {
    renderer.dispose()
    renderer.domElement.remove()
  }
  window.removeEventListener('resize', onResize)
})
</script>

<style scoped lang="scss">
@use './DeviceMonitor.scss' as *;
</style>