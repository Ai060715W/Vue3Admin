import {createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router'
import { useUserStoreHook} from "@/stores/modules/users";
import {usePermissionStoreHook} from "@/stores/modules/permission";
import {getToken} from "@/utils/cache/cookies";
import {ElMessage} from "element-plus";
const whiteTable:string[]=['/login','/forget','/','/businessList','/mine']
export const constantRoutes :RouteRecordRaw[] =[
  {path:'

router.beforeEach(async (to, from, next) => {
  const useStore = useUserStoreHook();
  const userPermissionStore = usePermissionStoreHook();
  const tokenExists = getToken();

  if (whiteTable.includes(to.path)) {

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
