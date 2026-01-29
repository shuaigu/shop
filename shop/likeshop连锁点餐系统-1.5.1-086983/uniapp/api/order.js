import request from '@/utils/request'

import {client} from '@/utils/tools'

//订单结算页
export function orderInfo(data) {
  return request.post("order/settlement", data);
} 
// 下单
export function orderBuy(data) {
  return request.post("order/sumbitOrder", data);
} 
//删除订单
export function delOrder(id) {
    return request.post('order/del', {id})
}
//订单列表
export function apiOrderLists(data) {
    return request.get('order/lists', {params: data})
}

//订单详情
export function apiOrderDetail(id) {
    return request.get('order/getOrderDetail', {params: id})
}

//取消订单
export function apiCancelOrder(id) {
    return request.post('order/cancel', {id})
}

//物流
export function orderTraces(id) {
    return request.get("order/orderTraces", {params: {id}})
}

//确认收货
export function confirmOrder(id) {
    return request.post("order/confirm", {id})
}



// 支付结果
export function getPayResult(id) {
  return request.get("order/pay_result", {params: {id}});
} 
