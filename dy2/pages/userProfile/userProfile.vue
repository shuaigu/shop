<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useUserInfoStore } from '@/store/user.js'
  // uni对象是全局的，不需要导入
  // userStore
  const userStore = useUserInfoStore()
  // 用户云对象
  const userApi = uniCloud.importObject('userDy')
  
  // 页面参数
  const loginCode = ref('')
  
  // 用户信息
  const userProfile = ref({
    nickName: '',
    avatarUrl: '/static/images/defalut.png',
    mobile: ''
  })
  
  // 表单校验状态
  const formValid = ref(false)
  // 提交状态
  const submitting = ref(false)
  // 表单验证错误信息
  const validationErrors = ref({
    nickname: ''
  })
  
  // 计算属性判断表单是否有效
  const isFormValid = computed(() => {
    return userProfile.value.nickName.trim() !== '' && 
           userProfile.value.avatarUrl !== '/static/images/defalut.png' &&
           !validationErrors.value.nickname
  })
  
  // 验证昵称
  function validateNickname(value) {
    if (!value.trim()) {
      validationErrors.value.nickname = '昵称不能为空'
      return false
    }
    if (value.length > 20) {
      validationErrors.value.nickname = '昵称不能超过20个字符'
      return false
    }
    validationErrors.value.nickname = ''
    return true
  }
  
  // 监听昵称输入
  const onNicknameInput = (e) => {
    const value = e.detail.value
    userProfile.value.nickName = value
    validateNickname(value)
  }
  
  // 选择头像
  const chooseAvatar = () => {
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        // 使用uni.uploadFile上传到服务器或临时存储
        // 这里暂时直接设置临时路径
        userProfile.value.avatarUrl = tempFilePath
      }
    })
  }
  
  // 获取手机号
  const getPhoneNumber = async (e) => {
    try {
      if (e.detail.errMsg !== 'getPhoneNumber:ok') {
        uni.showToast({
          title: '未授权手机号',
          icon: 'none',
          duration: 2000
        })
        return
      }
      
      const params = {
        code: loginCode.value,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      }
      
      uni.showLoading({
        title: '获取中...',
        mask: true
      })
      
      // 调用接口获取手机号
      const res = await userApi.getPhoneNumberDy(params)
      
      uni.hideLoading()
      
      if (res.code === 0 && res.data?.phoneNumber) {
        userProfile.value.mobile = res.data.phoneNumber
        uni.showToast({
          title: '获取成功',
          icon: 'success',
          duration: 2000
        })
      } else {
        throw new Error(res.message || '获取手机号失败')
      }
    } catch (err) {
      console.error('获取手机号失败:', err)
      uni.showToast({
        title: err.message || '获取手机号失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
  
  // 提交用户信息
  const submitUserInfo = async () => {
    if (!isFormValid.value) {
      uni.showToast({
        title: '请填写完整信息',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    submitting.value = true
    
    try {
      uni.showLoading({
        title: '保存中...',
        mask: true
      })
      
      // 获取登录code
      const loginRes = await uni.login()
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }
      
      let cloudFunctionName = 'user'
      let actionName = 'registerUser'
      
      // #ifdef MP-TOUTIAO
      cloudFunctionName = 'userDy'
      actionName = 'registerUserDy'
      // #endif
      
      // 调用云函数注册/更新用户信息
      const { result } = await uni.cloud.callFunction({
        name: cloudFunctionName,
        data: {
          action: actionName,
          params: {
            code: loginRes.code,
            nickName: userProfile.value.nickName,
            avatarUrl: userProfile.value.avatarUrl,
            mobile: userProfile.value.mobile
          }
        }
      })
      
      if (result.code === 0) {
        // 保存用户信息到本地
        userStore.setUserInfo({
          uid: result.data._id || result.data.uid || '',
          nickName: result.data.nickName || '',
          avatarUrl: result.data.avatarUrl || "/static/images/defalut.png",
          mobile: result.data.mobile || '',
          isLogin: true,
          role: Array.isArray(result.data.role) ? result.data.role : ['user'],
        })
        
        uni.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            // 延迟返回，确保toast显示完成
            setTimeout(() => {
              // 返回上一页
              uni.navigateBack()
            }, 2000)
          }
        })
      } else {
        throw new Error(result.message || '保存失败')
      }
    } catch (err) {
      console.error('提交用户信息错误:', err)
      uni.showToast({
        title: '保存失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      submitting.value = false
      uni.hideLoading()
    }
  }
  
  // 返回登录页
  const goBack = () => {
    uni.navigateBack()
  }
  
  // 页面加载
  onMounted(() => {
    // 获取页面参数
    const pages = getCurrentPages();
    const currentPage = pages[pages.length - 1];
    
    // 获取页面传递的loginCode
    if (currentPage && currentPage.options && currentPage.options.code) {
      loginCode.value = currentPage.options.code;
    } else {
      // 兼容方式获取参数
      const query = uni.$route?.query || uni.getLaunchOptionsSync().query || {};
      if (query.code) {
        loginCode.value = query.code;
      }
    }
  })
</script>

<template>
  <view class="profile-container">
    <view class="page-header">
      <view class="back-btn" @click="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="header-title">完善资料</view>
    </view>
    
    <view class="avatar-section">
      <view class="avatar-wrapper" @click="chooseAvatar">
        <image :src="userProfile.avatarUrl" mode="aspectFill" class="avatar-image"></image>
        <view class="avatar-edit">
          <text class="edit-icon">+</text>
        </view>
      </view>
      <view class="avatar-tip">点击更换头像</view>
    </view>
    
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">昵称</text>
        <input 
          class="form-input" 
          type="text" 
          placeholder="请输入昵称"
          v-model="userProfile.nickName"
          @input="onNicknameInput"
        />
        <view v-if="validationErrors.nickname" class="error-message">
          {{ validationErrors.nickname }}
        </view>
      </view>
      
      <view class="form-item">
        <text class="form-label">手机号</text>
        <view class="phone-section">
          <text class="phone-text" v-if="userProfile.mobile">{{ userProfile.mobile }}</text>
          <text class="phone-placeholder" v-else>未绑定手机号</text>
          <button class="phone-btn" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">获取</button>
        </view>
      </view>
    </view>
    
    <view class="submit-section">
      <button 
        class="submit-btn" 
        :disabled="!isFormValid || submitting" 
        :loading="submitting"
        @click="submitUserInfo"
      >
        完成
      </button>
      <view class="skip-btn" @click="submitUserInfo">跳过手机号绑定</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  padding: 0 30rpx;
  background-color: #fff;
}

.page-header {
  position: relative;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .back-btn {
    position: absolute;
    left: 0;
    width: 80rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .back-icon {
      font-size: 40rpx;
      color: #333;
    }
  }
  
  .header-title {
    font-size: 34rpx;
    font-weight: 500;
    color: #333;
  }
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
  
  .avatar-wrapper {
    position: relative;
    width: 180rpx;
    height: 180rpx;
    border-radius: 90rpx;
    overflow: hidden;
    
    .avatar-image {
      width: 100%;
      height: 100%;
    }
    
    .avatar-edit {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 50rpx;
      height: 50rpx;
      border-radius: 25rpx;
      background-color: $pyq-vi-color;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .edit-icon {
        color: #fff;
        font-size: 30rpx;
      }
    }
  }
  
  .avatar-tip {
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #999;
  }
}

.form-section {
  margin-top: 40rpx;
  
  .form-item {
    margin-bottom: 40rpx;
    
    .form-label {
      display: block;
      font-size: 28rpx;
      color: #333;
      margin-bottom: 20rpx;
    }
    
    .form-input {
      width: 100%;
      height: 80rpx;
      border-radius: 12rpx;
      background-color: #f8f8f8;
      padding: 0 20rpx;
      font-size: 28rpx;
      color: #333;
    }
    
    .phone-section {
      display: flex;
      align-items: center;
      height: 80rpx;
      background-color: #f8f8f8;
      border-radius: 12rpx;
      padding: 0 20rpx;
      
      .phone-text, .phone-placeholder {
        flex: 1;
        font-size: 28rpx;
      }
      
      .phone-text {
        color: #333;
      }
      
      .phone-placeholder {
        color: #999;
      }
      
      .phone-btn {
        width: 120rpx;
        height: 60rpx;
        line-height: 60rpx;
        background-color: $pyq-vi-color;
        color: #fff;
        font-size: 26rpx;
        padding: 0;
        margin: 0;
        border-radius: 30rpx;
      }
    }
  }
}

.submit-section {
  margin-top: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  .submit-btn {
    width: 80%;
    height: 88rpx;
    line-height: 88rpx;
    background-color: $pyq-vi-color;
    color: #fff;
    font-size: 32rpx;
    border-radius: 44rpx;
    
    &[disabled] {
      background-color: #ccc;
      color: #fff;
    }
  }
  
  .skip-btn {
    margin-top: 30rpx;
    font-size: 28rpx;
    color: #999;
    text-decoration: underline;
  }
}

.error-message {
  font-size: 24rpx;
  color: #ff4d4f;
  margin-top: 10rpx;
}
</style> 