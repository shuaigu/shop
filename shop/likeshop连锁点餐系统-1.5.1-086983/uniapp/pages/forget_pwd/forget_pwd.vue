<template>
    <view class="pages" :data-theme="themeName">
        <view class="forget-pwd">
            <view class="forget-pwd-text">忘记登录密码</view>

            <view class="input-container">
                <view class="input m-t-40">
                    <u-field
                        label-width="0"
                        v-model="ferget.mobile"
                        placeholder="请输入手机号"
                        :input-border="false"
                        :style="{ width: '100%' }"
                        type="number"
                    />
                </view>
                <view class="input m-t-40">
                    <u-field
                        label-width="0"
                        v-model="ferget.code"
                        placeholder="请输入验证码"
                        :style="{ width: '100%' }"
                        :input-border="false"
                    >
                        <view slot="right">
                            <view
                                class="sms-btn"
                                @tap="sendSMS"
                                :class="{ disabled: ferget.mobile.length !== 11 }"
                            >
                                <!-- 获取验证码 -->
                                <u-verification-code
                                    unique-key="login"
                                    ref="uCode"
                                    @change="codeChange"
                                >
                                </u-verification-code>
                                <view class="xs">{{ codeTips }}</view>
                            </view>
                        </view>
                    </u-field>
                </view>
                <view class="input m-t-40">
                    <u-field
                        label-width="0"
                        :password="!pwdShow"
                        type="text"
                        v-model="ferget.password"
                        placeholder="请输入密码"
                        :input-border="false"
                        :style="{ width: '100%' }"
                    >
                        <view slot="right">
                            <u-icon
                                name="eye"
                                @click="pwdShow = !pwdShow"
                                v-show="!pwdShow"
                                size="36rpx"
                            >
                            </u-icon>
                            <u-icon
                                name="eye-off"
                                @click="pwdShow = !pwdShow"
                                v-show="pwdShow"
                                size="36rpx"
                            ></u-icon>
                        </view>
                    </u-field>
                </view>
                <!-- <view class="input m-t-40">
          <u-field
            label-width="0"
            type="password"
            v-model="ferget.password_confirm"
            placeholder="请确认密码"
            :input-border="false"
            :style="{ width: '100%' }"
          />
        </view> -->
            </view>

            <button class="btn white" size="lg" @tap="fergetFun" :class="{ disabled: isDisabled }">
                立即重置密码
            </button>
        </view>
    </view>
</template>

<script>
import { apiResetPassword, apiRegisterCaptcha } from '@/api/app'
import { mapGetters } from 'vuex'
import { SMSType } from '@/utils/type'

export default {
    data() {
        return {
            ferget: {
                mobile: '',
                code: '',
                password: ''
                // password_confirm: "",
            },
            pwdShow: false,
            codeTips: ''
        }
    },
    methods: {
        codeChange(tip) {
            this.codeTips = tip
        },
        fergetFun() {
            let { mobile, password, code, password_confirm } = this.ferget
            if (!mobile) {
                this.$toast({
                    title: '请输入手机号'
                })
                return
            }
            if (!code) {
                this.$toast({
                    title: '请输入验证码'
                })
                return
            }
            if (!password) {
                this.$toast({
                    title: '请输入密码'
                })
                return
            }
            //   if (!password) {
            //     this.$toast({
            //       title: "请再次输入密码",
            //     });
            //     return;
            //   }
            //   if (password != password_confirm) {
            //     this.$toast({
            //       title: "两次密码输入不一致",
            //     });
            //     return;
            //   }
            apiResetPassword({
                mobile,
                password,
                code
            }).then(({ code }) => {
                if (code == 1) {
                    setTimeout(() => {
                        this.$Router.back(1)
                    }, 1500)
                }
            })
        },
        sendSMS() {
            if (!this.$refs.uCode.canGetCode) return

            if (this.ferget.mobile.length !== 11) {
                this.$toast({
                    title: '请输入正确手机号'
                })
                return
            }
            apiRegisterCaptcha({
                mobile: this.ferget.mobile,
                key: SMSType.FINDPWD
            }).then((res) => {
                if (res.code == 1) {
                    this.$refs.uCode.start()
                    this.$toast({
                        title: res.msg
                    })
                }
            })
        }
    },
    computed: {
        ...mapGetters(['appConfig']),
        isDisabled() {
            if (this.ferget.mobile.length == 11 && this.ferget.code && this.ferget.password) {
                return false
            } else {
                return true
            }
        }
    }
}
</script>

<style lang="scss">
page {
    background-color: white;
}

.forget-pwd {
    padding: 60rpx;

    &-text {
        font-size: 38rpx;
    }
    .input {
        border: 1px solid #d7d7d7;
        height: 100rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
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

    .btn {
        margin-top: 60rpx;
        height: 100rpx;
        line-height: 100rpx;
        @include background_color();
    }
    .disabled {
        opacity: 0.5;
    }
}
</style>
