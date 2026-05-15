<template>
  <div class="page-hazard_record">
    <!-- 顶部筛选与操作区 -->
    <div class="top-bar">
      <div class="filter-area">
        <el-input v-model="keyword" placeholder="搜索隐患描述/设备名称" clearable style="width:220px" @input="currentPage=1" />
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width:130px" @change="currentPage=1">
          <el-option label="全部" value="" />
          <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
        </el-select>
        <el-select v-model="filterRiskLevel" placeholder="风险等级" clearable style="width:150px" @change="currentPage=1">
          <el-option label="全部" value="" />
          <el-option v-for="r in riskLevelOptions" :key="r" :label="r" :value="r" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="发现日期起" end-placeholder="发现日期止" value-format="YYYY-MM-DD" style="width:240px" @change="currentPage=1" />
      </div>
      <div class="action-area">
        <el-button type="primary" @click="openAddDialog">新增隐患</el-button>
        <el-button @click="exportCSV">导出Excel</el-button>
      </div>
    </div>

    <!-- 主内容：左地图 + 右列表 -->
    <div class="main-content">
      <div class="map-section">
        <div class="section-header">
          <span class="header-decor"></span>
          <span>隐患分布地图</span>
        </div>
        <div class="map-container">
          <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg" class="hazard-map-svg">
            <!-- 厂区背景 -->
            <rect x="0" y="0" width="800" height="500" fill="#f0f4f8" rx="8"/>
            <!-- 道路 -->
            <line x1="0" y1="250" x2="800" y2="250" stroke="#94a3b8" stroke-width="4" stroke-dasharray="10,5"/>
            <line x1="400" y1="0" x2="400" y2="500" stroke="#94a3b8" stroke-width="4" stroke-dasharray="10,5"/>
            <!-- 建筑物 -->
            <rect x="50" y="50" width="150" height="100" fill="#cbd5e1" rx="4" stroke="#64748b" stroke-width="1"/>
            <text x="125" y="100" text-anchor="middle" fill="#1e293b" font-size="12">锅炉房</text>
            <rect x="600" y="50" width="150" height="100" fill="#cbd5e1" rx="4" stroke="#64748b" stroke-width="1"/>
            <text x="675" y="100" text-anchor="middle" fill="#1e293b" font-size="12">仓库</text>
            <rect x="50" y="300" width="150" height="100" fill="#cbd5e1" rx="4" stroke="#64748b" stroke-width="1"/>
            <text x="125" y="350" text-anchor="middle" fill="#1e293b" font-size="12">维修车间</text>
            <rect x="600" y="300" width="150" height="100" fill="#cbd5e1" rx="4" stroke="#64748b" stroke-width="1"/>
            <text x="675" y="350" text-anchor="middle" fill="#1e293b" font-size="12">办公楼</text>
            <rect x="300" y="100" width="200" height="200" fill="#a5b4fc" rx="4" stroke="#6366f1" stroke-width="1" fill-opacity="0.3"/>
            <text x="400" y="200" text-anchor="middle" fill="#312e81" font-size="14" font-weight="bold">生产区</text>
            <!-- 设备标记点 -->
            <g v-for="item in mapPoints" :key="item.id" @click="showDeviceDetail(item.device)" style="cursor:pointer">
              <circle :cx="item.x" :cy="item.y" :r="Math.max(6, Math.min(item.radius, 18))" :fill="item.color" fill-opacity="0.8" stroke="#fff" stroke-width="2"/>
              <text :x="item.x" :y="item.y + 4" text-anchor="middle" fill="#fff" font-size="10" font-weight="bold">{{ item.label }}</text>
            </g>
          </svg>
          <div v-if="mapPoints.length === 0" class="map-empty">暂无设备数据</div>
        </div>
      </div>

      <div class="list-section">
        <div class="section-header">
          <span class="header-decor"></span>
          <span>隐患列表</span>
          <span class="count-badge">{{ filteredList.length }}条</span>
        </div>
        <el-table :data="paginatedList" stripe highlight-current-row class="hazard-table">
          <el-table-column type="index" label="#" width="40" />
          <el-table-column prop="hazardType" label="隐患类型" width="90" />
          <el-table-column label="设备名称" width="110">
            <template #default="{row}">{{ getEquipName(row.equipmentId) }}</template>
          </el-table-column>
          <el-table-column label="风险等级" width="120">
            <template #default="{row}">
              <el-tag :type="riskTagType(row.riskLevel)" size="small">{{ row.riskLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{row}">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="discoveredDate" label="发现日期" width="100" />
          <el-table-column prop="assignedTo" label="负责人" width="70" />
          <el-table-column label="操作" fixed="right" min-width="200">
            <template #default="{row}">
              <el-button link size="small" @click="openDetail(row)">详情</el-button>
              <el-button link size="small" :disabled="row.status!=='待整改'" @click="openEditDialog(row)">编辑</el-button>
              <el-button link size="small" :disabled="row.status!=='待整改'" @click="handleDelete(row)">删除</el-button>
              <el-dropdown v-if="row.status !== '已完成' && row.status !== '已关闭'" trigger="click" size="small" @command="(cmd)=>handleStatusChange(row,cmd)">
                <el-button link size="small">更多<el-icon><ArrowDown /></el-icon></el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="row.status==='待整改'" command="整改中">提交整改</el-dropdown-item>
                    <el-dropdown-item v-if="row.status==='整改中'" command="待复查">完成整改</el-dropdown-item>
                    <el-dropdown-item v-if="row.status==='待复查'" command="已完成">确认完成</el-dropdown-item>
                    <el-dropdown-item v-if="row.status==='待复查'" command="已关闭">关闭</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
        <el-pagination
          v-if="total > pageSize"
          background
          layout="prev, pager, next, sizes"
          :total="total"
          :page-size="pageSize"
          v-model:current-page="currentPage"
          @current-change="handlePageChange"
          style="margin-top:16px; justify-content:center"
        />
      </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit?'编辑隐患':'新增隐患'" :width="'min(680px,92vw)'" top="5vh" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px" :rules="formRules" status-icon>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联设备" prop="equipmentId">
              <el-select v-model="form.equipmentId" filterable placeholder="选择设备" style="width:100%">
                <el-option v-for="eq in equipOptions" :key="eq.id" :label="eq.name" :value="eq.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="隐患类型" prop="hazardType">
              <el-select v-model="form.hazardType" placeholder="选择类型" style="width:100%">
                <el-option label="一般隐患" value="一般隐患" />
                <el-option label="重大隐患" value="重大隐患" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="严重程度" prop="severity">
              <el-select v-model="form.severity" placeholder="选择严重程度" style="width:100%">
                <el-option label="轻微" value="轻微" />
                <el-option label="一般" value="一般" />
                <el-option label="严重" value="严重" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="可能性" prop="probability">
              <el-select v-model="form.probability" placeholder="选择可能性" style="width:100%">
                <el-option label="低" value="低" />
                <el-option label="中" value="中" />
                <el-option label="高" value="高" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="风险等级" prop="riskLevel">
          <el-select v-model="form.riskLevel" placeholder="选择风险等级" style="width:100%">
            <el-option label="蓝色(低风险)" value="蓝色(低风险)" />
            <el-option label="黄色(一般风险)" value="黄色(一般风险)" />
            <el-option label="橙色(较大风险)" value="橙色(较大风险)" />
            <el-option label="红色(重大风险)" value="红色(重大风险)" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发现日期" prop="discoveredDate">
              <el-date-picker v-model="form.discoveredDate" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="整改负责人" prop="assignedTo">
              <el-select v-model="form.assignedTo" filterable placeholder="选择负责人" style="width:100%" clearable>
                <el-option v-for="u in userOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="整改期限" prop="rectificationDeadline">
          <el-date-picker v-model="form.rectificationDeadline" type="date" placeholder="选择期限" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="隐患描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="详细描述隐患情况" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 状态变更弹窗（填写负责人和期限） -->
    <el-dialog v-model="statusDialogVisible" title="状态变更" width="420px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="statusFormRef" :model="statusForm" label-width="100px" :rules="statusFormRules">
        <el-form-item label="整改负责人" prop="assignedTo">
          <el-select v-model="statusForm.assignedTo" filterable placeholder="选择负责人" style="width:100%">
            <el-option v-for="u in userOptions" :key="u" :label="u" :value="u" />
          </el-select>
        </el-form-item>
        <el-form-item label="整改期限" prop="rectificationDeadline">
          <el-date-picker v-model="statusForm.rectificationDeadline" type="date" placeholder="选择期限" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmStatusChange">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉（从表格） -->
    <el-drawer v-model="drawerVisible" title="隐患详情" size="500px" :direction="'rtl'">
      <template v-if="detailItem">
        <div class="detail-grid">
          <div class="detail-item"><label>隐患ID</label><span>{{ detailItem.id }}</span></div>
          <div class="detail-item"><label>设备名称</label><span>{{ getEquipName(detailItem.equipmentId) }}</span></div>
          <div class="detail-item"><label>隐患类型</label><span>{{ detailItem.hazardType }}</span></div>
          <div class="detail-item"><label>风险等级</label><span><el-tag :type="riskTagType(detailItem.riskLevel)" size="small">{{ detailItem.riskLevel }}</el-tag></span></div>
          <div class="detail-item"><label>状态</label><span><el-tag :type="statusTagType(detailItem.status)" size="small">{{ detailItem.status }}</el-tag></span></div>
          <div class="detail-item"><label>严重程度</label><span>{{ detailItem.severity }}</span></div>
          <div class="detail-item"><label>可能性</label><span>{{ detailItem.probability }}</span></div>
          <div class="detail-item"><label>发现日期</label><span>{{ detailItem.discoveredDate }}</span></div>
          <div class="detail-item"><label>整改负责人</label><span>{{ detailItem.assignedTo || '未分配' }}</span></div>
          <div class="detail-item"><label>整改期限</label><span>{{ detailItem.rectificationDeadline || '未设置' }}</span></div>
          <div class="detail-item full-width"><label>隐患描述</label><span>{{ detailItem.description }}</span></div>
        </div>
        <div class="detail-section">
          <div class="section-header"><span class="header-decor"></span>关联隐患记录</div>
          <el-table :data="relatedHazards" stripe size="small">
            <el-table-column prop="hazardType" label="类型" width="80" />
            <el-table-column prop="riskLevel" label="风险等级" width="110" />
            <el-table-column prop="discoveredDate" label="发现日期" width="90" />
          </el-table>
        </div>
      </template>
    </el-drawer>

    <!-- 设备详情抽屉（从地图点击触发） -->
    <el-drawer v-model="deviceDrawerVisible" title="设备详情" size="450px">
      <template v-if="activeDevice">
        <div class="detail-grid">
          <div class="detail-item"><label>设备名称</label><span>{{ activeDevice.name }}</span></div>
          <div class="detail-item"><label>注册代码</label><span>{{ activeDevice.registerCode }}</span></div>
          <div class="detail-item"><label>设备类型</label><span>{{ activeDevice.equipmentType }}</span></div>
          <div class="detail-item"><label>状态</label><span>{{ activeDevice.status }}</span></div>
          <div class="detail-item"><label>安装日期</label><span>{{ activeDevice.installDate }}</span></div>
          <div class="detail-item"><label>最近检验</label><span>{{ activeDevice.lastInspectDate }}</span></div>
          <div class="detail-item"><label>下次检验</label><span>{{ activeDevice.nextInspectDate }}</span></div>
          <div class="detail-item"><label>位置</label><span>{{ activeDevice.location }}</span></div>
        </div>
        <div class="detail-section">
          <div class="section-header"><span class="header-decor"></span>关联隐患</div>
          <el-table :data="deviceHazards" stripe size="small">
            <el-table-column prop="hazardType" label="类型" width="80" />
            <el-table-column prop="riskLevel" label="风险等级" width="110" />
            <el-table-column prop="status" label="状态" width="70" />
          </el-table>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useHazardRecordStore } from '@/stores/hazardRecord'

const equipStore = useEquipmentStore()
const hazardStore = useHazardRecordStore()

// 用户选项（硬编码字典）
const userOptions = ['张伟','李娜','王芳','刘洋','陈静','赵鑫']
const statusOptions = [
  { label:'全部', value:'' },
  { label:'待整改', value:'待整改' },
  { label:'整改中', value:'整改中' },
  { label:'待复查', value:'待复查' },
  { label:'已完成', value:'已完成' },
  { label:'已关闭', value:'已关闭' }
]
const riskLevelOptions = ['蓝色(低风险)','黄色(一般风险)','橙色(较大风险)','红色(重大风险)']

// 筛选
const keyword = ref('')
const filterStatus = ref('')
const filterRiskLevel = ref('')
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

const filteredList = computed(() => {
  let list = hazardStore.hazardRecordList
  // 关键词
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(item => {
      const descMatch = item.description.toLowerCase().includes(kw)
      const eqName = getEquipName(item.equipmentId).toLowerCase().includes(kw)
      return descMatch || eqName
    })
  }
  // 状态
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }
  // 风险等级
  if (filterRiskLevel.value) {
    list = list.filter(item => item.riskLevel === filterRiskLevel.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    if (start && end) {
      list = list.filter(item => {
        const d = item.discoveredDate
        return d >= start && d <= end
      })
    }
  }
  // 默认倒序（发现日期降序）
  return list.slice().sort((a,b) => (b.discoveredDate || '').localeCompare(a.discoveredDate || ''))
})

