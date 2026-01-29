<template>
    <view class="p-24">
        <u-parse :html="content" :selectable="true" :show-with-animation="true"></u-parse>
    </view>
</template>

<script>
import { apiPolicyAgreement } from '@/api/app'
export default {
    data() {
        return {
            content: '',
            type: ''
        }
    },

    methods: {
        // 获取服务协议
        getPolicyAgreement() {
            apiPolicyAgreement({}).then(({ data }) => {
                console.log(data)
                if (this.type == 0) {
                    this.content = data.service
                } else {
                    this.content = data.privacy
                }
            })
        }
    },

    onLoad(options) {
        this.type = options.type
        switch (+options.type) {
            case 0:
                uni.setNavigationBarTitle({
                    title: '服务协议'
                })
                break
            case 1:
                uni.setNavigationBarTitle({
                    title: '隐私协议'
                })
                break
        }
        this.getPolicyAgreement()
    }
}
</script>

<style></style>
