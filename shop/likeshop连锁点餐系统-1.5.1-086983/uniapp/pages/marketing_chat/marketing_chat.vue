<template>
    <view class="chat-page">
        <!-- 顶部横幅 -->
        <view class="header-banner">
            <view class="close-btn" @click="goBack">
                <text class="close-icon">×</text>
            </view>
            <view class="banner-text">
                <text class="banner-title">{{ bannerTitle }}</text>
                <text class="banner-subtitle">{{ bannerSubtitle }}</text>
            </view>
            <view class="banner-arrow">
                <text class="arrow-icon">∨</text>
            </view>
        </view>

        <!-- 聊天区域 -->
        <scroll-view 
            class="chat-container" 
            scroll-y 
            :scroll-top="scrollTop"
            :scroll-with-animation="true"
        >
            <view class="chat-content">
                <!-- 消息列表 -->
                <view 
                    v-for="(msg, index) in visibleMessages" 
                    :key="index"
                    class="message-item"
                    :class="msg.type"
                >
                    <!-- 客服消息 -->
                    <template v-if="msg.type === 'service'">
                        <image class="avatar" :src="serviceAvatar" mode="aspectFill"></image>
                        <view class="message-bubble service-bubble">
                            <text class="message-text">{{ msg.content }}</text>
                            <!-- 按钮选项 -->
                            <view v-if="msg.buttons && msg.showButtons" class="button-group">
                                <view 
                                    v-for="(btn, btnIndex) in msg.buttons" 
                                    :key="btnIndex"
                                    class="option-btn"
                                    :class="btn.type"
                                    @click="handleButtonClick(msg, btn)"
                                >
                                    {{ btn.text }}
                                </view>
                            </view>
                        </view>
                    </template>

                    <!-- 用户消息 -->
                    <template v-if="msg.type === 'user'">
                        <view class="message-bubble user-bubble">
                            <text class="message-text">{{ msg.content }}</text>
                        </view>
                        <image class="avatar" :src="userAvatar" mode="aspectFill"></image>
                    </template>
                </view>

                <!-- 输入提示 -->
                <view v-if="isTyping" class="message-item service">
                    <image class="avatar" :src="serviceAvatar" mode="aspectFill"></image>
                    <view class="message-bubble service-bubble typing-bubble">
                        <view class="typing-indicator">
                            <view class="dot"></view>
                            <view class="dot"></view>
                            <view class="dot"></view>
                        </view>
                    </view>
                </view>
            </view>
        </scroll-view>

        <!-- 底部备案信息 -->
        <view class="footer-info">
            <text class="footer-text">{{ footerText }}</text>
        </view>
    </view>
</template>

<script>
export default {
    data() {
        return {
            scrollTop: 0,
            isTyping: false,
            currentStep: 0,
            serviceAvatar: 'https://img.yzcdn.cn/vant/cat.jpeg',
            userAvatar: '/static/images/portrait_empty.png',
            visibleMessages: [],
            chatFlow: [],
            userResponses: {},
            bannerTitle: '我们帮您把业务/产品推广出去',
            bannerSubtitle: '您只需要等着客户主动找上门',
            footerText: '页面信息及服务由XXX企业管理有限公司提供',
            isLoading: true
        }
    },
    async onLoad() {
        // 加载配置
        await this.loadConfig()
        // 开始对话
        this.startChat()
    },
    methods: {
        async loadConfig() {
            try {
                uni.showLoading({ title: '加载中...' })
                const { data, code } = await getMarketingChatConfig()
                if (code === 1 && data) {
                    // 更新配置
                    this.chatFlow = data.chat_flow || []
                    this.serviceAvatar = data.service_avatar || this.serviceAvatar
                    this.bannerTitle = data.banner_title || this.bannerTitle
                    this.bannerSubtitle = data.banner_subtitle || this.bannerSubtitle
                    this.footerText = data.footer_text || this.footerText
                }
                this.isLoading = false
            } catch (error) {
                console.error('加载配置失败', error)
                uni.showToast({ title: '加载失败', icon: 'none' })
                // 使用默认配置
                this.chatFlow = this.getDefaultChatFlow()
                this.isLoading = false
            } finally {
                uni.hideLoading()
            }
        },

        getDefaultChatFlow() {
            // 默认配置，防止接口失败
            return [
                {
                    type: 'service',
                    content: '您好，请问有什么可以帮助您的吗？',
                    delay: 500
                }
            ]
        },

        goBack() {
            uni.navigateBack({
                delta: 1,
                fail: () => {
                    uni.switchTab({
                        url: '/pages/index/index'
                    })
                }
            })
        },

        async startChat() {
            await this.processNextMessage()
        },

        async processNextMessage() {
            if (this.currentStep >= this.chatFlow.length) return

            const message = this.chatFlow[this.currentStep]

            // 检查条件
            if (message.condition) {
                const conditionMet = this.userResponses[message.condition.key] === message.condition.value
                if (!conditionMet) {
                    this.currentStep++
                    await this.processNextMessage()
                    return
                }
            }

            // 显示输入中状态
            this.isTyping = true
            this.scrollToBottom()

            await this.delay(message.delay || 500)

            this.isTyping = false

            // 添加消息
            const newMessage = {
                type: message.type,
                content: message.content,
                buttons: message.buttons,
                showButtons: !!message.buttons,
                responseKey: message.responseKey
            }
            this.visibleMessages.push(newMessage)
            this.scrollToBottom()

            // 如果不需要等待响应，继续下一条
            if (!message.waitForResponse) {
                this.currentStep++
                await this.delay(300)
                await this.processNextMessage()
            }
        },

        handleButtonClick(msg, btn) {
            // 隐藏当前消息的按钮
            msg.showButtons = false

            // 保存用户响应
            if (msg.responseKey) {
                this.userResponses[msg.responseKey] = btn.value
            }

            // 添加用户回复消息
            this.visibleMessages.push({
                type: 'user',
                content: btn.text
            })
            this.scrollToBottom()

            // 继续下一步
            this.currentStep++
            setTimeout(() => {
                this.processNextMessage()
            }, 500)
        },

        scrollToBottom() {
            this.$nextTick(() => {
                this.scrollTop = this.scrollTop + 1000
            })
        },

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        }
    }
}
</script>

