import axios, {type AxiosInstance, type AxiosRequestConfig} from 'axios'
import {getReFlushToken, getToken, setToken} from "@/utils/cache/cookies";
import {merge} from "lodash-es";
import {useUserStoreHook} from "@/stores/modules/users";
import router from "@/router";

const logout = () => {
    return useUserStoreHook().logout()
}

const createService = () => {
    const app = axios.create()
    app.interceptors.response.use(response => {

        return response;
    }, async error => {
        if (error.response) {

            switch (error.response.status) {
                case 401:
                    setToken(error.response.data.token)
                    useUserStoreHook().token = <string>getToken()
                    const result = await request({
                        method: error.config.method, url: error.config.url, data: error.config.data
                    })
                    return Promise.resolve(result)

                default:
                    logout()
                   await router.replace('/login')
            }
            return Promise.reject(error);
        } else if (error.request) {

            if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {

            }
            return Promise.reject(error);
        } else {

            console.error('Request configuration error:', error.message);
            return Promise.reject(error);
        }
    });
    return app
}

const createRequest = (service: AxiosInstance) => {
    return (config: AxiosRequestConfig) => {
        const token = getToken()
        const defaultConfig = {
            headers: {
                Authorization: token ? `Bearer ${token}` : undefined, 'x-refresh-token': getReFlushToken()
            }, timeout: 5000, baseURL: 'http://localhost:3000/', data: {}
        }
        const mergeConfig = merge(defaultConfig, config)
        return service(mergeConfig)
    }
}

const service = createService()

export const request = createRequest(service)