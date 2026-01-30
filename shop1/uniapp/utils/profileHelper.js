/**
 * 微信小程序用户信息获取工具
 * 由于微信已废弃getUserProfile接口，现在推荐使用头像昵称填写能力
 */

/**
 * 检查是否支持微信头像昵称填写能力
 * @returns {boolean} 是否支持
 */
export function checkWxProfileSupport() {
	// #ifdef MP-WEIXIN
	try {
		const systemInfo = wx.getSystemInfoSync()
		const version = systemInfo.SDKVersion
		return compareVersion(version, '2.21.2') >= 0
	} catch (error) {
		console.error('检查微信版本失败:', error)
		return false
	}
	// #endif
	// #ifndef MP-WEIXIN
	return false
	// #endif
}

/**
 * 比较版本号
 * @param {string} v1 版本1
 * @param {string} v2 版本2
 * @returns {number} 1: v1>v2, 0: v1=v2, -1: v1<v2
 */
function compareVersion(v1, v2) {
	v1 = v1.split('.')
	v2 = v2.split('.')
	const len = Math.max(v1.length, v2.length)
	
	while (v1.length < len) {
		v1.push('0')
	}
	while (v2.length < len) {
		v2.push('0')
	}
	
	for (let i = 0; i < len; i++) {
		const num1 = parseInt(v1[i])
		const num2 = parseInt(v2[i])
		
		if (num1 > num2) {
			return 1
		} else if (num1 < num2) {
			return -1
		}
	}
	
	return 0
}

/**
 * 显示头像昵称设置引导
 * @param {Object} options 配置选项
 * @param {string} options.title 标题
 * @param {string} options.content 内容
 * @param {Function} options.onConfirm 确认回调
 * @param {Function} options.onCancel 取消回调
 */
export function showProfileGuide(options = {}) {
	const {
		title = '完善个人信息',
		content = '设置您的头像和昵称，让朋友更容易认识您',
		onConfirm,
		onCancel
	} = options
	
	uni.showModal({
		title,
		content,
		confirmText: '去设置',
		cancelText: '稍后',
		success: (res) => {
			if (res.confirm) {
				onConfirm && onConfirm()
			} else {
				onCancel && onCancel()
			}
		}
	})
}

/**
 * 检查用户是否需要完善头像昵称
 * @param {Object} userInfo 用户信息
 * @returns {Object} 检查结果
 */
export function checkProfileComplete(userInfo) {
	if (!userInfo || !userInfo.isLogin) {
		return {
			needComplete: false,
			needAvatar: false,
			needNickname: false,
			reason: '用户未登录'
		}
	}
	
	// 检查头像
	const hasDefaultAvatar = !userInfo.avatarUrl || 
		userInfo.avatarUrl === '/static/images/占位图.png' || 
		userInfo.avatarUrl === '/static/images/默认头像.png' ||
		userInfo.avatarUrl.includes('default')
	
	// 检查昵称
	const hasDefaultNickname = !userInfo.nickName || 
		userInfo.nickName === '' ||
		userInfo.nickName.includes('用户') ||
		userInfo.nickName.includes('User') ||
		/^用户\d+$/.test(userInfo.nickName)
	
	return {
		needComplete: hasDefaultAvatar || hasDefaultNickname,
		needAvatar: hasDefaultAvatar,
		needNickname: hasDefaultNickname,
		reason: hasDefaultAvatar && hasDefaultNickname ? '缺少头像和昵称' :
				hasDefaultAvatar ? '缺少头像' :
				hasDefaultNickname ? '缺少昵称' : '信息完整'
	}
}

/**
 * 引导用户完善信息的通用方法
 * @param {Object} userInfo 用户信息
 * @param {Object} options 配置选项
 */
