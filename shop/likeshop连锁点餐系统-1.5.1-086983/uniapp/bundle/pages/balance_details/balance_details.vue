<template>
    <view :data-theme="themeName">
        <u-tabs
            font-size="28"
            name="tabsName"
            inactive-color="#333"
            :active-color="themeColor"
            :list="tabList"
            :is-scroll="false"
            :current="current"
            @change="change"
        >
        </u-tabs>

        <!-- <block v-for="(items, index) in tabList" :key="index">
            <template v-if="index == current"> -->
        <mescroll-body
            ref="mescrollRef"
            height="90vh"
            @init="mescrollInit"
            @up="upCallback"
            :up="upOption"
            @down="downCallback"
        >
            <view class="p-t-20">
                <view class="bg-white" v-for="(item, index2) in lists" :key="index2">
                    <view class="record-cell flex row-between">
                        <!-- Left -->
                        <view>
                            <view class="remark md">{{ item.source_type }}</view>
                            <view class="time m-t-10 muted sm">{{ item.create_time }}</view>
                        </view>

                        <!-- Right -->
                        <view class="black">
                            <template v-if="item.change_type == 2">
                                <view class="normal lg">{{ item.change_amount_format }}</view>
                            </template>
                            <template v-if="item.change_type == 1">
                                <view class="money lg">{{ item.change_amount_format }}</view>
                            </template>
                        </view>
                    </view>
                </view>
            </view>
        </mescroll-body>
        <!-- </template>
        </block> -->
    </view>
</template>

<script>
import MescrollMixin from '@/components/mescroll-uni/mescroll-mixins.js'
import { apiBalanceDetails } from '@/api/user'
export default {
    mixins: [MescrollMixin], // 使用mixin
    data() {
        return {
            lists: [],
            tabList: [
                {
                    tabsName: '全部',
                    list: [],
                    type: 0
                },
                {
                    tabsName: '消费',
                    list: [],
                    type: 1
                },
                {
                    tabsName: '充值',
                    list: [],
                    type: 2
                }
            ],
            current: 0,

            // Tabs 列表
            upOption: {
                empty: {
                    icon: '/static/images/order_null.png',
                    tip: '暂无记录' // 提示
                }
            },
            list: [] // 列表数据--全部
        }
    },

    onLoad() {
        const type = this.$Route.query.type || 0
        this.current = type
    },

    methods: {
        change(index) {
            this.current = index
            this.mescroll.triggerDownScroll()
            console.log(this.current)
        },

        // 上拉加载
        upCallback(page) {
            const index = this.current
            const pageNum = page.num // 页码, 默认从1开始
            const pageSize = page.size // 页长, 默认每页10条
            apiBalanceDetails({
                page_size: pageSize,
                page_no: pageNum,
                source: index
            })
                .then(({ data }) => {
                    if (page.num == 1) this.lists = []
                    const curPageData = data.list
                    const curPageLen = curPageData.length
                    const hasNext = !!data.more
                    this.lists = this.lists.concat(curPageData)
                    this.mescroll.endSuccess(curPageLen, hasNext)
                })
                .catch((err) => {
                    console.log(err)
                    this.mescroll.endErr()
                })
        }
    }
}
</script>

<style lang="scss" scoped>
.record-cell {
    padding: 16rpx 30rpx;
    border-bottom: $-solid-border;

    .money {
        @include font_color();
    }
}

.record-cell:last-child {
    border-bottom: 0;
}
</style>
