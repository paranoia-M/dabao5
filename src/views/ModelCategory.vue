<template>
  <div class="page-model_category">
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <el-button type="primary" @click="openAddDialog">
        <el-icon><Plus /></el-icon>
        新增分类
      </el-button>
      <div class="filter-area">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索分类名称..."
          clearable
          class="search-input"
        />
        <el-select v-model="statusFilter" placeholder="全部状态" clearable class="status-select">
          <el-option label="全部" value="" />
          <el-option label="启用" value="启用" />
          <el-option label="禁用" value="禁用" />
        </el-select>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧分类树 -->
      <div class="tree-panel">
        <div class="panel-header">分类导航</div>
        <el-tree
          :data="filteredTreeData"
          node-key="id"
          :props="{ children: 'children', label: 'label' }"
          :highlight-current="true"
          :expand-on-click-node="false"
          default-expand-all
          @node-click="handleNodeClick"
        >
          <template #default="{ node, data }">
            <span class="custom-tree-node">
              <el-tag :type="data.status === '启用' ? 'success' : 'info'" size="small" class="status-tag">
                {{ data.status === '启用' ? '启用' : '禁用' }}
              </el-tag>
              <span class="node-label">{{ data.label }}</span>
              <el-icon class="info-icon" @click.stop="openDetailDrawer(data)"><InfoFilled /></el-icon>
            </span>
          </template>
        </el-tree>
      </div>

      <!-- 右侧详情 + 关联模型 -->
      <div class="detail-panel" v-if="currentCategory">
        <div class="panel-header">分类详情
          <div class="header-actions">
            <el-button size="small" @click="openEditDialog(currentCategory)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(currentCategory)">删除</el-button>
            <el-button size="small" @click="openDetailDrawer(currentCategory)">详情</el-button>
          </div>
        </div>
        <div class="detail-grid">
          <div class="field-row">
            <span class="label">名称</span>
            <span class="value">{{ currentCategory.name }}</span>
          </div>
          <div class="field-row">
            <span class="label">编码</span>
            <span class="value">{{ currentCategory.code || '—' }}</span>
          </div>
          <div class="field-row">
            <span class="label">父级分类</span>
            <span class="value">{{ parentName(currentCategory.parentId) || '（根节点）' }}</span>
          </div>
          <div class="field-row">
            <span class="label">排序号</span>
            <span class="value">{{ currentCategory.sortOrder }}</span>
          </div>
          <div class="field-row">
            <span class="label">状态</span>
            <el-switch
              :model-value="currentCategory.status === '启用'"
              active-text="启用"
              inactive-text="禁用"
              @change="(val) => toggleStatus(currentCategory.id, val)"
            />
          </div>
          <div class="field-row full-row">
            <span class="label">描述</span>
            <span class="value">{{ currentCategory.description || '—' }}</span>
          </div>
        </div>

        <!-- 子分类 SVG 树（详情区域） -->
        <div class="subtree-section" v-if="childTreeData.length > 0">
          <div class="subtree-title">子分类结构</div>
          <div class="svg-tree-container" v-html="childTreeSvg"></div>
        </div>
        <div class="subtree-section" v-else>
          <div class="subtree-title">子分类</div>
          <el-empty description="暂无子分类" :image-size="60" />
        </div>

        <!-- 关联模型列表 -->
        <div class="related-models">
          <div class="panel-header">关联模型 ({{ relatedModels.length }})</div>
          <el-table
            :data="relatedModels"
            :row-class-name="tableRowClassName"
            stripe
            style="width: 100%"
            max-height="260"
            @row-click="handleModelRowClick"
          >
            <el-table-column prop="name" label="模型名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="code" label="编码" width="120" />
            <el-table-column prop="format" label="格式" width="80" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click.stop="viewModelDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="detail-panel empty-panel" v-else>
        <el-empty description="请从左侧选择一个分类" :image-size="100" />
      </div>
    </div>

    <!-- 新增分类 Dialog -->
    <el-dialog v-model="addDialogVisible" title="新增分类" width="min(560px, 92vw)" :close-on-click-modal="false">
      <el-form :model="addForm" :rules="addRules" ref="addFormRef" label-width="100px" label-position="top">
        <el-form-item label="父级分类" prop="parentId">
          <el-tree-select
            v-model="addForm.parentId"
            :data="allTreeData"
            :props="{ children: 'children', label: 'label', value: 'id' }"
            placeholder="选择父级分类（可选，留空为根分类）"
            filterable
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="addForm.name" maxlength="50" show-word-limit placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="addForm.code" placeholder="可选，如 CAT-001" />
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="addForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="addForm.status" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="addForm.description" type="textarea" :rows="3" placeholder="描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 编辑分类 Dialog -->
    <el-dialog v-model="editDialogVisible" title="编辑分类" width="min(560px, 92vw)" :close-on-click-modal="false">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px" label-position="top">
        <el-form-item label="父级分类" prop="parentId">
          <el-tree-select
            v-model="editForm.parentId"
            :data="allTreeData"
            :props="{ children: 'children', label: 'label', value: 'id' }"
            :filter-node-method="filterEditParentNode"
            placeholder="选择父级分类（可选）"
            filterable
            clearable
            :disabled="disableParentChange"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="editForm.name" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" prop="code">
          <el-input v-model="editForm.code" />
        </el-form-item>
        <el-form-item label="排序号" prop="sortOrder">
          <el-input-number v-model="editForm.sortOrder" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch v-model="editForm.status" active-text="启用" inactive-text="禁用" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">保存修改</el-button>
      </template>
    </el-dialog>

    <!-- 详情 Drawer -->
    <el-drawer v-model="detailDrawerVisible" :title="detailCategory?.name" size="min(500px, 85vw)" direction="rtl">
      <div class="drawer-content" v-if="detailCategory">
        <div class="detail-grid">
          <div class="field-row"><span class="label">名称</span><span class="value">{{ detailCategory.name }}</span></div>
          <div class="field-row"><span class="label">编码</span><span class="value">{{ detailCategory.code || '—' }}</span></div>
          <div class="field-row"><span class="label">父级</span><span class="value">{{ parentName(detailCategory.parentId) || '（根节点）' }}</span></div>
          <div class="field-row"><span class="label">排序</span><span class="value">{{ detailCategory.sortOrder }}</span></div>
          <div class="field-row"><span class="label">状态</span><span class="value"><el-tag :type="detailCategory.status === '启用' ? 'success' : 'info'" size="small">{{ detailCategory.status }}</el-tag></span></div>
          <div class="field-row full-row"><span class="label">描述</span><span class="value">{{ detailCategory.description || '—' }}</span></div>
          <div class="field-row full-row"><span class="label">创建时间</span><span class="value">{{ detailCategory.createdAt || '—' }}</span></div>
          <div class="field-row full-row"><span class="label">更新时间</span><span class="value">{{ detailCategory.updatedAt || '—' }}</span></div>
        </div>
        <div class="subtree-section">
          <div class="subtree-title">子分类结构</div>
          <div class="svg-tree-container" v-html="detailChildTreeSvg"></div>
        </div>
      </div>
    </el-drawer>

    <!-- 模型详情 Drawer -->
    <el-drawer v-model="modelDrawerVisible" :title="modelDetail?.name" size="min(450px, 80vw)" direction="rtl">
      <div class="drawer-content" v-if="modelDetail">
        <div class="detail-grid">
          <div class="field-row"><span class="label">编码</span><span class="value">{{ modelDetail.code }}</span></div>
          <div class="field-row"><span class="label">格式</span><span class="value">{{ modelDetail.format }}</span></div>
          <div class="field-row"><span class="label">状态</span><span class="value"><el-tag :type="statusTagType(modelDetail.status)" size="small">{{ modelDetail.status }}</el-tag></span></div>
          <div class="field-row"><span class="label">文件大小</span><span class="value">{{ modelDetail.fileSize ? modelDetail.fileSize.toLocaleString() + ' KB' : '—' }}</span></div>
          <div class="field-row full-row"><span class="label">描述</span><span class="value">{{ modelDetail.description || '—' }}</span></div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, InfoFilled } from '@element-plus/icons-vue'