<style lang="scss" scoped>
.chat-page {
    min-height: 100vh;
    background: #f5f5f5;
    display: flex;
    flex-direction: column;
}

/* 顶部横幅 */
.header-banner {
    background: linear-gradient(135deg, #4fc3f7 0%, #29b6f6 50%, #03a9f4 100%);
    padding: 60rpx 30rpx 40rpx;
    position: relative;
    
    .close-btn {
        position: absolute;
        top: 30rpx;
        left: 30rpx;
        width: 50rpx;
        height: 50rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        
        .close-icon {
            font-size: 48rpx;
            color: rgba(255, 255, 255, 0.8);
        }
    }
    
    .banner-text {
        text-align: center;
        padding: 20rpx 0;
        
        .banner-title,
        .banner-subtitle {
            display: block;
            color: #ffeb3b;
            font-size: 38rpx;
            font-weight: bold;
            text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.2);
            line-height: 1.5;
        }
    }
    
    .banner-arrow {
        text-align: center;
        margin-top: 20rpx;
        
        .arrow-icon {
            color: rgba(255, 255, 255, 0.6);
            font-size: 40rpx;
        }
    }
}

/* 聊天容器 */
.chat-container {
    flex: 1;
    padding: 30rpx;
    box-sizing: border-box;
}

.chat-content {
    padding-bottom: 30rpx;
}

/* 消息项 */
.message-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 30rpx;
    
    &.service {
        justify-content: flex-start;
    }
    
    &.user {
        justify-content: flex-end;
    }
}

/* 头像 */
.avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    flex-shrink: 0;
    background: #e0e0e0;
}

/* 消息气泡 */
.message-bubble {
    max-width: 520rpx;
    padding: 24rpx 30rpx;
    border-radius: 20rpx;
    position: relative;
    
    .message-text {
        font-size: 30rpx;
        line-height: 1.6;
        color: #333;
    }
}

.service-bubble {
    background: #fff;
    margin-left: 20rpx;
    border-top-left-radius: 6rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.user-bubble {
    background: #fff;
    margin-right: 20rpx;
    border-top-right-radius: 6rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 按钮组 */
.button-group {
    display: flex;
    gap: 20rpx;
    margin-top: 24rpx;
}

.option-btn {
    flex: 1;
    padding: 20rpx 30rpx;
    border-radius: 10rpx;
    text-align: center;
    font-size: 28rpx;
    font-weight: 500;
    
    &.primary {
        background: #ff9800;
        color: #fff;
    }
    
    &.warning {
        background: #ffc107;
        color: #fff;
    }
    
    &:not(.primary):not(.warning) {
        background: #f5f5f5;
        color: #333;
        border: 1rpx solid #e0e0e0;
    }
}

/* 输入中动画 */
.typing-bubble {
    padding: 20rpx 30rpx;
}

.typing-indicator {
    display: flex;
    gap: 8rpx;
    
    .dot {
        width: 16rpx;
        height: 16rpx;
        background: #999;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
        
        &:nth-child(1) {
            animation-delay: 0s;
        }
        &:nth-child(2) {
            animation-delay: 0.2s;
        }
        &:nth-child(3) {
            animation-delay: 0.4s;
        }
    }
}

@keyframes typing {
    0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
    }
    30% {
        transform: translateY(-10rpx);
        opacity: 1;
    }
}

/* 底部信息 */
.footer-info {
    padding: 30rpx;
    text-align: center;
    background: #f5f5f5;
    
    .footer-text {
        font-size: 24rpx;
        color: #999;
    }
}
</style>