const total = computed(() => filteredList.value.length)
const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

const handlePageChange = (page) => { currentPage.value = page }

// 工具：获取设备名称
function getEquipName(equipId) {
  const eq = equipStore.equipmentList.find(e => e.id === equipId)
  return eq ? eq.name : '未知设备'
}

// 风险等级颜色
function riskTagType(level) {
  if (!level) return 'info'
  if (level.includes('红色')) return 'danger'
  if (level.includes('橙色')) return 'warning'
  if (level.includes('黄色')) return 'warning'
  return 'info'
}
function statusTagType(status) {
  const map = { '待整改':'danger','整改中':'warning','待复查':'','已完成':'success','已关闭':'info' }
  return map[status] || 'info'
}

// 地图点计算
const mapPoints = computed(() => {
  if (!equipStore.equipmentList.length) return []
  const points = []
  const equipList = equipStore.equipmentList
  const hazardList = hazardStore.hazardRecordList
  equipList.forEach((eq, idx) => {
    // 坐标
    const x = 100 + (idx % 4) * 180
    const y = 50 + Math.floor(idx / 4) * 120
    // 找该设备的所有隐患，取最高风险
    let maxRisk = 0
    let riskColor = '#16a34a' // 绿色安全
    const related = hazardList.filter(h => h.equipmentId === eq.id)
    for (const h of related) {
      let lv = 0
      if (h.riskLevel.includes('红色')) lv = 4
      else if (h.riskLevel.includes('橙色')) lv = 3
      else if (h.riskLevel.includes('黄色')) lv = 2
      else if (h.riskLevel.includes('蓝色')) lv = 1
      if (lv > maxRisk) {
        maxRisk = lv
        if (lv === 4) riskColor = '#dc2626'
        else if (lv === 3) riskColor = '#ea580c'
        else if (lv === 2) riskColor = '#d97706'
        else if (lv === 1) riskColor = '#2563eb'
      }
    }
    const radius = 6 + maxRisk * 3
    points.push({
      id: eq.id,
      device: eq,
      x, y,
      radius: Number.isFinite(radius) ? radius : 6,
      color: riskColor,
      label: eq.name.length > 4 ? eq.name.substring(0,4) : eq.name
    })
  })
  return points
})

