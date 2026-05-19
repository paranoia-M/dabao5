<template>
  <div class="review-page">
    <!-- 搜索区 -->
    <div class="search-area">
      <el-form :model="searchForm" inline>
        <el-form-item label="桩号">
          <el-input v-model="searchForm.pileNo" placeholder="输入桩号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="合格" value="pass" />
            <el-option label="不合格" value="fail" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" :icon="Plus" @click="handleAdd">新增记录</el-button>
      <el-button :icon="Download" @click="handleExport">导出数据</el-button>
    </div>

    <!-- 密集表格 -->
    <div class="table-container" v-loading="tableLoading">
      <el-table
        :data="tableData"
        border
        stripe
        style="width: 100%"
        :header-cell-style="{ background: '#f0f4f8', color: '#1e2832' }"
        @cell-click="handleCellClick"
      >
        <el-table-column type="index" label="序号" width="60" fixed />
        <el-table-column prop="pileNo" label="桩号" width="120" fixed>
          <template #default="{ row }">
            <el-tag>{{ row.pileNo }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="diameter" label="孔径(mm)" width="120">
          <template #default="{ row }">
            <el-input
              v-if="editingCell === row.id + '_diameter'"
              v-model="row.diameter"
              size="small"
              @blur="saveEdit(row, 'diameter')"
              @keyup.enter="saveEdit(row, 'diameter')"
              ref="editInput"
            />
            <span v-else>{{ row.diameter }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="depth" label="孔深(m)" width="120">
          <template #default="{ row }">
            <el-input
              v-if="editingCell === row.id + '_depth'"
              v-model="row.depth"
              size="small"
              @blur="saveEdit(row, 'depth')"
              @keyup.enter="saveEdit(row, 'depth')"
            />
            <span v-else>{{ row.depth }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="verticality" label="垂直度(%)" width="120">
          <template #default="{ row }">
            <el-input
              v-if="editingCell === row.id + '_verticality'"
              v-model="row.verticality"
              size="small"
              @blur="saveEdit(row, 'verticality')"
              @keyup.enter="saveEdit(row, 'verticality')"
            />
            <span v-else :class="getVerticalityClass(row.verticality)">{{ row.verticality }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sedimentThickness" label="沉渣厚度(mm)" width="140">
          <template #default="{ row }">
            <el-input
              v-if="editingCell === row.id + '_sedimentThickness'"
              v-model="row.sedimentThickness"
              size="small"
              @blur="saveEdit(row, 'sedimentThickness')"
              @keyup.enter="saveEdit(row, 'sedimentThickness')"
            />
            <span v-else>{{ row.sedimentThickness }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="success" link :icon="Check" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" link :icon="Close" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 图表联动分析 -->
    <div class="chart-section">
      <div class="chart-header">
        <h3>检测数据分布分析</h3>
        <div class="chart-actions">
          <el-button :icon="Refresh" size="small" @click="refreshChart">刷新图表</el-button>
        </div>
      </div>
      <div class="chart-container" v-loading="chartLoading">
        <div ref="chartRef" class="chart-box"></div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'add' ? '新增检测记录' : dialogMode === 'edit' ? '编辑检测记录' : '查看检测记录'"
      :width="600"
      :close-on-click-modal="false"
    >
      <el-form
        :model="formData"
        :rules="formRules"
        label-width="120px"
        :disabled="dialogMode === 'view'"
      >
        <el-form-item label="桩号" prop="pileNo">
          <el-input v-model="formData.pileNo" placeholder="请输入桩号" />
        </el-form-item>
        <el-form-item label="孔径(mm)" prop="diameter">
          <el-input-number v-model="formData.diameter" :min="0" :max="5000" />
        </el-form-item>
        <el-form-item label="孔深(m)" prop="depth">
          <el-input-number v-model="formData.depth" :min="0" :max="200" :step="0.1" />
        </el-form-item>
        <el-form-item label="垂直度(%)" prop="verticality">
          <el-input-number v-model="formData.verticality" :min="0" :max="100" :step="0.01" />
        </el-form-item>
        <el-form-item label="沉渣厚度(mm)" prop="sedimentThickness">
          <el-input-number v-model="formData.sedimentThickness" :min="0" :max="500" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="选择状态">
            <el-option label="待审核" value="pending" />
            <el-option label="合格" value="pass" />
            <el-option label="不合格" value="fail" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          v-if="dialogMode !== 'view'"
          type="primary"
          :loading="submitLoading"
          @click="handleSubmit"
        >
          {{ dialogMode === 'add' ? '新增' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 异常诊断弹窗 -->
    <el-dialog
      v-model="diagnoseVisible"
      title="数据异常诊断建议"
      :width="500"
    >
      <div class="diagnose-content">
        <el-alert
          :title="diagnoseInfo.title"
          :type="diagnoseInfo.type"
          :description="diagnoseInfo.description"
          show-icon
          :closable="false"
        />
        <div class="diagnose-suggestions">
          <h4>诊断建议：</h4>
          <ul>
            <li v-for="(item, index) in diagnoseInfo.suggestions" :key="index">{{ item }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="diagnoseVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import {
  Search,
  Refresh,
  Plus,
  Download,
  Edit,
  Check,
  Close,
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 搜索表单
const searchForm = reactive({
  pileNo: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const tableLoading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 悬浮编辑
const editingCell = ref(null)
const editInput = ref(null)

// 弹窗
const dialogVisible = ref(false)
const dialogMode = ref('add')
const formData = reactive({
  pileNo: '',
  diameter: 800,
  depth: 30,
  verticality: 0.5,
  sedimentThickness: 50,
  status: 'pending'
})
const submitLoading = ref(false)

// 异常诊断
const diagnoseVisible = ref(false)
const diagnoseInfo = reactive({
  title: '',
  type: 'warning',
  description: '',
  suggestions: []
})

// 图表
const chartRef = ref(null)
const chartLoading = ref(false)
let chartInstance = null

// 表单校验规则
const formRules = {
  pileNo: [
    { required: true, message: '请输入桩号', trigger: 'blur' },
    { min: 2, max: 20, message: '桩号长度在2-20个字符', trigger: 'blur' }
  ],
  diameter: [
    { required: true, message: '请输入孔径', trigger: 'blur' }
  ],
  depth: [
    { required: true, message: '请输入孔深', trigger: 'blur' }
  ],
  verticality: [
    { required: true, message: '请输入垂直度', trigger: 'blur' }
  ],
  sedimentThickness: [
    { required: true, message: '请输入沉渣厚度', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 生成假数据
const generateMockData = (page, size) => {
  const data = []
  const statuses = ['pending', 'pass', 'fail']
  const startIndex = (page - 1) * size

  for (let i = startIndex; i < startIndex + size; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const verticality = parseFloat((Math.random() * 3).toFixed(2))
    data.push({
      id: i + 1,
      pileNo: `PZ-${String(i + 1).padStart(4, '0')}`,
      diameter: Math.floor(Math.random() * 1200) + 600,
      depth: parseFloat((Math.random() * 80 + 10).toFixed(1)),
      verticality: verticality,
      sedimentThickness: Math.floor(Math.random() * 200) + 10,
      status: status,
      createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    })
  }
  return data
}

// 加载表格数据
const loadTableData = () => {
  tableLoading.value = true
  setTimeout(() => {
    const filteredData = generateMockData(currentPage.value, pageSize.value).filter(item => {
      let match = true
      if (searchForm.pileNo && !item.pileNo.includes(searchForm.pileNo)) {
        match = false
      }
      if (searchForm.status && item.status !== searchForm.status) {
        match = false
      }
      return match
    })
    tableData.value = filteredData
    total.value = 200
    tableLoading.value = false
  }, 500)
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  loadTableData()
}

// 重置
const handleReset = () => {
  searchForm.pileNo = ''
  searchForm.status = ''
  currentPage.value = 1
  loadTableData()
}

// 分页
const handleSizeChange = (val) => {
  pageSize.value = val
  loadTableData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  loadTableData()
}

// 单元格点击编辑
const handleCellClick = (row, column, cell, event) => {
  const editableColumns = ['diameter', 'depth', 'verticality', 'sedimentThickness']
  if (editableColumns.includes(column.property)) {
    editingCell.value = row.id + '_' + column.property
    nextTick(() => {
      const input = cell.querySelector('input')
      if (input) {
        input.focus()
        input.select()
      }
    })
  }
}

// 保存编辑
const saveEdit = (row, field) => {
  editingCell.value = null
  // 检查数据异常
  if (field === 'verticality' && row.verticality > 2) {
    diagnoseInfo.title = '垂直度异常'
    diagnoseInfo.type = 'warning'
    diagnoseInfo.description = `桩号 ${row.pileNo} 的垂直度为 ${row.verticality}%，超出规范允许范围（≤2%）`
    diagnoseInfo.suggestions = [
      '检查钻孔垂直度控制措施',
      '建议进行超声波检测验证',
      '必要时进行纠偏处理'
    ]
    diagnoseVisible.value = true
  }
  if (field === 'sedimentThickness' && row.sedimentThickness > 100) {
    diagnoseInfo.title = '沉渣厚度异常'
    diagnoseInfo.type = 'warning'
    diagnoseInfo.description = `桩号 ${row.pileNo} 的沉渣厚度为 ${row.sedimentThickness}mm，超出规范允许范围（≤100mm）`
    diagnoseInfo.suggestions = [
      '检查清孔工艺是否到位',
      '建议进行二次清孔',
      '检测泥浆性能指标'
    ]
    diagnoseVisible.value = true
  }
  ElMessage.success(`${field} 已更新`)
}

// 获取状态样式
const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    pass: 'success',
    fail: 'danger'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    pending: '待审核',
    pass: '合格',
    fail: '不合格'
  }
  return map[status] || status
}

const getVerticalityClass = (value) => {
  return value > 2 ? 'text-danger' : 'text-success'
}

// 新增
const handleAdd = () => {
  dialogMode.value = 'add'
  formData.pileNo = ''
  formData.diameter = 800
  formData.depth = 30
  formData.verticality = 0.5
  formData.sedimentThickness = 50
  formData.status = 'pending'
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row) => {
  dialogMode.value = 'edit'
  Object.assign(formData, {
    pileNo: row.pileNo,
    diameter: row.diameter,
    depth: row.depth,
    verticality: row.verticality,
    sedimentThickness: row.sedimentThickness,
    status: row.status
  })
  dialogVisible.value = true
}

// 提交
const handleSubmit = () => {
  // 手动校验
  const errors = []
  if (!formData.pileNo) errors.push('桩号不能为空')
  if (!formData.diameter) errors.push('孔径不能为空')
  if (!formData.depth) errors.push('孔深不能为空')
  if (!formData.verticality) errors.push('垂直度不能为空')
  if (!formData.sedimentThickness) errors.push('沉渣厚度不能为空')
  if (!formData.status) errors.push('状态不能为空')

  if (errors.length > 0) {
    ElMessage.warning(errors.join('；'))
    return
  }

  submitLoading.value = true
  setTimeout(() => {
    if (dialogMode.value === 'add') {
      const newRecord = {
        id: tableData.value.length + 1,
        ...formData
      }
      tableData.value.unshift(newRecord)
      total.value++
      ElMessage.success('新增成功')
    } else {
      const index = tableData.value.findIndex(item => item.pileNo === formData.pileNo)
      if (index !== -1) {
        Object.assign(tableData.value[index], formData)
        ElMessage.success('更新成功')
      }
    }
    submitLoading.value = false
    dialogVisible.value = false
  }, 500)
}

// 通过
const handleApprove = (row) => {
  ElMessageBox.confirm(`确认通过桩号 ${row.pileNo} 的检测记录？`, '确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'info'
  }).then(() => {
    row.status = 'pass'
    ElMessage.success('已通过')
  }).catch(() => {})
}

// 驳回
const handleReject = (row) => {
  ElMessageBox.confirm(`确认驳回桩号 ${row.pileNo} 的检测记录？`, '确认', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    row.status = 'fail'
    ElMessage.success('已驳回')
  }).catch(() => {})
}

// 导出
const handleExport = () => {
  ElMessage.success('数据导出中...')
  setTimeout(() => {
    ElMessage.success('导出完成')
  }, 1000)
}

// 图表
const initChart = () => {
  if (!chartRef.value) return
  chartLoading.value = true

  setTimeout(() => {
    if (chartInstance) {
      chartInstance.dispose()
    }
    chartInstance = echarts.init(chartRef.value)

    const categories = tableData.value.slice(0, 10).map(item => item.pileNo)
    const diameters = tableData.value.slice(0, 10).map(item => item.diameter)
    const depths = tableData.value.slice(0, 10).map(item => item.depth)
    const verticalities = tableData.value.slice(0, 10).map(item => item.verticality)

    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['孔径(mm)', '孔深(m)', '垂直度(%)']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '孔径(mm) / 孔深(m)'
        },
        {
          type: 'value',
          name: '垂直度(%)',
          min: 0,
          max: 5
        }
      ],
      series: [
        {
          name: '孔径(mm)',
          type: 'bar',
          data: diameters,
          itemStyle: {
            color: '#0066cc'
          }
        },
        {
          name: '孔深(m)',
          type: 'bar',
          data: depths,
          itemStyle: {
            color: '#00994c'
          }
        },
        {
          name: '垂直度(%)',
          type: 'line',
          yAxisIndex: 1,
          data: verticalities,
          itemStyle: {
            color: '#ffc107'
          },
          lineStyle: {
            width: 3
          },
          symbol: 'circle',
          symbolSize: 8
        }
      ]
    }

    chartInstance.setOption(option)
    chartLoading.value = false
  }, 500)
}

// 刷新图表
const refreshChart = () => {
  initChart()
}

// 监听表格数据变化重新渲染图表
watch(tableData, () => {
  initChart()
})

onMounted(() => {
  loadTableData()
})
</script>

<style lang='scss' scoped>
@use './table.scss';
</style>
