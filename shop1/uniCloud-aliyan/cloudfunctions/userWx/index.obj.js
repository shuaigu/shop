const config = require( './config.js' )
const { decryptPhoneNumber } = require( './decryptPhoneNumber.js' )
const { createToken } = require( './createToken.js' )
const generateRandomName = require( './generateRandomName' )

const dbJQL = uniCloud.databaseForJQL( )

module.exports = {
	_before: function( ) { // 通用预处理器
		// 在每个请求前打印日志
		console.log('userWx云函数被调用:', this.getMethodName())
	},

	/**
	 * uploadAvatarToCloud 将头像上传到云存储并返回永久链接
	 * @param {string} avatarUrl 头像临时路径或URL
	 * @returns {object} 返回包含永久链接的结果
	 */
	async uploadAvatarToCloud(avatarUrl) {
		try {
			console.log('开始处理头像:', avatarUrl);
			
			// 如果为空或未定义，返回默认头像
			if (!avatarUrl) {
				console.log('头像为空，返回默认头像');
				return {
					code: 0,
					data: {
						avatarUrl: '/static/images/默认头像.png',
						isDefault: true
					}
				};
			}
			
			// 如果已经是本地默认头像，直接返回
			if (avatarUrl === '/static/images/默认头像.png' || avatarUrl === '/static/images/占位图.png') {
				console.log('已是默认头像，直接返回');
				return {
					code: 0,
					data: { avatarUrl: avatarUrl, isDefault: true }
				};
			}
			
			// 检查是否为微信小程序临时文件路径
			const isTempFile = avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://') || avatarUrl.includes('/tmp/');
			
			if (!isTempFile) {
				// 如果不是临时文件，直接返回
				console.log('非临时文件，直接返回');
				return {
					code: 0,
					data: { avatarUrl: avatarUrl, isDefault: false }
				};
			}
			
			console.log('检测到临时文件，提示前端上传');
			return {
				code: 1,
				message: '检测到临时文件，请前端先上传到云存储',
				data: { avatarUrl: avatarUrl, isTempFile: true }
			};
		} catch (error) {
			console.error('处理头像失败:', error);
			return {
				code: -1,
				message: '处理头像失败: ' + error.message,
				data: { avatarUrl: '/static/images/默认头像.png', isDefault: true }
			};
		}
	},

	/**
	 * checkUserInfoExists 检查用户信息是否已存在且完整
	 * @param {string} code 微信登录code
	 * @returns {object} 返回用户信息检查结果
	 */
	async checkUserInfoExists(params) {
		const { code } = params
		console.log('checkUserInfoExists接收到的参数:', { code: code ? '***' : null })
		
		try {
			// 构造请求参数
			const sessionParams = {
				app_id: config.app_id_wx,
				app_secret: config.app_secret_wx,
				js_code: code
			}
			console.log( '微信登录参数:', { app_id: sessionParams.app_id } )
			
			// 1. 获取微信登录信息
			const res = await uniCloud.request({
				url: `https://api.weixin.qq.com/sns/jscode2session?appid=${sessionParams.app_id}&secret=${sessionParams.app_secret}&js_code=${sessionParams.js_code}&grant_type=authorization_code`,
				method: "POST",
			})
			
			console.log('微信登录返回结果:', { 
				statusCode: res.statusCode, 
				headers: res.header, 
				dataKeys: res.data ? Object.keys(res.data) : null 
			})

			const { openid } = res.data

			if (!openid) {
				console.error('获取微信用户信息失败，openid为空:', res.data)
				return {
					code: -1,
					message: '获取用户信息失败'
				}
			}
			
			console.log('成功获取openid:', openid.substring(0, 10) + '...')
			
			// 2. 查询用户是否存在
			const userRecord = await dbJQL.collection("user").where({
				openid_wx: openid
			}).limit(1).get()
			
			console.log('查询用户结果:', { count: userRecord.data.length })

			// 如果用户不存在，返回false
			if (userRecord.data.length === 0) {
				console.log('用户不存在')
				return {
					code: 0,
					message: '用户不存在',
					data: {
						hasCompleteInfo: false
					}
				}
			}
			
			const userInfo = userRecord.data[0]
			console.log('找到用户信息:', { 
				id: userInfo._id,
				hasAvatar: !!userInfo.avatarUrl,
				hasNickname: !!userInfo.nickName,
				avatarUrl: userInfo.avatarUrl
			})
			
			// 检查用户信息是否完整（头像和昵称都存在且不为空）
			const hasCompleteInfo = 
				userInfo.avatarUrl && 
				userInfo.avatarUrl !== '/static/images/占位图.png' && 
				userInfo.nickName && 
				userInfo.nickName.trim().length > 0
			
			console.log('用户信息完整性检查:', { hasCompleteInfo })
			
			return {
				code: 0,
				message: '检查成功',
				data: {
					hasCompleteInfo: hasCompleteInfo,
					userInfo: hasCompleteInfo ? userInfo : null
				}
			}
		} catch (error) {
			console.error('检查用户信息失败:', error)
			return {
				code: -1,
				message: '检查用户信息失败: ' + error.message
			}
		}
	},
	
	/**
	 * loginByPhoneWx 微信手机号登录
	 * @param {string} param1 参数1描述
	 * @returns {object} 返回值描述
	 */
		async loginByPhoneWx( params ) {
		const { code, encryptedData, iv, nickName, avatarUrl } = params
		console.log('loginByPhoneWx接收到的参数:', { 
			code: code ? '***' : null, 
			encryptedData: encryptedData ? '***' : null, 
			iv: iv ? '***' : null, 
			nickName, 
			avatarUrl: avatarUrl ? '***' : null 
		})
		
		// 处理头像：前端已上传，直接使用
		let processedAvatarUrl = avatarUrl || '/static/images/默认头像.png';
		console.log('使用头像URL:', processedAvatarUrl)
		
		// 构造请求参数
		const sessionParams = {
			app_id: config.app_id_wx,
			app_secret: config.app_secret_wx,
			js_code: code
		}
		console.log( '微信登录参数:', { app_id: sessionParams.app_id } )
		
		// 1. 获取微信登录信息
		const res = await uniCloud.request( {
			url: `https://api.weixin.qq.com/sns/jscode2session?appid=${sessionParams.app_id}&secret=${sessionParams.app_secret}&js_code=${sessionParams.js_code}&grant_type=authorization_code`,
			method: "POST",
		} )

		console.log('微信登录返回结果:', { 
			statusCode: res.statusCode, 
			headers: res.header, 
			dataKeys: res.data ? Object.keys(res.data) : null 
		})
		
		// 检查请求是否成功
		if (res.statusCode !== 200) {
			console.error('微信登录请求失败:', { statusCode: res.statusCode, data: res.data })
			throw new Error( '微信登录请求失败' )
		}

		const { openid, session_key, errmsg, errcode } = res.data
		
		// 检查微信返回的错误信息
		if (errcode) {
			console.error('微信登录返回错误:', { errcode, errmsg })
			throw new Error( errmsg || '微信登录失败' )
		}

		console.log('获取微信用户信息结果:', { 
			hasOpenid: !!openid, 
			hasSessionKey: !!session_key,
			openidPrefix: openid ? openid.substring(0, 10) + '...' : null,
			sessionKeyLength: session_key ? session_key.length : null
		})
		
		// console.log( open_id, session_key, '后端' )
		if ( !openid || !session_key ) {
			console.error('获取微信用户信息失败，openid或session_key为空:', { openid, session_key })
			throw new Error( '获取微信用户信息失败' )
		}
		
		console.log('成功获取openid和session_key')
		
		// 2. 解密手机号
		console.log('开始解密手机号')
		const phoneData = decryptPhoneNumber(
			session_key,
			encryptedData,
			iv
		)
		
		console.log('手机号解密结果:', { 
			isSuccess: !!phoneData, 
			hasPhoneNumber: phoneData && phoneData.phoneNumber,
			phoneNumber: phoneData && phoneData.phoneNumber ? phoneData.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : null
		})

		if ( !phoneData || !phoneData.phoneNumber ) {
			console.error('手机号解密失败:', { phoneData })
			throw new Error( '手机号解密失败' )
		}
		
		console.log('成功解密手机号')

		const userRecord = await dbJQL.collection( "user" ).where( {
			mobile: phoneData.phoneNumber
		} ).limit( 1 ).get( )
		
		console.log('查询用户结果:', { count: userRecord.data.length })

		let userId
		let userRes
		if ( userRecord.data.length === 0 ) {
			console.log('创建新用户')
			// 使用前端传递的昵称，如果没有则生成随机名称
			const finalNickName = nickName || generateRandomName()
			// 使用前端已上传的头像URL
			const finalAvatarUrl = processedAvatarUrl
			// 创建新用户
			const token = createToken( openid, session_key )
			const addRes = await dbJQL.collection( "user" ).add( {
				openid_wx: openid,
				session_key: session_key,
				mobile: phoneData.phoneNumber,
				role: [ 'user' ],
				token,
				nickName: finalNickName,
				avatarUrl: finalAvatarUrl
			} )
			console.log( '微信新用户创建结果:', { 
				isSuccess: addRes.id || addRes.errMsg,
				id: addRes.id,
				errMsg: addRes.errMsg
			} )
			userId = addRes.id
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )

		} else {
			console.log('更新老用户')
			userId = userRecord.data[ 0 ]._id
			// 更新老用户的openid
			const updateOpenidRes = await dbJQL.collection( "user" ).doc( userId ).update( { openid_wx: openid } )
			console.log('更新openid结果:', updateOpenidRes)
			
			// 如果前端传递了昵称和头像，则更新老用户的信息
			if (nickName || avatarUrl) {
				const updateData = {}
				if (nickName) updateData.nickName = nickName
				if (avatarUrl) updateData.avatarUrl = avatarUrl
				console.log('更新用户信息:', updateData)
				const updateUserInfoRes = await dbJQL.collection( "user" ).doc( userId ).update(updateData)
				console.log('更新用户信息结果:', updateUserInfoRes)
			}
			
			// 获取老用户信息
			userRes = await dbJQL.collection( "user" ).doc( userId ).get( )
			console.log('获取用户信息结果:', { 
				isSuccess: userRes.data && userRes.data.length > 0,
				dataKeys: userRes.data && userRes.data.length > 0 ? Object.keys(userRes.data[0]) : null
			})

		}

		// 返回
		return {
			code: 0,
			message: '登录成功',
			data: {
				_id: userRes.data[ 0 ]._id,
				openid_wx: userRes.data[ 0 ].openid_wx,
				token: userRes.data[ 0 ].token,
				mobile: userRes.data[ 0 ].mobile,
				nickName: userRes.data[ 0 ].nickName,
				avatarUrl: userRes.data[ 0 ].avatarUrl,
				role: userRes.data[ 0 ].role
			}
		}
	},
	
	/**
	 * 更新用户资料
	 * @param {Object} params 包含uid、avatarUrl和nickName
	 * @returns {Object} 返回操作结果
	 */
	async updateUserProfile(params) {
		const { uid, nickName, avatarUrl } = params
		
		if (!uid) {
			return {
				code: -1,
				message: '用户ID不能为空'
			}
		}
		
		try {
			// 构建更新数据
			const updateData = {}
			if (nickName) updateData.nickName = nickName
			// 直接使用前端已上传的头像URL
			if (avatarUrl) updateData.avatarUrl = avatarUrl
			
			// 如果没有任何更新字段，返回错误
			if (Object.keys(updateData).length === 0) {
				return {
					code: -1,
					message: '没有指定要更新的字段'
				}
			}
			
			// 更新用户资料
			await dbJQL.collection("user").doc(uid).update(updateData)
			
			return {
				code: 0,
				message: '更新成功'
			}
		} catch (error) {
			console.error('更新用户资料失败:', error)
			return {
				code: -1,
				message: '更新用户资料失败: ' + error.message
			}
		}
	},
	
	/**
	 * 根据用户ID数组获取用户信息
	 * @param {Array} userIds 用户ID数组
	 * @returns {Object} 返回用户信息结果
	 */
	async getUsersByIds(userIds) {
		if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
			return {
				code: -1,
				message: '用户ID数组不能为空',
				data: []
			}
		}
		
		try {
			// 使用数据库命令查询多个ID
			const db = uniCloud.database()
			const userCollection = db.collection('user')
			const userResult = await userCollection.where({
				_id: db.command.in(userIds)
			}).field({
				_id: true,
				mobile: true,
				nickName: true,
				avatarUrl: true
			}).get()
			
			if (userResult && userResult.data) {
				return {
					code: 0,
					message: '获取用户信息成功',
					data: userResult.data
				}
			} else {
				return {
					code: -1,
					message: '未找到用户信息',
					data: []
				}
			}
		} catch (error) {
			console.error('获取用户信息失败:', error)
			return {
				code: -1,
				message: '获取用户信息失败: ' + error.message,
				data: []
			}
		}
	},
	
	/**
	 * 获取单个用户信息
	 * @param {String} userId 用户ID
	 * @returns {Object} 返回用户信息
	 */
	async getUserInfo(userId) {
		if (!userId) {
			return {
				code: -1,
				message: '用户ID不能为空'
			}
		}
		
		try {
			const userResult = await dbJQL.collection("user").doc(userId).field({
				_id: true,
				mobile: true,
				nickName: true,
				avatarUrl: true,
				role: true
			}).get()
			
			if (userResult && userResult.data && userResult.data.length > 0) {
				return {
					code: 0,
					message: '获取用户信息成功',
					data: userResult.data[0]
				}
			} else {
				return {
					code: -1,
					message: '未找到用户信息'
				}
			}
		} catch (error) {
			console.error('获取用户信息失败:', error)
			return {
				code: -1,
				message: '获取用户信息失败: ' + error.message
			}
		}
	},
	
	/**
	 * 获取微信用户信息并更新到数据库
	 * @param {String} userId 用户ID
	 * @returns {Object} 返回更新后的用户信息
	 */
	async getWxUserInfoAndUpdate(userId) {
		if (!userId) {
			return {
				code: -1,
				message: '用户ID不能为空'
			}
		}
		
		try {
			// 首先获取用户当前信息
			const userResult = await dbJQL.collection("user").doc(userId).field({
				_id: true,
				mobile: true,
				nickName: true,
				avatarUrl: true,
				role: true,
				openid_wx: true,
				session_key: true
			}).get()
			
			if (!userResult || !userResult.data || userResult.data.length === 0) {
				return {
					code: -1,
					message: '未找到用户信息'
				}
			}
			
			const userData = userResult.data[0]
			console.log('获取到用户数据:', userData)
			
			// 检查是否有微信openid，如果没有则无法获取微信信息
			if (!userData.openid_wx) {
				return {
					code: -1,
					message: '用户未绑定微信，无法获取微信信息'
				}
			}
			
			// 模拟获取微信最新信息（通过微信API获取用户基本信息）
			// 这里模拟微信头像昵称填写组件的数据获取方式
			const wxUserInfo = await this.simulateWxUserInfoUpdate(userData)
			
			if (!wxUserInfo) {
				return {
					code: -2,
					message: '请使用微信小程序的头像昵称填写功能来更新您的信息',
					data: {
						nickName: userData.nickName || '微信用户',
						avatarUrl: userData.avatarUrl || '/static/images/default.png'
					}
				}
			}
			
			// 检查是否有更新
			const hasUpdate = 
				(wxUserInfo.nickName && wxUserInfo.nickName !== userData.nickName) ||
				(wxUserInfo.avatarUrl && wxUserInfo.avatarUrl !== userData.avatarUrl)
			
			if (!hasUpdate) {
				return {
					code: 0,
					message: '当前信息已是最新，无需更新',
					data: {
						nickName: userData.nickName,
						avatarUrl: userData.avatarUrl
					}
				}
			}
			
			// 更新用户信息到数据库
			const updateData = {}
			if (wxUserInfo.nickName && wxUserInfo.nickName !== userData.nickName) {
				updateData.nickName = wxUserInfo.nickName
			}
			if (wxUserInfo.avatarUrl && wxUserInfo.avatarUrl !== userData.avatarUrl) {
				updateData.avatarUrl = wxUserInfo.avatarUrl
			}
			
			if (Object.keys(updateData).length > 0) {
				await dbJQL.collection("user").doc(userId).update(updateData)
				console.log('成功更新用户信息:', updateData)
			}
			
			return {
				code: 0,
				message: '成功获取并更新微信用户信息',
				data: {
					nickName: wxUserInfo.nickName || userData.nickName,
					avatarUrl: wxUserInfo.avatarUrl || userData.avatarUrl
				}
			}
			
		} catch (error) {
			console.error('获取微信用户信息失败:', error)
			return {
				code: -1,
				message: '获取微信用户信息失败: ' + error.message
			}
		}
	},
	
	/**
	 * 模拟微信头像昵称填写组件的数据获取方式
	 * @param {Object} userData 用户数据
	 * @returns {Object|null} 返回微信用户信息或null
	 */
	async simulateWxUserInfoUpdate(userData) {
		try {
			// 在生产环境中，这里可以调用真实的微信API
			// 例如使用微信提供的服务端接口获取用户信息
			
			const isProduction = process.env.NODE_ENV === 'production'
			
			if (isProduction && userData.openid_wx && userData.session_key) {
				// 生产环境：尝试使用真实的微信API
				return await this.getRealWxUserInfo(userData.openid_wx, userData.session_key)
			} else {
				// 开发环境：使用模拟数据
				return this.getMockWxUserInfo(userData)
			}
			
		} catch (error) {
			console.error('获取微信信息失败:', error)
			return null
		}
	},
	
	/**
	 * 获取真实的微信用户信息（生产环境使用）
	 * @param {String} openid 微信openid
	 * @param {String} sessionKey 微信session_key
	 * @returns {Object|null} 微信用户信息
	 */
	async getRealWxUserInfo(openid, sessionKey) {
		try {
			// 这里可以调用微信的服务端接口
			// 注意：微信已经不再提供直接获取用户头像昵称的接口
			// 这里只是一个示例，实际上需要通过其他方式获取
			
			console.log('尝试获取真实微信用户信息:', { openid })
			
			// 这里可以实现真实的微信API调用
			// 例如调用微信的其他相关接口
			
			// 目前返回null表示未能获取到真实信息
			return null
			
		} catch (error) {
			console.error('调用真实微信API失败:', error)
			return null
		}
	},
	
	/**
	 * 获取模拟的微信用户信息（开发环境使用）
	 * 模拟微信点击更改头像、点击更改昵称的操作方式
	 * @param {Object} userData 用户数据
	 * @returns {Object} 模拟的微信用户信息
	 */
	getMockWxUserInfo(userData) {
		console.log('=== 模拟微信头像昵称填写组件操作 ===');
		console.log('当前用户信息:', userData);
		
		// 模拟微信头像昵称填写组件的行为
		// 1. 模拟点击头像更改操作
		const simulateAvatarChange = () => {
			const mockAvatars = [
				'https://thirdwx.qlogo.cn/mmopen/avatar1.jpg',
				'https://thirdwx.qlogo.cn/mmopen/avatar2.jpg', 
				'https://thirdwx.qlogo.cn/mmopen/avatar3.jpg',
				'https://wx.qlogo.cn/mmopen/mock_avatar_' + Date.now() + '.jpg'
			];
			const randomAvatar = mockAvatars[Math.floor(Math.random() * mockAvatars.length)];
			console.log('模拟点击头像更改操作，新头像:', randomAvatar);
			return randomAvatar;
		};
		
		// 2. 模拟点击昵称更改操作
		const simulateNicknameChange = () => {
			const mockNicknames = [
				'微信昵称_' + Math.random().toString(36).substr(2, 4),
				'WX用户_' + Date.now().toString().slice(-4),
				userData.nickName && userData.nickName.includes('微信') ? userData.nickName : '微信_' + userData.nickName,
				'新微信昵称'
			];
			const randomNickname = mockNicknames[Math.floor(Math.random() * mockNicknames.length)];
			console.log('模拟点击昵称更改操作，新昵称:', randomNickname);
			return randomNickname;
		};
		
		// 模拟微信用户操作行为
		let mockResult = {};
		
		// 如果用户已有完整信息，模拟有一定概率的更新
		if (userData.nickName && userData.avatarUrl) {
			console.log('用户已有完整信息，模拟可能的更新操作...');
			
			// 60% 概率保持原信息（用户没有进行更改操作）
			if (Math.random() < 0.6) {
				console.log('模拟结果：用户未进行更改操作，保持原信息');
				mockResult = {
					nickName: userData.nickName,
					avatarUrl: userData.avatarUrl
				};
			}
			// 25% 概率只更改头像
			else if (Math.random() < 0.85) {
				console.log('模拟结果：用户点击更改了头像');
				mockResult = {
					nickName: userData.nickName,
					avatarUrl: simulateAvatarChange()
				};
			}
			// 10% 概率只更改昵称
			else if (Math.random() < 0.95) {
				console.log('模拟结果：用户点击更改了昵称');
				mockResult = {
					nickName: simulateNicknameChange(),
					avatarUrl: userData.avatarUrl
				};
			}
			// 5% 概率两者都更改
			else {
				console.log('模拟结果：用户点击更改了头像和昵称');
				mockResult = {
					nickName: simulateNicknameChange(),
					avatarUrl: simulateAvatarChange()
				};
			}
		} else {
			// 如果用户信息不完整，模拟首次设置
			console.log('用户信息不完整，模拟首次通过微信设置头像昵称...');
			mockResult = {
				nickName: simulateNicknameChange(),
				avatarUrl: simulateAvatarChange()
			};
		}
		
		console.log('=== 模拟微信操作完成 ===');
		console.log('最终模拟结果:', mockResult);
		return mockResult;
	},
	
	/**
	 * 使用微信最新的头像昵称填写数据更新用户信息
	 * @param {Object} params 包含 uid、nickName、avatarUrl
	 * @returns {Object} 返回操作结果
	 */
	async updateWxUserInfo(params) {
		const { uid, nickName, avatarUrl } = params
		
		if (!uid) {
			return {
				code: -1,
				message: '用户ID不能为空'
			}
		}
		
		try {
			// 构建更新数据
			const updateData = {}
			if (nickName) updateData.nickName = nickName
			if (avatarUrl) updateData.avatarUrl = avatarUrl
			
			// 如果没有任何更新字段，返回错误
			if (Object.keys(updateData).length === 0) {
				return {
					code: -1,
					message: '没有指定要更新的字段'
				}
			}
			
			console.log('更新微信用户信息:', updateData)
			
			// 更新用户资料
			await dbJQL.collection("user").doc(uid).update(updateData)
			
			return {
				code: 0,
				message: '成功更新微信用户信息',
				data: updateData
			}
		} catch (error) {
			console.error('更新微信用户信息失败:', error)
			return {
				code: -1,
				message: '更新微信用户信息失败: ' + error.message
			}
		}
	},
	
	/**
	 * 通过用户ID后缀查询用户信息（用于海报二维码分享者信息解析）
	 * @param {String} idSuffix 用户ID的后8位
	 * @returns {Object} 返回用户信息
	 */
	async getUserByIdSuffix(idSuffix) {
		if (!idSuffix) {
			return {
				errCode: -1,
				errMsg: 'ID后缀不能为空'
			}
		}
		
		try {
			// 使用数据库查询，匹配_id以指定后缀结尾的用户
			const db = uniCloud.database()
			const dbCmd = db.command
			
			// 使用正则表达式匹配以idSuffix结尾的_id
			const result = await db.collection('user')
				.where({
					_id: dbCmd.regex({
						regexp: idSuffix + '$',  // 匹配以idSuffix结尾
						options: 'i'  // 忽略大小写
					})
				})
				.field({
					_id: true,
					nickName: true,
					avatarUrl: true
				})
				.limit(1)
				.get()
			
			if (result.data && result.data.length > 0) {
				return {
					errCode: 0,
					errMsg: '查询成功',
					data: result.data[0]
				}
			} else {
				return {
					errCode: -1,
					errMsg: '未找到匹配的用户'
				}
			}
		} catch (error) {
			console.error('查询用户失败:', error)
			return {
				errCode: -1,
				errMsg: '查询用户失败: ' + error.message
			}
		}
	}
}