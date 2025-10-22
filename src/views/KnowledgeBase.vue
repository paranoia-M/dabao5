<template>
  <div class="knowledge-base-container">
    <div class="header">
      <h1 class="platform-title"></h1>
      <div class="platform-subtitle">AI驱动的知识管理与智能分类系统</div>
      
      <div class="search-bar">
        <el-input
          v-model="searchQuery"
          placeholder="输入关键词搜索知识内容"
          clearable
          class="knowledge-search"
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button class="search-btn" @click="handleSearch">智能搜索</el-button>
          </template>
        </el-input>
        <el-button type="primary" class="add-btn" @click="showAddDialog">
          新增知识
        </el-button>
      </div>
    </div>

    <div class="filter-section">
      <div class="filter-title">智能筛选</div>
      <div class="filter-controls">
        <el-select v-model="categoryFilter" placeholder="知识分类" clearable class="category-select">
          <el-option
            v-for="item in categories"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        
        <el-select v-model="tagFilter" placeholder="知识标签" clearable multiple class="tag-select">
          <el-option
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
        
        <el-button type="info" plain @click="resetFilters" class="reset-btn">
          重置筛选条件
        </el-button>
      </div>
    </div>

    <div class="knowledge-list">
      <div class="list-header">
        <span class="list-title">知识条目</span>
        <span class="list-count">共 {{ totalItems }} 条知识</span>
      </div>
      
      <el-table :data="paginatedKnowledge" style="width: 100%" v-loading="loading" class="knowledge-table">
        <el-table-column prop="title" label="知识标题" width="220" />
        <el-table-column prop="category" label="知识分类" width="150">
          <template #default="{ row }">
            <span class="category-badge">{{ getCategoryLabel(row.category) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="tags" label="智能标签" width="220">
          <template #default="{ row }">
            <el-tag 
              v-for="tag in row.tags" 
              :key="tag" 
              size="small" 
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容摘要" class-name="content-cell" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" class="edit-btn" @click="handleEdit(row)">编辑内容</el-button>
            <el-button size="small" type="danger" class="delete-btn" @click="handleDelete(row)">删除条目</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination 
          v-model:current-page="currentPage" 
          v-model:page-size="pageSize" 
          :page-sizes="[10, 20, 30, 50]" 
          layout="总条数: total, 每页条数: sizes, 上一页, 页码, 下一页, 跳转到: jumper" 
          :total="totalItems" 
          @size-change="handleSizeChange" 
          @current-change="handleCurrentChange"
          class="custom-pagination"
        />
      </div>
    </div>

    <!-- 知识编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="50%"
      :before-close="handleClose"
      class="knowledge-dialog"
    >
      <el-form :model="formData" label-width="100px" class="knowledge-form">
        <el-form-item label="知识标题" required>
          <el-input v-model="formData.title" placeholder="请输入知识标题" />
        </el-form-item>
        
        <el-form-item label="知识分类" required>
          <el-select v-model="formData.category" placeholder="请选择知识分类" class="dialog-select">
            <el-option 
              v-for="item in categories" 
              :key="item.value" 
              :label="item.label" 
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="智能标签">
          <el-select 
            v-model="formData.tags" 
            multiple 
            filterable 
            allow-create 
            placeholder="请选择或输入标签"
            class="dialog-tags"
          >
            <el-option 
              v-for="tag in tags" 
              :key="tag" 
              :label="tag" 
              :value="tag"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="知识内容" required>
          <el-input v-model="formData.content" type="textarea" :rows="6" placeholder="请输入知识详细内容" class="content-textarea" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消操作</el-button>
          <el-button type="primary" @click="submitForm" class="confirm-btn">
            {{ isEditMode ? '更新知识' : '添加知识' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- AI智能推荐弹窗 -->
    <el-dialog
      v-model="showRecommendation"
      title="AI智能推荐"
      width="40%"
      class="recommend-dialog"
    >
      <div class="recommend-content">
        <div class="recommend-title">基于您当前编辑的内容，AI推荐以下相关知识点：</div>
        <ul class="recommend-list">
          <li v-for="(item, index) in recommendedKnowledge" :key="index" class="recommend-item">
            <div class="recommend-item-title">{{ item.title }}</div>
            <div class="recommend-item-content">{{ item.content }}</div>
          </li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="showRecommendation = false" class="close-recommend">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 假数据
const mockKnowledge = [
  {
    id: 1,
    title: '人工智能基础知识',
    category: 'AI',
    tags: ['机器学习', '深度学习'],
    content: '人工智能是研究、开发用于模拟、延伸和扩展人的智能的理论、方法、技术及应用系统的一门新的技术科学。',
    updateTime: '2023-05-15 10:30'
  },
  {
    id: 2,
    title: '企业知识管理规范',
    category: '管理',
    tags: ['规范', '流程'],
    content: '企业知识管理是指通过系统的方法发现、选择、组织、摘取信息，并向需要知识的人传递有用的信息。',
    updateTime: '2023-06-20 14:15'
  },
  {
    id: 3,
    title: '数据分类标准',
    category: '数据',
    tags: ['分类', '标准'],
    content: '数据分类是根据数据的属性或特征，按照一定的原则和方法进行区分和归类，并建立起一定的分类体系和排列顺序。',
    updateTime: '2023-07-10 09:45'
  },
  {
    id: 4,
    title: '智能分类算法',
    category: 'AI',
    tags: ['算法', '分类'],
    content: '智能分类算法是指利用机器学习、深度学习等技术实现自动分类的方法，如决策树、支持向量机、神经网络等。',
    updateTime: '2023-08-05 16:20'
  },
  {
    id: 5,
    title: '知识整合平台架构',
    category: '技术',
    tags: ['架构', '平台'],
    content: '知识整合平台通常采用微服务架构，包含知识采集、存储、处理、检索和展示等核心模块。',
    updateTime: '2023-09-12 11:10'
  }
];

// 分类选项
const categories = [
  { value: 'AI', label: '人工智能' },
  { value: '数据', label: '数据管理' },
  { value: '管理', label: '知识管理' },
  { value: '技术', label: '技术架构' }
];

// 获取分类标签
const getCategoryLabel = (value) => {
  const category = categories.find(item => item.value === value);
  return category ? category.label : value;
};

// 所有标签
const tags = ref(['机器学习', '深度学习', '规范', '流程', '分类', '标准', '算法', '架构', '平台']);

// 搜索和筛选
const searchQuery = ref('');
const categoryFilter = ref('');
const tagFilter = ref([]);

// 分页
const currentPage = ref(1);
const pageSize = ref(10);
const totalItems = computed(() => filteredKnowledge.value.length);

// 加载状态
const loading = ref(false);

// 对话框相关
const dialogVisible = ref(false);
const dialogTitle = ref('添加知识');
const isEditMode = ref(false);
const currentEditId = ref(null);

// AI推荐相关
const showRecommendation = ref(false);
const recommendedKnowledge = ref([]);

// 表单数据
const formData = ref({
  title: '',
  category: '',
  tags: [],
  content: ''
});

// 知识列表
const knowledgeList = ref([...mockKnowledge]);

// 过滤后的知识列表
const filteredKnowledge = computed(() => {
  let result = [...knowledgeList.value];
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.content.toLowerCase().includes(query)
    );
  }
  
  // 分类过滤
  if (categoryFilter.value) {
    result = result.filter(item => item.category === categoryFilter.value);
  }
  
  // 标签过滤
  if (tagFilter.value.length > 0) {
    result = result.filter(item => 
      tagFilter.value.every(tag => item.tags.includes(tag))
    );
  }
  
  return result;
});

// 分页处理
const paginatedKnowledge = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredKnowledge.value.slice(start, end);
});

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1;
  // 模拟AI搜索增强
  if (searchQuery.value) {
    ElMessage.success(`智能搜索完成，找到${filteredKnowledge.value.length}条相关知识点`);
  }
};

