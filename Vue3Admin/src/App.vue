<script lang="ts" setup>
import {useUserStoreHook} from "@/stores/modules/users";
import router from "@/router";
import {useRoute} from "vue-router";
import {getBusinessInfo} from "@/serve/InfoGet/InfoGet";
import {ElMessage} from "element-plus";
import {onMounted, ref, computed} from "vue";
import {createShop} from "@/serve/Business/business";
const userStore = useUserStoreHook();
const route = useRoute();
const isAdmin=ref(false)
const isBusiness=ref(false)
onMounted(async ()=>{
  await userStore.getUserInfo();
  isAdmin.value=userStore.roles.includes('Admin')
  isBusiness.value=userStore.roles.includes('Business')
})
const form =ref({
  Bname:'',
  description:'',
})
const menuRef = ref<any>();
const isShow = ref(false);
</script>
<template>
  <header class="top-header">
    <div class="header-left">
      <div class="logo-area" @click="router.push('/')">
        <img class="logo-img" src="/favicon.ico" alt="logo" />
        <span class="logo-text">Vue3Admin</span>
      </div>
      <nav class="nav-links">
        <span class="nav-item" :class="{ active: route.path === '/' }" @click="router.push('/')">首页</span>
        <span class="nav-item" :class="{ active: route.path === '/chat' }" @click="router.push('/chat')">AI助手</span>
      </nav>
    </div>
    <div class="header-right">
      <template v-if="userStore.token">
        <el-dropdown trigger="click">
          <span class="user-avatar-area">
            <el-avatar class="user-avatar" :size="32" :src="userStore.avatar" />
            <span class="user-name">{{ userStore.username || '用户' }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="router.push('/mine')">
                <div class="font-drop">个人中心</div>
              </el-dropdown-item>
              <el-dropdown-item v-if="isAdmin" @click="router.push('/control')">
                <div class="font-drop">管理界面</div>
              </el-dropdown-item>
              <el-dropdown-item v-if="isBusiness" @click="async()=>{
                const bid = await getBusinessInfo();
                if(bid.data.results.length){
                  await router.push({name:'businessControl',params:{Bid:bid.data.results[0]?.Bid}})
                } else {
                  ElMessage.warning('您还未创建店铺,请先创建');
                  isShow = true;
                }
              }">
                <div class="font-drop">商店管理</div>
              </el-dropdown-item>
              <el-dropdown-item divided @click="userStore.logout();router.push('/login')">
                <div class="font-drop">退出登录</div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
      <template v-else>
        <span class="login-link" @click="router.push('/login')">登录</span>
      </template>
    </div>
  </header>

  <el-dialog
      v-model="isShow"
      title="商店创建"
      :before-close="()=>{isShow = false}">
    <el-form v-model="form" @submit.prevent="createShop(form);isShow=false">
      <el-form-item label="店铺名称">
        <el-input v-model="form.Bname"></el-input>
      </el-form-item>
      <el-form-item label="店铺描述">
        <el-input type="textarea" v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item style="padding: 7%"  >
        <el-button type="primary" native-type="submit">创建</el-button>
        <el-button @click="isShow = false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>

  <div class="view">
    <router-view></router-view>
  </div>
</template>


<style lang="scss" scoped>
/* === 顶部导航栏 === */
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 40px;
  background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 36px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.logo-img {
  width: 28px;
  height: 28px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1px;
}

.nav-links {
  display: flex;
  gap: 24px;
  font-size: 14px;
}

.nav-item {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s;
  padding: 4px 0;
  border-bottom: 2px solid transparent;

  &:hover,
  &.active {
    opacity: 1;
    border-bottom-color: #fff;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-avatar-area {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.9;

  &:hover { opacity: 1; }
}

.user-avatar {
  background: rgba(255,255,255,.25);
}

.font-drop {
  color: #333;
  font-size: 14px;
}

.login-link {
  cursor: pointer;
  font-size: 14px;
  opacity: 0.85;
  &:hover { opacity: 1; }
}

.btn-recruit {
  background: rgba(255,255,255,.2);
  color: #fff;
  border: 1px solid rgba(255,255,255,.4);
  border-radius: 4px;
  padding: 6px 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all .2s;

  &:hover {
    background: rgba(255,255,255,.35);
  }
}

.view {
  min-height: calc(100vh - 60px);
  background: #f5f6fa;
}
</style>