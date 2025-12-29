// 未登录跳转
export const testLogin = ( ) => {
	uni.showModal( {
		title: '提示',
		content: '请登录后继续',
		confirmColor: '#399bfe',
		confirmText: '去登录',
		success: ( res ) => {
			if ( res.confirm ) {
				uni.reLaunch( {
					url: "/pages/login/login"
				} )
			}
		}
	} )
}