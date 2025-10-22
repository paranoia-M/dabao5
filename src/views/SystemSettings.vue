
<template>
  <div class="audit-container">
    <el-card class="audit-card" shadow="hover">
      <div class="header">
        <h2 class="title">网络通信网关调节配置管理系统</h2>
        <div class="search-filter">
          <el-input 
            v-model="searchQuery" 
            placeholder="请输入关键词搜索审计记录" 
            clearable 
            style="width: 300px"
            @clear="handleSearchClear"
          >
            <template #append>
              <el-button @click="handleSearch">
                <span class="search-text">搜索</span>
              </el-button>
            </template>
          </el-input>
          
          <el-select 
            v-model="filterValue" 
            placeholder="请选择安全等级" 
            clearable
            style="margin-left: 15px; width: 180px"
          >
            <el-option 
              v-for="item in filterOptions" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value" 
            />
          </el-select>
        </div>
      </div>
      
      <el-table 
        :data="filteredAuditData" 
        border 
        style="width: 100%" 
        v-loading="loading"
        stripe
        highlight-current-row
      >
        <el-table-column prop="id" label="事件ID" width="80" align="center" />
        <el-table-column prop="eventType" label="事件类型" width="150" />
        <el-table-column prop="sourceIP" label="源IP地址" width="150" />
        <el-table-column prop="target" label="目标对象" width="200" />
        <el-table-column prop="timestamp" label="发生时间" width="180" />
        <el-table-column prop="severity" label="安全等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag 
              :type="getSeverityTagType(row.severity)"
              :effect="row.severity === '严重' ? 'dark' : 'light'"
            >
              {{ row.severity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="details" label="事件详情" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleDetail(row)"
              plain
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
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
    </el-card>
    
    <!-- 详情对话框 -->
    <el-dialog 
      v-model="detailDialogVisible" 
      title="网络安全事件详情" 
      width="50%"
      custom-class="audit-detail-dialog"
    >
      <div class="detail-content">
        <el-descriptions 
          :column="1" 
          border
          size="large"
        >
          <el-descriptions-item label="事件ID">
            <span class="detail-value">{{ currentDetail.id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="事件类型">
            <span class="detail-value">{{ currentDetail.eventType }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="源IP地址">
            <span class="detail-value">{{ currentDetail.sourceIP }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="目标对象">
            <span class="detail-value">{{ currentDetail.target }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="发生时间">
            <span class="detail-value">{{ currentDetail.timestamp }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="安全等级">
            <el-tag :type="getSeverityTagType(currentDetail.severity)" :effect="currentDetail.severity === '严重' ? 'dark' : 'light'">
              {{ currentDetail.severity }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="详细信息">
            <div class="detail-text">{{ currentDetail.details }}</div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="handleExport(currentDetail)">导出报告</el-button>
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 假数据生成
const generateMockData = () => {
  const eventTypes = ['非法登录尝试', '敏感文件访问', '系统配置变更', '网络异常流量', '权限异常变更', '数据泄露风险', '恶意软件活动'];
  const severities = ['低', '中', '高', '严重'];
  const mockData = [];
  
  for (let i = 1; i <= 50; i++) {
    const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    const isInternal = Math.random() > 0.5;
    
    mockData.push({
      id: i,
      eventType: randomEvent,
      sourceIP: isInternal ? `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` 
               : `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      target: randomEvent.includes('登录') ? 'SSH服务' : 
              randomEvent.includes('文件') ? '/var/log/secure' : 
              randomEvent.includes('配置') ? '防火墙规则' : 
              randomEvent.includes('流量') ? '端口:8080' : 
              randomEvent.includes('权限') ? '用户权限' : '数据库',
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toLocaleString(),
      severity: randomSeverity,
      details: `检测到${randomEvent}事件，来自${isInternal ? '内部网络' : '外部网络'}，安全等级为${randomSeverity}。${randomSeverity === '严重' ? '建议立即处理！' : '请及时关注处理。'}`
    });
  }
  
  return mockData;
};

// 状态管理
const loading = ref(false);
const auditData = ref([]);
const searchQuery = ref('');
const filterValue = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const detailDialogVisible = ref(false);
const currentDetail = ref({});

// 筛选选项
const filterOptions = [
  { value: '低', label: '低风险' },
  { value: '中', label: '中风险' },
  { value: '高', label: '高风险' },
  { value: '严重', label: '严重风险' }
];

// 获取安全等级对应的标签类型
const getSeverityTagType = (severity) => {
  switch (severity) {
    case '低': return 'success';
    case '中': return 'warning';
    case '高': return 'danger';
    case '严重': return 'danger';
    default: return 'info';
  }
};

// 计算属性 - 过滤后的数据
const filteredAuditData = computed(() => {
  let result = auditData.value;
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.eventType.toLowerCase().includes(query) || 
      item.sourceIP.toLowerCase().includes(query) || 
      item.target.toLowerCase().includes(query) || 
      item.details.toLowerCase().includes(query)
    );
  }
  
  // 等级过滤
  if (filterValue.value) {
    result = result.filter(item => item.severity === filterValue.value);
  }
  
  // 更新总数
  total.value = result.length;
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  
  return result.slice(start, end);
});

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1;
  console.log('执行安全审计记录搜索:', searchQuery.value);
};

// 处理搜索清除
const handleSearchClear = () => {
  currentPage.value = 1;
  console.log('已清除搜索条件');
};

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val;
  console.log('分页大小变更为:', val);
};

// 处理当前页变化
const handleCurrentChange = (val) => {
  currentPage.value = val;
  console.log('当前页码变更为:', val);
};

// 查看详情
const handleDetail = (row) => {
  currentDetail.value = { ...row };
  detailDialogVisible.value = true;
  console.log('查看安全事件详情:', row.id);
};

// 导出报告
const handleExport = (row) => {
  console.log('导出安全事件报告:', row.id);
  alert(`已生成安全事件${row.id}的审计报告，可下载查看详细分析`);
};

// 初始化数据
onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    auditData.value = generateMockData();
    total.value = auditData.value.length;
    loading.value = false;
    console.log('网络安全审计数据加载完成');
  }, 800);
});
</script>

<style lang="scss" scoped>

@use './SystemSettings.scss';

</style>
