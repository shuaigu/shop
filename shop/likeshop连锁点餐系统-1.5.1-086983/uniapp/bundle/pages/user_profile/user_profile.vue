<template>
    <view :data-theme="themeName" style="padding: 24rpx">
        <!-- 头部修改头像 -->
        <view class="header bg-white p-t-30 m-b-24">
            <button
                class="flex flex-col row-center"
                hover-class="none"
                open-type="chooseAvatar"
                @chooseavatar="onChooseAvatar"
                @click="onChooseAvatar"
            >
                <image
                    :src="
                        userInfos.avatar != ''
                            ? userInfos.avatar
                            : '/static/images/portrait_empty.png'
                    "
                ></image>
                <view class="muted xs">点击修改头像</view>
            </button>
        </view>

        <!-- 昵称 -->
        <view class="item nr flex row-between">
            <view class="label">昵称</view>
            <input
                type="nickname"
                class="content"
                v-model="userInfos.nickname"
                placeholder="请输入昵称"
            />
        </view>
        <!-- 手机号 -->
        <view class="item nr flex row-between">
            <view class="label">手机号</view>
            <view class="content">{{
                userInfos.mobile == '' ? '未绑定手机号' : userInfos.mobile
            }}</view>
            <!-- #ifdef MP -->
            <button
                class="br60 bind nr flex row-center"
                open-type="getPhoneNumber"
                @getphonenumber="getPhoneNumber"
            >
                {{ userInfos.mobile ? '更换手机号' : '绑定手机号' }}
            </button>
            <!-- #endif -->
            <!-- #ifndef MP -->

            <button
                class="br60 bind nr flex row-center"
                open-type="getPhoneNumber"
                @click="getPhoneNumber"
            >
                {{ userInfos.mobile ? '更换手机号' : '绑定手机号' }}
            </button>
            <!-- #endif -->
        </view>
        <!-- 绑定微信 -->
        <!-- #ifdef H5 -->

        <view
            class="item nr flex row-between"
            v-if="!userInfos.is_auth == false"
            @click="bindWeChat"
        >
            <view class="label">微信授权</view>
            <view class="content">未授权</view>
        </view>
        <!-- #endif -->

        <!-- 性别 -->
        <view class="item nr flex row-between">
            <view class="label">性别</view>
            <view class="content">
                <u-radio-group
                    shape="circle"
                    :active-color="themeColor"
                    v-model="userInfos.sex"
                    @change="changeSex"
                >
                    <u-radio name="1"> 男 </u-radio>
                    <u-radio name="2"> 女 </u-radio>
                </u-radio-group>
            </view>
        </view>
        <!-- 生日 -->
        <view class="item nr flex row-between" @click="showDate = true">
            <view class="label">生日</view>
            <view class="content">
                {{ !userInfos.birthday ? '——' : userInfos.birthday }}
            </view>
        </view>

        <view class="btn flex row-center white" @click="setUserInfoFun"> 保存 </view>

        <view class="btn-loginout flex row-center white" @click="handleLoginOut"> 退出登录 </view>

        <!-- 生日的日期选择 -->
        <u-picker
            mode="time"
            v-model="showDate"
            @confirm="confirmDate"
            confirm-color="#101010"
            :params="params"
        >
        </u-picker>
    </view>
</template>

<script>
import wechath5 from '@/utils/wechath5'

import {
    setUserInfo, //设置用户信息
    getUserInfo, //获取用户信息
    getWxMnpMobile, //获取微信手机号码
    // hasPayPassword,      //判断是否有交易密码
    apiBindMobileCaptcha, //发送验证码绑定手机号
    apiBindMobile, //绑定手机号
    apiOaAuthLogin
} from '@/api/user'
import { chooseImage, uploadFile } from '@/utils/tools.js'
import { mapState } from 'vuex'
import { getWxCode, getUserProfile } from '@/utils/login'
import { userLogout } from '@/api/user'
import store from '@/store'

