// 未登录跳转
export const testLogin = ( ) => {
	// 获取当前页面栈
	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1]
	// 获取当前页面路径和参数
	const route = currentPage.route
	const options = currentPage.options
	
	// 构建完整的页面路径（包含参数）
	let fullPath = '/' + route
	if (options && Object.keys(options).length > 0) {
		const params = Object.keys(options)
			.map(key => `${key}=${options[key]}`)
			.join('&')
		fullPath += '?' + params
	}
	
	uni.showModal( {
		title: '提示',
		content: '请登录后继续',
		confirmColor: '#399bfe',
		confirmText: '去登录',
		success: ( res ) => {
			if ( res.confirm ) {
				uni.navigateTo({
					url: `/pages/login/login?redirect=${encodeURIComponent(fullPath)}`
				})
			}
		}
	} )
}