<template>
  <div class="classification-container">
    <el-card class="search-card">
      <div class="search-header">
        <el-input
          v-model="searchQuery"
          placeholder="输入关键词搜索分类"
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
        
        <el-select 
          v-model="filterCategory" 
          placeholder="选择分类" 
          clearable
          class="filter-select"
          @change="handleCategoryChange"
        >
          <el-option
            v-for="item in categoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </el-card>

    <el-card class="main-card">
      <div class="classification-list">
        <el-empty v-if="filteredData.length === 0" description="暂无相关数据" />
        
        <el-row :gutter="20" v-else>
          <el-col 
            v-for="item in paginatedData" 
            :key="item.id" 
            :xs="24" 
            :sm="12" 
            :md="8" 
            :lg="6"
          >
            <el-card class="classification-item" shadow="hover">
              <div class="item-header">
                <el-tag :type="getTagType(item.category)">{{ item.category }}</el-tag>
                <span class="item-icon">📚</span>
              </div>
              <h3 class="item-title">{{ item.title }}</h3>
              <p class="item-desc">{{ item.description }}</p>
              <div class="item-footer">
                <span class="item-date">{{ item.date }}</span>
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleViewDetail(item)"
                >知识详情</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <el-pagination
        v-if="filteredData.length > 0"
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[8, 16, 24, 32]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredData.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>

    <el-dialog v-model="detailVisible" :title="currentItem?.title" width="70%">
      <div v-if="currentItem" class="detail-content">
        <div class="detail-meta">
          <el-tag :type="getTagType(currentItem.category)">{{ currentItem.category }}</el-tag>
          <span class="detail-date">{{ currentItem.date }}</span>
        </div>
        <el-divider />
        <div class="detail-body">
          <h4>知识描述</h4>
          <p>{{ currentItem.description }}</p>
          <h4>详细内容</h4>
          <p>{{ currentItem.content }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleKnowledgeApply">应用知识</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';

// 生成更丰富的模拟数据
const generateMockData = () => {
  const categories = ['技术文档', '产品手册', '市场分析', '客户案例', '行业报告', '操作指南', '培训资料', '政策法规'];
  const mockData = [];
  
  for (let i = 1; i <= 50; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    mockData.push({
      id: i,
      title: `知识条目 ${i}`,
      description: `这是关于${category}的示例描述内容，展示了企业知识AI分类整合平台的智能分类能力。详细描述了${category}的相关信息和应用场景。`,
      content: `这是知识条目${i}的详细内容，包含了关于${category}的更多信息和细节描述。本平台通过人工智能技术自动分类整合企业知识资产，提高知识利用效率。\n\n具体内容包括:\n1. ${category}的基本概念\n2. ${category}的应用场景\n3. ${category}的最佳实践\n4. 相关案例分享\n5. 常见问题解答`,
      category,
      date: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`
    });
  }
  return mockData;
};

// 数据状态
const allData = ref([]);
const searchQuery = ref('');
const filterCategory = ref('');
const currentPage = ref(1);
const pageSize = ref(8);
const detailVisible = ref(false);
const currentItem = ref(null);

// 初始化数据
const initData = async () => {
  try {
    // 模拟API请求失败，直接使用本地数据
    allData.value = generateMockData();
  } catch (error) {
    console.error('获取知识数据失败:', error);
    ElMessage.error('获取知识数据失败，已使用本地数据');
    allData.value = generateMockData();
  }
};

// 分类选项
const categoryOptions = computed(() => {
  const categories = [...new Set(allData.value.map(item => item.category))];
  return categories.map(category => ({
    value: category,
    label: category
  }));
});

// 过滤后的数据
const filteredData = computed(() => {
  let result = [...allData.value];
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.description.toLowerCase().includes(query)
    );
  }
  
  if (filterCategory.value) {
    result = result.filter(item => item.category === filterCategory.value);
  }
  
  return result;
});

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredData.value.slice(start, end);
});

// 标签类型
const getTagType = (category) => {
  const types = ['', 'success', 'info', 'warning', 'danger'];
  const index = categoryOptions.value.findIndex(opt => opt.value === category) % types.length;
  return types[index];
};

// 事件处理
const handleSearch = () => {
  currentPage.value = 1;
};

const handleSearchClear = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

const handleCategoryChange = () => {
  currentPage.value = 1;
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

const handleViewDetail = (item) => {
  currentItem.value = item;
  detailVisible.value = true;
};

const handleKnowledgeApply = () => {
  ElMessage.success(`已应用知识: ${currentItem.value.title}`);
  detailVisible.value = false;
};

// 初始化
onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
@use './Classification.scss';
</style>