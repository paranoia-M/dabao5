<template>
  <div class="distribution-container">
    <!-- 空项目模板选择 -->
    <div v-if="showTemplateSelect" class="template-select-overlay">
      <div class="template-select-card">
        <h3>选择历史项目模板</h3>
        <el-input
          v-model="templateSearch"
          placeholder="搜索项目模板..."
          :prefix-icon="Search"
          class="template-search"
        />
        <div class="template-list">
          <div
            v-for="template in filteredTemplates"
            :key="template.id"
            class="template-item"
            @click="selectTemplate(template)"
          >
            <div class="template-name">{{ template.name }}</div>
            <div class="template-desc">{{ template.description }}</div>
          </div>
        </div>
        <el-button @click="showTemplateSelect = false" class="cancel-btn">取消</el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧画布区 -->
      <div class="canvas-area" ref="canvasRef" @contextmenu.prevent="handleCanvasRightClick">
        <div class="canvas-header">
          <span class="canvas-title">桩基分布图</span>
          <el-button-group>
            <el-button :icon="Refresh" size="small" @click="refreshCanvas" :loading="canvasLoading">刷新</el-button>
            <el-button :icon="ZoomIn" size="small" @click="zoomIn">放大</el-button>
            <el-button :icon="ZoomOut" size="small" @click="zoomOut">缩小</el-button>
            <el-button :icon="FullScreen" size="small" @click="fitView">适应</el-button>
          </el-button-group>
        </div>
        <div class="canvas-body" ref="canvasBodyRef" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag">
          <svg :width="canvasWidth" :height="canvasHeight" class="canvas-svg">
            <!-- 网格背景 -->
            <defs>
              <pattern id="grid" :width="gridSize" :height="gridSize" patternUnits="userSpaceOnUse">
                <path :d="`M ${gridSize} 0 L 0 0 0 ${gridSize}`" fill="none" stroke="#e0e0e0" stroke-width="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)"/>
            
            <!-- 桩基点 -->
            <g v-for="point in pilePoints" :key="point.id" :transform="`translate(${point.x}, ${point.y})`">
              <circle
                :r="pointSize"
                :fill="getStatusColor(point.status)"
                :stroke="selectedPoint?.id === point.id ? '#FFC107' : '#ffffff'"
                :stroke-width="selectedPoint?.id === point.id ? 3 : 2"
                class="pile-point"
                @click="selectPoint(point)"
                @mousedown.stop
                @contextmenu.prevent.stop="handlePointRightClick($event, point)"
              />
              <text
                :x="0"
                :y="pointSize + 14"
                text-anchor="middle"
                font-size="11"
                fill="#1E2832"
                class="point-label"
              >{{ point.label }}</text>
            </g>
          </svg>
        </div>
        <!-- 右键菜单 -->
        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        >
          <div class="menu-item" @click="editPoint(contextMenu.point)">
            <el-icon><Edit /></el-icon>编辑
          </div>
          <div class="menu-item" @click="markPoint(contextMenu.point)">
            <el-icon><Check /></el-icon>标记
          </div>
          <div class="menu-item" @click="viewPointDetail(contextMenu.point)">
            <el-icon><Document /></el-icon>查看详情
          </div>
          <div class="menu-item" @click="deletePoint(contextMenu.point)">
            <el-icon><Delete /></el-icon>删除
          </div>
        </div>
      </div>

      <!-- 右侧侧边栏 -->
      <div class="sidebar">
        <!-- 状态标签云 -->
        <div class="status-cloud">
          <h4>状态标签云</h4>
          <div class="tags">
            <el-tag
              v-for="status in statusTags"
              :key="status.value"
              :type="status.type"
              :color="status.color"
              effect="plain"
              class="status-tag"
            >
              {{ status.label }} ({{ status.count }})
            </el-tag>
          </div>
        </div>

        <!-- 拓扑信息 -->
        <div class="topology-info">
          <h4>拓扑信息</h4>
          <div class="info-item">
            <span class="info-label">总桩基数</span>
            <span class="info-value">{{ pilePoints.length }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">已完成</span>
            <span class="info-value success">{{ completedCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">进行中</span>
            <span class="info-value warning">{{ inProgressCount }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">待检测</span>
            <span class="info-value danger">{{ pendingCount }}</span>
          </div>
        </div>

        <!-- 选中点信息 -->
        <div v-if="selectedPoint" class="selected-point-info">
          <h4>选中桩基信息</h4>
          <div class="info-item">
            <span class="info-label">桩号</span>
            <span class="info-value">{{ selectedPoint.label }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">坐标</span>
            <span class="info-value">({{ selectedPoint.x }}, {{ selectedPoint.y }})</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <el-tag :type="getStatusTagType(selectedPoint.status)" size="small">
              {{ getStatusLabel(selectedPoint.status) }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">检测时间</span>
            <span class="info-value">{{ selectedPoint.detectionTime || '未检测' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑/查看弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'view' ? '查看桩基详情' : dialogMode === 'edit' ? '编辑桩基信息' : '新增桩基'"
      :width="dialogMode === 'view' ? '500px' : '600px'"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="桩号" prop="label">
          <el-input
            v-model="formData.label"
            :disabled="dialogMode === 'view'"
            placeholder="请输入桩号"
          />
        </el-form-item>
        <el-form-item label="X坐标" prop="x">
          <el-input-number
            v-model="formData.x"
            :disabled="dialogMode === 'view'"
            :min="0"
            :max="1000"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="Y坐标" prop="y">
          <el-input-number
            v-model="formData.y"
            :disabled="dialogMode === 'view'"
            :min="0"
            :max="1000"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="当前状态" prop="status">
          <el-select
            v-model="formData.status"
            :disabled="dialogMode === 'view'"
            placeholder="请选择状态"
          >
            <el-option label="已完成" value="completed" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="待检测" value="pending" />
            <el-option label="异常" value="abnormal" />
          </el-select>
        </el-form-item>
        <el-form-item label="检测时间" prop="detectionTime">
          <el-date-picker
            v-model="formData.detectionTime"
            :disabled="dialogMode === 'view'"
            type="datetime"
            placeholder="选择检测时间"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            :disabled="dialogMode === 'view'"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          @click="submitForm"
          :loading="submitLoading"
        >
          {{ dialogMode === 'edit' ? '保存' : '提交' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Edit, Delete, Plus, Search, Refresh, Check, Close, Warning,
  InfoFilled, CircleCheck, CircleClose, ArrowDown, ArrowUp,
  ArrowLeft, ArrowRight, Back, Document, Folder, Files, Tickets,
  Setting, Tools, Lock, Unlock, Filter, User, Avatar, UserFilled,
  ZoomIn, ZoomOut, FullScreen
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 状态定义
const showTemplateSelect = ref(true)
const templateSearch = ref('')
const canvasLoading = ref(false)
const canvasWidth = ref(800)
const canvasHeight = ref(600)
const gridSize = ref(40)
const pointSize = ref(12)
const scale = ref(1)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const canvasOffset = ref({ x: 0, y: 0 })
const selectedPoint = ref(null)
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  point: null
})
const dialogVisible = ref(false)
const dialogMode = ref('edit')
const submitLoading = ref(false)
const canvasRef = ref(null)
const canvasBodyRef = ref(null)

// 模板数据
const templates = ref([
  { id: 1, name: '长江大桥桩基检测', description: '2024年3月 - 45个桩基' },
  { id: 2, name: '跨海大桥桩基检测', description: '2024年1月 - 32个桩基' },
  { id: 3, name: '城市高架桩基检测', description: '2023年12月 - 28个桩基' }
])

const filteredTemplates = computed(() => {
  if (!templateSearch.value) return templates.value
  return templates.value.filter(t =>
    t.name.includes(templateSearch.value) || t.description.includes(templateSearch.value)
  )
})

// 桩基点数据
const pilePoints = ref([
  { id: 1, label: 'Z1-01', x: 100, y: 150, status: 'completed', detectionTime: '2024-03-15 10:30', remark: '检测合格' },
  { id: 2, label: 'Z1-02', x: 250, y: 200, status: 'in_progress', detectionTime: null, remark: '正在检测中' },
  { id: 3, label: 'Z1-03', x: 400, y: 180, status: 'pending', detectionTime: null, remark: '待安排检测' },
  { id: 4, label: 'Z1-04', x: 550, y: 250, status: 'completed', detectionTime: '2024-03-14 14:20', remark: '检测合格' },
  { id: 5, label: 'Z1-05', x: 150, y: 350, status: 'abnormal', detectionTime: '2024-03-13 09:15', remark: '需复检' },
  { id: 6, label: 'Z1-06', x: 300, y: 400, status: 'completed', detectionTime: '2024-03-12 16:00', remark: '检测合格' },
  { id: 7, label: 'Z1-07', x: 450, y: 380, status: 'in_progress', detectionTime: null, remark: '正在检测中' },
  { id: 8, label: 'Z1-08', x: 600, y: 450, status: 'pending', detectionTime: null, remark: '待安排检测' },
  { id: 9, label: 'Z1-09', x: 200, y: 500, status: 'completed', detectionTime: '2024-03-11 11:45', remark: '检测合格' },
  { id: 10, label: 'Z1-10', x: 350, y: 520, status: 'completed', detectionTime: '2024-03-10 08:30', remark: '检测合格' }
])

// 状态标签
const statusTags = computed(() => [
  { label: '已完成', value: 'completed', color: '#67C23A', count: completedCount.value },
  { label: '进行中', value: 'in_progress', color: '#E6A23C', count: inProgressCount.value },
  { label: '待检测', value: 'pending', color: '#909399', count: pendingCount.value },
  { label: '异常', value: 'abnormal', color: '#F56C6C', count: abnormalCount.value }
])

// 计算属性
const completedCount = computed(() => pilePoints.value.filter(p => p.status === 'completed').length)
const inProgressCount = computed(() => pilePoints.value.filter(p => p.status === 'in_progress').length)
const pendingCount = computed(() => pilePoints.value.filter(p => p.status === 'pending').length)
const abnormalCount = computed(() => pilePoints.value.filter(p => p.status === 'abnormal').length)

// 表单数据
const formData = reactive({
  label: '',
  x: 100,
  y: 100,
  status: 'pending',
  detectionTime: null,
  remark: ''
})

const formRules = {
  label: [{ required: true, message: '请输入桩号', trigger: 'blur' }],
  x: [{ required: true, message: '请输入X坐标', trigger: 'blur' }],
  y: [{ required: true, message: '请输入Y坐标', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 方法
function selectTemplate(template) {
  showTemplateSelect.value = false
  ElMessage.success(`已选择模板: ${template.name}`)
}

function refreshCanvas() {
  canvasLoading.value = true
  setTimeout(() => {
    canvasLoading.value = false
    ElMessage.success('画布已刷新')
  }, 800)
}

function zoomIn() {
  scale.value = Math.min(scale.value + 0.1, 3)
}

function zoomOut() {
  scale.value = Math.max(scale.value - 0.1, 0.5)
}

function fitView() {
  scale.value = 1
  canvasOffset.value = { x: 0, y: 0 }
}

function startDrag(e) {
  if (e.target === canvasBodyRef.value || e.target.tagName === 'svg' || e.target.tagName === 'rect') {
    isDragging.value = true
    dragStart.value = { x: e.clientX - canvasOffset.value.x, y: e.clientY - canvasOffset.value.y }
  }
}

function onDrag(e) {
  if (isDragging.value) {
    canvasOffset.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y
    }
  }
}

function endDrag() {
  isDragging.value = false
}

function selectPoint(point) {
  selectedPoint.value = point
  contextMenu.visible = false
}

function handlePointRightClick(event, point) {
  selectedPoint.value = point
  contextMenu.visible = true
  contextMenu.x = event.clientX
  contextMenu.y = event.clientY
  contextMenu.point = point
}

function handleCanvasRightClick(event) {
  contextMenu.visible = false
}

function getStatusColor(status) {
  const colors = {
    completed: '#67C23A',
    in_progress: '#E6A23C',
    pending: '#909399',
    abnormal: '#F56C6C'
  }
  return colors[status] || '#909399'
}

function getStatusTagType(status) {
  const types = {
    completed: 'success',
    in_progress: 'warning',
    pending: 'info',
    abnormal: 'danger'
  }
  return types[status] || 'info'
}

function getStatusLabel(status) {
  const labels = {
    completed: '已完成',
    in_progress: '进行中',
    pending: '待检测',
    abnormal: '异常'
  }
  return labels[status] || '未知'
}

function editPoint(point) {
  contextMenu.visible = false
  dialogMode.value = 'edit'
  Object.assign(formData, {
    label: point.label,
    x: point.x,
    y: point.y,
    status: point.status,
    detectionTime: point.detectionTime ? new Date(point.detectionTime) : null,
    remark: point.remark || ''
  })
  dialogVisible.value = true
}

function markPoint(point) {
  contextMenu.visible = false
  const statusOrder = ['pending', 'in_progress', 'completed', 'abnormal']
  const currentIndex = statusOrder.indexOf(point.status)
  const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
  point.status = nextStatus
  ElMessage.success(`桩基 ${point.label} 状态已更新为: ${getStatusLabel(nextStatus)}`)
}

function viewPointDetail(point) {
  contextMenu.visible = false
  dialogMode.value = 'view'
  Object.assign(formData, {
    label: point.label,
    x: point.x,
    y: point.y,
    status: point.status,
    detectionTime: point.detectionTime ? new Date(point.detectionTime) : null,
    remark: point.remark || ''
  })
  dialogVisible.value = true
}

function deletePoint(point) {
  contextMenu.visible = false
  ElMessageBox.confirm(`确定要删除桩基 ${point.label} 吗？`, '确认删除', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = pilePoints.value.findIndex(p => p.id === point.id)
    if (index > -1) {
      pilePoints.value.splice(index, 1)
      if (selectedPoint.value?.id === point.id) {
        selectedPoint.value = null
      }
      ElMessage.success(`桩基 ${point.label} 已删除`)
    }
  }).catch(() => {})
}

function submitForm() {
  // 手动校验
  const errors = []
  if (!formData.label) errors.push('桩号不能为空')
  if (!formData.x && formData.x !== 0) errors.push('X坐标不能为空')
  if (!formData.y && formData.y !== 0) errors.push('Y坐标不能为空')
  if (!formData.status) errors.push('请选择状态')

  if (errors.length > 0) {
    ElMessage.warning(errors.join('；'))
    return
  }

  submitLoading.value = true
  setTimeout(() => {
    if (dialogMode.value === 'edit' && selectedPoint.value) {
      const point = pilePoints.value.find(p => p.id === selectedPoint.value.id)
      if (point) {
        point.label = formData.label
        point.x = formData.x
        point.y = formData.y
        point.status = formData.status
        point.detectionTime = formData.detectionTime ? formData.detectionTime.toISOString().slice(0, 16).replace('T', ' ') : null
        point.remark = formData.remark
      }
      ElMessage.success('桩基信息已更新')
    } else if (dialogMode.value === 'add') {
      const newPoint = {
        id: pilePoints.value.length + 1,
        label: formData.label,
        x: formData.x,
        y: formData.y,
        status: formData.status,
        detectionTime: formData.detectionTime ? formData.detectionTime.toISOString().slice(0, 16).replace('T', ' ') : null,
        remark: formData.remark
      }
      pilePoints.value.push(newPoint)
      ElMessage.success('桩基已添加')
    }
    submitLoading.value = false
    dialogVisible.value = false
  }, 500)
}

// 点击其他区域关闭右键菜单
document.addEventListener('click', () => {
  contextMenu.visible = false
})

onMounted(() => {
  // 初始化画布尺寸
  if (canvasRef.value) {
    canvasWidth.value = canvasRef.value.clientWidth - 20
    canvasHeight.value = canvasRef.value.clientHeight - 60
  }
})
</script>

<style lang='scss' scoped>
@use './canvas.scss';
</style>
