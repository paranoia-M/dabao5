<template>
  <div class="page-inmate-archive">
    <!-- 顶部操作栏 -->
    <el-row justify="space-between" align="middle" class="top-bar">
      <div class="top-left">
        <span class="page-title">在押人员档案</span>
        <span class="total-count">共 {{ filteredInmates.length }} 人</span>
      </div>
      <div class="top-actions">
        <el-button type="primary" @click="handleAdd">新增档案</el-button>
        <el-button :disabled="selectedIds.length === 0" @click="handleExportSelected">导出所选</el-button>
        <el-button @click="handleExportAll">导出全部</el-button>
      </div>
    </el-row>
    <!-- 筛选区 -->
    <el-row :gutter="16" class="filter-row">
      <el-col :span="6">
        <el-input v-model="filterKeyword" placeholder="搜索姓名/身份证号/案由" clearable @clear="handleFilterReset" />
      </el-col>
      <el-col :span="4">
        <el-select v-model="filterStatus" placeholder="状态" clearable style="width:100%">
          <el-option label="全部" value="" />
          <el-option label="在押" value="在押" />
          <el-option label="释放" value="释放" />
          <el-option label="转出" value="转出" />
        </el-select>
      </el-col>
      <el-col :span="8">
        <el-date-picker v-model="filterDateRange" type="daterange" range-separator="至" start-placeholder="入所开始" end-placeholder="入所结束" value-format="YYYY-MM-DD" style="width:100%" :clearable="true" />
      </el-col>
      <el-col :span="2">
        <el-button @click="handleFilterReset">重置</el-button>
      </el-col>
    </el-row>
    <!-- 主体区域 -->
    <el-row class="main-content" :gutter="16">
      <el-col :span="18" class="card-grid-col">
        <div class="card-grid">
          <div v-for="inmate in filteredInmates" :key="inmate.id" class="inmate-card" :class="{ 'is-selected': selectedIds.includes(inmate.id), 'is-disabled': ['释放','转出'].includes(inmate.status) }" @click="handleCardClick(inmate)">
            <div class="card-checkbox" @click.stop>
              <el-checkbox v-model="selectedIds" :label="inmate.id" @change="handleSelectionChange" />
            </div>
            <div class="card-photo">
              <img :src="inmate.photoUrl || ''" :alt="inmate.name" @error="onImgError" />
            </div>
            <div class="card-info">
              <div class="card-name">{{ inmate.name }}</div>
              <div class="card-case">{{ inmate.caseType }}</div>
              <div class="card-status">
                <el-tag :type="inmate.status === '在押' ? 'success' : inmate.status === '释放' ? 'info' : 'warning'" size="small">{{ inmate.status }}</el-tag>
              </div>
            </div>
          </div>
          <el-empty v-if="filteredInmates.length === 0" description="暂无在押人员档案" />
        </div>
      </el-col>
      <el-col :span="6" class="detail-preview-col">
        <div class="detail-preview" v-if="selectedInmate">
          <div class="preview-photo">
            <img :src="selectedInmate.photoUrl || ''" :alt="selectedInmate.name" @error="onImgError" />
          </div>
          <div class="preview-fields">
            <div class="field-row"><span class="field-label">姓名：</span><span>{{ selectedInmate.name }}</span></div>
            <div class="field-row"><span class="field-label">身份证号：</span><span>{{ selectedInmate.idCard }}</span></div>
            <div class="field-row"><span class="field-label">案由：</span><span>{{ selectedInmate.caseType }}</span></div>
            <div class="field-row"><span class="field-label">状态：</span><el-tag :type="selectedInmate.status === '在押' ? 'success' : selectedInmate.status === '释放' ? 'info' : 'warning'" size="small">{{ selectedInmate.status }}</el-tag></div>
            <div class="field-row"><span class="field-label">监室号：</span><span>{{ selectedInmate.cellNumber }}</span></div>
            <div class="field-row"><span class="field-label">入所日期：</span><span>{{ selectedInmate.admissionDate }}</span></div>
          </div>
          <div class="preview-actions">
            <el-button type="primary" size="small" @click="handleViewDetail(selectedInmate)">查看详情</el-button>
            <el-button size="small" :disabled="['释放','转出'].includes(selectedInmate.status)" @click="handleEdit(selectedInmate)">编辑</el-button>
            <el-button size="small" :disabled="['释放','转出'].includes(selectedInmate.status)" @click="handleTransfer(selectedInmate)">转移监室</el-button>
          </div>
        </div>
        <el-empty v-else description="请选择在押人员" />
      </el-col>
    </el-row>
    <!-- 底部批量操作栏 -->
    <div class="bottom-bar">
      <el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">全选</el-checkbox>
      <span class="selected-count">已选 {{ selectedIds.length }} 人</span>
      <el-button :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
      <el-button :disabled="selectedIds.length === 0" @click="handleBatchTransfer">批量转移监室</el-button>
    </div>
    <!-- 新增/编辑 Dialog -->
    <el-dialog v-model="formDialogVisible" :title="isEdit ? '编辑档案' : '新增档案'" width="min(640px,92vw)" class="inmate-archive-form-dialog" :close-on-click-modal="false">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="form.idCard" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="form.gender" style="width:100%">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="form.age" :min="14" :max="100" style="width:100%" />
        </el-form-item>
        <el-form-item label="案件类型" prop="caseType">
          <el-select v-model="form.caseType" style="width:100%">
            <el-option v-for="ct in caseTypeOptions" :key="ct" :label="ct" :value="ct" />
          </el-select>
        </el-form-item>
        <el-form-item label="入所日期" prop="admissionDate">
          <el-date-picker v-model="form.admissionDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="监室号" prop="cellNumber">
          <el-select v-model="form.cellNumber" style="width:100%">
            <el-option v-for="cell in cellOptions" :key="cell" :label="cell" :value="cell" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleFormSubmit">确认</el-button>
      </template>
    </el-dialog>
    <!-- 详情 Drawer -->
    <el-drawer v-model="detailDrawerVisible" direction="rtl" size="min(760px,92vw)" class="inmate-archive-detail-drawer" :close-on-click-modal="false">
      <template #header>
        <span>在押人员档案详情</span>
      </template>
      <div class="detail-content" v-if="detailInmate">
        <div class="detail-photo">
          <img :src="detailInmate.photoUrl || ''" :alt="detailInmate.name" @error="onImgError" />
        </div>
        <div class="detail-fields-grid">
          <div class="field-item"><label>姓名</label><span>{{ detailInmate.name }}</span></div>
          <div class="field-item"><label>身份证号</label><span>{{ detailInmate.idCard }}</span></div>
          <div class="field-item"><label>性别</label><span>{{ detailInmate.gender }}</span></div>
          <div class="field-item"><label>年龄</label><span>{{ detailInmate.age }}</span></div>
          <div class="field-item"><label>案件类型</label><span>{{ detailInmate.caseType }}</span></div>
          <div class="field-item"><label>状态</label><el-tag :type="detailInmate.status === '在押' ? 'success' : detailInmate.status === '释放' ? 'info' : 'warning'" size="small">{{ detailInmate.status }}</el-tag></div>
          <div class="field-item"><label>入所日期</label><span>{{ detailInmate.admissionDate }}</span></div>
          <div class="field-item"><label>监室号</label><span>{{ detailInmate.cellNumber }}</span></div>
          <div class="field-item" v-if="detailInmate.remark"><label>备注</label><span>{{ detailInmate.remark }}</span></div>
        </div>
        <div class="detail-actions">
          <el-button type="primary" :disabled="['释放','转出'].includes(detailInmate.status)" @click="handleEdit(detailInmate)">编辑</el-button>
          <el-button :disabled="['释放','转出'].includes(detailInmate.status)" @click="handleTransfer(detailInmate)">转移监室</el-button>
          <el-button :disabled="['释放','转出'].includes(detailInmate.status)" @click="handleUploadPhoto(detailInmate)">上传照片</el-button>
          <el-button type="danger" :disabled="['释放','转出'].includes(detailInmate.status)" @click="handleDelete(detailInmate)">删除</el-button>
        </div>
        <div class="related-uploads">
          <h4>上传记录</h4>
          <el-table :data="relatedUploads" max-height="200" v-if="relatedUploads.length > 0">
            <el-table-column prop="fileName" label="文件名" min-width="120" show-overflow-tooltip />
            <el-table-column prop="fileSize" label="大小" width="80" :formatter="formatFileSize" />
            <el-table-column prop="uploadTime" label="上传时间" width="150" />
            <el-table-column prop="uploader" label="上传人" width="80" />
          </el-table>
          <el-empty v-else description="暂无上传记录" />
        </div>
      </div>
      <div v-else class="empty-state">请选择在押人员</div>
    </el-drawer>
    <!-- 转移监室 Dialog -->
    <el-dialog v-model="transferDialogVisible" title="转移监室" width="min(500px,85vw)" class="inmate-archive-transfer-dialog">
      <el-form :model="transferForm" label-width="100px">
        <el-form-item label="目标监室">
          <el-select v-model="transferForm.targetCell" style="width:100%">
            <el-option v-for="cell in cellOptions" :key="cell" :label="cell" :value="cell" />
          </el-select>
        </el-form-item>
        <el-form-item label="转移原因">
          <el-input v-model="transferForm.reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTransferConfirm">确认转移</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useInmateStore } from '@/stores/inmate'
