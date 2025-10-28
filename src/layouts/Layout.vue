
        <template>
            <el-container class="layout-container">
                <el-aside width="220px" class="sidebar">
                    <div class="logo">
                        <span class="logo-icon">🌱</span>
                        <span class="logo-text">航清智慧环保数据采集分析系统</span>
                    </div>
                    <el-menu
                        :default-active="activeMenu"
                        class="el-menu-vertical"
                        background-color="#f5f7fa"
                        text-color="#333"
                        active-text-color="#ffffff"
                        active-background-color="#409EFF"
                        router
                        @select="handleMenuSelect"
                    >
                        <el-menu-item index="/" route="/">
                            <span class="menu-item">
                                <span class="menu-icon">🏠</span>
                                <span>首页</span>
                            </span>
                        </el-menu-item>
                        <el-menu-item index="/monitoring" route="/monitoring">
                            <span class="menu-item">
                                <span class="menu-icon">📊</span>
                                <span>监测中心</span>
                            </span>
                        </el-menu-item>
                        <el-menu-item index="/alarm" route="/alarm">
                            <span class="menu-item">
                                <span class="menu-icon">🚨</span>
                                <span>告警管理</span>
                            </span>
                        </el-menu-item>
                        <el-menu-item index="/statistics" route="/statistics">
                            <span class="menu-item">
                                <span class="menu-icon">📈</span>
                                <span>统计分析</span>
                            </span>
                        </el-menu-item>
                        <el-menu-item index="/settings" route="/settings">
                            <span class="menu-item">
                                <span class="menu-icon">⚙️</span>
                                <span>系统设置</span>
                            </span>
                        </el-menu-item>
                    </el-menu>
                </el-aside>
                <el-container>
                    <el-header class="header">
                        <div class="header-right">
                            <el-button type="primary" plain @click="handleLogout">退出登录</el-button>
                        </div>
                    </el-header>
                    <el-main class="main-content">
                        <RouterView />
                    </el-main>
                </el-container>
            </el-container>
        </template>

        <script setup>
        import { computed } from 'vue'
        import { useRoute, useRouter } from 'vue-router'

        const route = useRoute()
        const router = useRouter()

        const activeMenu = computed(() => {
            return route.path
        })

        const handleMenuSelect = (index) => {
            router.push(index)
        }

        const handleLogout = async () => {
            localStorage.clear()
            await router.push('/login')
        }
        </script>

        <style lang="scss" scoped>


        @use './Layout.scss';
        

</style>
    