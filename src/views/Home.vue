<template>
  <div class="risk-control-container">
    <!-- 移除多余的头部和菜单导航 -->
    <el-card class="header-card">
      <div class="header-title">
        <h2>浩泽金郡智慧终端设备调度管理平台</h2>
      </div>
      <el-divider />
      <div class="header-stats">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="风险总数" :value="riskStats.total" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="高风险" :value="riskStats.high" class="high-risk" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="中风险" :value="riskStats.medium" class="medium-risk" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="低风险" :value="riskStats.low" class="low-risk" />
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 添加可视化图表 -->
    <el-card class="chart-card">
      <div class="chart-container">
        <div class="chart-item">
          <h3>风险等级分布</h3>
          <el-empty v-if="!chartData.riskLevel" description="暂无数据" />
          <PieChart v-else :data="chartData.riskLevel" />
        </div>
        <div class="chart-item">
          <h3>风险趋势分析</h3>
          <el-empty v-if="!chartData.riskTrend" description="暂无数据" />
          <LineChart v-else :data="chartData.riskTrend" />
        </div>
      </div>
    </el-card>

    <el-card class="main-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="风险管控" name="control">
          <div class="table-toolbar">
            <el-button type="primary" @click="handleAddRisk">新增风险</el-button>
            <el-button @click="handleExport">导出数据</el-button>
            <el-input
              v-model="searchQuery"
              placeholder="请输入搜索内容"
              style="width: 300px; margin-left: auto;"
              clearable
              @clear="handleSearchClear"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button icon="el-icon-search" @click="handleSearch" />
              </template>
            </el-input>
          </div>
          <el-table :data="filteredRiskList" border style="width: 100%" height="500">
            <el-table-column prop="id" label="风险ID" width="120" fixed />
            <el-table-column prop="name" label="风险名称" width="180" />
            <el-table-column prop="level" label="风险等级" width="120">
              <template #default="{ row }">
                <el-tag :type="getRiskTagType(row.level)">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="责任部门" width="150" />
            <el-table-column prop="person" label="责任人" width="120" />
            <el-table-column prop="status" label="管控状态" width="120" />
            <el-table-column prop="lastCheck" label="最近检查" width="180" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="showDetail(row)">详情</el-button>
                <el-button type="warning" size="small" @click="showWarning(row)">预警</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            class="pagination"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="riskList.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </el-tab-pane>
        <el-tab-pane label="动态预警" name="warning">
          <el-timeline>
            <el-timeline-item
              v-for="(warning, index) in warningList"
              :key="index"
              :timestamp="warning.time"
              placement="top"
            >
              <el-card>
                <h4>{{ warning.title }}</h4>
                <p>{{ warning.content }}</p>
                <el-button type="text" @click="handleWarning(warning)">处理</el-button>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="风险详情" width="50%">
      <div v-if="currentRisk">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="风险ID">{{ currentRisk.id }}</el-descriptions-item>
          <el-descriptions-item label="风险名称">{{ currentRisk.name }}</el-descriptions-item>
          <el-descriptions-item label="风险等级">
            <el-tag :type="getRiskTagType(currentRisk.level)">
              {{ currentRisk.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="责任部门">{{ currentRisk.department }}</el-descriptions-item>
          <el-descriptions-item label="责任人">{{ currentRisk.person }}</el-descriptions-item>
          <el-descriptions-item label="管控状态">{{ currentRisk.status }}</el-descriptions-item>
          <el-descriptions-item label="最近检查">{{ currentRisk.lastCheck }}</el-descriptions-item>
          <el-descriptions-item label="风险描述" :span="2">{{ currentRisk.desc }}</el-descriptions-item>
          <el-descriptions-item label="管控措施" :span="2">{{ currentRisk.measure }}</el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 预警弹窗 -->
    <el-dialog v-model="warningVisible" title="风险预警" width="40%">
      <el-form :model="warningForm" label-width="100px">
        <el-form-item label="预警类型">
          <el-select v-model="warningForm.type" placeholder="请选择预警类型">
            <el-option label="立即整改" value="urgent" />
            <el-option label="限期整改" value="timeLimit" />
            <el-option label="警示提醒" value="reminder" />
          </el-select>
        </el-form-item>
        <el-form-item label="预警内容">
          <el-input
            v-model="warningForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入预警内容"
          />
        </el-form-item>
        <el-form-item label="处理期限">
          <el-date-picker
            v-model="warningForm.deadline"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="warningVisible = false">取消</el-button>
        <el-button type="primary" @click="submitWarning">发送预警</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import PieChart from '@/components/PieChart.vue'
import LineChart from '@/components/LineChart.vue'

const activeTab = ref('control')
const detailVisible = ref(false)
const warningVisible = ref(false)
const currentRisk = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const riskStats = reactive({
  total: 0,
  high: 0,
  medium: 0,
  low: 0
})

const riskList = ref([])
const warningList = ref([])
const chartData = reactive({
  riskLevel: null,
  riskTrend: null
})

const warningForm = reactive({
  type: '',
  content: '',
  deadline: ''
})

// 计算属性 - 过滤后的风险列表
const filteredRiskList = computed(() => {
  let list = [...riskList.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.id.toLowerCase().includes(query) ||
      item.department.toLowerCase().includes(query) ||
      item.person.toLowerCase().includes(query)
    )
  }
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return list.slice(start, end)
})

const getRiskTagType = (level) => {
  switch (level) {
    case '高风险': return 'danger'
    case '中风险': return 'warning'
    case '低风险': return 'success'
    default: return 'info'
  }
}

const showDetail = (risk) => {
  currentRisk.value = risk
  detailVisible.value = true
}

const showWarning = (risk) => {
  currentRisk.value = risk
  warningForm.type = ''
  warningForm.content = `关于【${risk.name}】的风险预警通知`
  warningForm.deadline = ''
  warningVisible.value = true
}

const handleWarning = (warning) => {
  ElMessage.success(`已处理预警: ${warning.title}`)
}

const submitWarning = () => {
  if (!warningForm.type || !warningForm.content) {
    ElMessage.warning('请填写完整的预警信息')
    return
  }

  warningList.value.unshift({
    title: `风险预警: ${currentRisk.value.name}`,
    content: warningForm.content,
    time: new Date().toLocaleString()
  })

  ElMessage.success('预警发送成功')
  warningVisible.value = false
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleSearchClear = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const handleSizeChange = (val) => {
  pageSize.value = val
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

const handleAddRisk = () => {
  ElMessage.info('新增风险功能待实现')
}

const handleExport = () => {
  ElMessage.success('导出数据成功')
}

// 模拟数据加载
onMounted(() => {
  // 模拟风险统计数据
  riskStats.total = 156
  riskStats.high = 23
  riskStats.medium = 67
  riskStats.low = 66

  // 模拟风险列表数据
  riskList.value = [
    {
      id: 'R2023001',
      name: '高空作业防护缺失',
      level: '高风险',
      department: '工程部',
      person: '张三',
      status: '管控中',
      lastCheck: '2023-05-15',
      desc: '施工现场高空作业区域防护栏缺失，存在坠落风险',
      measure: '1.立即安装防护栏；2.加强现场巡查；3.作业人员佩戴安全带'
    },
    {
      id: 'R2023002',
      name: '电气线路老化',
      level: '中风险',
      department: '设备部',
      person: '李四',
      status: '整改中',
      lastCheck: '2023-05-10',
      desc: '车间部分电气线路老化，存在短路起火风险',
      measure: '1.制定更换计划；2.临时增加巡检频次；3.配备灭火器材'
    },
    {
      id: 'R2023003',
      name: '消防通道堵塞',
      level: '低风险',
      department: '安全部',
      person: '王五',
      status: '已管控',
      lastCheck: '2023-05-18',
      desc: '仓库消防通道被临时货物堵塞',
      measure: '1.立即清理通道；2.设置禁止堆放标识；3.每周检查'
    },
    // 更多模拟数据...
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `R2023${1004 + i}`,
      name: `模拟风险${i + 4}`,
      level: ['高风险', '中风险', '低风险'][Math.floor(Math.random() * 3)],
      department: ['工程部', '设备部', '安全部', '生产部'][Math.floor(Math.random() * 4)],
      person: ['张三', '李四', '王五', '赵六'][Math.floor(Math.random() * 4)],
      status: ['管控中', '整改中', '已管控'][Math.floor(Math.random() * 3)],
      lastCheck: `2023-05-${Math.floor(Math.random() * 30) + 1}`,
      desc: `这是模拟风险${i + 4}的描述内容`,
      measure: `1.措施一；2.措施二；3.措施三`
    }))
  ]

  // 模拟预警数据
  warningList.value = [
    {
      title: '电气线路老化预警',
      content: '检测到电气线路温度异常升高，请立即检查处理',
      time: '2023-05-20 09:30'
    },
    {
      title: '安全培训提醒',
      content: '本月安全培训完成率不足80%，请及时组织培训',
      time: '2023-05-18 14:15'
    }
  ]

  // 模拟图表数据
  chartData.riskLevel = {
    title: '风险等级分布',
    data: [
      { value: riskStats.high, name: '高风险' },
      { value: riskStats.medium, name: '中风险' },
      { value: riskStats.low, name: '低风险' }
    ]
  }

  chartData.riskTrend = {
    title: '风险趋势分析',
    xAxis: ['1月', '2月', '3月', '4月', '5月'],
    series: [
      {
        name: '高风险',
        data: [15, 18, 20, 22, 23]
      },
      {
        name: '中风险',
        data: [45, 50, 55, 60, 67]
      },
      {
        name: '低风险',
        data: [50, 55, 60, 62, 66]
      }
    ]
  }
})
</script>

<style lang="scss" scoped>

@use './Home.scss';

</style>