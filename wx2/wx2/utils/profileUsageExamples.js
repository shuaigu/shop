// 使用方案3工具函数的示例代码

import { 
	checkProfileComplete,
	guideProfileComplete,
	handleWxAvatarChoose,
	handleWxNicknameChange,
	checkWxProfileSupport
} from '@/utils/profileHelper.js'

// 示例1：在任何页面检查用户信息完整度
export function checkUserProfile(userInfo) {
	const result = checkProfileComplete(userInfo)
	console.log('用户信息检查结果:', result)
	
	// result.needComplete - 是否需要完善信息
	// result.needAvatar - 是否需要设置头像
	// result.needNickname - 是否需要设置昵称
	// result.reason - 具体原因
	
	return result
}

// 示例2：在登录后或关键页面引导用户完善信息
export function guideUserProfile(userInfo, options = {}) {
	const guided = guideProfileComplete(userInfo, {
		autoShow: true, // 自动显示引导弹窗
		redirectTo: '/pages/my/my', // 跳转到个人中心页面
		onSkip: () => {
			console.log('用户跳过了信息完善')
			// 可以记录用户行为或执行其他逻辑
		}
	})
	
	return guided
}

// 示例3：在Vue组件中使用
export const useProfileHelper = () => {
	const userStore = useUserInfoStore()
	
	// 检查是否支持微信头像昵称填写
	const supportWxProfile = ref(checkWxProfileSupport())
	
	// 处理头像选择
	const onAvatarChoose = (e) => {
		handleWxAvatarChoose(e, userStore.userInfo.uid, (fileID) => {
			// 头像更新成功
			userStore.updateUserAvatar(fileID)
			console.log('头像更新成功:', fileID)
		}, (error) => {
			// 处理错误
			console.error('头像更新失败:', error)
		})
	}
	
	// 处理昵称修改
	const onNicknameChange = (e) => {
		handleWxNicknameChange(e, userStore.userInfo.uid, userStore.userInfo.nickName, (nickName) => {
			// 昵称更新成功
			userStore.updateUserNickName(nickName)
			console.log('昵称更新成功:', nickName)
		}, (error) => {
			// 处理错误
			console.error('昵称更新失败:', error)
		})
	}
	
	// 检查用户信息完整度
	const checkUserInfo = () => {
		return checkProfileComplete(userStore.userInfo)
	}
	
	// 引导用户完善信息
	const guideComplete = () => {
		return guideProfileComplete(userStore.userInfo)
	}
	
	return {
		supportWxProfile,
		onAvatarChoose,
		onNicknameChange,
		checkUserInfo,
		guideComplete
	}
}

// 示例4：在文章发布等页面使用
export function checkBeforePublish(userInfo) {
	const result = checkProfileComplete(userInfo)
	
	if (result.needComplete) {
		uni.showModal({
			title: '完善个人信息',
			content: `发布内容前建议先${result.reason}，这样可以获得更好的互动效果`,
			confirmText: '去完善',
			cancelText: '继续发布',
			success: (res) => {
				if (res.confirm) {
					uni.switchTab({
						url: '/pages/my/my'
					})
				}
				// 用户选择继续发布，可以继续后续流程
			}
		})
		return false
	}
	
	return true // 信息完整，可以继续
}

// 示例5：在评论或互动功能中使用
export function checkBeforeInteract(userInfo, action = '互动') {
	const result = checkProfileComplete(userInfo)
	
	if (result.needAvatar) {
		uni.showToast({
			title: `建议先设置头像再进行${action}`,
			icon: 'none',
			duration: 2000
		})
		
		setTimeout(() => {
			guideProfileComplete(userInfo)
		}, 2000)
		
		return false
	}
	
	return true
}

// 示例6：在个人资料展示页面使用
export function getProfileStatus(userInfo) {
	const result = checkProfileComplete(userInfo)
	
	if (result.needComplete) {
		return {
			status: 'incomplete',
			message: result.reason,
			tips: '完善个人信息可以获得更好的用户体验'
		}
	}
	
	return {
		status: 'complete',
		message: '个人信息已完善',
		tips: ''
	}
}