import { getUser } from '@/api/user'
import { USER_INFO, TOKEN, CONFIG } from '@/config/cachekey'
import Cache from '@/utils/cache'
import wechath5 from '@/utils/wechath5'

const state = {
    config: Cache.get(CONFIG) || {
        center_setting: {
            top_bg_image: ''
        },
        navigation_menu: []
    },
    userInfo: {
        user_money: 0,
        user_integral: 0
    },
    token: Cache.get(TOKEN) || null
}

const mutations = {
    login(state, opt) {
        state.token = opt.token
        Cache.set(TOKEN, opt.token, 59 * 24 * 60 * 60)
        this.dispatch('getUser')
    },
    logout(state) {
        state.token = undefined
        state.userInfo = {
            user_money: 0,
            user_integral: 0,
            coupon: 0
        }
        Cache.remove(TOKEN)
    },
    setUserInfo(state, user) {
        state.userInfo = user
    },
    // 配置
    setConfig(state, data) {
        state.config = Object.assign(state.config, data)
        Cache.set(CONFIG, state.config)
    },
    setSystemInfo(state, data) {
        state.sysInfo = data
    }
}

const actions = {
    getUser({ state, commit }) {
        return new Promise((resolve) => {
            getUser().then((res) => {
                if (res.code == 1) {
                    commit('setUserInfo', res.data)
                }
                resolve()
            })
        })
    },

    wxShare({ state }, opt) {
        // #ifdef H5
        const shareInfo = state.config.share
        const inviteCode = state.userInfo.distribution_code
        const href = window.location.href
        const sym = href.includes('?') ? '&' : '?'
        const option = {
            shareTitle: shareInfo.h5_share_title,
            shareLink: inviteCode ? `${href}${sym}invite_code=${inviteCode}` : href,
            shareImage: shareInfo.h5_share_image,
            shareDesc: shareInfo.h5_share_intro
        }
        wechath5.share(Object.assign(option, opt))
        // #endif
    },

    getSystemInfo({ state, commit }) {
        uni.getSystemInfo({
            success: (res) => {
                let { statusBarHeight, platform } = res
                let navHeight
                if (platform == 'ios' || platform == 'devtools') {
                    navHeight = statusBarHeight + 44
                } else {
                    navHeight = statusBarHeight + 48
                }
                commit('setSystemInfo', {
                    ...res,
                    navHeight
                })
                console.log(state)
            },
            fail(err) {
                console.log(err)
            }
        })
    }
}

export default {
    state,
    mutations,
    actions
}
