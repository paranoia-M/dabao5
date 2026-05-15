<template>
  <div class="page-equipment_profile">
    <div v-if="equipment" class="profile-layout">
      <!-- 主区域：设备信息 + 时间线 -->
      <div class="profile-main">
        <el-card class="info-card" shadow="never">
          <div class="info-header">
            <div class="info-header-left">
              <h2 class="device-name">{{ equipment.name }}</h2>
              <el-tag :type="statusTagType" size="large">{{ equipment.status }}</el-tag>
            </div>
            <div class="info-header-actions">
              <el-button type="primary" plain @click="handleEdit">
                <el-icon><Edit /></el-icon> 编辑
              </el-button>
              <el-button type="danger" plain @click="handleDelete">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
              <el-button type="success" plain @click="handleCreateTask">
                <el-icon><Plus /></el-icon> 发起隐患排查
              </el-button>
              <el-button type="warning" plain @click="handleExport">
                <el-icon><Download /></el-icon> 导出档案
              </el-button>
            </div>
          </div>
          <el-descriptions :column="2" border class="info-descriptions">
            <el-descriptions-item label="设备编号">{{ equipment.registerCode }}</el-descriptions-item>
            <el-descriptions-item label="设备类型">{{ equipment.equipmentType }}</el-descriptions-item>
            <el-descriptions-item label="制造单位">{{ equipment.manufacturer }}</el-descriptions-item>
            <el-descriptions-item label="安装位置">{{ equipment.location }}</el-descriptions-item>
            <el-descriptions-item label="安装日期">{{ equipment.installDate }}</el-descriptions-item>
            <el-descriptions-item label="上次检验日期">{{ equipment.lastInspectDate }}</el-descriptions-item>
            <el-descriptions-item label="下次检验日期">
              <span :class="inspectUrgencyClass">{{ equipment.nextInspectDate }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 设备时间线（招牌积木） -->
        <div class="timeline-section">
          <h3 class="section-title">设备时间线</h3>
          <div class="timeline-svg-wrapper">
            <svg
              :viewBox="`0 0 480 ${svgHeight}`"
              width="100%"
              height="auto"
              style="overflow: visible; display: block;"
            >
              <line
                x1="64" y1="30"
                :x2="64" :y2="svgHeight - 30"
                stroke="#ddd"
                stroke-width="2"
                stroke-dasharray="4,4"
              />
              <g v-for="(evt, idx) in timelineEvents" :key="idx">
                <circle
                  :cx="64"
                  :cy="calcY(idx)"
                  :r="7"
                  :fill="eventColor(evt)"
                  stroke="#fff"
                  stroke-width="2"
                  style="cursor: pointer;"
                  @click="showTimelineEvent(evt)"
                />
                <text
                  :x="72"
                  :y="calcY(idx) + 4"
                  font-size="12"
                  fill="#374151"
                  dominant-baseline="middle"
                >{{ evt.date }} — {{ evt.label }}</text>
              </g>
            </svg>
          </div>
        </div>
      </div>

      <!-- 侧边栏：操作入口 + 隐患排查记录 -->
      <div class="profile-sidebar">
        <el-card class="hazard-card" shadow="never">
          <template #header>
            <span class="section-title">隐患排查记录</span>
          </template>
          <div class="filter-bar">
            <el-input
              v-model="keyword"
              placeholder="搜索隐患描述"
              clearable
              size="small"
              @input="onFilterChange"
            />
            <el-select
              v-model="hazardStatus"
              placeholder="隐患状态"
              clearable
              size="small"
              @change="onFilterChange"
            >
              <el-option label="待整改" value="待整改" />
              <el-option label="整改中" value="整改中" />
              <el-option label="待复查" value="待复查" />
              <el-option label="已完成" value="已完成" />
              <el-option label="关闭" value="关闭" />
            </el-select>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="检查开始"
              end-placeholder="检查结束"
              size="small"
              value-format="YYYY-MM-DD"
              @change="onFilterChange"
            />
          </div>
          <el-table
            :data="pagedHazards"
            stripe
            highlight-current-row
            @row-click="showHazardDetail"
            size="small"
            style="width: 100%;"
            max-height="360"
          >
            <el-table-column prop="discoveredDate" label="日期" width="100" />
            <el-table-column prop="hazardType" label="类型" width="80" />
            <el-table-column prop="severity" label="等级" width="60" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="hazardStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="60" fixed="right">
              <template #default="{ row }">
                <el-button text size="small" @click.stop="showHazardDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="filteredHazards.length > 10"
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredHazards.length"
            layout="total, prev, pager, next"
            small
            class="pagination"
          />
        </el-card>
      </div>
    </div>
    <el-empty v-else-if="!deviceId" description="请先选择设备">
      <el-button type="primary" @click="router.push('/equipment-ledger')">前往设备台账</el-button>
    </el-empty>
    <el-empty v-else description="设备不存在或已删除" />

    <!-- 编辑设备弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑设备" width="640px" @open="initEditForm">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="120px">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="设备编号" prop="registerCode">
          <el-input v-model="editForm.registerCode" />
        </el-form-item>
        <el-form-item label="设备型号" prop="model">
          <el-input v-model="editForm.model" />
        </el-form-item>
        <el-form-item label="制造单位" prop="manufacturer">
          <el-input v-model="editForm.manufacturer" />
        </el-form-item>
        <el-form-item label="安装位置" prop="location">
          <el-input v-model="editForm.location" :disabled="hasOpenHazards" />
        </el-form-item>
        <el-form-item label="使用状态" prop="status">
          <el-select v-model="editForm.status" :disabled="hasOpenHazards">
            <el-option label="正常" value="正常" />
            <el-option label="待检验" value="待检验" />
            <el-option label="超期未检" value="超期未检" />
            <el-option label="停用" value="停用" />
            <el-option label="报废" value="报废" />
          </el-select>
        </el-form-item>
        <el-form-item label="下次检验日期" prop="nextInspectDate">
          <el-date-picker
            v-model="editForm.nextInspectDate"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            :disabled="hasOpenHazards"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">确认更新</el-button>
      </template>
    </el-dialog>

    <!-- 隐患详情弹窗 -->
    <el-dialog v-model="hazardDetailVisible" title="隐患详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="隐患描述">{{ hazardDetail.description }}</el-descriptions-item>
        <el-descriptions-item label="隐患等级">{{ hazardDetail.severity }}</el-descriptions-item>
        <el-descriptions-item label="检查人">{{ hazardDetail.assignedTo }}</el-descriptions-item>
        <el-descriptions-item label="检查日期">{{ hazardDetail.discoveredDate }}</el-descriptions-item>
        <el-descriptions-item label="整改期限">{{ hazardDetail.rectificationDeadline }}</el-descriptions-item>
        <el-descriptions-item label="整改状态">
          <el-tag :type="rectStatusTag(hazardDetail.status)">{{ hazardDetail.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="照片展示区">
          <div v-if="hazardVideoEvidence.length > 0" class="photo-grid">
            <div v-for="(item, idx) in hazardVideoEvidence" :key="idx" class="photo-item">
              <img :src="item" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;" />
            </div>
          </div>
          <span v-else>暂无照片</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="hazardDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 时间线事件详情弹窗 -->
    <el-dialog v-model="timelineDialogVisible" title="事件详情" width="480px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="事件类型">{{ timelineEvent.label }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ timelineEvent.date }}</el-descriptions-item>
        <el-descriptions-item label="说明">{{ timelineEvent.desc }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="timelineDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Plus, Download } from '@element-plus/icons-vue'
import { useEquipmentStore } from '@/stores/equipment'
import { useHazardRecordStore } from '@/stores/hazardRecord'
import { useReportStore } from '@/stores/report'

const route = useRoute()
const router = useRouter()

const equipmentStore = useEquipmentStore()
const hazardRecordStore = useHazardRecordStore()
const reportStore = useReportStore()

// 当前设备ID
const deviceId = route.query?.id || route.params?.id || ''
const equipment = computed(() => {
  if (!deviceId) return null
  return equipmentStore.equipmentList.find(item => item.id === deviceId) || null
})

// 设备状态显示的tag类型
const statusTagType = computed(() => {
  const map = { '正常': 'success', '待检验': 'warning', '超期未检': 'danger', '停用': 'info', '报废': 'info' }
  return map[equipment.value?.status] || 'info'
})

// 下次检验日期紧迫样式
const inspectUrgencyClass = computed(() => {
  if (!equipment.value?.nextInspectDate) return ''
  const diff = new Date(equipment.value.nextInspectDate) - Date.now()
  return diff < 30 * 24 * 60 * 60 * 1000 ? 'urgent' : ''
})

// ===== 隐患排查记录 =====
const keyword = ref('')
const hazardStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = 10

const allHazards = computed(() => {
  if (!equipment.value) return []
  return hazardRecordStore.hazardRecordList.filter(h => h.equipmentId === equipment.value.id)
})

const filteredHazards = computed(() => {
  return allHazards.value.filter(h => {
    if (keyword.value && !h.description.includes(keyword.value)) return false
    if (hazardStatus.value && h.status !== hazardStatus.value) return false
    if (dateRange.value && dateRange.value.length === 2) {
      const d = new Date(h.discoveredDate)
      const start = new Date(dateRange.value[0])
      const end = new Date(dateRange.value[1])
      if (d < start || d > end) return false
    }
    return true
  })
})

const pagedHazards = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredHazards.value.slice(start, start + pageSize)
})

function onFilterChange() {
  currentPage.value = 1
}

// 隐患状态tag
function hazardStatusTag(status) {
  const map = { '待整改': 'danger', '整改中': 'warning', '待复查': 'info', '已完成': 'success', '关闭': 'info' }
  return map[status] || 'info'
}

// ===== 隐患详情弹窗 =====
const hazardDetailVisible = ref(false)
const hazardDetail = ref({})
const hazardVideoEvidence = ref([])

function showHazardDetail(row) {
  hazardDetail.value = row
  // 查找该隐患对应的整改证据（假设从rectificationStore获取）
  try {
    const rect = rectificationList.value.find(r => r.hazardId === row.id)
    if (rect && rect.evidence && rect.evidence.length > 0) {
      // evidence是字符串数组，我们拿它当作文件名，假装构造图片URL（实际项目中会是后端地址）
      hazardVideoEvidence.value = rect.evidence.map(() => 'https://via.placeholder.com/80?text=photo')
    } else {
      hazardVideoEvidence.value = []
    }
  } catch (e) {
    hazardVideoEvidence.value = []
  }
  hazardDetailVisible.value = true
}
import { useRectificationStore } from '@/stores/rectification'
const rectificationStore = useRectificationStore()
const rectificationList = computed(() => rectificationStore.rectificationList)
function rectStatusTag(status) {
  const map = { '待整改': 'danger', '整改中': 'warning', '已完成': 'success', '关闭': 'info' }
  return map[status] || 'info'
}

// ===== 编辑设备弹窗 =====
const editDialogVisible = ref(false)
const editFormRef = ref(null)

function handleEdit() {
  editDialogVisible.value = true
}

const editForm = ref({
  name: '',
  registerCode: '',
  model: '',
  manufacturer: '',
  location: '',
  status: '',
  nextInspectDate: ''
})
const editRules = {
  name: [{ required: true, message: '设备名称必填', trigger: 'blur' }],
  registerCode: [{ required: true, message: '设备编号必填', trigger: 'blur' }],
  model: [{ required: true, message: '设备型号不能为空', trigger: 'blur' }],
  manufacturer: [{ required: true, message: '制造单位不能为空', trigger: 'blur' }]
}

// 是否有未闭环隐患
const hasOpenHazards = computed(() => {
  if (!equipment.value) return false
  return allHazards.value.some(h => h.status === '待整改' || h.status === '整改中')
})

function initEditForm() {
  if (!equipment.value) return
  editForm.value = {
    name: equipment.value.name,
    registerCode: equipment.value.registerCode,
    model: equipment.value.model || '',
    manufacturer: equipment.value.manufacturer,
    location: equipment.value.location,
    status: equipment.value.status,
    nextInspectDate: equipment.value.nextInspectDate
  }
}

function submitEdit() {
  editFormRef.value.validate((valid) => {
    if (!valid) return
    // 模拟后端唯一性校验：设备编号不能与当前设备之外的其他设备重复
    const dup = equipmentStore.equipmentList.find(item => item.registerCode === editForm.value.registerCode && item.id !== deviceId)
    if (dup) {
      ElMessage.error('设备编号已存在，请重新输入')
      return
    }
    // 尝试更新
    equipmentStore.update(deviceId, {
      name: editForm.value.name,
      registerCode: editForm.value.registerCode,
      model: editForm.value.model, // 注意store没有model字段，但在种子中也没提供，我们假设可以扩展但不要用未定义字段。我们只更新store中已有的字段
      manufacturer: editForm.value.manufacturer,
      location: editForm.value.location,
      status: editForm.value.status,
      nextInspectDate: editForm.value.nextInspectDate
    })
    ElMessage.success('设备信息已更新')
    editDialogVisible.value = false
  })
}

// ===== 删除设备 =====
function handleDelete() {
  // 后端校验是否有未闭环隐患
  if (hasOpenHazards.value) {
    ElMessage.error('该设备存在未闭环隐患，请先处理')
    return
  }
  ElMessageBox.confirm(
    `确定删除设备 [${equipment.value?.name}] ？删除后不可恢复`,
    '警告',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    equipmentStore.remove(deviceId)
    ElMessage.success('设备已删除')
    router.push('/equipment-list')
  }).catch(() => {})
}

// ===== 发起隐患排查 =====
function handleCreateTask() {
  if (!equipment.value) return
  router.push(`/inspection-task?equipId=${deviceId}`)
}

// ===== 导出设备档案 =====
function handleExport() {
  if (!equipment.value) return
  // 模拟生成报告并添加到reportStore
  const reportItem = {
    id: 'report_' + Date.now(),
    title: `${equipment.value.name}设备档案`,
    reportType: '隐患排查报告',
    generationMethod: '手动',
    status: '草稿',
    relatedEntityType: '设备',
    relatedEntityId: deviceId,
    content: {
      summary: `导出设备 ${equipment.value.name} 的档案，包含隐患记录 ${allHazards.value.length} 条。`,
      findings: allHazards.value.map(h => h.description),
      score: 0
    },
    createTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    auditBy: '',
    auditTime: ''
  }
  reportStore.add(reportItem)
  ElMessage.success('档案已生成，可前往报告模块查看')
  // 模拟下载文件
  const blob = new Blob([JSON.stringify(reportItem, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${equipment.value.name}_设备档案.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ===== 设备时间线 =====
const timelineEvents = computed(() => {
  if (!equipment.value) return []
  const events = []
  events.push({
    date: equipment.value.installDate,
    label: '设备安装',
    desc: `${equipment.value.name} 安装于 ${equipment.value.location}`,
    type: 'install'
  })
  events.push({
    date: equipment.value.lastInspectDate,
    label: '上次检验',
    desc: `检验日期 ${equipment.value.lastInspectDate}`,
    type: 'inspect'
  })
  events.push({
    date: equipment.value.nextInspectDate,
    label: '下次检验',
    desc: `下次检验日期 ${equipment.value.nextInspectDate}`,
    type: 'inspect'
  })
  allHazards.value.forEach(h => {
    events.push({
      date: h.discoveredDate,
      label: '隐患发现',
      desc: `隐患描述：${h.description}，等级${h.severity}`,
      type: 'hazard'
    })
  })
  events.sort((a, b) => new Date(a.date) - new Date(b.date))
  return events
})

const svgHeight = computed(() => Math.max(150, timelineEvents.value.length * 80 + 60))

function calcY(index) {
  return 30 + index * 80
}

function eventColor(evt) {
  const map = { install: '#059669', inspect: '#2563EB', hazard: '#DC2626' }
  return map[evt.type] || '#999'
}

const timelineDialogVisible = ref(false)
const timelineEvent = ref({})

function showTimelineEvent(evt) {
  timelineEvent.value = evt
  timelineDialogVisible.value = true
}
</script>

<style scoped lang="scss">
@use './EquipmentProfile.scss' as *;
</style>