import { useUploadRecordStore } from '@/stores/uploadRecord'
import { ElMessage, ElMessageBox } from 'element-plus'

const inmateStore = useInmateStore()
const uploadStore = useUploadRecordStore()

// 筛选
const filterKeyword = ref('')
const filterStatus = ref('')
const filterDateRange = ref([])

// 选择
const selectedIds = ref([])
const checkAll = ref(false)
const isIndeterminate = ref(false)
const selectedInmate = ref(null)

// 表单
const formDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const form = ref({
  id: '',
  name: '',
  idCard: '',
  gender: '男',
  age: 30,
  caseType: '',
  admissionDate: '',
  cellNumber: '',
  remark: '',
  status: '在押',
  photoUrl: ''
})
const caseTypeOptions = ['盗窃', '诈骗', '故意伤害', '抢劫', '杀人', '贩卖毒品', '交通肇事', '非法拘禁']
const cellOptions = ['A-101','A-102','A-105','B-206','B-207','C-301','C-302','D-101']
const idCardReg = /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
const formRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: idCardReg, message: '身份证号格式不正确（18位数字或数字+X）', trigger: 'blur' }
  ],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  caseType: [{ required: true, message: '请选择案件类型', trigger: 'change' }],
  admissionDate: [{ required: true, message: '请选择入所日期', trigger: 'change' }],
}

