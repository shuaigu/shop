<script>
import { mapActions, mapMutations, mapGetters } from 'vuex'
import { getConfig } from '@/api/app'
import { setTabbar } from '@/utils/tools'
import Cache from '@/utils/cache'
export default {
    async onLaunch(options) {
        //#ifdef MP-WEIXIN
        this.checkMpUpdate()
        //#endif
        // 获取配置
        this.getConfigFun()
        this.getUser()
        this.getSystemInfo()
        this.getDecorateConfig()

        // 定位获取经纬度( 传入需要执行的函数 )
        this.getLocationFunc().then(async (res) => {
            if (res == false) return
            await this.getShoplist(uni.getStorageSync('sid'))
            if (uni.getStorageSync('did')) {
                uni.reLaunch({
                    url: '/pages/order/order?'
                })
            }
        })
        //#ifdef H5
        const { clarity_app_id } = this.appConfig
        console.log(this.appConfig, 1111)

        if (clarity_app_id) {
            ;(function (c, l, a, r, i, t, y) {
                c[a] =
                    c[a] ||
                    function () {
                        ;(c[a].q = c[a].q || []).push(arguments)
                    }
                t = l.createElement(r)
                t.async = 1
                t.src = 'https://www.clarity.ms/tag/' + i
                y = l.getElementsByTagName(r)[0]
                y.parentNode.insertBefore(t, y)
            })(window, document, 'clarity', 'script', clarity_app_id)
        }
        //#endif
    },
    computed: {
        ...mapGetters(['appConfig'])
    },
    methods: {
        ...mapActions([
            'getUser',
            'wxShare',
            'getDecorateConfig',
            'getSystemInfo',
            'getLocationFunc',
            'getShoplist'
        ]),
        ...mapMutations(['setConfig', 'setLocation']),
        ...mapGetters(['location']),
        async getConfigFun() {
            const { code, data } = await getConfig()
            if (code == 1) {
                this.setConfig(data)
                // setTabbar()
                // 防止第一次调用时拿不到数据
                this.wxShare()
            }
        },
        //#ifdef MP-WEIXIN
        checkMpUpdate() {
            const updateManager = wx.getUpdateManager()
            updateManager.onUpdateReady(function () {
                wx.showModal({
                    title: '更新提示',
                    content: '新版本已准备好，是否重启？',
                    success: function (res) {
                        if (res.confirm) {
                            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                            updateManager.applyUpdate()
                        }
                    }
                })
            })
        }
        //#endif
    }
}
</script>
<style lang="scss">
@import 'styles/common.scss';
@import 'components/uview-ui/index.scss';
/*每个页面公共css */
</style>
