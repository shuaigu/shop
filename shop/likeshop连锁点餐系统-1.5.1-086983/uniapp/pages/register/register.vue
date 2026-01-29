<template>
    <view class="pages" :data-theme="themeName">
        <view class="register">
            <view class="input-container">
                <view class="register-text">注册新账号</view>
                <view class="input m-t-40">
                    <u-field
                        label-width="0"
                        v-model="register.mobile"
                        placeholder="请输入手机号"
                        :border-bottom="false"
                        type="number"
                        :input-border="false"
                        :style="{ width: '100%' }"
                    />
                </view>
                <view class="input m-t-40" v-if="appConfig.register_sms">
                    <u-field
                        label-width="0"
                        v-model="register.code"
                        placeholder="请输入验证码"
                        :input-border="false"
                        :border-bottom="false"
                        type="number"
                        :style="{ width: '100%' }"
                    >
                        <view slot="right">
                            <view
                                class="sms-btn"
                                @tap="sendSMS"
                                :class="{ disabled: register.mobile.length !== 11 }"
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
                        type="text"
                        v-model="register.password"
                        placeholder="请输入密码"
                        :password="!pwdShow"
                        :input-border="false"
                        :border-bottom="false"
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
                <view class="input m-t-40">
                    <u-field
                        label-width="0"
                        type="text"
                        v-model="register.password_confirm"
                        placeholder="请确认密码"
                        :password="!comfirmPwdShow"
                        :input-border="false"
                        :border-bottom="false"
                        :style="{ width: '100%' }"
                    >
                        <view slot="right">
                            <u-icon
                                name="eye"
                                @click="comfirmPwdShow = !comfirmPwdShow"
                                v-show="!comfirmPwdShow"
                                size="36rpx"
                            >
                            </u-icon>
                            <u-icon
                                name="eye-off"
                                @click="comfirmPwdShow = !comfirmPwdShow"
                                v-show="comfirmPwdShow"
                                size="36rpx"
                            ></u-icon>
                        </view>
                    </u-field>
                </view>
            </view>
            <button
                class="register-btn white"
                size="lg"
                @tap="registerFun"
                :class="{ disabled: isDisabled }"
            >
                注册
            </button>

            <view class="m-t-40">
                <u-checkbox
                    v-model="isAgree"
                    :active-color="themeColor"
                    shape="circle"
                    :label-disabled="true"
                >
                    <view class="sm flex">
                        已阅读并同意
                        <router-link
                            data-theme=""
                            to="/bundle/pages/server_explan/server_explan?type=0"
                        >
                            <view class="agreement">《服务协议》</view>
                        </router-link>
                        和
                        <router-link to="/bundle/pages/server_explan/server_explan?type=1">
                            <view class="agreement">《隐私协议》</view>
                        </router-link>
                    </view>
                </u-checkbox>
            </view>
        </view>
        <u-modal
            :value="showModel"
            show-cancel-button
            :show-title="false"
            @confirm=";(isAgree = true), (showModel = false)"
            @cancel="showModel = false"
            :confirm-color="themeColor"
        >
            <view class="comfirm-box">
                <view> 请先阅读并同意 </view>
                <view class="flex row-center">
                    <router-link
                        data-theme=""
                        to="/bundle/pages/server_explan/server_explan?type=0"
                    >
                        <view class="agreement">《服务协议》</view>
                    </router-link>
                    和
                    <router-link to="/bundle/pages/server_explan/server_explan?type=1">
                        <view class="agreement">《隐私协议》</view>
                    </router-link>
                </view>
            </view>
        </u-modal>
    </view>
</template>

<script>
import { apiRegisterCaptcha, apiAccountRegister } from '@/api/app'
import { mapGetters } from 'vuex'
import { SMSType } from '@/utils/type'

export default {
    name: 'register',
    data() {
        return {
            register: {
                mobile: '',
                code: '',
                password: '',
                password_confirm: ''
            },
            codeTips: '',
            isAgree: false, // 是否同意协议
            showModel: false,
            pwdShow: false,
            comfirmPwdShow: false
        }
    },
    methods: {
        codeChange(tip) {
            this.codeTips = tip
        },
        registerFun() {
            let { mobile, password, code, password_confirm } = this.register
            if (!mobile) {
                this.$toast({
                    title: '请输入手机号'
                })
                return
            }
            if (!password) {
                this.$toast({
                    title: '请输入密码'
                })
                return
            }
            if (!password) {
                this.$toast({
                    title: '请再次输入密码'
                })
                return
            }
            if (password != password_confirm) {
                this.$toast({
                    title: '两次密码输入不一致'
                })
                return
            }
            if (!this.isAgree) {
                this.showModel = true
                return
            }
            apiAccountRegister(this.register).then(({ code }) => {
                if (code == 1) {
                    this.$toast({
                        title: '注册成功'
                    })
                    setTimeout(() => {
                        this.$Router.back(1)
                    }, 1500)
                }
            })
        },
        sendSMS() {
            if (!this.$refs.uCode.canGetCode) return
            if (this.register.mobile.length !== 11) {
                this.$toast({
                    title: '请输入正确手机号'
                })
                return
            }
            apiRegisterCaptcha({
                mobile: this.register.mobile,
                key: SMSType.REGISTER
            }).then((res) => {
                this.$refs.uCode.start()
            })
        }
    },
    computed: {
        ...mapGetters(['appConfig']),
        isRegisterCode() {
            const { register_sms } = this.appConfig
            return register_sms
        },
        isDisabled() {
            //TODO
            if (this.register_sms) {
                if (
                    this.register.mobile.length == 11 &&
                    this.register.code &&
                    this.register.password &&
                    this.register.password_confirm
                ) {
                    return false
                } else {
                    return true
                }
            } else {
                if (
                    this.register.mobile.length == 11 &&
                    this.register.password &&
                    this.register.password_confirm
                ) {
                    return false
                } else {
                    return true
                }
            }
        }
    }
}
</script>

<style lang="scss">
page {
    background-color: white;
}

.register {
    padding: 40rpx 30rpx 0;
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

    .register-btn {
        margin-top: 60rpx;

        width: 100%;
        height: 100rpx;
        line-height: 100rpx;
        font-size: 32rpx;
        border-radius: 12rpx;
        @include background_color();
    }

    .agreement {
        @include font_color;
    }
}
.comfirm-box {
    text-align: center;
    padding: 60rpx 0 70rpx 0;
}
.disabled {
    opacity: 0.5;
}
</style>