const handleSearchClear = () => {
  searchQuery.value = '';
  currentPage.value = 1;
};

// 重置筛选
const resetFilters = () => {
  searchQuery.value = '';
  categoryFilter.value = '';
  tagFilter.value = [];
  currentPage.value = 1;
  ElMessage.success('筛选条件已重置');
};

// 分页变化
const handleSizeChange = (val) => {
  pageSize.value = val;
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
};

// 显示添加对话框
const showAddDialog = () => {
  dialogTitle.value = '添加知识';
  isEditMode.value = false;
  formData.value = {
    title: '',
    category: '',
    tags: [],
    content: ''
  };
  dialogVisible.value = true;
};

// 编辑知识
const handleEdit = (row) => {
  dialogTitle.value = '编辑知识';
  isEditMode.value = true;
  currentEditId.value = row.id;
  formData.value = {
    title: row.title,
    category: row.category,
    tags: [...row.tags],
    content: row.content
  };
  dialogVisible.value = true;
  
  // 模拟AI推荐相关知识点
  setTimeout(() => {
    recommendedKnowledge.value = knowledgeList.value
      .filter(item => item.id !== row.id && 
        (item.category === row.category || 
         item.tags.some(tag => row.tags.includes(tag))))
      .slice(0, 3);
    
    if (recommendedKnowledge.value.length > 0) {
      showRecommendation.value = true;
    }
  }, 500);
};