import { useModelCategoryStore } from '@/stores/modelCategory'
import { useModelStore } from '@/stores/model'
import { useTeamMemberStore } from '@/stores/teamMember'

// Stores
const categoryStore = useModelCategoryStore()
const modelStore = useModelStore()
const memberStore = useTeamMemberStore()

// 直接读种子数据
const categoryList = categoryStore.categoryList
const modelList = modelStore.modelList

// ---------- 筛选 ----------
const searchKeyword = ref('')
const statusFilter = ref('')

// ---------- 构建过滤后的树数据 ----------
const filteredTreeData = computed(() => {
  const keyword = searchKeyword.value?.trim().toLowerCase() || ''
  const status = statusFilter.value // '' 表示全部
  // 获取匹配节点 id 集合（包括祖先）
  const matchedIds = new Set()
  function addAncestors(nodeId, depth = 0) {
    if (!nodeId || depth >= 50) return
    matchedIds.add(nodeId)
    const node = categoryList.find(c => c.id === nodeId)
    if (node && node.parentId) {
      addAncestors(node.parentId, depth + 1)
    }
  }
  categoryList.forEach(cat => {
    const nameMatch = !keyword || cat.name.toLowerCase().includes(keyword)
    const statusMatch = !status || cat.status === status
    if (nameMatch && statusMatch) {
      addAncestors(cat.id)
    }
  })
  // 构建树（只保留匹配节点）
  function buildChildren(parentId, depth = 0) {
    if (depth >= 20) return []
    return categoryList
      .filter(c => c.parentId === parentId && matchedIds.has(c.id))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id,
        label: c.name,
        code: c.code,
        status: c.status,
        sortOrder: c.sortOrder,
        description: c.description,
        parentId: c.parentId,
        children: buildChildren(c.id, depth + 1)
      }))
  }
  // 根节点：parentId 不在 matchedIds 中（或没有父节点）
  const allParentIds = new Set(categoryList.map(c => c.id))
  return categoryList
    .filter(c => matchedIds.has(c.id) && (!c.parentId || !matchedIds.has(c.parentId)))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(c => ({
      id: c.id,
      label: c.name,
      code: c.code,
      status: c.status,
      sortOrder: c.sortOrder,
      description: c.description,
      parentId: c.parentId,
      children: buildChildren(c.id)
    }))
})

