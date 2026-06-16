<template>
  <div class="page-inmate-movement">
    <!-- 顶部：标题 + KPI + 操作按钮 -->
    <div class="im-header">
      <div class="im-header-left">
        <h2 class="im-title">人员出入登记</h2>
        <div class="im-kpi-row">
          <div class="kpi-card status-register">
            <span class="kpi-label">登记</span>
            <span class="kpi-value">{{ statusCounts.register }}</span>
          </div>
          <div class="kpi-card status-confirm">
            <span class="kpi-label">已确认</span>
            <span class="kpi-value">{{ statusCounts.confirm }}</span>
          </div>
          <div class="kpi-card status-cancel">
            <span class="kpi-label">已取消</span>
            <span class="kpi-value">{{ statusCounts.cancel }}</span>
          </div>
        </div>
      </div>
      <div class="im-header-right">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          新增出入登记
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="im-filter">
      <el-input
        v-model="keyword"
        placeholder="搜索姓名/编号"
        clearable
        class="filter-input"
      />
      <el-select v-model="filterStatus" placeholder="状态" clearable class="filter-select">
        <el-option label="全部" value="" />
        <el-option label="登记" value="登记" />
        <el-option label="确认" value="确认" />
        <el-option label="已取消" value="已取消" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        class="filter-date"
        value-format="YYYY-MM-DD HH:mm:ss"
        @change="onDateChange"
      />
    </div>

    <!-- 主舞台：人员出入滚动条 + 右侧统计 -->
    <div class="im-main">
      <div class="im-main-left">
        <div class="im-scroll-section">
          <div class="section-title">
            <span class="title-dot" />
            <span>人员出入手牌</span>
            <el-tag size="small" type="info">{{ filteredList.length }}条</el-tag>
          </div>
          <el-scrollbar class="scrollbar-horizontal" direction="horizontal">
            <div class="scroll-track">
              <div
                v-for="item in filteredList"
                :key="item.id"
                class="movement-card"
                @click="openDetailDrawer(item)"
              >
                <div class="card-avatar" :style="{ backgroundColor: avatarColor(item.inmateInfo?.name || '?') }">
                  {{ (item.inmateInfo?.name || '?')[0] }}
                </div>
                <div class="card-info">
                  <div class="card-name">{{ item.inmateInfo?.name || '未知' }}</div>
                  <div class="card-direction" :class="{ leave: item.direction === '离开', back: item.direction === '返回' }">
                    <el-icon v-if="item.direction === '离开'" class="dir-icon"><TopRight /></el-icon>
                    <el-icon v-else class="dir-icon"><BottomLeft /></el-icon>
                    <span>{{ item.direction }}</span>
                  </div>
                  <div class="card-time">{{ item.recordTime }}</div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </div>

        <!-- 表格明细 -->
        <div class="im-table-section">
          <div class="section-title">
            <span class="title-dot" />
            <span>出入明细</span>
          </div>
          <el-table :data="filteredList" stripe style="width:100%" @row-click="openDetailDrawer">
            <el-table-column prop="inmateInfo.name" label="在押人员" min-width="100" />
            <el-table-column prop="inmateId" label="编号" min-width="120" />
            <el-table-column prop="movementType" label="出入类型" width="100" />
            <el-table-column prop="direction" label="方向" width="80">
              <template #default="{ row }">
                <el-tag :type="row.direction === '离开' ? 'warning' : 'success'" size="small">
                  {{ row.direction }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="recordTime" label="出入时间" width="160" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="openDetailDrawer(row)">详情</el-button>
                <el-button
                  v-if="row.status === '登记'"
                  link
                  type="primary"
                  size="small"
                  @click.stop="openEditDialog(row)"
                >编辑</el-button>
                <el-button
                  v-if="row.status === '登记'"
                  link
                  type="success"
                  size="small"
                  @click.stop="handleConfirm(row)"
                >确认</el-button>
                <el-button
                  v-if="row.status === '登记'"
                  link
                  type="danger"
                  size="small"
                  @click.stop="handleDelete(row)"
                >删除</el-button>
                <span v-else class="disabled-op">——</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- 右侧统计区 -->
      <div class="im-main-right">
        <div class="stat-section">
          <div class="section-title small">
            <span class="title-dot" />
            <span>近期进出统计</span>
          </div>
          <div class="stat-cards">
            <div class="stat-item">
              <div class="stat-label">今日</div>
              <div class="stat-value">{{ todayCount }}</div>
              <div class="stat-unit">次</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本周</div>
              <div class="stat-value">{{ weekCount }}</div>
              <div class="stat-unit">次</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">本月</div>
              <div class="stat-value">{{ monthCount }}</div>
              <div class="stat-unit">次</div>
            </div>
          </div>
        </div>
        <div class="status-bar-section">
          <div class="section-title small">
            <span class="title-dot" />
            <span>状态分布</span>
          </div>
          <div class="status-bar">
            <div
              v-for="s in statusList"
              :key="s.value"
              :class="['status-chip', { active: filterStatus === s.value }]"
              @click="filterStatus = s.value"
            >
              <span class="chip-label">{{ s.label }}</span>
              <span class="chip-count">{{ s.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑出入登记' : '新增出入登记'"
      width="min(600px, 92vw)"
      class="im-form-dialog"
      @closed="resetForm"
    >
      <el-form ref="formRef" :model="form" label-width="100px" :rules="formRules">
        <el-form-item label="在押人员" prop="inmateName">
          <el-autocomplete
            v-model="form.inmateName"
            :fetch-suggestions="inmateSearch"
            placeholder="请输入姓名搜索"
            @select="onInmateSelect"
            style="width:100%"
            :trigger-on-focus="false"
          />
        </el-form-item>
        <el-form-item label="在押人员编号">
          <el-input v-model="form.inmateId" disabled />
        </el-form-item>
        <el-form-item label="出入类型" prop="movementType">
          <el-select v-model="form.movementType" style="width:100%">
            <el-option v-for="t in ['提讯','就医','放风','劳动','会见','其他']" :key="t" :label="t" :value="t" />
          </el-select>
        </el-form-item>
        <el-form-item label="出入方向" prop="direction">
          <el-radio-group v-model="form.direction">
            <el-radio label="离开">出</el-radio>
            <el-radio label="返回">入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出入时间" prop="recordTime">
          <el-date-picker
            v-model="form.recordTime"
            type="datetime"
            placeholder="选择日期时间"
            style="width:100%"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="目的地">
          <el-input v-model="form.destination" placeholder="目的地/区域" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认{{ isEdit ? '修改' : '登记' }}</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      class="inmate-movement-detail-drawer"
      direction="rtl"
      size="min(760px, 92vw)"
      title="出入登记详情"
    >
      <template #default>
        <div class="detail-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">在押人员姓名</span>
              <span class="value">{{ currentDetail?.inmateInfo?.name || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">在押人员编号</span>
              <span class="value">{{ currentDetail?.inmateId || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">出入类型</span>
              <span class="value">{{ currentDetail?.movementType || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">出入方向</span>
              <span class="value">{{ currentDetail?.direction || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">出入时间</span>
              <span class="value">{{ currentDetail?.recordTime || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">目的地</span>
              <span class="value">{{ extraFieldsMap[currentDetail?.id]?.destination || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">登记人</span>
              <span class="value">{{ currentDetail?.operator || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">登记时间</span>
              <span class="value">{{ currentDetail?.recordTime || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="label">状态</span>
              <span class="value">
                <el-tag :type="statusTagType(currentDetail?.status)" size="small">{{ currentDetail?.status }}</el-tag>
              </span>
            </div>
            <div class="detail-item full">
              <span class="label">备注</span>
              <span class="value">{{ extraFieldsMap[currentDetail?.id]?.remark || '-' }}</span>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, reactive } from 'vue'
import { useInmateMovementStore } from '@/stores/inmateMovement'
import { useInmateStore } from '@/stores/inmate'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, TopRight, BottomLeft } from '@element-plus/icons-vue'

const movementStore = useInmateMovementStore()
const inmateStore = useInmateStore()

// 额外字段存储（目的地、备注）
const extraFieldsMap = ref({})

// 筛选状态
const keyword = ref('')
const filterStatus = ref('')
const dateRange = ref([])

const filteredList = computed(() => {
  let list = [...movementStore.movementList]

  // 关键词搜索（姓名或编号）
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(item => {
      const nameMatch = item.inmateInfo?.name?.toLowerCase().includes(kw)
      const idMatch = item.inmateId?.toLowerCase().includes(kw)
      return nameMatch || idMatch
    })
  }

  // 状态筛选
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }

  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime()
    list = list.filter(item => {
      const t = new Date(item.recordTime).getTime()
      return t >= start && t <= end
    })
  }

  // 按时间降序
  list.sort((a, b) => new Date(b.recordTime) - new Date(a.recordTime))

  // 关联inmate信息
  return list.map(item => ({
    ...item,
    inmateInfo: inmateStore.findById(item.inmateId) || null
  }))
})

// KPI统计
const statusCounts = computed(() => {
  const counts = { register: 0, confirm: 0, cancel: 0 }
  movementStore.movementList.forEach(item => {
    if (item.status === '登记') counts.register++
    else if (item.status === '确认') counts.confirm++
    else if (item.status === '已取消') counts.cancel++
  })
  return counts
})

// 近期统计
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return movementStore.movementList.filter(item => new Date(item.recordTime).toDateString() === today).length
})
const weekCount = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
  return movementStore.movementList.filter(item => {
    const t = new Date(item.recordTime)
    return t >= startOfWeek && t < endOfWeek
  }).length
})
const monthCount = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return movementStore.movementList.filter(item => {
    const t = new Date(item.recordTime)
    return t >= startOfMonth && t < endOfMonth
  }).length
})

// 状态分布
const statusList = computed(() => {
  const counts = {}
  movementStore.movementList.forEach(item => {
    counts[item.status] = (counts[item.status] || 0) + 1
  })
  return [
    { label: '全部', value: '', count: movementStore.movementList.length },
    { label: '登记', value: '登记', count: counts['登记'] || 0 },
    { label: '确认', value: '确认', count: counts['确认'] || 0 },
    { label: '已取消', value: '已取消', count: counts['已取消'] || 0 }
  ]
})

// 状态标签类型
function statusTagType(status) {
  const map = { '登记': 'warning', '确认': 'success', '已取消': 'info' }
  return map[status] || 'info'
}

// 头像颜色
function avatarColor(name) {
  const colors = ['#0284C7', '#0D9488', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#059669', '#B45309']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// 日期选择变化（不做特别处理，computed自动响应）
function onDateChange(val) {
  // 允许空
}

// 新增/编辑弹窗
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  inmateName: '',
  inmateId: '',
  movementType: '',
  direction: '',
  recordTime: '',
  destination: '',
  remark: ''
})

const formRules = {
  inmateName: [{ required: true, message: '请选择在押人员', trigger: 'blur' }],
  movementType: [{ required: true, message: '请选择出入类型', trigger: 'change' }],
  direction: [{ required: true, message: '请选择出入方向', trigger: 'change' }],
  recordTime: [{ required: true, message: '请选择出入时间', trigger: 'change' }]
}

function resetForm() {
  form.inmateName = ''
  form.inmateId = ''
  form.movementType = ''
  form.direction = ''
  form.recordTime = ''
  form.destination = ''
  form.remark = ''
  isEdit.value = false
  editingId.value = ''
  formRef.value?.resetFields()
}

function openAddDialog() {
  isEdit.value = false
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  const extra = extraFieldsMap.value[row.id] || {}
  form.inmateName = row.inmateInfo?.name || ''
  form.inmateId = row.inmateId
  form.movementType = row.movementType
  form.direction = row.direction
  form.recordTime = row.recordTime
  form.destination = extra.destination || ''
  form.remark = extra.remark || ''
  dialogVisible.value = true
}

// 在押人员自动补全
function inmateSearch(queryString, cb) {
  const results = inmateStore.inmateList
    .filter(inmate => inmate.name.includes(queryString))
    .map(inmate => ({ value: inmate.name, inmateId: inmate.id, ...inmate }))
  cb(results)
}

function onInmateSelect(item) {
  form.inmateName = item.value
  form.inmateId = item.inmateId
}

// 提交表单
function submitForm() {
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    // 时间异常检查
    const recordTime = new Date(form.recordTime)
    const now = new Date()
    const diffMs = Math.abs(recordTime - now)
    if (diffMs > 24 * 60 * 60 * 1000) {
      try {
        await ElMessageBox.confirm('登记时间超出当前时间24小时，存在异常，是否继续提交？', '时间异常', {
          confirmButtonText: '确认提交',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch {
        return
      }
    }
    submitting.value = true
    try {
      if (isEdit.value) {
        const patch = {
          inmateId: form.inmateId,
          movementType: form.movementType,
          direction: form.direction,
          recordTime: form.recordTime
        }
        movementStore.update(editingId.value, patch)
        // 保存额外字段
        extraFieldsMap.value[editingId.value] = {
          destination: form.destination,
          remark: form.remark
        }
        ElMessage.success('修改成功')
      } else {
        const newItem = {
          inmateId: form.inmateId,
          movementType: form.movementType,
          direction: form.direction,
          recordTime: form.recordTime,
          status: '登记',
          operator: '当前民警' // 简化
        }
        const added = movementStore.add(newItem)
        extraFieldsMap.value[added.id] = {
          destination: form.destination,
          remark: form.remark
        }
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
    } catch (e) {
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// 确认流转
function handleConfirm(row) {
  ElMessageBox.confirm(`确认将记录（${row.inmateInfo?.name || row.inmateId}）的状态转为"确认"？`, '状态确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    movementStore.update(row.id, { status: '确认' })
    ElMessage.success('已确认')
  }).catch(() => {})
}

// 删除
function handleDelete(row) {
  ElMessageBox.confirm(`确定删除该出入登记记录（${row.inmateInfo?.name || row.inmateId}）？删除后不可恢复。`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    movementStore.remove(row.id)
    delete extraFieldsMap.value[row.id]
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// 详情抽屉
const drawerVisible = ref(false)
const currentDetail = ref(null)

function openDetailDrawer(row) {
  currentDetail.value = row
  drawerVisible.value = true
}

// 导出
function handleExport() {
  const data = filteredList.value
  if (data.length === 0) {
    ElMessage.warning('当前筛选结果为空，无法导出')
    return
  }
  const header = ['在押人员姓名', '在押人员编号', '出入类型', '出入方向', '出入时间', '状态', '目的地', '备注']
  const rows = data.map(item => {
    const extra = extraFieldsMap.value[item.id] || {}
    return [
      item.inmateInfo?.name || '',
      item.inmateId,
      item.movementType,
      item.direction,
      item.recordTime,
      item.status,
      extra.destination || '',
      extra.remark || ''
    ]
  })
  let csv = '\uFEFF' + header.join(',') + '\n' // BOM for Excel
  rows.forEach(row => {
    csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n'
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `出入登记_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// 初始化时给已存在的记录填充默认extra字段（如果种子有的话）
// 种子没有destination和remark，所以不填充
</script>

<style scoped lang="scss">
@use './InmateMovement.scss' as *;
</style>