// 地图点击
const activeDevice = ref(null)
const deviceDrawerVisible = ref(false)
const deviceHazards = ref([])
function showDeviceDetail(device) {
  activeDevice.value = device
  deviceHazards.value = hazardStore.hazardRecordList.filter(h => h.equipmentId === device.id)
    .map(h => ({ hazardType: h.hazardType, riskLevel: h.riskLevel, status: h.status }))
  deviceDrawerVisible.value = true
}

// 表格详情抽屉
const drawerVisible = ref(false)
const detailItem = ref(null)
const relatedHazards = ref([])
function openDetail(row) {
  detailItem.value = row
  relatedHazards.value = [row] // 这里可以展示该隐患自身或其他关联，简单展示自身
  drawerVisible.value = true
}

// 新增/编辑
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref('')
const formRef = ref(null)
const submitting = ref(false)
const form = ref({
  equipmentId: '',
  hazardType: '',
  severity: '',
  probability: '',
  riskLevel: '',
  discoveredDate: '',
  assignedTo: '',
  rectificationDeadline: '',
  description: ''
})
const formRules = {
  equipmentId: [{ required: true, message: '请选择关联设备', trigger: 'change' }],
  hazardType: [{ required: true, message: '请选择隐患类型', trigger: 'change' }],
  severity: [{ required: true, message: '请选择严重程度', trigger: 'change' }],
  probability: [{ required: true, message: '请选择可能性', trigger: 'change' }],
  riskLevel: [{ required: true, message: '请选择风险等级', trigger: 'change' }],
  discoveredDate: [{ required: true, message: '请选择发现日期', trigger: 'change' }]
}
const equipOptions = computed(() => equipStore.equipmentList.map(e => ({ id: e.id, name: e.name })))

