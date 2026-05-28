<template>
  <div class="page-model_library">
    <!-- 顶部筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索名称/编号"
        clearable
        class="filter-item"
        @input="onFilterChange"
      />
      <el-select v-model="filterStatus" placeholder="状态" clearable class="filter-item" @change="onFilterChange">
        <el-option label="全部" value="" />
        <el-option v-for="s in statusOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-select v-model="filterCategoryId" placeholder="分类" clearable class="filter-item" @change="onFilterChange">
        <el-option label="全部" value="" />
        <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="创建开始"
        end-placeholder="创建结束"
        class="filter-item"
        @change="onFilterChange"
      />
      <el-button class="filter-item" @click="resetFilters">重置</el-button>
      <el-button type="primary" class="filter-item" @click="openAddDialog">新增模型</el-button>
      <el-button class="filter-item" @click="handleExport">导出清单</el-button>
    </div>

    <!-- 主体：左侧分类树 + 右侧表格 -->
    <div class="main-content">
      <!-- 左侧分类树 -->
      <div class="tree-panel">
        <div class="tree-header">模型分类</div>
        <div class="tree-body">
          <svg ref="treeSvg" :width="treeWidth" :height="treeHeight" class="tree-svg">
            <!-- 连线 -->
            <path
              v-for="(link, i) in treeLinks"
              :key="'link'+i"
              :d="link.path"
              fill="none"
              stroke="var(--page-primary, #0F766E)"
              stroke-width="2"
            />
            <!-- 节点 -->
            <g
              v-for="(node, i) in treeNodes"
              :key="node.id"
              :transform="`translate(${node.x}, ${node.y})`"
              class="tree-node"
              :class="{ 'node-selected': selectedTreeNodeId === node.id }"
              @click="onTreeNodeClick(node)"
              @dblclick="onTreeNodeDblClick(node)"
            >
              <rect
                :x="0"
                :y="0"
                :width="nodeWidth"
                :height="nodeHeight"
                rx="4"
                ry="4"
                fill="var(--page-primary, #0F766E)"
                :opacity="node.expandable ? 0.85 : 0.6"
                stroke="#fff"
                stroke-width="1"
              />
              <text
                :x="nodeWidth/2"
                :y="nodeHeight/2+1"
                text-anchor="middle"
                dominant-baseline="middle"
                fill="#fff"
                font-size="12"
              >{{ node.label }}</text>
              <text
                v-if="node.expandable"
                :x="nodeWidth - 8"
                :y="nodeHeight/2"
                text-anchor="end"
                dominant-baseline="middle"
                fill="#fff"
                font-size="10"
                style="cursor:pointer"
                @click.stop="toggleExpand(node)"
              >{{ node.expanded ? '▼' : '▶' }}</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- 右侧模型表格 -->
      <div class="table-panel">
        <el-table
          :data="paginatedList"
          stripe
          style="width:100%"
          @row-click="handleRowClick"
        >
          <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
          <el-table-column prop="code" label="编号" width="120" />
          <el-table-column label="分类" width="100">
            <template #default="{ row }">
              {{ getCategoryName(row.categoryId) }}
            </template>
          </el-table-column>
          <el-table-column prop="format" label="格式" width="80" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="标签" width="120">
            <template #default="{ row }">
              <el-tag
                v-for="t in (row.tags || [])"
                :key="t"
                size="small"
                style="margin-right:2px; margin-bottom:2px;"
              >{{ t }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="fileSize" label="大小(MB)" width="90" />
          <el-table-column label="上传者" width="80">
            <template #default="{ row }">
              {{ getUploaderName(row.uploaderId) || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="110">
            <template #default="{ row }">{{ row.createdAt?.slice(0,10) }}</template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="220">
            <template #default="{ row }">
              <el-button link type="primary" size="small" :disabled="!canEdit(row)" @click.stop="openEditDialog(row)">编辑</el-button>
              <el-button link type="danger" size="small" :disabled="!canEdit(row)" @click.stop="handleDelete(row)">删除</el-button>
              <el-button link size="small" @click.stop="openDetailDrawer(row)">详情</el-button>
              <el-button link type="warning" size="small" :disabled="row.status!=='草稿'" @click.stop="submitApproval(row)">提交审批</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pageNo"
            v-model:page-size="pageSize"
            :total="filteredList.length"
            :page-sizes="[5,10,20]"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增模型' : '编辑模型'"
      width="min(640px,92vw)"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <el-input v-model="formData.name" placeholder="输入模型名称" />
        </el-form-item>
        <el-form-item label="分类" prop="categoryId">
          <el-select v-model="formData.categoryId" placeholder="选择分类">
            <el-option v-for="cat in categoryList" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="tagStr" placeholder="逗号分隔多个标签" />
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="formData.versionNumber" placeholder="默认自动递增" />
        </el-form-item>
        <el-form-item label="模型文件">
          <el-upload
            ref="fileUpload"
            :auto-upload="false"
            :limit="1"
            accept=".obj,.fbx,.glb,.gltf,.stl,.3ds"
            :on-change="handleFileChange"
          >
            <el-button>选择文件</el-button>
            <template #tip><div class="el-upload__tip">≤ 500MB，格式OBJ/FBX/GLTF/STL/3DS</div></template>
          </el-upload>
        </el-form-item>
        <el-form-item label="预览图">
          <el-upload
            :auto-upload="false"
            :limit="1"
            accept="image/*"
            :on-change="handleThumbChange"
          >
            <el-button>选择图片</el-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>

    <!-- 详情抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      title="模型详情"
      size="min(500px,85vw)"
      :with-header="true"
    >
      <template #default>
        <div v-if="currentDetail" class="detail-content">
          <div class="detail-left">
            <div class="info-block">
              <div class="info-row"><span class="label">名称：</span>{{ currentDetail.name }}</div>
              <div class="info-row"><span class="label">编号：</span>{{ currentDetail.code }}</div>
              <div class="info-row"><span class="label">分类：</span>{{ getCategoryName(currentDetail.categoryId) }}</div>
              <div class="info-row"><span class="label">格式：</span>{{ currentDetail.format }}</div>
              <div class="info-row"><span class="label">状态：</span><el-tag :type="statusTagType(currentDetail.status)" size="small">{{ currentDetail.status }}</el-tag></div>
              <div class="info-row"><span class="label">大小：</span>{{ currentDetail.fileSize }} MB</div>
              <div class="info-row"><span class="label">上传者：</span>{{ getUploaderName(currentDetail.uploaderId) || '-' }}</div>
              <div class="info-row"><span class="label">创建时间：</span>{{ currentDetail.createdAt }}</div>
              <div class="info-row"><span class="label">描述：</span>{{ currentDetail.description || '-' }}</div>
              <div class="info-row"><span class="label">标签：</span>
                <el-tag v-for="t in (currentDetail.tags||[])" :key="t" size="small" style="margin:2px">{{ t }}</el-tag>
              </div>
            </div>
          </div>
          <div class="detail-right">
            <div class="version-title">版本历史</div>
            <el-table :data="modelVersions" max-height="300" stripe>
              <el-table-column prop="versionNumber" label="版本号" width="80" />
              <el-table-column prop="createdAt" label="上传时间" width="100" />
              <el-table-column prop="fileSize" label="大小(KB)" width="80" />
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button link size="small" @click="handleDownloadVersion(row)">下载</el-button>
                  <el-button link size="small" @click="viewVersionNotes(row)">备注</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </template>
      <template #footer>
        <el-button @click="drawerVisible = false">关闭</el-button>
        <el-button type="primary" :disabled="!currentDetail || currentDetail.status!=='草稿'" @click="submitApproval(currentDetail)">提交审批</el-button>
      </template>
    </el-drawer>

    <!-- 审批理由弹窗 -->
    <el-dialog v-model="approvalDialogVisible" title="提交审批" width="400px">
      <el-form :model="approvalForm">
        <el-form-item label="审批理由">
          <el-input v-model="approvalForm.reason" type="textarea" :rows="3" placeholder="请输入申请理由" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approvalDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="approving" @click="confirmApproval">提交</el-button>
      </template>
    </el-dialog>

    <!-- 分类编辑弹窗 -->
    <el-dialog v-model="categoryEditVisible" title="编辑分类" width="400px">
      <el-form :model="categoryEditForm">
        <el-form-item label="名称">
          <el-input v-model="categoryEditForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="categoryEditForm.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryEditVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategoryEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 版本备注弹窗 -->
    <el-dialog v-model="notesVisible" title="版本备注" width="400px">
      <p>{{ currentNotes }}</p>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Edit, Delete, View } from '@element-plus/icons-vue'

import { useModelStore } from '@/stores/model'
import { useModelVersionStore } from '@/stores/modelVersion'
import { useModelCategoryStore } from '@/stores/modelCategory'
import { useTeamMemberStore } from '@/stores/teamMember'
import { useShareRequestStore } from '@/stores/shareRequest'
import { useApprovalRecordStore } from '@/stores/approvalRecord'
import { useExportRecordStore } from '@/stores/exportRecord'

const modelStore = useModelStore()
const versionStore = useModelVersionStore()
const categoryStore = useModelCategoryStore()
const memberStore = useTeamMemberStore()
const shareRequestStore = useShareRequestStore()
const approvalRecordStore = useApprovalRecordStore()
const exportRecordStore = useExportRecordStore()

// ========== 筛选相关 ==========
const keyword = ref('')
const filterStatus = ref('')
const filterCategoryId = ref('')
const dateRange = ref([]) // 空数组，不设默认值
const statusOptions = ['草稿', '审核中', '已发布', '已归档', '已删除']

// 分类列表（来自 store）
const categoryList = computed(() => categoryStore.categoryList || [])

// 分类树数据（用于左侧树）
const treeData = ref([])
const treeNodes = ref([])
const treeLinks = ref([])
const selectedTreeNodeId = ref(null) // 当前选中节点id
const nodeWidth = 120
const nodeHeight = 36
const treeWidth = computed(() => Math.max(300, nodeWidth + 60))
const treeHeight = computed(() => treeNodes.value.length * (nodeHeight + 30) + 30)

// 构建树的逻辑
function buildTreeData() {
  const list = categoryStore.categoryList || []
  // 找到根节点（parentId 不存在于 list 中或 parentId 为 ''）
  const rootNodes = list.filter(c => !c.parentId || !list.find(p => p.id === c.parentId))
  const tree = []
  function findChildren(parentId) {
    return list.filter(c => c.parentId === parentId)
  }
  function buildNode(cat, depth) {
    const children = findChildren(cat.id)
    const expandable = children.length > 0
    return {
      id: cat.id,
      label: cat.name,
      depth,
      expandable,
      expanded: true,
      children: expandable ? children.map(child => buildNode(child, depth + 1)) : [],
    }
  }
  rootNodes.forEach(root => {
    tree.push(buildNode(root, 0))
  })
  treeData.value = tree
  // 计算平面坐标
  updateTreeLayout()
}

function updateTreeLayout() {
  const nodes = []
  const links = []
  let yOffset = 20
  const xBase = 30

  function traverse(node, parentX, parentY, depth, parentNodeId) {
    const x = depth === 0 ? xBase + nodeWidth / 2 : parentX + nodeWidth + 40
    const y = yOffset
    nodes.push({
      id: node.id,
      label: node.label,
      x: x - nodeWidth / 2,
      y,
      expandable: node.expandable,
      expanded: node.expanded,
    })
    if (parentY !== null && parentY !== undefined) {
      // 画折线：从父节点底部中心 -> 当前节点顶部中心
      const startX = parentX
      const startY = parentY + nodeHeight
      const midY = startY + (y - startY) / 2
      const endX = x
      const endY = y
      const path = `M${startX},${startY} L${startX},${midY} L${endX},${midY} L${endX},${endY}`
      links.push({ path, from: parentNodeId, to: node.id })
    }
    if (node.expanded && node.children) {
      node.children.forEach(child => {
        traverse(child, x, y, depth + 1, node.id)
      })
    }
    yOffset += nodeHeight + 30
  }

  function traverseTree(nodesArr, parentX, parentY, depth) {
    nodesArr.forEach(node => {
      traverse(node, parentX, parentY, depth, null)
    })
  }

  yOffset = 20
  const rootNodes = treeData.value
  let lastParentX = xBase + nodeWidth / 2
  let lastParentY = 20
  treeData.value.forEach((root, idx) => {
    traverse(root, idx === 0 ? xBase + nodeWidth / 2 : (treeNodes.value.length > 0 ? treeNodes.value[treeNodes.value.length - 1].x + nodeWidth/2 : xBase + nodeWidth/2), null, 0, null)
  })
  // 修正：简化处理，只计算一级
  // 重新计算：更精确的布局
  const flatNodes = []
  const flatLinks = []
  let curY = 20

  function layoutTree(nodeList, parentX, parentY, parentNodeId) {
    nodeList.forEach(node => {
      const x = parentX + nodeWidth + 40
      if (parentX === undefined) {
        // 根节点
        const x0 = xBase
        const y0 = curY
        flatNodes.push({ id: node.id, label: node.label, x: x0, y: y0, expandable: node.expandable, expanded: node.expanded })
        curY += nodeHeight + 30
        if (parentY !== undefined) {
          flatLinks.push({ from: parentNodeId, to: node.id, path: `M${parentX},${parentY+nodeHeight} L${parentX},${(parentY+nodeHeight + y0)/2} L${x0+nodeWidth/2},${(parentY+nodeHeight + y0)/2} L${x0+nodeWidth/2},${y0}` })
        }
        if (node.expanded && node.children) {
          layoutTree(node.children, x0 + nodeWidth/2, y0, node.id)
        }
      } else {
        const x0 = parentX
        const y0 = curY
        flatNodes.push({ id: node.id, label: node.label, x: x0 - nodeWidth/2, y: y0, expandable: node.expandable, expanded: node.expanded })
        const startX = parentX
        const startY = parentY + nodeHeight
        const midY = (startY + y0) / 2
        const endX = x0
        const endY = y0
        flatLinks.push({ from: parentNodeId, to: node.id, path: `M${startX},${startY} L${startX},${midY} L${endX},${midY} L${endX},${endY}` })
        curY += nodeHeight + 30
        if (node.expanded && node.children) {
          layoutTree(node.children, endX, endY, node.id)
        }
      }
    })
  }
  // 重置
  flatNodes.length = 0
  flatLinks.length = 0
  curY = 20
  treeData.value.forEach(root => {
    layoutTree([root], undefined, undefined, null)
  })
  treeNodes.value = flatNodes
  treeLinks.value = flatLinks
}

function toggleExpand(node) {
  const n = findNode(treeData.value, node.id)
  if (n) {
    n.expanded = !n.expanded
    updateTreeLayout()
  }
}
function findNode(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNode(n.children, id)
      if (found) return found
    }
  }
  return null
}

