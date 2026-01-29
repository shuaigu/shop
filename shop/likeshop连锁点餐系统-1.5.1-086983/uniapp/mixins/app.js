import { mapGetters, mapMutations } from 'vuex'
import wechath5 from '@/utils/wechath5'

import { isWeixinClient, currentPage, paramsToStr } from '@/utils/tools'
import Cache from '@/utils/cache'
export default {
    data() {
        return {}
    },
    async onLoad(option) {},
    methods: {},
    computed: {
        ...mapGetters(['isLogin', 'themeName', 'themeColor', 'shopData', 'appConfig'])
    },

    // 全局配置分享
    onShareAppMessage() {
        const { share_image, share_intro, mnp_share_title } = this.appConfig
        // const { code } = this.userInfo
        const share = {
            title: mnp_share_title,
            path: `/pages/index/index`
            // imageUrl: share_image
        }
        return share
    },

    onShareTimeline() {
        const { share_image, share_intro, mnp_share_title } = this.appConfig
        const { code } = this.userInfo
        const share = {
            title: mnp_share_title,
            query: `/pages/index/index`
            // imageUrl: share_image
        }
        return share
    }
}
