import {defineStore, } from "pinia";
import {ref} from "vue";
import type {RouteRecordRaw} from "vue-router";
import {constantRoutes, dynamicRoutes} from "@/router";
import store from "@/stores";

const hasPermission = (roles: string[], route: RouteRecordRaw): boolean => {
    const routerRoles = route.meta?.roles
    return routerRoles ? routerRoles.some(role => roles.includes(role)) : false
}

const filterDynamicRoutes = (routes: RouteRecordRaw[], roles: string[]) => {
    const res: RouteRecordRaw[] = []
    routes.forEach(route => {

        const tmp = {...route}

        if (hasPermission(roles, tmp)) {
            if (tmp.children) {
                tmp.children = filterDynamicRoutes(tmp.children, roles)
            }
            res.push(tmp)
        }
    })
    return res
}

export const useUserPermissionStore :any = defineStore('permission', () => {

    const routes = ref<RouteRecordRaw[]>([])
    const addRoutes = ref<RouteRecordRaw[]>([])

    const setRoutes = (roles: string[]) => {

        const accessRoutes=filterDynamicRoutes(dynamicRoutes,roles)
        routes.value = constantRoutes.concat(accessRoutes)
        console.log(accessRoutes)
        addRoutes.value=accessRoutes
    }

return {routes, addRoutes, setRoutes}
}
)
export function usePermissionStoreHook() {
    return useUserPermissionStore(store)
}

