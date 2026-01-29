<template>
    <view :data-theme="themeColor">
        <u-tabbar :value="currentIndex" :active-color="list[active].selectColor" 
        :inactiveColor="list[active].color" :border-top="false" @change="change" :list="list"
         ></u-tabbar>
    </view>
</template>

<script>
    import {
        mapGetters
    } from 'vuex'
    import {router} from "@/router.js"
    import {currentPage} from "@/utils/tools.js"
    export default {
        props: {
            active: {
                type: Number,
                default: 0
            }
        },
        
        computed: {
            ...mapGetters(["appConfig"]),
            
            tabbarList() {
                let data = this.appConfig
                this.list = data.navigation_menu
                return data.navigation_menu
            },
        },
        
        created() {
            this.tabbarList
            this.currentPath
        },
        
        watch: {
            active: {
                handler(val) {
                    this.currentIndex = val;
                },
                immediate: true
            }
        },

        data() {
            return {
                list: [],
                currentIndex: 0,//当前索引
                tabbar: ['/pages/index/index', '/pages/order/order', '/pages/order_list/order_list', '/pages/user/user']
            }
        },

        methods: {
            change(event) {                
                uni.switchTab({
                    url: this.tabbar[event]
                })
            }
        }
    }
</script>

<style>
</style>
