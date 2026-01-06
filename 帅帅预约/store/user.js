import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserInfoStore = defineStore( 'userInfo', ( ) => {
	// 默认用户数据
	const defaultUserInfo = {
		uid: '', //本地平台ID
		nickName: "", //昵称
		avatarUrl: "/static/images/defalut.png", //头像地址
		mobile: "未填写", //手机号码
		isLogin: false, //登录状态
		role: [ ], //默认角色
	}

	// 初始化用户数据（从本地存储获取或使用默认值）
	const userInfo = ref(
		uni.getStorageSync('userInfo') || { ...defaultUserInfo }
	)

	// 设置用户数据
	const setUserInfo = ( obj = {} ) => {
		// 确保只存储简单的可序列化数据
		const serializableObj = {};
		
		// 提取基本类型的数据
		for (const key in obj) {
			// 排除函数和复杂对象
			if (obj[key] !== undefined && 
				(typeof obj[key] === 'string' || 
				 typeof obj[key] === 'number' || 
				 typeof obj[key] === 'boolean' ||
				 Array.isArray(obj[key]))) {
				serializableObj[key] = obj[key];
			}
		}
		
		// 确保角色是数组
		if (serializableObj.role && !Array.isArray(serializableObj.role)) {
			serializableObj.role = [];
		}
		
		userInfo.value = {
			...defaultUserInfo, // 保持默认值
			...serializableObj, // 覆盖新数据
		}
		
		try {
			// 检查是否可以序列化
			JSON.stringify(userInfo.value);
			// 同步到本地存储
			uni.setStorageSync('userInfo', userInfo.value);
		} catch (error) {
			console.error('存储用户信息失败，数据无法序列化:', error);
			// 存储基本信息
			const basicInfo = {
				...defaultUserInfo,
				uid: serializableObj.uid || '',
				nickName: serializableObj.nickName || '',
				avatarUrl: serializableObj.avatarUrl || defaultUserInfo.avatarUrl,
				mobile: serializableObj.mobile || defaultUserInfo.mobile,
				isLogin: !!serializableObj.uid,
				role: Array.isArray(serializableObj.role) ? serializableObj.role : [],
			};
			
			userInfo.value = basicInfo;
			uni.setStorageSync('userInfo', basicInfo);
		}
	}

	// 清空用户数据
	const cleanUserInfo = ( ) => {
		userInfo.value = { ...defaultUserInfo }
		likeRecords.value = [ ] // 清空点赞记录
		// 清除本地存储
		uni.removeStorageSync('userInfo')
	}

	// 存储点赞记录
	const likeRecords = ref( [ ] )

	// 设置点赞记录
	const setLikeRecords = ( records ) => {
		likeRecords.value = records
	}

	// 检查是否点赞过某篇文章
	const isLiked = ( article_id ) => {
		return likeRecords.value.some( ( record ) => record.article_id === article_id )
	}

	return {
		userInfo,
		setUserInfo,
		cleanUserInfo,
		likeRecords,
		setLikeRecords,
		isLiked
	}
}, {
	persist: {
		// 使用 uni storage 代替 localStorage
		storage: {
			getItem( key ) {
				return uni.getStorageSync( key )
			},
			setItem( key, value ) {
				try {
					// 尝试序列化确保可存储
					if (typeof value === 'object') {
						JSON.stringify(value);
					}
					uni.setStorageSync( key, value )
				} catch (e) {
					console.error('存储数据失败:', e);
				}
			}
		},
		paths: ['userInfo', 'likeRecords'] // 指定需要持久化的状态
	}
} )