// 详情抽屉
const detailDrawerVisible = ref(false)
const detailInmate = ref(null)

// 转移
const transferDialogVisible = ref(false)
const transferForm = ref({ targetCell: '', reason: '' })
const transferringInmate = ref(null)

// 计算过滤列表
const filteredInmates = computed(() => {
  let list = inmateStore.inmateList.slice()
  if (filterKeyword.value) {
    const kw = filterKeyword.value.trim().toLowerCase()
    list = list.filter(item =>
      item.name.toLowerCase().includes(kw) ||
      item.idCard.toLowerCase().includes(kw) ||
      item.caseType.toLowerCase().includes(kw)
    )
  }
  if (filterStatus.value) {
    list = list.filter(item => item.status === filterStatus.value)
  }
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const start = filterDateRange.value[0]
    const end = filterDateRange.value[1]
    list = list.filter(item => {
      const d = item.admissionDate
      return d >= start && d <= end
    })
  }
  list.sort((a, b) => b.admissionDate.localeCompare(a.admissionDate))
  return list
})

const defaultSelectedInmate = computed(() => {
  const found = filteredInmates.value.find(item => item.status === '在押') || filteredInmates.value[0]
  return found || null
})
watch(defaultSelectedInmate, (val) => {
  if (val && !selectedInmate.value) {
    selectedInmate.value = val
  }
}, { immediate: true })

