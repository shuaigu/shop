<template>
    <view class="pages" :data-theme="themeName">
        <view class="login">
            <!-- #ifdef MP-WEIXIN -->
            <view class="mpwx-login flex-col col-center row-around">
                <image class="logo" :src="appConfig.shop_login_logo" mode="heightFix"></image>
                <view>
                    <button size="lg" class="white flex row-center btn" @click="mnpLoginFun">
                        用户一键登录
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
            </view>

            <mplogin-popup
                v-model="showLoginPop"
                :logo="appConfig.shop_login_logo"
                :title="appConfig.name"
                @close="closePopup"
                :login-data="loginData"
                @update="handleSubmitInfo"
            />
            <!--  #endif -->
            <!-- #ifdef H5 -->
            <view class="login-box">
                <view class="flex row-center">
                    <image class="logo" :src="appConfig.shop_login_logo" mode="heightFix"></image>
                </view>
                <template v-if="!phoneLogin">
                    <button
                        size="lg"
                        class="white flex row-center btn"
                        @tap="getCodeUrl"
                        v-if="isWeixin"
                    >
                        用户一键登录
                    </button>
                    <button
                        size="lg"
                        class="white flex row-center btn-phone"
                        @click="phoneLogin = !phoneLogin"
                    >
                        手机号登录
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
                </template>
                <template v-if="phoneLogin">
                    <template v-if="loginType == 0">
                        <view class="input m-t-40">
                            <u-field
                                label-width="0"
                                v-model="mobile"
                                placeholder="请输入账号"
                                :border-bottom="false"
                                :style="{ width: '100%' }"
                                type="number"
                            />
                        </view>
                        <view class="input m-t-40">
                            <u-field
                                label-width="0"
                                v-model="password"
                                type="password"
                                :password-icon="false"
                                placeholder="请输入密码"
                                :border-bottom="false"
                                :style="{ width: '100%' }"
                            >
                                <view class="forget-btn p-l-20" slot="right">
                                    <router-link to="/pages/forget_pwd/forget_pwd">
                                        忘记密码?
                                    </router-link>
                                </view>
                            </u-field>
                        </view>
                    </template>
                    <template v-if="loginType == 1">
                        <view class="input m-t-40">
                            <u-field
                                label-width="0"
                                v-model="telephone"
                                placeholder="请输入手机号"
                                :border-bottom="false"
                                :style="{ width: '100%' }"
                                type="number"
                            />
                        </view>
                        <view class="input m-t-40">
                            <u-field
                                label-width="0"
                                v-model="smsCode"
                                placeholder="请输入验证码"
                                :border-bottom="false"
                                :style="{ width: '100%' }"
                                type="number"
                            >
                                <view slot="right">
                                    <view
                                        class="sms-btn"
                                        @click="sendSMS"
                                        :class="{ disabled: telephone.length !== 11 }"
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
                    </template>
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
                    <button
                        size="lg"
                        class="btn white"
                        @click="loginFun"
                        :class="{ disabled: isDisabled }"
                    >
                        登录
                    </button>
                    <view class="flex row-between" style="width: 100%; margin-top: 40rpx">
                        <view class="lighter" @click="changeLoginType">{{
                            loginType == 0 ? '短信验证码登录' : '账号登录'
                        }}</view>
                        <navigator class="lighter" url="/pages/register/register" hover-class="none"
                            >注册账号</navigator
                        >
                    </view>
                </template>
            </view>
            <!--  #endif -->
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
import { mapMutations, mapActions, mapGetters } from 'vuex'
import {
    accountLogin,
    codeLogin,
    apiRegisterCaptcha,
    wxpLogin,
    smsCodeLogin,
    opLogin,
    authLogin,
    updateUser
} from '@/api/app'
import { bindSuperior } from '@/api/user'
import wechath5 from '@/utils/wechath5'
import { isWeixinClient, currentPage, client } from '@/utils/tools'
import Cache from '@/utils/cache'
import { BACK_URL, INVITE_CODE } from '@/config/cachekey'
import { getWxCode, getUserProfile } from '@/utils/login'
import { SMSType } from '@/utils/type'
const loginType = {
    ACCOUNT_LOGIN: 0,
    SMS_CODE_LOGIN: 1
}
export default {
    data() {
        return {
            password: '',
            mobile: '',
            code: '',
            isWeixin: '',
            loginType: 0,
            smsCode: '',
            codeTips: '',
            telephone: '',
            text: '',
            showLoginPop: false,
            loginData: {},
            phoneLogin: false,
            isAgree: false,
            showModel: false
        }
    },

    async onLoad(option) {
        // #ifdef H5
        // H5微信登录
        this.isWeixin = isWeixinClient()
        if (this.isLogin) {
            uni.switchTab({
                url: '/pages/index/index'
            })
            return
        }
        if (this.isWeixin) {
            const { code } = option
            if (code) {
                // coonsole.log(code)
                const data = await wechath5.authLogin(code)
                this.loginHandle(data)
            } else {
                // wechath5.getWxUrl();
            }
        }
        // #endif
    },
    onUnload() {},
    methods: {
        ...mapMutations(['login']),
        ...mapActions(['getUser']),
        codeChange(tip) {
            this.codeTips = tip
        },
        // 公众号获取code
        getCodeUrl() {
            if (!this.isAgree) {
                this.showModel = true
                return
            }
            wechath5.getWxUrl()
        },
        // 小程序登录
        async mnpLoginFun() {
            if (!this.isAgree) {
                this.showModel = true
                return
            }
            const {
                userInfo: { avatarUrl, nickName, gender }
            } = await getUserProfile()
            uni.showLoading({
                title: '登录中...',
                mask: true
            })
            const wxCode = await getWxCode()
            const { code, data, msg } = await authLogin({
                code: wxCode,
                nickname: nickName,
                headimgurl: avatarUrl
            })
            if (code == 1) {
                if (data.is_new_user) {
                    uni.hideLoading()
                    this.showLoginPop = true
                    this.loginData = data
                } else {
                    this.loginHandle(data)
                }
            } else {
                this.$toast({
                    title: msg
                })
            }
        },
        // 账号登录
        async loginFun() {
            const { mobile, password, telephone, smsCode } = this
            if (this.loginType == 0) {
                if (!mobile) {
                    this.$toast({
                        title: '请输入账户/手机号'
                    })
                    return
                }
                if (!password) {
                    this.$toast({
                        title: '请输入密码'
                    })
                    return
                }
                if (!this.isAgree) {
                    this.showModel = true
                    return
                }
                const { code, data } = await accountLogin({
                    mobile,
                    password,
                    client: client
                })
                if (code == 1) {
                    this.loginHandle(data)
                }
            } else {
                if (!telephone) {
                    this.$toast({
                        title: '请输入手机号'
                    })
                    return
                }
                if (!smsCode) {
                    this.$toast({
                        title: '请输入验证码'
                    })
                    return
                }
                if (!this.isAgree) {
                    this.showModel = true
                    return
                }
                smsCodeLogin({
                    mobile: telephone,
                    code: smsCode
                }).then((res) => {
                    if (res.code == 1) {
                        this.loginHandle(res.data)
                    }
                })
            }
        },
        // 登录结果处理
        async loginHandle(data) {
            this.login(data)
            uni.hideLoading()
            // 绑定邀请码
            const inviteCode = Cache.get(INVITE_CODE)
            if (inviteCode) {
                bindSuperior({
                    code: inviteCode
                })
                Cache.remove(INVITE_CODE)
            }

            if (getCurrentPages().length > 1) {
                uni.navigateBack({
                    success() {
                        const { onLoad, options } = currentPage()
                        onLoad && onLoad(options)
                    }
                })
            } else if (Cache.get(BACK_URL)) {
                this.$Router.replace(Cache.get(BACK_URL))
            } else {
                this.$Router.pushTab('/pages/index/index')
            }
            Cache.remove(BACK_URL)
        },
        changeLoginType() {
            if (this.loginType == loginType.ACCOUNT_LOGIN) {
                this.loginType = loginType.SMS_CODE_LOGIN
            } else if (this.loginType == loginType.SMS_CODE_LOGIN) {
                this.loginType = loginType.ACCOUNT_LOGIN
            }
        },
        // 发送验证码
        sendSMS() {
            if (!this.$refs.uCode.canGetCode) return
            if (!this.telephone) {
                this.$toast({
                    title: '请输入手机号'
                })
                return
            }
            apiRegisterCaptcha({
                mobile: this.telephone,
                key: SMSType.LOGIN
            }).then((res) => {
                if (res.code == 1) {
                    this.$refs.uCode.start()
                    this.$toast({
                        title: res.msg
                    })
                }
            })
        },
        // app微信登录
        async appWxLogin() {
            uni.login({
                provider: 'weixin',
                success: (res) => {
                    uni.showLoading({
                        title: '登录中...',
                        mask: true
                    })
                    const { openid, access_token } = res.authResult
                    opLogin({
                        openid,
                        access_token
                    })
                        .then((res) => {
                            uni.hideLoading()
                            if (res.code == 1) {
                                this.loginHandle(res.data)
                            }
                        })
                        .catch(() => {
                            uni.hideLoading()
                        })
                }
            })
        },
        async handleSubmitInfo(e) {
            const loginData = this.loginData || {}
            const res = await updateUser(e, loginData.token)
            if (res.code == 1) {
                this.loginHandle(loginData)
            }
        },
        closePopup() {
            this.showLoginPop = false
        }
    },
    computed: {
        ...mapGetters(['appConfig']),
        //登录按钮禁用样式
        isDisabled() {
            if (this.mobile && this.password && this.loginType == 0) {
                return false
            } else if (this.telephone.length == 11 && this.smsCode && this.loginType == 1) {
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
    background-color: #fff;
    padding: 0;
}

.login {
    height: 100vh;
    .mpwx-login {
        height: 50%;

        .btn {
            height: 100rpx;
            @include background_color();
            width: 680rpx;
            margin: 80rpx auto 0;
            line-height: 100rpx;
        }

        .logo {
            margin: 80rpx auto;
            height: 80rpx;
        }
    }
    .login-box {
        padding-top: 100rpx;
        padding: 60rpx;

        .logo {
            height: 80rpx;
            margin: 80rpx;
        }
        .btn {
            height: 100rpx;
            @include background_color();
            width: 100%;
            margin: 80rpx auto 0;
            line-height: 100rpx;
        }
        .btn-phone {
            border: 1px solid #bbb;
            height: 100rpx;
            color: black;
            width: 100%;
            margin: 80rpx auto 0;
            line-height: 100rpx;
        }
        .input {
            border: 1px solid #d7d7d7;
            height: 100rpx;
            width: 100%;
            border-radius: 12rpx;
            display: flex;
            align-items: center;
        }
        // .sms-btn {
        //   text-align: center;
        //   border: 1px solid;
        //   width: 176rpx;
        //   height: 60rpx;
        //   line-height: 60rpx;
        //   border-radius: 60rpx;
        //   @include font_color();
        //   @include border_color();
        // }
    }
    .acount-login {
        display: flex;
        flex-direction: column;
        align-items: center;
        height: 100%;
        box-sizing: border-box;

        .input {
            width: 670rpx;
            border-bottom: $-solid-border;
            margin-top: 30rpx;
        }

        .wx-login {
            margin-top: 60rpx;

            .image {
                margin-top: 40rpx;
                width: 80rpx;
                height: 80rpx;
            }
        }

        .login-btn {
            margin: 80rpx 0 50rpx;
            width: 680rpx;
            @include background_color();
        }
    }
}
.comfirm-box {
    text-align: center;
    padding: 60rpx 0 70rpx 0;
}
.agreement {
    @include font_color;
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
