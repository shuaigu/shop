import { getShoplist } from '@/api/store'

const state = {
    location: {
        latitude: 0,
        longitude: 0
    },
    shopData: {}
}

const mutations = {
    setLocation(state, data) {
        state.location = data
    },
    setShopData(state, data) {
        state.shopData = data
    }
}

const actions = {
    // 位置授权
    async getAuthorize({ dispatch }, { resolve }) {
        const [error, data] = await uni.showModal({
            title: '您已拒绝地理位置权限',
            content: '是否进入权限管理，调整授权？'
        })
        if (data.confirm) {
            const [error, data] = await uni.openSetting()
            if (data.authSetting['scope.userLocation']) resolve(dispatch('getLocationFunc'))
        } else {
            resolve(false)
        }
    },
    // 获取当前定位
    async getLocationFunc({ dispatch, rootState, commit }) {
        return new Promise((resolve, reject) => {
            dispatch('getSystemInfo')
            // #ifdef MP
            if (!rootState.app.sysInfo.locationEnabled) {
                uni.showModal({
                    title: '温馨提示',
                    content: '您的手机定位还未开启'
                })
                return
            }
            // #endif
            uni.showLoading({
                title: '获取定位中'
            })
            uni.getLocation({
                // #ifdef MP

                type: 'gcj02',
                // #endif
                success(res) {
                    commit('setLocation', res)
                    resolve(res)
                    uni.hideLoading()
                },
                fail(error) {
                    // reject(false)
                    // #ifdef MP
                    if (error.errMsg == 'getLocation:fail auth deny')
                        return dispatch('getAuthorize', { resolve })
                    // #endif
                    console.log(error)
                    uni.hideLoading()
                }
            })
        })
        // console.log('获取地址')
        // try {
        // 	const [error, res] = await
        // 	// #ifdef MP
        // 	console.log(error, res);

        // 	// #endif

        // 	// if( error ) {
        // 	// 	uni.showModal({
        // 	// 	    title: '温馨提示',
        // 	// 	    // content: JSON.stringify(error.errMsg)
        // 	// 		content: "获取位置失败，请检查是否开启定位！",
        // 	// 	})
        // 	// 	return
        // 	// }
        // 	return true
        // } catch (err) {
        // 	console.log(err)
        // 	// toast({ title: err.errMsg })
        // 	// throw new Error(err + '获取位置')
        // }
    },
    // 获取离自己最近的店铺
    getShoplist({ state, commit }, id) {
        return new Promise((resolve) => {
            getShoplist({
                latitude: state.location.latitude,
                longitude: state.location.longitude
            }).then((res) => {
                if (res.code == 1) {
                    // 找出离自己最近的距离
                    const min = Math.min.apply(
                        Math,
                        res.data.list.map(function (o) {
                            return o.distance.split('k')[0]
                        })
                    )
                    // 匹配最近距离的店铺
                    let shop = []
                    console.log(id)
                    if (id) {
                        shop = res.data.list.filter((item) => item.id == id)
                    } else {
                        shop = res.data.list.filter((item) => item.distance.split('k')[0] == min)
                    }
                    console.log(shop)
                    commit('setShopData', shop[0])
                }
                resolve()
            })
        })
    }
}

export default {
    state,
    mutations,
    actions
}