function openAddDialog() {
  isEdit.value = false
  editingId.value = ''
  form.value = { equipmentId:'', hazardType:'', severity:'', probability:'', riskLevel:'', discoveredDate:'', assignedTo:'', rectificationDeadline:'', description:'' }
  dialogVisible.value = true
}
function openEditDialog(row) {
  isEdit.value = true
  editingId.value = row.id
  form.value = { ...row }
  dialogVisible.value = true
}

function submitForm() {
  formRef.value.validate(async valid => {
    if (!valid) return
    submitting.value = true
    try {
      if (isEdit.value) {
        // 检查重复
        const dup = hazardStore.hazardRecordList.find(item =>
          item.equipmentId === form.value.equipmentId &&
          item.hazardType === form.value.hazardType &&
          item.discoveredDate === form.value.discoveredDate &&
          item.id !== editingId.value
        )
        if (dup) {
          ElMessage.warning('该隐患已记录，请检查或更新')
          return
        }
        hazardStore.update(editingId.value, { ...form.value })
        ElMessage.success('隐患更新成功')
      } else {
        // 新增重复检查
        const dup = hazardStore.hazardRecordList.find(item =>
          item.equipmentId === form.value.equipmentId &&
          item.hazardType === form.value.hazardType &&
          item.discoveredDate === form.value.discoveredDate
        )
        if (dup) {
          ElMessage.warning('该隐患已记录，请检查或更新')
          return
        }
        hazardStore.add({
          ...form.value,
          inspectionTaskId: '',
          status: '待整改',
          id: 'hazardrecord_' + Date.now()
        })
        ElMessage.success('隐患新增成功')
      }
      dialogVisible.value = false
    } finally {
      submitting.value = false
    }
  })
}

