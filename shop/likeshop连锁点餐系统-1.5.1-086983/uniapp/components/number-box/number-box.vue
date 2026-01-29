<template>
    <view :data-theme="themeName">
        <view class="flex">
            <view class="reduce" :class="inputValue==0&&isZero?'trans':'appear'" @click="reduce">
                <u-icon name="minus-circle" :color="themeColor" :size="size"></u-icon>
            </view>
            <view class="num normal md" :class="inputValue==0&&isZero?'trans1':'appear1'">
                {{ value }}
            </view>
            <view class="plus" @click="plus($event)" ref="btn">
                <u-icon name="plus-circle-fill" :color="themeColor" :size="size"></u-icon>
            </view>
        </view>
    </view>
</template>

<script>
    export default {
        name: "number-box",
        props: {
            // 预先显示数字
            value: {
                type: Number,
                default: 1
            },

            // 尺寸大小 数字
            size: {
                type: Number,
                default: 50
            },

            // 是否禁用
            disabled: {
                type: Boolean | null,
                default: false
            },

            // 能否小小于等于0
            isZero: {
                type: Boolean,
                default: false
            }
        },

        data() {
            return {
                inputValue: 0,
                changeFromInner: false, // 值发生变化，是来自内部还是外部
                innerChangeTimer: null, // 内部定时器
                // location: {
                //     left: 0,
                //     top: 0
                // },
                isFistVal: true
            }
        },

        watch: {
            value: {
                handler(val1, val2) {
                    // 只有value的改变是来自外部的时候，才去同步inputVal的值，否则会造成循环错误
                    if (!this.changeFromInner) {
                        if (this.inputValue == val1) return
                        this.inputValue = val1;
                        // 因为inputValue变化后，会触发this.handleChange()，在其中changeFromInner会再次被设置为true，
                        // 进行this.$nextTick延时
                        this.$nextTick(function() {
                            this.changeFromInner = false;
                        })
                    }
                },
                immediate: true
            },
            
            inputValue(val1, v2) {
                if(this.isFistVal) return;
                // 发出change事件
                this.handleChange(val1, 'change');
            }
        },

        created() {
            // this.handleChange = trottle(this.handleChange, 400, this)
            this.inputValue = Number(this.value);
            this.$nextTick(function() {
                this.isFistVal = false
            })
        },

        methods: {
            //加入增加数量并加入购物车
            plus(event) {
                if (!this.isLogin) return uni.navigateTo({
            		url: '/pages/login/login'
            	});
                this.inputValue += 1;
                // this.location.left = (event.touches[0].pageX)
                // this.location.top = (event.touches[0].pageY - 20)
            },
            // 点餐减商品
            reduce() {
                if(this.inputValue <= 1) {
                    if (!this.isZero) return false
                }
                this.inputValue -= 1
            },

            handleChange(value, type) {
                if (this.disabled) return;
                // 清除定时器，避免造成混乱
                if (this.innerChangeTimer) {
                    clearTimeout(this.innerChangeTimer);
                    this.innerChangeTimer = null;
                }
                // 发出input事件，修改通过v-model绑定的值，达到双向绑定的效果
                this.changeFromInner = true;
                // 一定时间内，清除changeFromInner标记，否则内部值改变后
                // 外部通过程序修改value值，将会无效
                this.innerChangeTimer = setTimeout(() => {
                    this.changeFromInner = false;
                }, 100);
                this.$emit('input', Number(value));
                this.$emit(type, {
                    // 转为Number类型
                    // location: this.location,
                    value: Number(value)
                })
            }
        }
    }
</script>

<style lang="scss">
    .num {
        width: 60rpx;
        text-align: center;
    }

    .trans {
        position: relative;
        left: 100rpx;
        opacity: 0;
        transform: rotate(0deg);
        transition: all .1s linear;
    }

    .appear {
        position: relative;
        left: 0rpx;
        opacity: 1;
        transform: rotate(-360deg);
        transition: all .1s linear;
    }

    .trans1 {
        position: relative;
        left: 50rpx;
        opacity: 0;
        transform: rotate(0deg);
        transition: all .1s linear;
    }

    .appear1 {
        position: relative;
        left: 0rpx;
        opacity: 1;
        transform: rotate(-360deg);
        transition: all .1s linear;
    }
</style>
