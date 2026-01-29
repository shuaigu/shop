<template>
    <view class="container" :data-theme="themeName">
        <u-field label-width="160" v-model="mobile" label="手机号" disabled> </u-field>

        <u-field
            label-width="160"
            v-model="newMobile"
            label="新号码"
            placeholder="请输入新的手机号码"
        >
        </u-field>
        <u-field
            label-width="160"
            label="短信验证码"
            v-model="code"
            placeholder="请输入验证码"
            :style="{ width: '100%' }"
            type="number"
        >
            <view slot="right">
                <view
                    class="sms-btn"
                    @click="sendSMS"
                    :class="{ disabled: newMobile.length !== 11 }"
                >
                    <!-- 获取验证码 -->
                    <u-verification-code unique-key="login" ref="uCode" @change="codeChange">
                    </u-verification-code>
                    <view class="xs">{{ codeTips }}</view>
                </view>
            </view>
        </u-field>
        <view class="btn flex row-center white lg br60" @click="confirm">确认</view>
    </view>
</template>
<script>
import { getUserInfo, changeUserMobile } from '@/api/user'
import { apiRegisterCaptcha } from '@/api/app'
import { SMSType } from '@/utils/type'

export default {
    data() {
        return {
            userInfo: {},
            codeTips: '获取验证码',
            code: '', //验证码
            newMobile: '' //新手机号
        }
    },
    methods: {
        codeChange(tip) {
            this.codeTips = tip
        },
        // 获取用户信息
        getUserInfoFun() {
            getUserInfo().then((res) => {
                this.userInfo = res.data
            })
        },
        //获取验证码
        sendSMS() {
            if (!this.$refs.uCode.canGetCode) return
            if (this.newMobile.length !== 11) {
                this.$toast({
                    title: '请输入正确手机号'
                })
                return
            }
            apiRegisterCaptcha({
                mobile: this.newMobile,
                key: SMSType.CHANGE_MOBILE
            }).then((res) => {
                if (res.code == 1) {
                    this.$refs.uCode.start()
                    this.$toast({
                        title: res.msg
                    })
                }
            })
        },
        confirm() {
            changeUserMobile({
                mobile: this.userInfo.mobile,
                new_mobile: this.newMobile,
                code: this.code
            }).then(({ code }) => {
                if (code == 1) {
                    setTimeout(() => {
                        this.$Router.back(2)
                    }, 1500)
                }
            })
        }
    },
    computed: {
        mobile() {
            if (this.userInfo.mobile) {
                return '+86 ' + this.userInfo.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            }
        }
    },
    onLoad() {
        this.getUserInfoFun()
    }
}
</script>
<style scoped lang="scss">
.container {
    background-color: white;
    padding-bottom: 1rpx;
}
.btn {
    height: 84rpx;
    margin: 85rpx 20rpx 85rpx 20rpx;
    @include background_color();
}
.sms-btn {
    text-align: center;
    border: 1px solid;
    width: 176rpx;
    height: 60rpx;
    line-height: 60rpx;
    border-radius: 60rpx;
    @include font_color();
    @include border_color();
}
.disabled {
    opacity: 0.5;
}
</style>
