import {request} from "@/utils/service";

export const getBusinessList=async ()=>{
    return (await request({
        url: 'businessList',
        method: 'get'
    }))
}

export const getProductInfo=async (bid:any)=>{
    return (await request({
        url: 'productInfo',
        method: 'get',
        params:{
            bid:bid
        }
    }))
}
export const getProductInfoByType=async (data:any)=>{
    console.log(data)
    return (await request({
        url: 'getProductListByType',
        method: 'get',
        params:{
            bid:data.Bid,
            type:data.type
        }
    }))}

export const getBusinessInfo=async ()=>{
    return (await request({
        url:'BusinessInfoByUid',
        method:'get',
    }))
}
export const getUserList =async()=>{
    return (await request(
        {
            url:'getUserList',
            method:'get'
        }
    ))
}