function onTreeNodeClick(node) {
  selectedTreeNodeId.value = node.id
  filterCategoryId.value = node.id
  onFilterChange()
}

function onTreeNodeDblClick(node) {
  // 打开编辑分类弹窗
  const cat = categoryStore.findById(node.id)
  if (cat) {
    categoryEditForm.value = { name: cat.name, description: cat.description }
    categoryEditTargetId.value = node.id
    categoryEditVisible.value = true
  }
}

const categoryEditVisible = ref(false)
const categoryEditForm = ref({ name: '', description: '' })
const categoryEditTargetId = ref('')
function saveCategoryEdit() {
  const { name, description } = categoryEditForm.value
  if (!name.trim()) { ElMessage.warning('名称不能为空'); return }
  categoryStore.update(categoryEditTargetId.value, { name: name.trim(), description: description.trim() })
  categoryEditVisible.value = false
  ElMessage.success('分类已更新')
  buildTreeData()
}

// 筛选后的模型列表
const filteredList = computed(() => {
  let list = modelStore.modelList || []
  // 关键词
  if (keyword.value) {
    const kw = keyword.value.trim().toLowerCase()
    list = list.filter(m => (m.name && m.name.toLowerCase().includes(kw)) || (m.code && m.code.toLowerCase().includes(kw)))
  }
  // 状态
  if (filterStatus.value) {
    list = list.filter(m => m.status === filterStatus.value)
  }
  // 分类
  if (filterCategoryId.value) {
    // 选中分类节点，包括其所有子分类（简化：只精确匹配）
    list = list.filter(m => m.categoryId === filterCategoryId.value)
  }
  // 日期范围
  if (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1]) {
    const start = new Date(dateRange.value[0]).getTime()
    const end = new Date(dateRange.value[1]).getTime() + 86400000 // 当天结束
    list = list.filter(m => {
      const t = new Date(m.createdAt).getTime()
      return t >= start && t <= end
    })
  }
  return list
})

