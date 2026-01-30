import request from '@/utils/request'
import wechath5 from '@/utils/wechath5'
import { client } from '@/utils/tools'

//小程序授权登录
export function authLogin(data) {
    return request.post('account/authLogin', data)
}
//小程序静默登录
export function silentLogin(data) {
    return request.post('account/silentLogin', data)
}
// app登录
export function opLogin(data) {
    return request.post('account/uinAppLogin', { ...data, client })
}
//预支付接口
export function prepay(data) {
    return request.post('pay/unifiedpay', { ...data })
}
//小程序订阅
export function getMnpNotice(data) {
    return request.get('subscribe/lists', {
        params: data
    })
}
//账号登录
export function accountLogin(data) {
    return request.post('account/login', { ...data, client })
}
// 登录
export function wechatLogin(data) {
    return request.post('account/oalogin', data)
}
// 向微信请求code的链接
export function getCodeUrl() {
    return request.get('account/codeurl', {
        params: {
            url: encodeURIComponent(location.href)
        }
    })
}
//微信sdk配置
export function getJsconfig() {
    return request.get('wechat/jsconfig', {
        params: {
            url: encodeURIComponent(wechath5.signLink())
        }
    })
}
// 忘记密码
export function forgetPwd(data) {
    return request.post('login_password/forget', { ...data, client })
}

// 发送短信
export function sendSms(data) {
    return request.post('sms/send', { ...data, client })
}

// Html5 注册账号
export function register(data) {
    return request.post('account/register', { ...data, client })
}

// 获取服务协议
export function getServerProto() {
    return request.get('policy/service')
}

// 获取隐私政策
export function getPrivatePolicy() {
    return request.get('policy/privacy')
}

// 验证码登录
export function smsCodeLogin(data) {
    return request.post('account/smsLogin', { ...data, client })
}

export function getConfig() {
    return request.get('index/config')
}

// 获取支付配置
export function getPayway(params) {
    return request.get('pay/getPayWay', { params })
}

//更新小程序头像昵称
export function updateUser(data, token) {
    return request.post('account/updateUser', data, { header: { token } })
}

//注册发送短信
export function apiRegisterCaptcha(data) {
    return request.post('sms/send', data)
}
//注册
export function apiAccountRegister(data) {
    return request.post('account/register', { ...data, client })
}
// 协议
export function apiPolicyAgreement(params) {
    return request.get('index/agreement', { params })
}
// 重置密码
export function apiResetPassword(data) {
    return request.post('account/resetPwd', { ...data })
}
//变更手机号
export function changeUserMobile(data) {
    return request.post('user/changeMobile', { ...data })
}

// 创建营销聊天订单
export function createMarketingPayOrder(data) {
    return request.post('pay/createMarketingChatOrder', { ...data })
}
