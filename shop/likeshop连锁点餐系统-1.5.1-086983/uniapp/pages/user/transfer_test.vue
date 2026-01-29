<template>
    <view class="transfer-test">
        <view class="p-30 bg-white m-t-20">
            <view class="lg bold m-b-20">商家转账到零钱测试</view>
            <view class="form-item flex row-between border-b p-v-20">
                <view class="label">转账金额(元)</view>
                <input type="digit" v-model="amount" placeholder="请输入金额" class="text-right" />
            </view>
            <view class="sm muted m-t-20">
                提示：此功能仅用于测试微信商家转账到零钱功能是否配置正确。
            </view>
        </view>

        <view class="p-30 m-t-50">
            <button class="bg-primary white br60" @tap="handleTransfer">立即发起转账测试</button>
        </view>

        <view class="p-30 muted sm" v-if="result">
            <view class="m-b-10">测试结果：</view>
            <text>{{ result }}</text>
        </view>
    </view>
</template>

<script>
import { transferTest } from '@/api/user'
export default {
    data() {
        return {
            amount: '0.01',
            result: ''
        }
    },
    methods: {
        async handleTransfer() {
            if (!this.amount || parseFloat(this.amount) <= 0) {
                return this.$toast({ title: '请输入有效金额' });
            }
            uni.showLoading({ title: '请求中...' });
            try {
                // 注意：这里调用的是我们即将添加的测试接口
                const res = await transferTest({ amount: this.amount });
                this.result = JSON.stringify(res, null, 2);
                if (res.code == 1) {
                    this.$toast({ title: '请求成功' });
                } else {
                    this.$toast({ title: res.msg || '请求失败' });
                }
            } catch (e) {
                this.result = e.message || '网络请求失败';
            } finally {
                uni.hideLoading();
            }
        }
    }
}
</script>

<style lang="scss">
.transfer-test {
    min-height: 100vh;
    background-color: #f8f8f8;
    .form-item {
        padding: 30rpx 0;
    }
}
</style>