export function guideProfileComplete(userInfo, options = {}) {
	const checkResult = checkProfileComplete(userInfo)
	
	if (!checkResult.needComplete) {
		return false
	}
	
	const {
		autoShow = true,
		redirectTo = '/pages/my/my',
		onSkip
	} = options
	
	if (autoShow) {
		let content = '设置您的头像和昵称，让朋友更容易认识您'
		
		if (checkResult.needAvatar && checkResult.needNickname) {
			content = '请设置您的头像和昵称'
		} else if (checkResult.needAvatar) {
			content = '请设置您的头像'
		} else if (checkResult.needNickname) {
			content = '请设置您的昵称'
		}
		
		showProfileGuide({
			content,
			onConfirm: () => {
				uni.navigateTo({
					url: redirectTo,
					fail: (err) => {
						console.error('跳转失败:', err)
						uni.showToast({
							title: '页面跳转失败',
							icon: 'none'
						})
					}
				})
			},
			onCancel: () => {
				onSkip && onSkip()
			}
		})
	}
	
	return true
}

/**
 * 上传头像的通用方法 - 使用与文章图片相同的上传逻辑
 * @param {string} tempFilePath 临时文件路径
 * @param {string} userId 用户ID
 * @returns {Promise<string>} 上传后的文件URL
 */
export async function uploadAvatar(tempFilePath, userId) {
	try {
		console.log('📷 开始上传头像, tempFilePath:', tempFilePath, 'userId:', userId);
				
		// 获取图片信息（宽高）
		const imageInfo = await uni.getImageInfo({
			src: tempFilePath
		}).catch(err => {
			console.error('获取图片尺寸信息失败:', err)
			return { width: 0, height: 0 } // 失败时使用默认值
		})
				
		console.log('📷 头像尺寸:', imageInfo.width, 'x', imageInfo.height);
				
		// 使用 fabuWx 云函数获取上传配置（与文章图片相同）
		const extStorageCo = uniCloud.importObject('fabuWx', { customUI: true });
		const uploadOptions = await extStorageCo.getUploadFileOptions({
			cloudPath: `2025/touxiang/${userId}_${Date.now()}.jpg`, // 使用正确的头像存储路径
			fileType: 'image',
			isOriginal: true, // 使用原图
			imageWidth: imageInfo.width,
			imageHeight: imageInfo.height
		});
				
		console.log('====== 云函数返回的上传配置 ======');
		console.log('图片尺寸:', imageInfo.width, 'x', imageInfo.height);
		console.log('原图URL:', uploadOptions.fileURL);
		console.log('云路径cloudPath:', uploadOptions.cloudPath);
		console.log('说明: 直接使用原图URL，无压缩处理');
		console.log('===================================');
		
		// 执行上传（与文章图片相同的逻辑）
		return new Promise((resolve, reject) => {
			const uploadTask = uni.uploadFile({
				...uploadOptions.uploadFileOptions,
				filePath: tempFilePath,
				success: (uploadRes) => {
					console.log('📤 上传响应:', uploadRes);
					
					if (uploadRes.statusCode === 200) {
						// 保存纯净的原始URL，不带任何参数
						const originalUrl = uploadOptions.url || uploadOptions.fileURL;
						// 移除URL中的所有参数
						const cleanUrl = originalUrl.includes('?') ? originalUrl.split('?')[0] : originalUrl;
						
						console.log('====== 头像上传成功 ======');
						console.log('原始URL:', originalUrl);
						console.log('保存URL:', cleanUrl);
						console.log('包含aly2.jingle0350.cn:', cleanUrl.includes('aly2.jingle0350.cn'));
						console.log('包呢2025/touxiang:', cleanUrl.includes('2025/touxiang'));
						console.log('说明: 保存纯净原图URL，不带任何参数');
						console.log('===========================');
						
						// 返回纯净URL
						resolve(cleanUrl);
					} else {
						console.error('❌ 上传失败, 状态码:', uploadRes.statusCode);
						reject(new Error(`上传失败: ${uploadRes.statusCode}`));
					}
				},
				fail: (error) => {
					console.error('❌ 上传失败:', error);
					reject(new Error('上传失败: ' + error.errMsg));
				}
			});
		});
	} catch (error) {
		console.error('上传头像失败:', error)
		throw error
	}
}

/**
 * 更新用户信息的通用方法
 * @param {Object} updateData 要更新的数据
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 更新结果
 */
export async function updateUserProfile(updateData, userId) {
	try {
		const userApi = uniCloud.importObject('userWx', { customUI: true })
		
		const result = await userApi.updateUserProfile({
			uid: userId,
			...updateData
		})
		
		return result
	} catch (error) {
		console.error('更新用户信息失败:', error)
		throw error
	}
}