// 分页
const pageNo = ref(1)
const pageSize = ref(5)
const paginatedList = computed(() => {
  const start = (pageNo.value - 1) * pageSize.value
  return filteredList.value.slice(start, start + pageSize.value)
})

// 表格辅助
function getCategoryName(categoryId) {
  if (!categoryId) return '-'
  const cat = categoryStore.findById(categoryId)
  return cat ? cat.name : '-'
}
function getUploaderName(uploaderId) {
  if (!uploaderId) return ''
  const member = memberStore.memberList.find(m => m.id === uploaderId)
  return member ? member.name : ''
}
function statusTagType(status) {
  const map = { '草稿': 'info', '审核中': 'warning', '已发布': 'success', '已归档': '', '已删除': 'danger' }
  return map[status] || 'info'
}
function canEdit(row) {
  return row.status === '草稿'
}

// 筛选方法
function onFilterChange() {
  pageNo.value = 1
}
function resetFilters() {
  keyword.value = ''
  filterStatus.value = ''
  filterCategoryId.value = ''
  dateRange.value = []
  selectedTreeNodeId.value = null
  pageNo.value = 1
}

// ========== 新增/编辑模型 ==========
const dialogVisible = ref(false)
const dialogMode = ref('add')
const formRef = ref(null)
const fileUpload = ref(null)
const tagStr = ref('')
const submitting = ref(false)
const formData = ref({
  name: '',
  categoryId: '',
  tags: [],
  versionNumber: 'v1.0',
  description: '',
})