// 关联上传记录
const relatedUploads = computed(() => {
  if (!detailInmate.value) return []
  return uploadStore.uploadList.filter(u => u.inmateId === detailInmate.value.id)
})

// 全选
function handleCheckAllChange(val) {
  selectedIds.value = val ? filteredInmates.value.map(i => i.id) : []
  isIndeterminate.value = false
}
watch(selectedIds, (val) => {
  const total = filteredInmates.value.length
  if (total === 0) {
    checkAll.value = false
    isIndeterminate.value = false
    return
  }
  if (val.length === total) {
    checkAll.value = true
    isIndeterminate.value = false
  } else if (val.length > 0) {
    checkAll.value = false
    isIndeterminate.value = true
  } else {
    checkAll.value = false
    isIndeterminate.value = false
  }
})

function handleSelectionChange() {}

// 重置筛选
function handleFilterReset() {
  filterKeyword.value = ''
  filterStatus.value = ''
  filterDateRange.value = []
}

// 新增
function handleAdd() {
  isEdit.value = false
  form.value = {
    id: '',
    name: '',
    idCard: '',
    gender: '男',
    age: 30,
    caseType: '',
    admissionDate: '',
    cellNumber: '',
    remark: '',
    status: '在押',
    photoUrl: ''
  }
  formDialogVisible.value = true
}

// 编辑
function handleEdit(inmate) {
  if (['释放','转出'].includes(inmate.status)) {
    ElMessage.warning('该人员状态不可编辑')
    return
  }
  isEdit.value = true
  form.value = { ...inmate }
  formDialogVisible.value = true
}

async function handleFormSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  if (!isEdit.value) {
    const exists = inmateStore.inmateList.some(item => item.idCard === form.value.idCard)
    if (exists) {
      ElMessage.warning('身份证号已存在')
      return
    }
  }
  if (isEdit.value) {
    const patch = {}
    Object.keys(form.value).forEach(key => {
      if (key !== 'id') patch[key] = form.value[key]
    })
    inmateStore.update(form.value.id, patch)
    ElMessage.success('编辑成功')
  } else {
    const newId = `inmate_${Date.now()}`
    const newRecord = { ...form.value, id: newId, status: '在押', photoUrl: '' }
    inmateStore.add(newRecord)
    ElMessage.success('新增成功')
  }
  formDialogVisible.value = false
}