export default {
    data() {
        return {
            userInfos: {}, //用户信息
            mobile: '', //手机号码
            showDate: false, //生日
            date: [], //显示的生日
            code: '',
            params: {
                year: true,
                month: true,
                day: true,
                // 时间戳
                timestamp: true
            }
        }
    },

    methods: {
        // 获取用户信息
        getUserInfoFun() {
            getUserInfo().then((res) => {
                this.userInfos = res.data
            })
        },

        // 修改用户信息
        setUserInfoFun() {
            let user = this.userInfos
            const params = {
                ...user,
                birthday: Math.round(new Date(user.birthday) / 1000)
            }
            setUserInfo({
                ...params
            }).then((res) => {
                this.getUserInfoFun()
                this.$toast({
                    title: res.msg
                })
            })
        },

        // 上传图片
        onChooseAvatar(e) {
            // #ifndef MP-WEIXIN
            // 此为uView的跳转方法，详见"文档-JS"部分，也可以用uni的uni.navigateTo
            this.$Router.push({
                // 关于此路径，请见下方"注意事项"
                path: '/components/uview-ui/components/u-avatar-cropper/u-avatar-cropper',
                // 内部已设置以下默认参数值，可不传这些参数
                query: {
                    // 输出图片宽度，高等于宽，单位px
                    destWidth: 300,
                    // 裁剪框宽度，高等于宽，单位px
                    rectWidth: 200,
                    // 输出的图片类型，如果'png'类型发现裁剪的图片太大，改成"jpg"即可
                    fileType: 'jpg'
                }
            })
            // #endif
            // #ifdef MP-WEIXIN
            if (e.detail.avatarUrl) {
                this.uploadAvatar(e.detail.avatarUrl)
            }
            // #endif
        },
        // 修改用户昵称
        // async changeNameConfirm(e) {
        // 	this.fieldType = FieldType.NICKNAME;
        // 	this.newNickname = e.detail.value.nickname
        // 	if (!this.newNickname) return this.$toast({
        // 		title: '请输入新的昵称'
        // 	})
        // 	await this.setUserInfoFun(this.newNickname)
        // 	this.showNickName = false;
        // },

        // 选择性别
        changeSex(event) {
            this.userInfos.sex = event
        },

        // 生日的选择
        confirmDate(event) {
            this.userInfos.birthday = event.year + '-' + event.month + '-' + event.day
        },

        // 绑定｜｜修改用户手机号
        // #ifdef MP
        async getPhoneNumber(e) {
            this.code = await getWxCode()
            const { encryptedData, iv } = e.detail
            let data = {
                code: this.code,
                encrypted_data: encryptedData,
                iv
            }
            if (encryptedData) {
                getWxMnpMobile({
                    ...data
                }).then((res) => {
                    this.userInfos.mobile = res.data.purePhoneNumber
                })
            }
        },
        // #endif
        // #ifndef MP

        getPhoneNumber() {
            if (this.userInfos.mobile) {
                uni.navigateTo({
                    url: '/bundle/pages/change_mobile/change_mobile'
                })
            } else {
                uni.navigateTo({
                    url: '/bundle/pages/bind_mobile/bind_mobile'
                })
            }
        },
        // #endif

        uploadAvatar(path) {
            uni.showLoading({
                title: '正在上传中...',
                mask: true
            })
            uploadFile(path)
                .then((res) => {
                    uni.hideLoading()
                    this.userInfos.avatar = res.uri
                })
                .catch(() => {
                    uni.hideLoading()
                    this.$toast({
                        title: '上传失败'
                    })
                })
        },
        handleLoginOut() {
            uni.showModal({
                title: '是否确认退出登录',
                confirmColor: this.themeColor,
                success: ({ confirm }) => {
                    if (confirm) {
                        userLogout()
                            .then(({ code }) => {
                                if (code == 1) {
                                    store.commit('logout')
                                    this.$toast({
                                        title: '退出成功'
                                    })
                                    setTimeout(() => {
                                        uni.redirectTo({
                                            url: '/pages/login/login'
                                        })
                                    }, 500)
                                }
                            })
                            .catch((err) => {
                                this.$toast({
                                    title: err
                                })
                            })
                    }
                },
                fail: (err) => {
                    console.log(err)
                }
            })
        },
        bindWeChat() {
            this.oaAuth()
        },
        oaAuth() {
            wechath5.getWxUrl()
        }
    },

    created() {
        // 监听从裁剪页发布的事件，获得裁剪结果
        uni.$on('uAvatarCropper', (path) => {
            this.uploadAvatar(path)
        })
    },

    onUnload() {
        uni.$off('uAvatarCropper')
    },

    async onLoad(options) {
        // #ifdef MP
        this.code = await getWxCode()
        // #endif
        // #ifdef H5
        let { code } = options
        if (code) {
            if (Array.isArray(code)) code = code.pop()
            await apiOaAuthLogin({
                code
            })
        }
        // #endif
    },
    onShow() {
        this.getUserInfoFun()
    }
}
</script>

<style lang="scss">
.header {
    width: 100%;
    height: 240rpx;
    border-radius: 14rpx;

    image {
        width: 120rpx;
        height: 120rpx;
        border-radius: 50%;
    }
}

.item {
    margin-top: 2rpx;
    padding: 30rpx 20rpx;
    // border-radius: 14rpx;
    background-color: #ffffff;

    .label {
        width: 150rpx;
    }

    .content {
        flex: 1;
        width: 80%;
    }

    .bind {
        width: 180rpx;
        height: 56rpx;
        border-width: 1rpx;
        border-style: solid;
        @include font_color();
        @include border_color();
    }
}

.btn {
    height: 88rpx;
    border-radius: 10rpx;
    margin: 60rpx 10rpx 0;
    @include background_color();
}
.btn-loginout {
    height: 88rpx;
    border-radius: 10rpx;
    margin: 60rpx 10rpx 0;
    // background-color: white;
    color: rgb(126, 126, 126);
}
</style>