// 删除
async function handleDelete(row) {
  try {
    const { value } = await ElMessageBox.prompt('请输入删除原因（至少5个字）', '确认删除', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      inputPlaceholder: '删除原因',
      inputValidator: val => val.length >= 5 || '删除原因至少5个字符'
    })
    hazardStore.remove(row.id)
    ElMessage.success('删除成功')
  } catch {
    // 取消
  }
}

// 状态变更
const statusDialogVisible = ref(false)
const statusFormRef = ref(null)
const statusForm = ref({ assignedTo: '', rectificationDeadline: '' })
const pendingStatusRow = ref(null)
const pendingStatusTarget = ref('')
const statusFormRules = {
  assignedTo: [{ required: true, message: '请选择整改负责人', trigger: 'change' }],
  rectificationDeadline: [{ required: true, message: '请选择整改期限', trigger: 'change' }]
}
function handleStatusChange(row, target) {
  if (target === '整改中') {
    // 需要填写负责人和期限
    pendingStatusRow.value = row
    pendingStatusTarget.value = target
    statusForm.value = { assignedTo: row.assignedTo || '', rectificationDeadline: row.rectificationDeadline || '' }
    statusDialogVisible.value = true
  } else {
    // 直接变更
    hazardStore.update(row.id, { status: target })
    ElMessage.success('状态已更新')
  }
}
function confirmStatusChange() {
  statusFormRef.value.validate(valid => {
    if (!valid) return
    const row = pendingStatusRow.value
    hazardStore.update(row.id, { status: pendingStatusTarget.value, assignedTo: statusForm.value.assignedTo, rectificationDeadline: statusForm.value.rectificationDeadline })
    statusDialogVisible.value = false
    ElMessage.success('状态已更新')
  })
}

// 导出CSV
function exportCSV() {
  const rows = filteredList.value
  if (!rows.length) {
    ElMessage.info('无数据可导出')
    return
  }
  const headers = ['隐患ID','设备名称','隐患类型','严重程度','可能性','风险等级','状态','发现日期','负责人','整改期限','隐患描述']
  const csvContent = [
    headers.join(','),
    ...rows.map(r => [
      r.id,
      `"${getEquipName(r.equipmentId)}"`,
      `"${r.hazardType}"`,
      `"${r.severity}"`,
      `"${r.probability}"`,
      `"${r.riskLevel}"`,
      `"${r.status}"`,
      r.discoveredDate,
      `"${r.assignedTo || ''}"`,
      r.rectificationDeadline || '',
      `"${(r.description || '').replace(/"/g,'""')}"`
    ].join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`
  link.download = `隐患记录_${dateStr}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  ElMessage.success('导出完成')
}

</script>

<style scoped lang="scss">
@use './HazardRecord.scss' as *;
</style>