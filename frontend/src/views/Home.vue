<template>
  <div class="home-container">
    <el-header class="header">
      <span class="title">用户管理系统</span>
      <div class="user-info">
        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>
    <el-main class="main">
      <el-card>
        <template #header>
          <span>注册用户列表</span>
        </template>
        <el-table :data="users" stripe style="width:100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
                {{ row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'warning'">
                {{ row.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
        </el-table>
      </el-card>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserList } from '../api/user'

const router = useRouter()
const users = ref([])
const loading = ref(false)

onMounted(async () => {
  await fetchUsers()
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList()
    if (res.code === 200) {
      users.value = res.data
    }
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  ElMessage.success('已退出登录')
  router.push('/login')
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f0f2f5;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.title {
  font-size: 20px;
  font-weight: bold;
}
.main {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
}
</style>