const formRules = {
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  categoryId: [{ required: true, message: '必选', trigger: 'change' }],
}

// 当前编辑的模型id（编辑模式）
let editingModelId = null

function openAddDialog() {
  dialogMode.value = 'add'
  editingModelId = null
  formData.value = { name: '', categoryId: '', tags: [], versionNumber: '', description: '' }
  tagStr.value = ''
  dialogVisible.value = true
}

function openEditDialog(row) {
  dialogMode.value = 'edit'
  editingModelId = row.id
  formData.value = {
    name: row.name,
    categoryId: row.categoryId,
    tags: row.tags || [],
    versionNumber: '', // 编辑不强制改版本
    description: row.description || '',
  }
  tagStr.value = (row.tags || []).join(',')
  dialogVisible.value = true
}

function handleFileChange(file) {
  // 模拟文件大小校验，实际可以读取文件大小
  if (file.size > 500 * 1024 * 1024) {
    ElMessage.error('文件超过500MB')
    return false
  }
  // 格式校验
  const ext = file.name.split('.').pop().toLowerCase()
  if (!['obj','fbx','glb','gltf','stl','3ds'].includes(ext)) {
    ElMessage.error('不支持的格式')
    return false
  }
}
function handleThumbChange(file) {
  // 不做严格处理
}
function submitForm() {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    // 处理标签
    const tags = tagStr.value ? tagStr.value.split(',').map(s => s.trim()).filter(s => s) : []
    const payload = {
      name: formData.value.name.trim(),
      categoryId: formData.value.categoryId,
      tags,
      versionNumber: formData.value.versionNumber || undefined,
      description: formData.value.description,
    }
    try {
      if (dialogMode.value === 'add') {
        // 新增
        const newModel = {
          ...payload,
          id: 'model_' + Date.now(),
          code: 'BLD-' + Date.now(),
          format: 'FBX', // 默认格式，可从文件扩展名获取
          status: '草稿',
          fileSize: 0,
          uploaderId: currentUser.value?.id || '',
          createdAt: new Date().toISOString().slice(0,19).replace('T',' '),
          updatedAt: new Date().toISOString().slice(0,19).replace('T',' '),
        }
        modelStore.add(newModel)
        // 同时添加上传记录
        const uploadRecordStore = useUploadRecordStore?.() // 如果存在
        if (uploadRecordStore) {
          uploadRecordStore.add({
            id: 'upload_' + Date.now(),
            modelId: newModel.id,
            userId: currentUser.value?.id || '',
            fileName: fileUpload.value?.uploadFiles?.[0]?.name || '',
            fileSize: fileUpload.value?.uploadFiles?.[0]?.size || 0,
            format: 'FBX',
            status: '完成',
            versionNumber: payload.versionNumber || 'v1.0',
            createdAt: new Date().toISOString().slice(0,19).replace('T',' '),
          })
        }
        ElMessage.success('新增成功')
      } else {
        // 编辑
        modelStore.update(editingModelId, {
          ...payload,
          updatedAt: new Date().toISOString().slice(0,19).replace('T',' '),
        })
        ElMessage.success('更新成功')
      }
      dialogVisible.value = false
    } catch (e) {
      ElMessage.error('操作失败')
    } finally {
      submitting.value = false
    }
  })
}

