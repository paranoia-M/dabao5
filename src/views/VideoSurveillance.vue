<template>
  <div class="page-video-surveillance">
    <!-- 顶部工具栏 -->
    <header class="surveillance-header">
      <div class="header-left">
        <h2 class="page-title">实时视频监控</h2>
        <el-select
          v-model="selectedGroup"
          placeholder="摄像头分组"
          size="small"
          class="group-select"
        >
          <el-option label="全部区域" value="" />
          <el-option v-for="g in areaGroups" :key="g" :label="g" :value="g" />
        </el-select>
        <el-radio-group v-model="layoutMode" size="small" class="layout-group">
          <el-radio-button :value="1">1</el-radio-button>
          <el-radio-button :value="4">4</el-radio-button>
          <el-radio-button :value="9">9</el-radio-button>
          <el-radio-button :value="16">16</el-radio-button>
        </el-radio-group>
      </div>
      <div class="header-center">
        <span class="alert-badge">
          <el-icon><WarningFilled /></el-icon>
          未处理报警：<strong>{{ unhandledCount }}</strong> 条
        </span>
      </div>
      <div class="header-right">
        <el-button size="small" @click="handleScreenshot" :disabled="!selectedCameraId">
          <el-icon><CameraFilled /></el-icon> 截图
        </el-button>
        <el-button size="small" @click="handleFullscreen">
          <el-icon><FullScreen /></el-icon> 全屏
        </el-button>
      </div>
    </header>

    <!-- 主体区域 -->
    <div class="surveillance-body">
      <!-- 视频墙 -->
      <div class="video-wall-wrapper" ref="videoWallRef">
        <div
          class="video-wall"
          :style="{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`
          }"
        >
          <div
            v-for="cam in displayCameras"
            :key="cam.id"
            class="video-cell"
            :class="{ 'is-active': selectedCameraId === cam.id, 'is-offline': cam.status === '离线' }"
            @click="selectedCameraId = cam.id"
            @dblclick="handleSingleFullscreen(cam.id)"
          >
            <div :id="'player-' + cam.id" class="player-container"></div>
            <div class="cell-overlay">
              <span class="cell-name">{{ cam.deviceName }}</span>
              <span class="cell-status" :class="'status-' + (cam.status === '在线' ? 'online' : 'offline')">
                {{ cam.status }}
              </span>
              <el-button
                size="small"
                circle
                class="favorite-btn"
                :type="isFavorite(cam.id) ? 'warning' : 'default'"
                @click.stop="toggleFavorite(cam.id)"
              >
                <el-icon><StarFilled v-if="isFavorite(cam.id)" /><Star v-else /></el-icon>
              </el-button>
            </div>
            <!-- 选中时显示 PTZ 快捷入口 -->
            <div v-if="selectedCameraId === cam.id && ptzSupported[cam.id]" class="ptz-quick">
              <el-button size="small" circle @click.stop="openPtzPanel(cam.id)">
                <el-icon><SetUp /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- PTZ 控制面板 -->
        <Teleport to="body">
          <div v-if="showPtzPanel && ptzSupported[ptzCameraId]" class="ptz-panel" ref="ptzPanelRef">
            <div class="ptz-header">
              <span>PTZ 云台控制 - {{ ptzCameraName }}</span>
              <el-button size="small" text @click="showPtzPanel = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="ptz-direction">
              <div class="row">
                <el-button size="small" @click="ptzMove('up-left')">↖</el-button>
                <el-button size="small" @click="ptzMove('up')">↑</el-button>
                <el-button size="small" @click="ptzMove('up-right')">↗</el-button>
              </div>
              <div class="row">
                <el-button size="small" @click="ptzMove('left')">←</el-button>
                <el-button size="small" disabled>●</el-button>
                <el-button size="small" @click="ptzMove('right')">→</el-button>
              </div>
              <div class="row">
                <el-button size="small" @click="ptzMove('down-left')">↙</el-button>
                <el-button size="small" @click="ptzMove('down')">↓</el-button>
                <el-button size="small" @click="ptzMove('down-right')">↘</el-button>
              </div>
            </div>
            <div class="ptz-zoom">
              <span>变焦</span>
              <el-slider v-model="ptzZoom" :min="1" :max="10" :step="1" size="small" style="width:120px" @input="ptzZoomChange" />
            </div>
          </div>
        </Teleport>

        <!-- 截图弹窗 -->
        <el-dialog
          v-model="screenshotDialogVisible"
          title="截图预览"
          :width="'min(480px, 90vw)'"
          class="video-surveillance-detail-dialog"
        >
          <img :src="screenshotDataUrl" style="max-width:100%" alt="截图" />
        </el-dialog>

        <!-- 收藏管理抽屉 -->
        <el-drawer
          v-model="favoriteDrawerVisible"
          title="收藏摄像头"
          :size="'min(320px, 40vw)'"
          direction="rtl"
          class="video-surveillance-detail-drawer"
        >
          <div v-if="favoriteCameras.length === 0" class="empty-favorites">
            <el-empty description="暂无收藏摄像头" />
          </div>
          <div v-else class="favorite-list">
            <div v-for="cam in favoriteCameras" :key="cam.id" class="favorite-item" @contextmenu.prevent="removeFavorite(cam.id)">
              <span>{{ cam.deviceName }}</span>
              <el-button size="small" text type="danger" @click="removeFavorite(cam.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </el-drawer>
      </div>

      <!-- 右侧报警事件列表 -->
      <aside class="alert-sidebar">
        <div class="alert-filter">
          <el-input
            v-model="alertKeyword"
            placeholder="摄像头名称/编号"
            size="small"
            clearable
            class="filter-item"
          />
          <el-select v-model="alertStatusFilter" placeholder="状态" size="small" clearable class="filter-item">
            <el-option label="全部" value="" />
            <el-option label="未确认" value="未处理" />
            <el-option label="已确认" value="已确认" />
            <el-option label="处理中" value="处理中" />
          </el-select>
          <el-date-picker
            v-model="alertDateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="small"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="filter-item"
          />
        </div>
        <div class="alert-list">
          <div v-if="paginatedEvents.length === 0" class="list-empty">
            <el-empty :description="'暂无报警事件'" />
          </div>
          <el-table
            v-else
            :data="paginatedEvents"
            stripe
            size="small"
            highlight-current-row
            class="alert-table"
            @row-click="handleAlertRowClick"
          >
            <el-table-column label="摄像头" min-width="100" show-overflow-tooltip>
              <template #default="{ row }">
                <span>{{ row.deviceName }}</span>
              </template>
            </el-table-column>
            <el-table-column label="时间" min-width="130">
              <template #default="{ row }">
                <span>{{ row.occurTime }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类型" width="60">
              <template #default="{ row }">
                <el-tag :type="eventTagType(row)" size="small">{{ row.eventType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="70">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === '未处理'"
                  type="primary"
                  size="small"
                  link
                  @click.stop="confirmAlert(row)"
                >
                  确认
                </el-button>
                <el-button size="small" link type="primary" @click.stop="showAlertDetail(row)">详情</el-button>
                <el-button size="small" link type="danger" @click.stop="deleteAlert(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="filteredEvents.length > pageSize"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredEvents.length"
            layout="prev, pager, next"
            small
            class="alert-pagination"
          />
        </div>
        <!-- 收藏入口 -->
        <div class="favorite-section">
          <el-button size="small" text @click="favoriteDrawerVisible = true">
            <el-icon><StarFilled /></el-icon> 收藏摄像头 ({{ favoriteCameras.length }})
          </el-button>
        </div>
      </aside>
    </div>

    <!-- 底部控制条 -->
    <footer class="surveillance-footer">
      <div class="footer-time">
        <el-icon><Clock /></el-icon>
        <span>{{ currentTime }}</span>
      </div>
      <div class="footer-controls">
        <el-button size="small" @click="toggleAllPlayback">
          <el-icon><VideoPause v-if="allPlaying" /><VideoPlay v-else /></el-icon>
          {{ allPlaying ? '全部暂停' : '全部播放' }}
        </el-button>
        <el-button size="small" @click="handleScreenshot" :disabled="!selectedCameraId">
          <el-icon><CameraFilled /></el-icon> 截图
        </el-button>
        <el-button size="small" @click="handleFullscreen">
          <el-icon><FullScreen /></el-icon> 全屏
        </el-button>
      </div>
      <div class="footer-extra">
        <el-button size="small" text @click="favoriteDrawerVisible = true">
          收藏管理
        </el-button>
      </div>
    </footer>

    <!-- 报警详情弹窗 -->
    <el-dialog
      v-model="alertDetailVisible"
      title="报警详情"
      :width="'min(640px, 92vw)'"
      class="video-surveillance-detail-dialog"
    >
      <div v-if="currentAlertDetail" class="alert-detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="摄像头名称">{{ currentAlertDetail.deviceName }}</el-descriptions-item>
          <el-descriptions-item label="编号">{{ currentAlertDetail.deviceId }}</el-descriptions-item>
          <el-descriptions-item label="位置">{{ getDeviceLocation(currentAlertDetail.deviceId) }}</el-descriptions-item>
          <el-descriptions-item label="报警时间">{{ currentAlertDetail.occurTime }}</el-descriptions-item>
          <el-descriptions-item label="报警类型">
            <el-tag :type="eventTagType(currentAlertDetail)" size="small">{{ currentAlertDetail.eventType }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="等级">
            <el-tag :type="levelTagType(currentAlertDetail.level)" size="small">{{ currentAlertDetail.level }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="statusTagType(currentAlertDetail.status)" size="small">{{ currentAlertDetail.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理人">{{ currentAlertDetail.handler || '-' }}</el-descriptions-item>
          <el-descriptions-item label="确认时间">{{ currentAlertDetail.confirmTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="事件描述" :span="2">{{ currentAlertDetail.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { WarningFilled, CameraFilled, FullScreen, StarFilled, Star, SetUp, Close, Delete, Clock, VideoPause, VideoPlay } from '@element-plus/icons-vue'
import { useAlertEventStore } from '@/stores/alertEvent'
import { useDeviceStore } from '@/stores/device'
import Player from 'xgplayer'
import 'xgplayer/dist/index.min.css'
import dayjs from 'dayjs'

// stores
const alertEventStore = useAlertEventStore()
const deviceStore = useDeviceStore()

// 摄像头相关
const cameras = computed(() => deviceStore.deviceList.filter(d => d.deviceType === '摄像头'))
const areaGroups = computed(() => {
  const areas = new Set()
  cameras.value.forEach(c => {
    const match = c.location.match(/^([A-Z]区)/)
    if (match) areas.add(match[1])
  })
  return Array.from(areas).sort()
})
const selectedGroup = ref('')
const groupedCameras = computed(() => {
  if (!selectedGroup.value) return cameras.value
  return cameras.value.filter(c => c.location.startsWith(selectedGroup.value))
})
const layoutMode = ref(4) // 1,4,9,16
const gridCols = computed(() => {
  if (layoutMode.value === 1) return 1
  if (layoutMode.value === 4) return 2
  if (layoutMode.value === 9) return 3
  if (layoutMode.value === 16) return 4
  return 2
})
const gridRows = computed(() => Math.ceil(displayCameras.value.length / gridCols.value))
const displayCameras = computed(() => groupedCameras.value.slice(0, layoutMode.value))

// 选中的摄像头
const selectedCameraId = ref(null)
watch(displayCameras, (arr) => {
  if (arr.length > 0 && !arr.find(c => c.id === selectedCameraId.value)) {
    selectedCameraId.value = arr[0].id
  }
}, { immediate: true })

// PTZ 支持模拟（前两个支持云台）
const ptzSupported = computed(() => {
  const map = {}
  cameras.value.forEach((c, idx) => {
    map[c.id] = idx < 2 // 前两个支持
  })
  return map
})
const showPtzPanel = ref(false)
const ptzCameraId = ref(null)
const ptzCameraName = ref('')
const ptzZoom = ref(5)
const openPtzPanel = (camId) => {
  const cam = cameras.value.find(c => c.id === camId)
  if (cam) {
    ptzCameraId.value = camId
    ptzCameraName.value = cam.deviceName
    showPtzPanel.value = true
  }
}
const ptzMove = (dir) => {
  ElMessage.success(`PTZ ${dir} 移动指令已发送`)
}
const ptzZoomChange = (val) => {
  ElMessage.success(`变焦倍率调整为 ${val}x`)
}

// 收藏
const favoriteCameraIds = ref([])
const favoriteDrawerVisible = ref(false)
const favoriteCameras = computed(() => cameras.value.filter(c => favoriteCameraIds.value.includes(c.id)))
const isFavorite = (id) => favoriteCameraIds.value.includes(id)
const toggleFavorite = (id) => {
  if (isFavorite(id)) {
    ElMessage.info('已收藏')
  } else {
    favoriteCameraIds.value.push(id)
    ElMessage.success('收藏成功')
  }
}
const removeFavorite = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该收藏摄像头？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消' })
    favoriteCameraIds.value = favoriteCameraIds.value.filter(fid => fid !== id)
    ElMessage.success('已取消收藏')
  } catch {}
}

// 报警事件列表
const alertKeyword = ref('')
const alertStatusFilter = ref('')
const alertDateRange = ref([])
const currentPage = ref(1)
const pageSize = 20

const deviceNameMap = computed(() => {
  const map = {}
  deviceStore.deviceList.forEach(d => { map[d.id] = d.deviceName })
  return map
})
const deviceLocationMap = computed(() => {
  const map = {}
  deviceStore.deviceList.forEach(d => { map[d.id] = d.location })
  return map
})
const getDeviceLocation = (id) => deviceLocationMap.value[id] || '-'

const filteredEvents = computed(() => {
  let list = alertEventStore.alertEventList.map(e => ({
    ...e,
    deviceName: deviceNameMap.value[e.deviceId] || e.deviceId
  }))
  if (alertKeyword.value) {
    const kw = alertKeyword.value.toLowerCase()
    list = list.filter(e => e.deviceName.toLowerCase().includes(kw) || e.deviceId.toLowerCase().includes(kw))
  }
  if (alertStatusFilter.value) {
    list = list.filter(e => e.status === alertStatusFilter.value)
  }
  if (alertDateRange.value && alertDateRange.value.length === 2) {
    const start = dayjs(alertDateRange.value[0]).valueOf()
    const end = dayjs(alertDateRange.value[1]).valueOf()
    list = list.filter(e => {
      const t = dayjs(e.occurTime).valueOf()
      return t >= start && t <= end
    })
  }
  list.sort((a, b) => dayjs(b.occurTime).valueOf() - dayjs(a.occurTime).valueOf())
  return list
})
const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredEvents.value.slice(start, start + pageSize)
})
const unhandledCount = computed(() => alertEventStore.alertEventList.filter(e => e.status === '未处理').length)

const eventTagType = (row) => {
  if (row.eventType === '入侵') return 'danger'
  if (row.eventType === '打架') return 'warning'
  if (row.eventType === '火灾') return 'danger'
  return 'info'
}
const levelTagType = (level) => {
  if (level === '高') return 'danger'
  if (level === '中') return 'warning'
  return 'info'
}
const statusTagType = (status) => {
  if (status === '未处理') return 'danger'
  if (status === '处理中') return 'warning'
  if (status === '已确认') return 'success'
  return 'info'
}
const confirmAlert = async (row) => {
  try {
    await ElMessageBox.confirm('确认该报警事件？', '确认', { confirmButtonText: '确认', cancelButtonText: '取消' })
    alertEventStore.update(row.id, {
      status: '已确认',
      handler: '系统管理员',
      confirmTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    ElMessage.success('报警已确认')
  } catch {}
}
const deleteAlert = async (row) => {
  try {
    await ElMessageBox.confirm(
      row.status !== '未处理' ? '该事件已关联处理记录，删除后将解除关联，是否继续？' : '确定删除该报警事件？',
      '提示',
      { confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    alertEventStore.remove(row.id)
    ElMessage.success('报警事件已删除')
  } catch {}
}
const currentAlertDetail = ref(null)
const alertDetailVisible = ref(false)
const showAlertDetail = (row) => {
  currentAlertDetail.value = {
    ...row,
    deviceName: deviceNameMap.value[row.deviceId] || row.deviceId
  }
  alertDetailVisible.value = true
}
const handleAlertRowClick = (row) => {
  showAlertDetail(row)
}

// 播放器管理
const playerMap = new Map()
const allPlaying = ref(true)

const initPlayer = (cam) => {
  const container = document.getElementById('player-' + cam.id)
  if (!container || playerMap.has(cam.id)) return
  const player = new Player({
    el: container,
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4', // mock
    playsinline: true,
    autoplay: true,
    controls: false,
    volume: 0,
    width: '100%',
    height: '100%'
  })
  playerMap.set(cam.id, player)
}
const destroyPlayer = (id) => {
  const p = playerMap.get(id)
  if (p) {
    p.destroy()
    playerMap.delete(id)
  }
}
const syncPlayers = (targetCams) => {
  const currentIds = new Set(targetCams.map(c => c.id))
  // remove stale
  for (const [id] of playerMap) {
    if (!currentIds.has(id)) {
      destroyPlayer(id)
    }
  }
  // add new
  targetCams.forEach(cam => {
    if (!playerMap.has(cam.id)) {
      nextTick(() => initPlayer(cam))
    }
  })
}
watch(displayCameras, (newCams) => { syncPlayers(newCams) }, { deep: false })

onMounted(() => {
  syncPlayers(displayCameras.value)
})
onBeforeUnmount(() => {
  for (const [id] of playerMap) {
    destroyPlayer(id)
  }
})

// 全屏与截图
const videoWallRef = ref(null)
const handleFullscreen = () => {
  const el = videoWallRef.value
  if (el) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }
}
const handleSingleFullscreen = (camId) => {
  const container = document.getElementById('player-' + camId)
  if (container) {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }
}
const screenshotDataUrl = ref('')
const screenshotDialogVisible = ref(false)
const handleScreenshot = () => {
  if (!selectedCameraId.value) {
    ElMessage.warning('请先选择一个摄像头')
    return
  }
  const player = playerMap.get(selectedCameraId.value)
  if (!player) {
    ElMessage.warning('播放器未初始化')
    return
  }
  const video = player.video
  if (!video) return
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)
  screenshotDataUrl.value = canvas.toDataURL('image/png')
  screenshotDialogVisible.value = true
}

// 全局播放/暂停
const toggleAllPlayback = () => {
  allPlaying.value = !allPlaying.value
  playerMap.forEach((p) => {
    if (allPlaying.value) {
      p.play()
    } else {
      p.pause()
    }
  })
}

// 时间
const currentTime = ref(dayjs().format('HH:mm:ss'))
let timeInterval
onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = dayjs().format('HH:mm:ss')
  }, 1000)
})
onBeforeUnmount(() => {
  clearInterval(timeInterval)
})
</script>

<style scoped lang="scss">
@use './VideoSurveillance.scss' as *;
</style>