async function handleDelete(inmate) {
  const related = uploadStore.uploadList.filter(u => u.inmateId === inmate.id)
  let confirmMsg = '确定要删除该在押人员档案吗？删除后不可恢复。'
  if (related.length > 0) {
    confirmMsg = '该人员有关联数据（上传记录），删除将同时移除关联数据，是否继续？'
  }
  try {
    await ElMessageBox.confirm(confirmMsg, '确认删除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    related.forEach(u => uploadStore.remove(u.id))
    inmateStore.remove(inmate.id)
    ElMessage.success('删除成功')
    if (selectedInmate.value && selectedInmate.value.id === inmate.id) {
      selectedInmate.value = defaultSelectedInmate.value || null
    }
    selectedIds.value = selectedIds.value.filter(id => id !== inmate.id)
  } catch {}
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const removable = inmateStore.inmateList.filter(i => selectedIds.value.includes(i.id) && !['释放','转出'].includes(i.status))
  if (removable.length === 0) {
    ElMessage.warning('选中人员中无可删除的在押人员')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${removable.length} 条档案吗？`, '批量删除', { type: 'warning' })
    const removedIds = []
    removable.forEach(inmate => {
      const related = uploadStore.uploadList.filter(u => u.inmateId === inmate.id)
      related.forEach(u => uploadStore.remove(u.id))
      inmateStore.remove(inmate.id)
      removedIds.push(inmate.id)
    })
    selectedIds.value = selectedIds.value.filter(id => !removedIds.includes(id))
    if (selectedInmate.value && removedIds.includes(selectedInmate.value.id)) {
      selectedInmate.value = defaultSelectedInmate.value || null
    }
    ElMessage.success(`成功删除 ${removedIds.length} 条档案`)
  } catch {}
}

async function handleBatchTransfer() {
  if (selectedIds.value.length === 0) return
  const valid = inmateStore.inmateList.filter(i => selectedIds.value.includes(i.id) && i.status === '在押')
  if (valid.length === 0) {
    ElMessage.warning('选中人员中没有可转移的在押人员')
    return
  }
  const { value: targetCell } = await ElMessageBox.prompt('请输入目标监室号', '批量转移监室', {
    inputPattern: /^[A-Z]-\d{3}$/,
    inputErrorMessage: '监室号格式不正确（如A-101）'
  })
  if (targetCell) {
    valid.forEach(inmate => inmateStore.update(inmate.id, { cellNumber: targetCell }))
    ElMessage.success(`已将 ${valid.length} 名在押人员转移到 ${targetCell}`)
    selectedIds.value = []
  }
}

function handleCardClick(inmate) {
  detailInmate.value = inmate
  detailDrawerVisible.value = true
  selectedInmate.value = inmate
}

function handleViewDetail(inmate) {
  detailInmate.value = inmate
  detailDrawerVisible.value = true
}

function handleTransfer(inmate) {
  transferringInmate.value = inmate
  transferForm.value = { targetCell: '', reason: '' }
  transferDialogVisible.value = true
}

function handleTransferConfirm() {
  if (!transferForm.value.targetCell) {
    ElMessage.warning('请选择目标监室')
    return
  }
  if (transferForm.value.targetCell === transferringInmate.value.cellNumber) {
    ElMessage.warning('目标监室与当前相同，无需转移')
    return
  }
  inmateStore.update(transferringInmate.value.id, { cellNumber: transferForm.value.targetCell })
  ElMessage.success('转移成功')
  transferDialogVisible.value = false
}

function handleUploadPhoto(inmate) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const fakeUrl = `http://img.jianyu.gov/photos/upload_${Date.now()}.jpg`
      inmateStore.update(inmate.id, { photoUrl: fakeUrl })
      ElMessage.success('照片上传成功')
      detailInmate.value = inmateStore.findById(inmate.id)
    }
  }
  input.click()
}

function downloadCSV(rows, filename) {
  const header = ['姓名','身份证号','性别','年龄','案件类型','状态','入所日期','监室号']
  const csvContent = [
    header.join(','),
    ...rows.map(row => [
      row.name,
      row.idCard,
      row.gender,
      row.age,
      row.caseType,
      row.status,
      row.admissionDate,
      row.cellNumber
    ].map(val => `"${val}"`).join(','))
  ].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function handleExportSelected() {
  const rows = inmateStore.inmateList.filter(i => selectedIds.value.includes(i.id))
  if (rows.length === 0) {
    ElMessage.warning('请先选择要导出的在押人员')
    return
  }
  downloadCSV(rows, `在押人员档案_选中_${Date.now()}.csv`)
}

function handleExportAll() {
  const rows = filteredInmates.value
  if (rows.length === 0) {
    ElMessage.warning('当前筛选结果为空')
    return
  }
  downloadCSV(rows, `在押人员档案_全部_${Date.now()}.csv`)
}

function formatFileSize(row, column, cellValue) {
  if (!cellValue) return '0B'
  const units = ['B','KB','MB','GB']
  let size = cellValue
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit++
  }
  return size.toFixed(1) + units[unit]
}

function onImgError(e) {
  e.target.src = ''
}
</script>

<style scoped lang="scss">
@use './InmateArchive.scss' as *;
</style>