// ========== 删除 ==========
function handleDelete(row) {
  // 检查是否有关联共享记录（已发布）
  const relatedShares = shareRequestStore.shareRequestList.filter(s => s.modelId === row.id && s.status === '已通过')
  if (relatedShares.length > 0) {
    ElMessageBox.confirm('该模型存在已发布的关联共享记录，删除后可能影响共享，是否继续？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
      .then(() => {
        modelStore.remove(row.id)
        ElMessage.success('删除成功')
      }).catch(() => {})
    return
  }
  ElMessageBox.confirm('删除后不可恢复，是否删除？', '确认删除', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error'
  }).then(() => {
    modelStore.remove(row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

// ========== 详情抽屉 ==========
const drawerVisible = ref(false)
const currentDetail = ref(null)
const modelVersions = ref([])

function openDetailDrawer(row) {
  currentDetail.value = row
  // 获取版本列表
  modelVersions.value = versionStore.versionList.filter(v => v.modelId === row.id)
  drawerVisible.value = true
}

function handleDownloadVersion(version) {
  ElMessage.success('下载任务已提交，请稍后查看导出记录')
  // 添加导出记录
  exportRecordStore.add({
    id: 'export_' + Date.now(),
    userId: currentUser.value?.id || '',
    module: '模型清单',
    format: 'Excel',
    status: '处理中',
    filePath: version.filePath || '',
    createdAt: new Date().toISOString().slice(0,19).replace('T',' '),
  })
}

function viewVersionNotes(version) {
  notesVisible.value = true
  currentNotes.value = version.notes || '无备注'
}

const notesVisible = ref(false)
const currentNotes = ref('')

// ========== 提交审批 ==========
const approvalDialogVisible = ref(false)
const approvalForm = ref({ reason: '' })
const approving = ref(false)
let approvalTargetRow = null

function submitApproval(row) {
  if (row.status !== '草稿') {
    ElMessage.warning('仅草稿状态可提交审批')
    return
  }
  approvalTargetRow = row
  approvalForm.value.reason = ''
  approvalDialogVisible.value = true
}

function confirmApproval() {
  if (!approvalForm.value.reason.trim()) {
    ElMessage.warning('请输入审批理由')
    return
  }
  approving.value = true
  try {
    // 更新模型状态为审核中
    modelStore.update(approvalTargetRow.id, { status: '审核中', updatedAt: new Date().toISOString().slice(0,19).replace('T',' ') })
    // 创建共享请求
    const shareReq = {
      id: 'sharerequest_' + Date.now(),
      modelId: approvalTargetRow.id,
      applicantId: currentUser.value?.id || '',
      applicantName: currentUser.value?.name || '未知',
      reason: approvalForm.value.reason,
      status: '待审批',
      approverId: 'APPR_PENDING',
      approvedAt: null,
      createdAt: new Date().toISOString().slice(0,19).replace('T',' '),
    }
    shareRequestStore.add(shareReq)
    // 创建审批记录（可选）
    approvalRecordStore.add({
      id: 'approval_' + Date.now(),
      shareRequestId: shareReq.id,
      approverId: 'APPR_PENDING',
      action: '通过',
      comment: '自动创建',
      createdAt: new Date().toISOString().slice(0,19).replace('T',' '),
    })
    ElMessage.success('已提交审批')
    approvalDialogVisible.value = false
  } catch (e) {
    ElMessage.error('提交失败')
  } finally {
    approving.value = false
  }
}

// ========== 导出清单 ==========
function handleExport() {
  if (filteredList.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  exportRecordStore.add({
    id: 'export_' + Date.now(),
    userId: currentUser.value?.id || '',
    module: '模型清单',
    format: 'Excel',
    status: '处理中',
    filePath: `/exports/${new Date().toISOString().slice(0,10)}/模型清单.xlsx`,
    createdAt: new Date().toISOString().slice(0,19).replace('T',' '),
  })
  ElMessage.success('导出任务已创建，请前往导出记录查看')
}

// ========== 当前用户 ==========
const currentUser = computed(() => {
  const members = memberStore.memberList
  return members.length > 0 ? members[0] : { id: '', name: '' }
})

// 初始化
onMounted(() => {
  buildTreeData()
})
</script>

<style scoped lang="scss">
@use './ModelLibrary.scss' as *;
</style>