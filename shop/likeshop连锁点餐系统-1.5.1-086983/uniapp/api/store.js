import request from '@/utils/request'
import { client } from '@/utils/tools'

//获取首页数据接口
export function getHome() {
  return request.get('index/index')
}

// 通过首页分类id获取数据
export function getIndexCategory(params) {
  return request.get('index/indexCategory', { params })
}

//获取菜单
export function getMenu(data) {
  return request.get('menu/lists', {
    params: data,
  });
}

//广告位
export function getAdList(data) {
  return request.get('ad/lists', {
    params: data
  });
}

// 主题
export function apiDecorateConfig() {
  return request.get('index/style');
}

//购物车
export function getCartList(params) {
  return request.get('cart/lists', { params })
}

//加入购物车
export function addCart(data) {
  return request.post('cart/add', data);
}

//购物车数量
export function getCartNum(params) {
  return request.get("cart/num", { params });
}

// 购物车数量更改
export function changeGoodsCount(data) {
  return request.post("cart/change", data)
}

// 单选/全选/店铺选择
export function selectedOpt(data) {
  return request.post("cart/selected", data)
}

// 删除商品
export function deleteGoods(data) {
  return request.post("cart/del", data);
}

// 获取门店列表
export function getShoplist(params) {
  return request.get("shop/lists", { params });
}

// 获取门店商品列表
export function getShopGoodsList(params) {
  return request.get("goods/lists", { params });
}

// 获取门店商品详情
export function getShopGoodsDetail(params) {
  return request.get("goods/detail", { params });
}

// 获取门店公告
export function getShopNotice(params) {
  return request.get("shop/announcement", { params });
}

// 加入购物车
export function addShopCart(params) {
  return request.post("cart/add", params);
}

// 联系客服
export function apiServiceConfig() {
  return request.get("setting/getPlatformCustomerService");
}

// 领券列表
export function apiReceiveCouponList(params) {
  return request.get("coupon/lists", { params });
}

// 领取优惠券
export function apiReceiveCoupon(params) {
  return request.post("coupon/getCoupon", params);
}

// 订单下单获取优惠券
export function apiOrderBuyCouponList(params) {
  return request.get("coupon/getOrderCoupon", { params });
}

// 我的优惠券
export function apiMyCouponList(params) {
  return request.get("coupon/MyCoupon", { params });
}

// 公告详情
export function apiShopNoticeDetail(params) {
  return request.get("shop/announcementDetail", { params });
}