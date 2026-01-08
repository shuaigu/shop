<template>
  <view class="product-detail-page">
    <!-- 顶部图片展示区 -->
    <view class="product-image-section">
      <swiper class="product-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500"
        :circular="true" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
        <swiper-item v-for="(image, index) in productImages" :key="index">
          <image :src="image" mode="aspectFill" class="product-image" />
        </swiper-item>
      </swiper>

      <!-- 返回和分享按钮 -->
      <view class="top-buttons">
        <view class="back-btn" @click="goBack">
          <text class="iconfont icon-back">←</text>
        </view>
        <view class="share-btn" @click="handleShare">
          <text class="iconfont icon-share">⤴</text>
        </view>
      </view>

      <!-- 图片指示器 -->
      <view class="image-indicator">{{ currentImageIndex + 1 }}/{{ productImages.length }}</view>
    </view>

    <!-- 社交证明区域 -->
    <view class="social-proof-section">
      <view class="proof-item">
        <image src="https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132" mode="aspectFill" class="proof-avatar" />
        <text class="proof-text">回头客<text class="proof-number">{{ repeatBuyers }}</text>人</text>
      </view>
      <view class="proof-item">
        <image src="https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132" mode="aspectFill" class="proof-avatar" />
        <text class="proof-text">一周内<text class="proof-number">{{ weekBuyers }}+</text>人购买</text>
      </view>
    </view>

    <!-- 价格区域 -->
    <view class="price-section">
      <view class="price-left">
        <view class="price-row">
          <text class="price-label">抢购价</text>
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ currentPrice }}</text>
          <view class="discount-tag">限时直降{{ discount }}元</view>
        </view>
        <view class="nearby-buyers">附近{{ nearbyBuyers }}人买过</view>
      </view>
      <view class="countdown-section">
        <text class="countdown-label">今日特惠</text>
        <view class="countdown-timer">
          <text class="countdown-time">{{ countdownHours }}</text>
          <text class="countdown-separator">:</text>
          <text class="countdown-time">{{ countdownMinutes }}</text>
          <text class="countdown-separator">:</text>
          <text class="countdown-time">{{ countdownSeconds }}</text>
          <text class="countdown-separator">.</text>
          <text class="countdown-time">{{ countdownMilliseconds }}</text>
        </view>
      </view>
    </view>

    <!-- 商品标题区域 -->
    <view class="product-title-section">
      <text class="product-title">{{ productTitle }}</text>
      <view class="product-tags">
        <view class="tag tag-green">坏了包退</view>
        <view class="tag tag-green">晚到必赔</view>
      </view>
    </view>

    <!-- 配送信息 -->
    <view class="delivery-section">
      <text class="delivery-icon">🕐</text>
      <text class="delivery-text">{{ deliveryCountdown }} 内下单，次日{{ deliveryTime }}点前门店自提</text>
    </view>

    <!-- 商品保障 -->
    <view class="guarantee-section">
      <text class="guarantee-icon">✓</text>
      <text class="guarantee-text">坏了包退 · 无理由退换货 · 晚到必赔 · 极速退款</text>
      <text class="guarantee-more">...</text>
      <text class="guarantee-arrow">›</text>
    </view>

    <!-- 商品评价 -->
    <view class="review-section">
      <view class="review-header">
        <text class="review-title">商品评价 ({{ totalReviews }})</text>
        <view class="review-rate">
          <text class="review-rate-text">好评率{{ goodRate }}%</text>
          <text class="review-arrow">›</text>
        </view>
      </view>

      <!-- 评价标签 -->
      <view class="review-tags">
        <view class="review-tag" v-for="(tag, index) in reviewTags" :key="index">
          {{ tag.name }} ({{ tag.count }})
        </view>
      </view>

      <!-- 用户评价列表 -->
      <view class="review-list">
        <view class="review-item" v-for="(review, index) in reviews" :key="index">
          <view class="review-user-info">
            <image :src="review.avatar" mode="aspectFill" class="review-avatar" />
            <view class="review-user-details">
              <text class="review-username">{{ review.username }}</text>
              <view class="review-badge" v-if="review.buyCount">买过{{ review.buyCount }}次</view>
            </view>
            <view class="review-stars">
              <text v-for="star in 5" :key="star" class="star">★</text>
            </view>
          </view>
          <text class="review-content">{{ review.content }}</text>
        </view>
      </view>
    </view>

    <!-- 底部占位 -->
    <view class="bottom-placeholder"></view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="cart-section" @click="goToCart">
        <view class="cart-icon-wrapper">
          <text class="cart-icon">🛒</text>
          <view class="cart-badge" v-if="cartCount > 0">{{ cartCount }}</view>
        </view>
      </view>
      <view class="action-buttons">
        <view class="pay-button" @click="goToPay">
          <text class="pay-text">去支付¥{{ currentPrice }}</text>
          <text class="pay-saved">已减 ¥{{ discount }}</text>
        </view>
        <view class="add-cart-button" @click="addToCart">
          <text class="add-cart-text">加入购物车</text>
          <text class="add-cart-discount">限时直降{{ discount }}元</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 商品图片（使用示例图片）
      productImages: [
        'https://img.alicdn.com/imgextra/i4/2200660470732/O1CN01s1QnYo1Uw5F8F3J8N_!!2200660470732.jpg',
        'https://img.alicdn.com/imgextra/i4/2200660470732/O1CN01s1QnYo1Uw5F8F3J8N_!!2200660470732.jpg',
        'https://img.alicdn.com/imgextra/i4/2200660470732/O1CN01s1QnYo1Uw5F8F3J8N_!!2200660470732.jpg',
        'https://img.alicdn.com/imgextra/i4/2200660470732/O1CN01s1QnYo1Uw5F8F3J8N_!!2200660470732.jpg'
      ],
      currentImageIndex: 0,

      // 社交证明数据
      repeatBuyers: 4612,
      weekBuyers: 200,
      nearbyBuyers: 5924,

      // 价格信息
      currentPrice: '20.99',
      discount: 3,

      // 倒计时
      countdownHours: '02',
      countdownMinutes: '26',
      countdownSeconds: '54',
      countdownMilliseconds: '0',

      // 商品信息
      productTitle: '1200g/箱 50袋/箱【经典美味】亚特兰食品老乡香酥虾干吃面掌心面',

      // 配送信息
      deliveryCountdown: '02:26:54.0',
      deliveryTime: '16',

      // 评价信息
      totalReviews: 6754,
      goodRate: 91.1,
      reviewTags: [
        { name: '好吃', count: 264 },
        { name: '包装很好', count: 35 },
        { name: '份量足', count: 21 }
      ],

      // 评价列表
      reviews: [
        {
          avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
          username: '鸭梨',
          buyCount: 3,
          content: '非常好吃，包装很好，份量足'
        },
        {
          avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
          username: '衣阿华.张',
          buyCount: 3,
          content: '质量很好，物流也快'
        }
      ],

      // 购物车数量
      cartCount: 1
    }
  },

  onLoad(options) {
    // 接收商品ID等参数
    if (options.productId) {
      this.loadProductDetail(options.productId)
    }
    this.startCountdown()
  },

  onUnload() {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },

  methods: {
    // 返回
    goBack() {
      uni.navigateBack()
    },

    // 分享
    handleShare() {
      uni.showToast({
        title: '分享功能',
        icon: 'none'
      })
    },

    // 加载商品详情
    loadProductDetail(productId) {
      // TODO: 调用云函数获取商品详情
      console.log('加载商品详情:', productId)
    },

    // 开始倒计时
    startCountdown() {
      let totalSeconds = 2 * 3600 + 26 * 60 + 54
      this.countdownTimer = setInterval(() => {
        if (totalSeconds <= 0) {
          clearInterval(this.countdownTimer)
          return
        }
        totalSeconds--
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60

        this.countdownHours = hours.toString().padStart(2, '0')
        this.countdownMinutes = minutes.toString().padStart(2, '0')
        this.countdownSeconds = seconds.toString().padStart(2, '0')
      }, 1000)
    },

    // 去购物车
    goToCart() {
      uni.navigateTo({
        url: '/pages/cart/cart'
      })
    },

    // 去支付
    goToPay() {
      uni.showToast({
        title: '去支付',
        icon: 'none'
      })
    },

    // 加入购物车
    addToCart() {
      this.cartCount++
      uni.showToast({
        title: '已加入购物车',
        icon: 'success'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.product-detail-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 商品图片区域 */
.product-image-section {
  position: relative;
  width: 100%;
  height: 750rpx;
  background-color: #fff;

  .product-swiper {
    width: 100%;
    height: 100%;
  }

  .product-image {
    width: 100%;
    height: 100%;
  }

  .top-buttons {
    position: absolute;
    top: 40rpx;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 24rpx;
    z-index: 10;

    .back-btn,
    .share-btn {
      width: 68rpx;
      height: 68rpx;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 36rpx;
    }
  }

  .image-indicator {
    position: absolute;
    bottom: 24rpx;
    right: 24rpx;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
    padding: 8rpx 20rpx;
    border-radius: 30rpx;
    font-size: 24rpx;
  }
}

/* 社交证明区域 */
.social-proof-section {
  background-color: #fff;
  padding: 24rpx;
  display: flex;
  gap: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .proof-item {
    display: flex;
    align-items: center;
    gap: 12rpx;

    .proof-avatar {
      width: 48rpx;
      height: 48rpx;
      border-radius: 50%;
    }

    .proof-text {
      font-size: 26rpx;
      color: #333;

      .proof-number {
        color: #e02e24;
        font-weight: bold;
        margin: 0 4rpx;
      }
    }
  }
}

/* 价格区域 */
.price-section {
  background-color: #e02e24;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .price-left {
    flex: 1;

    .price-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 12rpx;

      .price-label {
        font-size: 28rpx;
        color: #fff;
        margin-right: 12rpx;
      }

      .price-symbol {
        font-size: 36rpx;
        color: #fff;
        font-weight: bold;
      }

      .price-value {
        font-size: 72rpx;
        color: #fff;
        font-weight: bold;
        line-height: 1;
      }

      .discount-tag {
        background-color: rgba(255, 255, 255, 0.3);
        color: #fff;
        padding: 4rpx 12rpx;
        border-radius: 8rpx;
        font-size: 24rpx;
        margin-left: 16rpx;
      }
    }

    .nearby-buyers {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .countdown-section {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .countdown-label {
      font-size: 28rpx;
      color: #fff;
      margin-bottom: 8rpx;
    }

    .countdown-timer {
      display: flex;
      align-items: center;
      color: #fff;
      font-weight: bold;

      .countdown-time {
        background-color: rgba(0, 0, 0, 0.3);
        padding: 4rpx 8rpx;
        border-radius: 4rpx;
        font-size: 28rpx;
        min-width: 40rpx;
        text-align: center;
      }

      .countdown-separator {
        margin: 0 4rpx;
        font-size: 28rpx;
      }
    }
  }
}

/* 商品标题区域 */
.product-title-section {
  background-color: #fff;
  padding: 24rpx;
  margin-top: 16rpx;

  .product-title {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
    line-height: 1.5;
    display: block;
    margin-bottom: 16rpx;
  }

  .product-tags {
    display: flex;
    gap: 12rpx;

    .tag {
      padding: 6rpx 16rpx;
      border-radius: 6rpx;
      font-size: 24rpx;
      border: 1rpx solid;

      &.tag-green {
        color: #09bb07;
        background-color: #f0f9f0;
        border-color: #09bb07;
      }
    }
  }
}

/* 配送信息 */
.delivery-section {
  background-color: #fff;
  padding: 24rpx;
  margin-top: 1rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border-top: 1rpx solid #f0f0f0;

  .delivery-icon {
    font-size: 32rpx;
    color: #e02e24;
  }

  .delivery-text {
    font-size: 26rpx;
    color: #e02e24;
    flex: 1;
  }
}

/* 商品保障 */
.guarantee-section {
  background-color: #fff;
  padding: 24rpx;
  margin-top: 1rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  border-top: 1rpx solid #f0f0f0;

  .guarantee-icon {
    font-size: 32rpx;
    color: #09bb07;
  }

  .guarantee-text {
    font-size: 26rpx;
    color: #666;
    flex: 1;
  }

  .guarantee-more {
    font-size: 26rpx;
    color: #999;
  }

  .guarantee-arrow {
    font-size: 32rpx;
    color: #999;
  }
}

/* 商品评价 */
.review-section {
  background-color: #fff;
  padding: 24rpx;
  margin-top: 16rpx;

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .review-title {
      font-size: 32rpx;
      color: #333;
      font-weight: 500;
    }

    .review-rate {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .review-rate-text {
        font-size: 26rpx;
        color: #999;
      }

      .review-arrow {
        font-size: 32rpx;
        color: #999;
      }
    }
  }

  .review-tags {
    display: flex;
    gap: 16rpx;
    margin-bottom: 32rpx;
    flex-wrap: wrap;

    .review-tag {
      background-color: #f5f5f5;
      padding: 12rpx 24rpx;
      border-radius: 30rpx;
      font-size: 26rpx;
      color: #666;
    }
  }

  .review-list {
    .review-item {
      padding: 24rpx 0;
      border-top: 1rpx solid #f0f0f0;

      &:first-child {
        border-top: none;
        padding-top: 0;
      }

      .review-user-info {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;

        .review-avatar {
          width: 64rpx;
          height: 64rpx;
          border-radius: 50%;
          margin-right: 16rpx;
        }

        .review-user-details {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12rpx;

          .review-username {
            font-size: 28rpx;
            color: #333;
            font-weight: 500;
          }

          .review-badge {
            background-color: #fff0f0;
            color: #e02e24;
            padding: 2rpx 12rpx;
            border-radius: 4rpx;
            font-size: 22rpx;
            border: 1rpx solid #e02e24;
          }
        }

        .review-stars {
          display: flex;
          gap: 4rpx;

          .star {
            color: #ff6034;
            font-size: 28rpx;
          }
        }
      }

      .review-content {
        font-size: 28rpx;
        color: #666;
        line-height: 1.6;
      }
    }
  }
}

/* 底部占位 */
.bottom-placeholder {
  height: 120rpx;
}

/* 底部操作栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.1);
  z-index: 100;

  .cart-section {
    .cart-icon-wrapper {
      position: relative;
      width: 88rpx;
      height: 88rpx;
      background-color: #fff;
      border: 1rpx solid #e0e0e0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      .cart-icon {
        font-size: 40rpx;
      }

      .cart-badge {
        position: absolute;
        top: 0;
        right: 0;
        background-color: #e02e24;
        color: #fff;
        width: 32rpx;
        height: 32rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20rpx;
      }
    }
  }

  .action-buttons {
    flex: 1;
    display: flex;
    gap: 16rpx;

    .pay-button,
    .add-cart-button {
      flex: 1;
      height: 88rpx;
      border-radius: 44rpx;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .pay-button {
      background: linear-gradient(135deg, #333 0%, #666 100%);
      color: #fff;

      .pay-text {
        font-size: 30rpx;
        font-weight: bold;
      }

      .pay-saved {
        font-size: 22rpx;
        opacity: 0.9;
      }
    }

    .add-cart-button {
      background: linear-gradient(135deg, #ff6034 0%, #e02e24 100%);
      color: #fff;

      .add-cart-text {
        font-size: 30rpx;
        font-weight: bold;
      }

      .add-cart-discount {
        font-size: 22rpx;
        opacity: 0.9;
      }
    }
  }
}
</style>