// ---------- 全部树数据（不过滤，用于选择父级） ----------
const allTreeData = computed(() => {
  function buildChildren(parentId, depth = 0) {
    if (depth >= 20) return []
    return categoryList
      .filter(c => c.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(c => ({
        id: c.id,
        label: c.name,
        code: c.code,
        status: c.status,
        sortOrder: c.sortOrder,
        description: c.description,
        parentId: c.parentId,
        children: buildChildren(c.id, depth + 1)
      }))
  }
  const rootNodes = categoryList
    .filter(c => !c.parentId || !categoryList.some(p => p.id === c.parentId))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(c => ({
      id: c.id,
      label: c.name,
      code: c.code,
      status: c.status,
      sortOrder: c.sortOrder,
      description: c.description,
      parentId: c.parentId,
      children: buildChildren(c.id)
    }))
  return rootNodes
})

// ---------- 选中节点 ----------
const selectedId = ref(categoryList.length > 0 ? categoryList[0].id : '')
const currentCategory = computed(() => {
  return categoryStore.findById(selectedId.value) || categoryList[0] || null
})
function handleNodeClick(data) {
  selectedId.value = data.id
}

// 获取父级名称
function parentName(parentId) {
  if (!parentId) return ''
  const parent = categoryList.find(c => c.id === parentId)
  return parent ? parent.name : ''
}

// ---------- 状态切换 ----------
function toggleStatus(id, val) {
  const newStatus = val ? '启用' : '禁用'
  categoryStore.update(id, { status: newStatus })
  ElMessage.success('状态已更新')
}

// ---------- 删除 ----------
function handleDelete(cat) {
  // 检查子分类
  const hasChildren = categoryList.some(c => c.parentId === cat.id)
  if (hasChildren) {
    ElMessage.warning('请先删除子分类')
    return
  }
  // 检查关联模型
  const hasModels = modelList.some(m => m.categoryId === cat.id)
  if (hasModels) {
    ElMessage.warning('该分类下有模型资产，无法删除')
    return
  }
  ElMessageBox.confirm(`确定删除分类「${cat.name}」吗？`, '确认删除', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    categoryStore.remove(cat.id)
    ElMessage.success('分类已删除')
    // 如果删除的是当前选中，重置选中
    if (selectedId.value === cat.id) {
      selectedId.value = categoryList.length > 0 ? categoryList[0].id : ''
    }
  }).catch(() => {})
}