/**
 * 处理微信头像选择
 * @param {Object} e 事件对象
 * @param {string} userId 用户ID
 * @param {Function} onSuccess 成功回调
 * @param {Function} onError 错误回调
 */
export async function handleWxAvatarChoose(e, userId, onSuccess, onError) {
	const { avatarUrl } = e.detail
	if (!avatarUrl) {
		onError && onError(new Error('未选择头像'))
		return
	}
	
	try {
		uni.showLoading({ title: '上传头像中...' })
				
		// 上传头像到七牛云，返回七牛云URL
		const qiniuAvatarUrl = await uploadAvatar(avatarUrl, userId)
		console.log('📷 头像上传成功，七牛云URL:', qiniuAvatarUrl);
		console.log('📷 头像URL包含aly2.jingle0350.cn:', qiniuAvatarUrl.includes('aly2.jingle0350.cn'));
		console.log('📷 头像URL包含2025/touxiang:', qiniuAvatarUrl.includes('2025/touxiang'));
				
		// 保存七牛云URL到数据库
		const result = await updateUserProfile({ avatarUrl: qiniuAvatarUrl }, userId)
		console.log('📷 数据库更新结果:', result);
		
		if (result.code === 0) {
			onSuccess && onSuccess(qiniuAvatarUrl)
			uni.showToast({
				title: '头像更新成功',
				icon: 'success'
			})
		} else {
			throw new Error(result.message || '头像更新失败')
		}
	} catch (error) {
		onError && onError(error)
		uni.showToast({
			title: error.message || '头像更新失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
	}
}

/**
 * 从微信获取用户最新的头像和昵称，并直接更新到云端
 * @param {string} userId 用户ID
 * @returns {Promise<Object>} 返回获取到的微信用户信息
 */
export async function getWxUserProfile(userId) {
	try {
		console.log('开始获取微信用户信息, userId:', userId)
		
		// #ifdef MP-WEIXIN
		// 微信小程序环境，调用专门的微信信息获取方法
		const userInfoApi = uniCloud.importObject('userWx', { customUI: true })
		
		// 调用新的微信信息获取方法
		console.log('调用云函数 getWxUserInfoAndUpdate...')
		const result = await userInfoApi.getWxUserInfoAndUpdate(userId)
		console.log('云函数返回结果:', result)
		
		if (result && result.code === 0 && result.data) {
			console.log('微信信息获取成功:', result.data)
			
			return {
				code: 0,
				message: result.message,
				data: result.data
			}
		} else if (result && result.code === -2) {
			// 需要使用微信头像昵称填写组件
			console.log('需要使用微信头像昵称填写组件:', result)
			return {
				code: -2,
				message: result.message,
				data: result.data
			}
		} else {
			console.error('云函数返回错误或无数据:', result)
			return {
				code: -1,
				message: result?.message || '获取微信信息失败',
				data: null
			}
		}
		// #endif
		
		// #ifndef MP-WEIXIN
		return {
			code: -1,
			message: '此功能仅在微信小程序中可用',
			data: null
		}
		// #endif
	} catch (error) {
		console.error('获取微信用户信息失败:', error)
		return {
			code: -1,
			message: '获取用户信息失败: ' + error.message,
			data: null
		}
	}
}

/**
 * 处理微信昵称输入
 * @param {Object} e 事件对象
 * @param {string} userId 用户ID
 * @param {string} currentNickname 当前昵称
 * @param {Function} onSuccess 成功回调
 * @param {Function} onError 错误回调
 */
export async function handleWxNicknameChange(e, userId, currentNickname, onSuccess, onError) {
	const nickName = e.detail.value
	if (!nickName || nickName === currentNickname) {
		return
	}
	
	try {
		uni.showLoading({ title: '更新昵称中...' })
		
		const result = await updateUserProfile({ nickName }, userId)
		
		if (result.code === 0) {
			onSuccess && onSuccess(nickName)
			uni.showToast({
				title: '昵称更新成功',
				icon: 'success'
			})
		} else {
			throw new Error(result.message || '昵称更新失败')
		}
	} catch (error) {
		onError && onError(error)
		uni.showToast({
			title: error.message || '昵称更新失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
	}
}