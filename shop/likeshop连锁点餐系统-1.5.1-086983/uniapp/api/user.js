import request from '../utils/request'
import { client } from '@/utils/tools'
//个人中心
export function getUser() {
    return request.get('user/center')
}

// 地址列表
export function getAddressLists(data) {
    return request.get('user_address/lists', data)
}

// 添加编辑地址
export function editAddress(data) {
    return request.post('user_address/update', data)
}

export function addAddress(data) {
    return request.post('user_address/add', data)
}

// 删除地址
export function delAddress(id) {
    return request.post('user_address/del', { id })
}

// 获取单个地址
export function getOneAddress(id) {
    return request.get('user_address/detail', { params: { id } })
}

// 获取默认地址
export function getDefaultAddress(id) {
    return request.get('user_address/getDefault', { params: { id } })
}

// 设置默认地址
export function setDefaultAddress(id) {
    return request.post('user_address/setDefault', { id })
}

//传省市区字符串判读是否有code
export function hasRegionCode(data) {
    return request.post('user_address/handleRegion', data)
}

// 设置个人信息
export function setUserInfo(data) {
    return request.post('user/setInfo', data)
}

// 获取个人信息
export function getUserInfo(data) {
    return request.post('user/info', data)
}

// 获取手机号
export function getWxMnpMobile(data) {
    return request.post('user/getMobile', data)
}

//更新微信信息
export function setWechatInfo(data) {
    return request.post('user/setWechatInfo', data)
}

// 更换手机号
export function changeUserMobile(data) {
    return request.post('user/changeMobile', { ...data, client })
}
// 绑定手机号
export function bindUserMobile(data) {
    return request.post('user/bindMobile', { ...data, client })
}
// 用户钱包
export function getWallet() {
    return request.get('user/myWallet')
}
// 账户流水

export function getAccountLog(params) {
    return request.get('user/accountLog', { params })
}

//充值
export function recharge(data) {
    return request.post('recharge/recharge', data)
}

//充值规则
export function rechargeRule() {
    return request.post('recharge/rechargeRule')
}

//余额明细
export function apiBalanceDetails(params) {
    return request.get('user/balanceDetails', { params })
}

// 退出登录
export function userLogout(data) {
    return request.post('account/logout', data)
}

// 商家转账测试
export function transferTest(data) {
    return request.post('user/transferTest', data)
}

//
export function apiOaAuthLogin(data) {
    return request.post('account/oaAuthBind', data)
}
