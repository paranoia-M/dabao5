<template>
  <div class="page-equipment_ledger">
    <!-- 主内容区：左侧树 + 中央表格 + 右侧结构 -->
    <div class="main-content">
      <!-- 左侧设备类型筛选树 -->
      <div class="left-filter glass-card">
        <h4 class="filter-title">设备类型</h4>
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="{ label: 'label', children: 'children' }"
          node-key="key"
          highlight-current
          default-expand-all
          @node-click="handleTreeNodeClick"
        />
      </div>

      <!-- 中央表格区 -->
      <div class="center-table">
        <!-- 筛选条件行 -->
        <div class="filter-bar glass-card">
          <el-input
            v-model="keyword"
            placeholder="搜索设备名称/制造单位"
            clearable
            class="filter-input"
          />
          <el-select v-model="statusFilter" placeholder="设备状态" clearable class="filter-input">
            <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
          </el-select>
          <el-input
            v-model="registerCodeFilter"
            placeholder="注册代码模糊查询"
            clearable
            class="filter-input"
          />
          <el-button type="primary" @click="handleAdd">新增设备</el-button>
          <el-button @click="handleBatchImport">批量导入</el-button>
          <el-button @click="handleExport">导出Excel</el-button>
        </div>

        <!-- 表格 -->
        <el-table
          :data="pagedList"
          stripe
          highlight-current-row
          @row-click="handleRowClick"
          ref="tableRef"
          style="width: 100%"
          class="equipment-table"
        >
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="name" label="设备名称" min-width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="device-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="equipmentType" label="设备类型" width="100" />
          <el-table-column prop="registerCode" label="注册代码" min-width="130" />
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="lastInspectDate" label="最近检验" width="110" />
          <el-table-column prop="nextInspectDate" label="下次检验" width="110" />
          <el-table-column prop="manufacturer" label="制造单位" min-width="140" show-overflow-tooltip />
          <el-table-column label="操作" fixed="right" width="210">
            <template #default="{ row }">
              <el-button size="small" link @click.stop="handleDetail(row)">详情</el-button>
              <el-button size="small" link @click.stop="handleEdit(row)">编辑</el-button>
              <el-button size="small" link type="danger" @click.stop="handleDelete(row)">删除</el-button>
              <el-button size="small" link @click.stop="handleViewHazard(row)">隐患</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :total="filteredListAll.length"
          layout="total, sizes, prev, pager, next"
          background
          class="pagination-bar"
        />
      </div>

      <!-- 右侧设备结构示意 -->
      <div class="right-structure glass-card">
        <div v-if="!currentRow" class="empty-tip">请选择左侧表格中的设备查看结构示意</div>
        <div v-else class="structure-container">
          <h3 class="structure-title">{{ currentRow.name }} - 结构示意</h3>
          <div class="svg-wrapper">
            <!-- 锅炉 -->
            <svg v-if="currentRow.equipmentType === '锅炉'" viewBox="0 0 400 400" class="device-svg" width="100%" height="100%">
              <rect x="100" y="80" width="200" height="240" rx="10" class="part part-main" :class="hazardClass" :title="dangerTip" />
              <circle cx="200" cy="200" r="60" class="part part-drum" :class="hazardClass" :title="dangerTip" />
              <rect x="120" y="260" width="160" height="20" class="part part-burner" :class="hazardClass" :title="dangerTip" />
              <rect x="180" y="20" width="40" height="60" class="part part-chimney" :class="hazardClass" :title="dangerTip" />
              <text x="200" y="350" text-anchor="middle" fill="#666" font-size="12">蒸汽锅炉</text>
            </svg>
            <!-- 电梯 -->
            <svg v-else-if="currentRow.equipmentType === '电梯'" viewBox="0 0 300 500" class="device-svg" width="100%" height="100%">
              <rect x="80" y="40" width="140" height="400" class="part part-shaft" />
              <rect x="100" y="100" width="100" height="120" class="part part-car" :class="hazardClass" :title="dangerTip" />
              <rect x="80" y="40" width="6" height="400" class="part part-guide" />
              <rect x="214" y="40" width="6" height="400" class="part part-guide" />
              <rect x="100" y="60" width="100" height="30" class="part part-roof" :class="hazardClass" :title="dangerTip" />
              <circle cx="150" cy="40" r="12" class="part part-sheave" :class="hazardClass" :title="dangerTip" />
              <text x="150" y="480" text-anchor="middle" fill="#666" font-size="12">乘客电梯</text>
            </svg>
            <!-- 起重机 -->
            <svg v-else-if="currentRow.equipmentType === '起重机'" viewBox="0 0 500 300" class="device-svg" width="100%" height="100%">
              <rect x="50" y="100" width="400" height="30" class="part part-beam" :class="hazardClass" :title="dangerTip" />
              <rect x="50" y="130" width="20" height="150" class="part part-leg" />
              <rect x="430" y="130" width="20" height="150" class="part part-leg" />
              <rect x="230" y="130" width="40" height="20" class="part part-trolley" :class="hazardClass" :title="dangerTip" />
              <line x1="250" y1="150" x2="250" y2="250" stroke-width="5" class="part part-hoist" :class="hazardClass" :title="dangerTip" />
              <circle cx="250" cy="260" r="12" fill="none" stroke-width="4" class="part part-hook" :class="hazardClass" :title="dangerTip" />
              <text x="250" y="290" text-anchor="middle" fill="#666" font-size="12">桥式起重机</text>
            </svg>
            <!-- 压力容器 -->
            <svg v-else-if="currentRow.equipmentType === '压力容器'" viewBox="0 0 500 300" class="device-svg" width="100%" height="100%">
              <ellipse cx="250" cy="150" rx="200" ry="80" class="part part-vessel" :class="hazardClass" :title="dangerTip" />
              <ellipse cx="50" cy="150" rx="30" ry="80" class="part part-head" :class="hazardClass" :title="dangerTip" />
              <ellipse cx="450" cy="150" rx="30" ry="80" class="part part-head" :class="hazardClass" :title="dangerTip" />
              <rect x="230" y="30" width="40" height="40" class="part part-manhole" :class="hazardClass" :title="dangerTip" />
              <text x="250" y="270" text-anchor="middle" fill="#666" font-size="12">卧式压力容器</text>
            </svg>
            <!-- 厂内机动车 -->
            <svg v-else-if="currentRow.equipmentType === '厂内机动车'" viewBox="0 0 400 300" class="device-svg" width="100%" height="100%">
              <rect x="100" y="120" width="200" height="100" class="part part-body" :class="hazardClass" :title="dangerTip" />
              <rect x="50" y="160" width="50" height="15" class="part part-fork" :class="hazardClass" :title="dangerTip" />
              <circle cx="140" cy="240" r="25" class="part part-wheel" />
              <circle cx="260" cy="240" r="25" class="part part-wheel" />
              <rect x="180" y="50" width="40" height="70" class="part part-mast" :class="hazardClass" :title="dangerTip" />
              <text x="200" y="280" text-anchor="middle" fill="#666" font-size="12">平衡重式叉车</text>
            </svg>
            <!-- 客运索道 -->
            <svg v-else-if="currentRow.equipmentType === '客运索道'" viewBox="0 0 500 300" class="device-svg" width="100%" height="100%">
              <line x1="50" y1="80" x2="450" y2="80" stroke-width="4" stroke-dasharray="8,4" class="part part-cable" />
              <circle cx="50" cy="80" r="16" class="part part-wheel" />
              <circle cx="450" cy="80" r="16" class="part part-wheel" />
              <rect x="200" y="120" width="80" height="80" rx="8" class="part part-car" :class="hazardClass" :title="dangerTip" />
              <line x1="240" y1="120" x2="240" y2="200" stroke-width="4" class="part part-hanger" :class="hazardClass" :title="dangerTip" />
              <text x="250" y="250" text-anchor="middle" fill="#666" font-size="12">固定抱索器索道</text>
            </svg>
            <!-- 大型游乐设施 -->
            <svg v-else-if="currentRow.equipmentType === '大型游乐设施'" viewBox="0 0 400 400" class="device-svg" width="100%" height="100%">
              <circle cx="200" cy="180" r="120" fill="none" stroke-width="8" class="part part-rim" />
              <line x1="200" y1="60" x2="200" y2="300" stroke-width="5" class="part part-spoke" />
              <line x1="80" y1="180" x2="320" y2="180" stroke-width="5" class="part part-spoke" />
              <line x1="115" y1="95" x2="285" y2="265" stroke-width="5" class="part part-spoke" />
              <line x1="115" y1="265" x2="285" y2="95" stroke-width="5" class="part part-spoke" />
              <circle cx="200" cy="180" r="18" class="part part-hub" />
              <circle cx="200" cy="60" r="14" class="part part-carriage" :class="hazardClass" :title="dangerTip" />
              <circle cx="80" cy="180" r="14" class="part part-carriage" :class="hazardClass" :title="dangerTip" />
              <circle cx="285" cy="265" r="14" class="part part-carriage" :class="hazardClass" :title="dangerTip" />
              <circle cx="115" cy="95" r="14" class="part part-carriage" :class="hazardClass" :title="dangerTip" />
              <circle cx="115" cy="265" r="14" class="part part-carriage" :class="hazardClass" :title="dangerTip" />
              <circle cx="285" cy="95" r="14" class="part part-carriage" :class="hazardClass" :title="dangerTip" />
              <text x="200" y="350" text-anchor="middle" fill="#666" font-size="12">摩天轮</text>
            </svg>
            <!-- 其他 -->
            <svg v-else viewBox="0 0 300 300" class="device-svg" width="100%" height="100%">
              <rect x="80" y="50" width="140" height="200" class="part part-generic" :class="hazardClass" :title="dangerTip" />
              <rect x="100" y="10" width="100" height="40" class="part part-generic-top" :class="hazardClass" :title="dangerTip" />
              <circle cx="150" cy="260" r="12" class="part part-generic-base" />
              <text x="150" y="290" text-anchor="middle" fill="#666" font-size="12">其他设备</text>
            </svg>
          </div>
          <div class="hazard-indicator">
            <span>关联未闭环隐患：</span>
            <el-tag :type="hazardCount > 0 ? 'danger' : 'success'" size="small">
              {{ hazardCount }} 项
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑 Dialog -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑设备' : '新增设备'"
      width="min(640px, 92vw)"
      :close-on-click-modal="false"
      class="form-dialog"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="110px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="formData.name" :disabled="isEdit && isLocked" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="equipmentType">
              <el-select v-model="formData.equipmentType" :disabled="isEdit && isLocked" style="width:100%">
                <el-option v-for="t in equipmentTypes" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="注册代码" prop="registerCode">
              <el-input v-model="formData.registerCode" :disabled="isEdit && isLocked" placeholder="请输入注册代码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="制造单位" prop="manufacturer">
              <el-input v-model="formData.manufacturer" :disabled="isEdit && isLocked" placeholder="请输入制造单位" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="安装日期" prop="installDate">
              <el-date-picker
                v-model="formData.installDate"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled="isEdit && isLocked"
                style="width:100%"
                placeholder="选择安装日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备状态" prop="status">
              <el-select v-model="formData.status" :disabled="isEdit && isLocked" style="width:100%">
                <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="最近检验日期" prop="lastInspectDate">
              <el-date-picker
                v-model="formData.lastInspectDate"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled="isEdit && isLocked"
                style="width:100%"
                placeholder="选择最近检验日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下次检验日期" prop="nextInspectDate">
              <el-date-picker
                v-model="formData.nextInspectDate"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled="isEdit && isLocked"
                style="width:100%"
                placeholder="选择下次检验日期"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="位置" prop="location">
          <el-input v-model="formData.location" :disabled="isEdit && isLocked" placeholder="请输入设备位置" />
        </el-form-item>
        <el-form-item label="备注" prop="remarks" v-if="isEdit && isLocked">
          <el-input v-model="formData.remarks" type="textarea" :rows="2" placeholder="仅可编辑备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Dialog -->
    <el-dialog v-model="detailVisible" title="设备详情" width="min(700px, 92vw)" class="detail-dialog">
      <template v-if="detailRow">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备名称">{{ detailRow.name }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ detailRow.equipmentType }}</el-descriptions-item>
          <el-descriptions-item label="注册代码">{{ detailRow.registerCode }}</el-descriptions-item>
          <el-descriptions-item label="制造单位">{{ detailRow.manufacturer }}</el-descriptions-item>
          <el-descriptions-item label="安装日期">{{ detailRow.installDate }}</el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag :type="statusTagType(detailRow.status)" size="small">{{ detailRow.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="最近检验日期">{{ detailRow.lastInspectDate }}</el-descriptions-item>
          <el-descriptions-item label="下次检验日期">{{ detailRow.nextInspectDate }}</el-descriptions-item>
          <el-descriptions-item label="位置" :span="2">{{ detailRow.location }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4 style="margin-bottom:12px;">关联隐患记录</h4>
        <el-table :data="detailHazardList" stripe border size="small" max-height="240">
          <el-table-column prop="hazardType" label="隐患类型" width="100" />
          <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
          <el-table-column prop="riskLevel" label="风险等级" width="140" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="hazardStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="70">
            <template #default="{ row }">
              <el-button size="small" link @click="viewHazardDetail(row)">查看</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="detailHazardList.length === 0" style="text-align:center;color:#999;">暂无关联隐患</div>
      </template>
    </el-dialog>

    <!-- 隐患详情 Dialog -->
    <el-dialog v-model="hazardDetailVisible" title="隐患详情" width="min(600px, 92vw)">
      <template v-if="currentHazard">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="隐患类型">{{ currentHazard.hazardType }}</el-descriptions-item>
          <el-descriptions-item label="隐患描述">{{ currentHazard.description }}</el-descriptions-item>
          <el-descriptions-item label="严重程度">{{ currentHazard.severity }}</el-descriptions-item>
          <el-descriptions-item label="可能性">{{ currentHazard.probability }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">{{ currentHazard.riskLevel }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentHazard.status }}</el-descriptions-item>
          <el-descriptions-item label="发现日期">{{ currentHazard.discoveredDate }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentHazard.assignedTo }}</el-descriptions-item>
          <el-descriptions-item label="整改期限">{{ currentHazard.rectificationDeadline }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-dialog>

    <!-- 批量导入 Dialog -->
    <el-dialog v-model="importVisible" title="批量导入设备" width="min(500px, 92vw)">
      <el-upload
        ref="uploadRef"
        accept=".csv,.txt"
        :auto-upload="false"
        :show-file-list="true"
        :limit="1"
        :on-change="handleFileChange"
      >
        <el-button type="primary">选择 CSV 文件</el-button>
        <template #tip>
          <div style="font-size:12px;color:#999;margin-top:6px;">
            支持 CSV 格式，表头：设备名称,设备类型,注册代码,制造单位,安装日期,最近检验日期,下次检验日期,位置,状态
          </div>
        </template>
      </el-upload>
      <el-input v-model="importResult" type="textarea" :rows="4" readonly placeholder="导入结果将显示在这里" />
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!importFile" @click="confirmImport">开始导入</el-button>
      </template>
    </el-dialog>

    <!-- 设备隐患列表 Dialog (从表格操作弹出) -->
    <el-dialog v-model="hazardListVisible" title="关联隐患记录" width="min(700px, 92vw)">
      <el-table v-if="currentRow" :data="currentRowHazardList" stripe border size="small">
        <el-table-column prop="hazardType" label="隐患类型" width="100" />
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="riskLevel" label="风险等级" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="hazardStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70">
          <template #default="{ row }">
            <el-button size="small" link @click="viewHazardDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="currentRowHazardList.length === 0" style="text-align:center;color:#999;">暂无关联隐患</div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useHazardRecordStore } from '@/stores/hazardRecord'

import { useRouter } from 'vue-router'

// Store
const equipmentStore = useEquipmentStore()
const hazardRecordStore = useHazardRecordStore()
const router = useRouter()

// ---------- 常量 ----------
const equipmentTypes = ['锅炉','压力容器','电梯','起重机械','厂内机动车','客运索道','大型游乐设施','其他']
const statusOptions = ['正常','待检验','超期未检','停用','报废']

const treeData = [
  {
    label: '全部设备',
    key: 'all',
    children: equipmentTypes.map(t => ({ label: t, key: t }))
  }
]

const statusTagType = (s) => {
  const map = { '正常':'success', '待检验':'warning', '超期未检':'danger', '停用':'warning', '报废':'info' }
  return map[s] || 'info'
}

const hazardStatusTag = (s) => {
  const map = { '待整改':'danger', '整改中':'warning', '待复查':'warning', '已完成':'success', '关闭':'info' }
  return map[s] || 'info'
}

// ---------- 筛选与分页 ----------
const keyword = ref('')
const statusFilter = ref('')
const registerCodeFilter = ref('')
const typeFilter = ref(null) // from tree
const currentPage = ref(1)
const pageSize = ref(20)

const filteredListAll = computed(() => {
  let list = equipmentStore.equipmentList || []
  if (typeFilter.value && typeFilter.value !== 'all') {
    list = list.filter(i => i.equipmentType === typeFilter.value)
  }
  if (keyword.value.trim()) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(i => (i.name && i.name.toLowerCase().includes(kw)) || (i.manufacturer && i.manufacturer.toLowerCase().includes(kw)))
  }
  if (statusFilter.value) {
    list = list.filter(i => i.status === statusFilter.value)
  }
  if (registerCodeFilter.value.trim()) {
    list = list.filter(i => i.registerCode && i.registerCode.includes(registerCodeFilter.value.trim()))
  }
  return list
})

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredListAll.value.slice(start, start + pageSize.value)
})

// 当筛选变化时重置到第一页
watch([keyword, statusFilter, registerCodeFilter, typeFilter], () => {
  currentPage.value = 1
})

// ---------- 表格行选中 ----------
const currentRow = ref(null)
const tableRef = ref(null)
const handleRowClick = (row) => {
  currentRow.value = row
}

// ---------- 设备结构示意 ----------
const hazardCount = computed(() => {
  if (!currentRow.value) return 0
  const id = currentRow.value.id
  const closedStatus = ['已完成','关闭']
  return hazardRecordStore.hazardRecordList.filter(r => r.equipmentId === id && !closedStatus.includes(r.status)).length
})
const hazardClass = computed(() => hazardCount.value > 0 ? 'has-hazard' : 'no-hazard')
const dangerTip = computed(() => `隐患数: ${hazardCount.value}`)

// ---------- 新增/编辑 ----------
const formDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = ref({})
const editingId = ref('')

const isLocked = computed(() => {
  if (!isEdit.value) return false
  return formData.value.status === '报废' || formData.value.status === '注销'
})

const formRules = {
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  equipmentType: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  registerCode: [{ required: true, message: '请输入注册代码', trigger: 'blur' }]
}

const resetForm = () => {
  formData.value = {
    name: '',
    equipmentType: '',
    status: '正常',
    registerCode: '',
    manufacturer: '',
    installDate: '',
    lastInspectDate: '',
    nextInspectDate: '',
    location: '',
    remarks: ''
  }
}

const handleAdd = () => {
  isEdit.value = false
  editingId.value = ''
  resetForm()
  formDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  editingId.value = row.id
  formData.value = { ...row, remarks: '' }
  formDialogVisible.value = true
}

const confirmForm = async () => {
  const valid = await formRef.value.validate().catch(() => {})
  if (!valid) return
  const data = { ...formData.value }
  delete data.remarks // remarks not in store
  if (isEdit.value) {
    // 更新
    equipmentStore.update(editingId.value, data)
    ElMessage.success('设备更新成功')
  } else {
    // 新增：生成临时ID
    const newId = 'equipment_' + Date.now()
    equipmentStore.add({ id: newId, ...data })
    ElMessage.success('设备新增成功')
  }
  formDialogVisible.value = false
}

// ---------- 删除 ----------
const handleDelete = (row) => {
  const id = row.id
  const closedStatus = ['已完成','关闭']
  const openHazards = hazardRecordStore.hazardRecordList.filter(r => r.equipmentId === id && !closedStatus.includes(r.status))
  if (openHazards.length > 0) {
    ElMessageBox.alert(`该设备存在 ${openHazards.length} 项未闭环隐患，请先处理隐患后再删除。`, '禁止删除', { type: 'warning', confirmButtonText: '知道了' })
    return
  }
  ElMessageBox.confirm(`确定要删除设备 "${row.name}" 吗？`, '确认删除', { type: 'warning' }).then(() => {
    equipmentStore.remove(id)
    ElMessage.success('设备已删除')
    if (currentRow.value && currentRow.value.id === id) {
      currentRow.value = null
    }
  }).catch(() => {})
}

// ---------- 详情 ----------
const detailVisible = ref(false)
const detailRow = ref(null)
const detailHazardList = computed(() => {
  if (!detailRow.value) return []
  const id = detailRow.value.id
  return hazardRecordStore.hazardRecordList.filter(r => r.equipmentId === id)
})

const handleDetail = (row) => {
  router.push(`/equipment-profile?id=${row.id}`)
}

const hazardDetailVisible = ref(false)
const currentHazard = ref(null)
const viewHazardDetail = (hazard) => {
  currentHazard.value = hazard
  hazardDetailVisible.value = true
}

// ---------- 查看隐患（从表格操作列） ----------
const hazardListVisible = ref(false)
const currentRowHazardList = computed(() => {
  if (!currentRow.value) return []
  const id = currentRow.value.id
  return hazardRecordStore.hazardRecordList.filter(r => r.equipmentId === id)
})

const handleViewHazard = (row) => {
  currentRow.value = row
  hazardListVisible.value = true
}

// ---------- 批量导入 ----------
const importVisible = ref(false)
const importFile = ref(null)
const importResult = ref('')
const uploadRef = ref(null)

const handleBatchImport = () => {
  importVisible.value = true
  importFile.value = null
  importResult.value = ''
}

const handleFileChange = (file) => {
  importFile.value = file.raw
}

const confirmImport = () => {
  if (!importFile.value) {
    ElMessage.warning('请选择文件')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    const lines = text.split('\n').filter(line => line.trim() !== '')
    if (lines.length < 2) {
      ElMessage.warning('文件格式错误：至少包含表头和一行数据')
      return
    }
    // 首行为表头，忽略
    let successCount = 0
    let failCount = 0
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].split(',').map(s => s.trim())
      if (fields.length < 9) {
        failCount++
        continue
      }
      const [name, equipmentType, registerCode, manufacturer, installDate, lastInspectDate, nextInspectDate, location, status] = fields
      if (!name || !registerCode || !equipmentType) {
        failCount++
        continue
      }
      const newId = 'equipment_' + Date.now() + '_' + i
      const item = {
        id: newId,
        name,
        equipmentType,
        registerCode,
        manufacturer: manufacturer || '',
        installDate: installDate || '',
        lastInspectDate: lastInspectDate || '',
        nextInspectDate: nextInspectDate || '',
        location: location || '',
        status: statusOptions.includes(status) ? status : '正常'
      }
      equipmentStore.add(item)
      successCount++
    }
    importResult.value = `导入完成：成功 ${successCount} 条，失败 ${failCount} 条`
    ElMessage.success(`批量导入完成，成功 ${successCount} 条`)
    importFile.value = null
    uploadRef.value?.clearFiles?.()
  }
  reader.readAsText(importFile.value)
}

// ---------- 导出 ----------
const handleExport = () => {
  const list = filteredListAll.value
  if (list.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  // 生成 CSV
  const headers = ['设备名称','设备类型','注册代码','制造单位','安装日期','最近检验日期','下次检验日期','位置','状态']
  const rows = list.map(item => [
    item.name,
    item.equipmentType,
    item.registerCode,
    item.manufacturer,
    item.installDate,
    item.lastInspectDate,
    item.nextInspectDate,
    item.location,
    item.status
  ])
  let csvContent = '\uFEFF' + headers.join(',') + '\n'
  rows.forEach(row => {
    csvContent += row.map(f => `"${f}"`).join(',') + '\n'
  })
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `设备台账_${new Date().toISOString().slice(0,10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

// ---------- 树筛选 ----------
const handleTreeNodeClick = (node) => {
  if (node.key === 'all') {
    typeFilter.value = null
  } else {
    typeFilter.value = node.key
  }
}
</script>

<style scoped lang="scss">
@use './EquipmentLedger.scss' as *;
</style>