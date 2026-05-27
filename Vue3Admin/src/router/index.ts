import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import { useUserStoreHook} from "@/stores/modules/users";
import {usePermissionStoreHook} from "@/stores/modules/permission";
import {getToken} from "@/utils/cache/cookies";
import {ElMessage} from "element-plus";
const whiteTable:string[]=['/login','/forget','/','/businessList','/mine']
export const constantRoutes :RouteRecordRaw[] =[
  {path:'/*',
  redirect:'/'},
  {path:'/',
  name:'name',
  component:()=>import('@/views/menu/menu.vue')},
  {
    path:'/redirect',
    redirect:'/',
  },{
  path:'/login',
    component: ()=>import('@/views/login/login.vue')
  },{
  path:'/demo1',
    component: ()=>import('@/views/Demo/audioVisualzationDemo.vue')
  },{
    path:'/businessList',
    name:'businessList',
    component:()=>import('@/views/Detail/BusinessList/businessList.vue'),
    meta:{ title:'全部商家' }
  },{
    path:'/mine',
    name:'mine',
    component:()=>import('@/views/mine/mine.vue'),
    meta:{ title:'个人中心' }
  }
]
export  const dynamicRoutes :RouteRecordRaw[] =[
  { component: ()=>import('@/views/Detail/BusinessDetail/businessDetail.vue'),
    path:'/businessDetail/:bid?',
    name:'business',
    meta:{
      title:'商家详情',
      roles:['Admin','Business','User']
    },
  },  {
  component: ()=>import('@/views/mine/mine.vue'),
    path:'/mine/:Uid?',
    name:'mine',
    meta:{
      title:'个人界面',
      roles:['Admin','Business','User']
    },
  },
  {component:()=>import('@/views/Control/BusinessControl/BusinessControl.vue'),
  path:'/businessControl/:Bid',
    name:'businessControl',
    meta:{
      title:'商家控制',
      roles:['Business']
    },
  },
  {
    component:()=>import('@/views/Control/Control/control.vue'),
    path:'/control',
    name:'Control',
    meta:{
      title:'用户控制',
      roles:['Admin']
    },},
  {
    component:()=>import('@/views/Control/FileControl/file.vue'),
    path:'/file',
    name:'file',
    meta:{
      title:'文件控制',
      roles:['Admin','User']
    },

  },
  {
    component:()=>import("@/views/Demo/chatDemo.vue"),
    path:'/chat',
    name:'chat',
    meta:{
      title:'聊天界面',
      roles:['Admin','Business','User']
    },

  }
]
const router = createRouter({
  history:createWebHistory(),
  routes:constantRoutes,
})

export default router

/**
 * @description 全局路由守卫 如果用户没有动态路由中的角色，则获取角色 再根据角色生成动态路由，如果有 直接放行
 * @autor MuYuan
 * */
router.beforeEach(async (to, from, next) => {
  const useStore = useUserStoreHook();
  const userPermissionStore = usePermissionStoreHook();
  const tokenExists = getToken();

  // 白名单路由直接放行
  if (whiteTable.includes(to.path)) {
    // 已登录用户访问首页时，加载动态路由
    if (tokenExists && to.path === '/') {
      await useStore.getUserInfo();
      const roles = useStore.roles.filter((r: string) => r !== '');
      if (roles.length > 0 && userPermissionStore.addRoutes.length === 0) {
        userPermissionStore.setRoutes(roles);
        userPermissionStore.addRoutes.forEach((route: RouteRecordRaw) => router.addRoute(route));
      }
    }
    next();
    return;
  }

  if (tokenExists) {
    await useStore.getUserInfo();
    const roles = useStore.roles.filter((r: string) => r !== '');
    if (roles.length === 0) {
      ElMessage.error('没有权限');
      next('/login');
      return;
    }
    if (userPermissionStore.addRoutes.length === 0) {
      userPermissionStore.setRoutes(roles);
      userPermissionStore.addRoutes.forEach((route: RouteRecordRaw) => router.addRoute(route));
      next({ ...to, replace: true });
      return;
    }
    next();
  } else {
    ElMessage.error('请先登录');
    next('/login');
  }
});