// ---------- 新增 Dialog ----------
const addDialogVisible = ref(false)
const addFormRef = ref(null)
const addForm = ref({
  parentId: '',
  name: '',
  code: '',
  sortOrder: 0,
  status: true, // switch绑定
  description: ''
})
const addRules = {
  name: [
    { required: true, message: '分类名称不可为空', trigger: 'blur' },
    { max: 50, message: '不超过50字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      const parentId = addForm.value.parentId || ''
      const exist = categoryList.some(c => c.parentId === parentId && c.name === value)
      if (exist) {
        callback(new Error('分类名称已存在，请重新输入'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}
function openAddDialog() {
  addForm.value = { parentId: '', name: '', code: '', sortOrder: 0, status: true, description: '' }
  addDialogVisible.value = true
}
function submitAdd() {
  addFormRef.value.validate((valid) => {
    if (!valid) return
    const newCat = {
      name: addForm.value.name,
      code: addForm.value.code || '',
      parentId: addForm.value.parentId || '',
      sortOrder: addForm.value.sortOrder,
      status: addForm.value.status ? '启用' : '禁用',
      description: addForm.value.description || ''
    }
    categoryStore.add(newCat)
    addDialogVisible.value = false
    ElMessage.success('分类已新增')
  })
}

// ---------- 编辑 Dialog ----------
const editDialogVisible = ref(false)
const editFormRef = ref(null)
const editForm = ref({})
const disableParentChange = ref(false)

function openEditDialog(cat) {
  // 检查是否可以修改父级
  disableParentChange.value = modelList.some(m => m.categoryId === cat.id)
  editForm.value = {
    id: cat.id,
    parentId: cat.parentId || '',
    name: cat.name,
    code: cat.code || '',
    sortOrder: cat.sortOrder,
    status: cat.status === '启用',
    description: cat.description || ''
  }
  editDialogVisible.value = true
}
const editRules = {
  name: [
    { required: true, message: '分类名称不可为空', trigger: 'blur' },
    { max: 50, message: '不超过50字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      const parentId = editForm.value.parentId || ''
      const exist = categoryList.some(c => c.parentId === parentId && c.name === value && c.id !== editForm.value.id)
      if (exist) {
        callback(new Error('分类名称已存在，请重新输入'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}
function filterEditParentNode(value, data) {
  if (!value) return true
  return data.label.toLowerCase().includes(value.toLowerCase())
}
function submitEdit() {
  editFormRef.value.validate((valid) => {
    if (!valid) return
    const patch = {
      name: editForm.value.name,
      code: editForm.value.code || '',
      parentId: editForm.value.parentId || '',
      sortOrder: editForm.value.sortOrder,
      status: editForm.value.status ? '启用' : '禁用',
      description: editForm.value.description || ''
    }
    categoryStore.update(editForm.value.id, patch)
    editDialogVisible.value = false
    ElMessage.success('分类已更新')
  })
}

// ---------- 详情 Drawer ----------
const detailDrawerVisible = ref(false)
const detailCategory = ref(null)
function openDetailDrawer(data) {
  detailCategory.value = categoryStore.findById(data.id) || data
  detailDrawerVisible.value = true
}

// 子分类 SVG 树生成（详情面板使用）
function buildChildTreeSvg(category, depth = 0, maxDepth = 3) {
  if (!category) return ''
  const children = categoryList.filter(c => c.parentId === category.id).sort((a, b) => a.sortOrder - b.sortOrder)
  if (children.length === 0 || depth >= maxDepth) return ''
  // 简单垂直树布局
  const nodeWidth = 130
  const nodeHeight = 34
  const xGap = 10
  const yGap = 50
  const startX = 20
  const startY = 30
  const svgW = 320
  const svgH = 300
  let svg = `<svg width="${svgW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">`
  // 递归函数
  function drawNode(node, x, y, level) {
    // 矩形
    svg += `<rect x="${x}" y="${y}" width="${nodeWidth}" height="${nodeHeight}" rx="6" ry="6" fill="#fff" stroke="#52525B" stroke-width="1.5" />`
    svg += `<text x="${x + nodeWidth/2}" y="${y + nodeHeight/2 + 5}" text-anchor="middle" font-size="12" fill="#333">${node.name}</text>`
    const childNodes = categoryList.filter(c => c.parentId === node.id).sort((a, b) => a.sortOrder - b.sortOrder)
    if (childNodes.length > 0 && level < maxDepth) {
      const childXStart = x - (childNodes.length - 1) * (nodeWidth + xGap) / 2
      childNodes.forEach((child, idx) => {
        const childX = childXStart + idx * (nodeWidth + xGap)
        const childY = y + nodeHeight + yGap
        // 连线
        svg += `<line x1="${x + nodeWidth/2}" y1="${y + nodeHeight}" x2="${childX + nodeWidth/2}" y2="${childY}" stroke="#52525B" stroke-width="1.5" />`
        drawNode(child, childX, childY, level + 1)
      })
    }
  }
  // 从 category 本身开始绘制（作为根）
  const rootX = 20
  const rootY = 10
  // 根节点不画，画子节点
  if (children.length > 0) {
    const childXStart = rootX + (svgW - 2*rootX - (children.length * nodeWidth + (children.length-1)*xGap)) / 2
    children.forEach((child, idx) => {
      const cx = childXStart + idx * (nodeWidth + xGap)
      const cy = rootY + nodeHeight + yGap
      // 从顶部中心连线
      svg += `<line x1="${rootX + nodeWidth/2}" y1="${rootY + nodeHeight}" x2="${cx + nodeWidth/2}" y2="${cy}" stroke="#52525B" stroke-width="1.5" />`
      drawNode(child, cx, cy, 1)
    })
  }
  svg += '</svg>'
  return svg
}
const childTreeData = computed(() => {
  if (!currentCategory.value) return []
  return categoryList.filter(c => c.parentId === currentCategory.value.id).sort((a, b) => a.sortOrder - b.sortOrder)
})
const childTreeSvg = computed(() => buildChildTreeSvg(currentCategory.value))
const detailChildTreeSvg = computed(() => buildChildTreeSvg(detailCategory.value))

// ---------- 关联模型 ----------
const relatedModels = computed(() => {
  if (!selectedId.value) return []
  return modelList.filter(m => m.categoryId === selectedId.value)
})

function tableRowClassName({ row }) {
  const status = row.status
  const map = { '草稿': 'draft', '审核中': 'pending', '已发布': 'published', '已归档': 'archived', '已删除': 'deleted' }
  return `status-row-${map[status] || 'draft'}`
}
function statusTagType(status) {
  const map = { '草稿': 'info', '审核中': 'warning', '已发布': 'success', '已归档': '', '已删除': 'danger' }
  return map[status] || 'info'
}

// ---------- 模型详情 Drawer ----------
const modelDrawerVisible = ref(false)
const modelDetail = ref(null)
function viewModelDetail(model) {
  modelDetail.value = model
  modelDrawerVisible.value = true
}
function handleModelRowClick(row) {
  viewModelDetail(row)
}

// ---------- watch 筛选重置 ----------
watch([searchKeyword, statusFilter], () => {
  // 自动触发 computed 更新
})
</script>

<style scoped lang="scss">
@use './ModelCategory.scss' as *;
</style>