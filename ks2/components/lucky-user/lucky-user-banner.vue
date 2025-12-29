<template>
  <view class="lucky-user-banner">
    <view class="lucky-user-avatar">
      <image :src="actualAvatar" mode="aspectFill" class="avatar-image"></image>
      <view class="avatar-glow"></view>
    </view>
    <view class="lucky-user-info">
      <view class="lucky-user-title">
        <text class="title-text">幸运用户</text>
        <view class="lucky-icon">🎉</view>
      </view>
      <view class="lucky-user-desc">
        <text class="nickname">{{ actualNickname }}</text>
        <text>是第{{ actualRank }}位点赞用户，获得幸运奖励！</text>
      </view>
    </view>
    <view class="lucky-badge">
      <text class="badge-text">幸运</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue';

// 定义props
const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  rank: {
    type: [Number, String, Object],
    default: 1,
    validator: (value) => {
      // 如果是对象，尝试从 likeRank 属性获取值
      if (typeof value === 'object' && value !== null) {
        return !isNaN(value.likeRank);
      }
      // 如果是字符串，确保可以转换为数字
      if (typeof value === 'string') {
        return !isNaN(Number(value));
      }
      // 如果是数字，确保不是 NaN
      return !isNaN(value);
    }
  },
  avatar: {
    type: String,
    default: ''
  },
  nickname: {
    type: String,
    default: ''
  }
});

// 计算实际的排名值
const actualRank = computed(() => {
  try {
    if (typeof props.rank === 'object' && props.rank !== null) {
      return Number(props.rank.likeRank) || 1;
    }
    if (typeof props.rank === 'string') {
      return Number(props.rank) || 1;
    }
    return Number(props.rank) || 1;
  } catch (e) {
    console.error('计算排名值出错:', e);
    return 1;
  }
});

// 计算实际的头像
const actualAvatar = computed(() => {
  return props.avatar || defaultAvatar;
});

// 计算实际的昵称
const actualNickname = computed(() => {
  return props.nickname || '用户';
});

// 默认头像
const defaultAvatar = '/static/images/default-avatar.png';
</script>

<style lang="scss" scoped>
.lucky-user-banner {
  width: 100%;
  background: linear-gradient(to right, #fff8f8, #fff);
  border-radius: 12rpx;
  padding: 24rpx;
  margin: 20rpx 0;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.2);
  border: 1rpx solid #ff6b6b;
  animation: banner-pulse 2s infinite;
  position: relative;
  overflow: hidden;
}

.lucky-user-avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 24rpx;
  border: 3rpx solid #ff6b6b;
  position: relative;
  z-index: 1;
  
  .avatar-image {
    width: 100%;
    height: 100%;
  }
  
  .avatar-glow {
    position: absolute;
    top: -10rpx;
    left: -10rpx;
    right: -10rpx;
    bottom: -10rpx;
    border-radius: 50%;
    background: rgba(255, 107, 107, 0.3);
    z-index: -1;
    animation: glow-pulse 2s infinite alternate;
  }
}

.lucky-user-info {
  flex: 1;
}

.lucky-user-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #ff6b6b;
  margin-bottom: 8rpx;
  display: flex;
  align-items: center;
  
  .title-text {
    margin-right: 10rpx;
  }
  
  .lucky-icon {
    font-size: 36rpx;
    animation: bounce 1s infinite;
  }
}

.lucky-user-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.nickname {
  color: #ff6b6b;
  font-weight: bold;
  margin-right: 4rpx;
}

.lucky-badge {
  position: absolute;
  top: -5rpx;
  right: -5rpx;
  background-color: #ff6b6b;
  color: white;
  font-size: 22rpx;
  font-weight: bold;
  padding: 6rpx 16rpx;
  border-radius: 0 0 0 16rpx;
  transform: rotate(5deg);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  z-index: 2;
}

@keyframes banner-pulse {
  0% {
    box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.2);
  }
  50% {
    box-shadow: 0 8rpx 24rpx rgba(255, 107, 107, 0.4);
  }
  100% {
    box-shadow: 0 4rpx 16rpx rgba(255, 107, 107, 0.2);
  }
}

@keyframes glow-pulse {
  0% {
    opacity: 0.5;
    transform: scale(1);
  }
  100% {
    opacity: 0.8;
    transform: scale(1.2);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5rpx);
  }
}
</style> 