// 删除知识
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除知识"${row.title}"吗?`, '删除确认', {
    confirmButtonText: '确认删除',
    cancelButtonText: '取消操作',
    type: 'warning',
    customClass: 'delete-confirm'
  }).then(() => {
    knowledgeList.value = knowledgeList.value.filter(item => item.id !== row.id);
    ElMessage.success('知识删除成功');
  }).catch(() => {
    ElMessage.info('已取消删除操作');
  });
};

// 提交表单
const submitForm = () => {
  if (!formData.value.title || !formData.value.category || !formData.value.content) {
    ElMessage.warning('请填写完整知识信息');
    return;
  }
  
  if (isEditMode.value) {
    // 编辑模式
    const index = knowledgeList.value.findIndex(item => item.id === currentEditId.value);
    if (index !== -1) {
      knowledgeList.value[index] = {
        id: currentEditId.value,
        title: formData.value.title,
        category: formData.value.category,
        tags: formData.value.tags,
        content: formData.value.content,
        updateTime: new Date().toLocaleString()
      };
      ElMessage.success('知识更新成功');
    }
  } else {
    // 添加模式
    const newId = Math.max(...knowledgeList.value.map(item => item.id)) + 1;
    knowledgeList.value.push({
      id: newId,
      title: formData.value.title,
      category: formData.value.category,
      tags: formData.value.tags,
      content: formData.value.content,
      updateTime: new Date().toLocaleString()
    });
    ElMessage.success('知识添加成功');
  }
  
  dialogVisible.value = false;
};

// 对话框关闭
const handleClose = (done) => {
  ElMessageBox.confirm('确定要放弃当前编辑的内容吗?', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    done();
  }).catch(() => {
    // 取消关闭
  });
};

// 内容变化时触发AI推荐
watch(() => formData.value.content, (newVal) => {
  if (newVal && newVal.length > 20 && isEditMode.value) {
    // 模拟AI分析内容
    setTimeout(() => {
      recommendedKnowledge.value = knowledgeList.value
        .filter(item => item.id !== currentEditId.value && 
          item.content.includes(newVal.substring(0, 10)))
        .slice(0, 2);
    }, 800);
  }
});

// 模拟加载
onMounted(() => {
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    ElMessage.success('知识库加载完成');
  }, 800);
});
</script>

<style lang="scss" scoped>

@use './KnowledgeBase.scss';

</style>