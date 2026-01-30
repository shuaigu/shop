/**
 * 超级缓存管理器 - 极致优化首页加载性能
 * 提供内存缓存、本地存储、智能预加载功能
 */

class CacheManager {
	constructor() {
		// 内存缓存 - 最快速访问
		this.memoryCache = new Map();
		// 缓存过期时间配置（毫秒）- 优化时间
		this.cacheConfig = {
			categories: 10 * 60 * 1000,    // 分类缓存10分钟(增加了)
			articles: 3 * 60 * 1000,       // 文章缓存3分钟(增加了)
			userInfo: 15 * 60 * 1000,      // 用户信息缓存15分钟(增加了)
			default: 5 * 60 * 1000         // 默认缓存5分钟(增加了)
		};
		// 缓存打击统计
		this.stats = {
			hits: 0,
			misses: 0,
			sets: 0
		};
		// 最大缓存数量
		this.maxCacheSize = 1000;
	}

	/**
	 * 生成缓存键
	 * @param {string} prefix - 缓存前缀
	 * @param {string} key - 缓存键
	 * @returns {string} 完整的缓存键
	 */
	generateKey(prefix, key = '') {
		return `${prefix}_${key}`;
	}

	/**
	 * 设置缓存 - 增加了大小限制
	 * @param {string} key - 缓存键
	 * @param {any} data - 缓存数据
	 * @param {string} type - 缓存类型
	 */
	set(key, data, type = 'default') {
		// 如果缓存超过最大数量,删除最旧的
		if (this.memoryCache.size >= this.maxCacheSize) {
			const firstKey = this.memoryCache.keys().next().value;
			this.memoryCache.delete(firstKey);
		}
		
		const expireTime = Date.now() + (this.cacheConfig[type] || this.cacheConfig.default);
		
		this.memoryCache.set(key, {
			data,
			expireTime,
			type,
			createdAt: Date.now()
		});
		
		this.stats.sets++;
	}

	/**
	 * 获取缓存 - 添加了统计
	 * @param {string} key - 缓存键
	 * @returns {any|null} 缓存数据或null
	 */
	get(key) {
		const cached = this.memoryCache.get(key);
		
		if (!cached) {
			this.stats.misses++;
			return null;
		}

		// 检查是否过期
		if (Date.now() > cached.expireTime) {
			this.memoryCache.delete(key);
			this.stats.misses++;
			return null;
		}

		this.stats.hits++;
		return cached.data;
	}

	/**
	 * 删除缓存
	 * @param {string} key - 缓存键
	 */
	delete(key) {
		this.memoryCache.delete(key);
	}

	/**
	 * 清空指定类型的缓存
	 * @param {string} type - 缓存类型
	 */
	clearByType(type) {
		let count = 0;
		for (const [key, value] of this.memoryCache.entries()) {
			if (value.type === type) {
				this.memoryCache.delete(key);
				count++;
			}
		}
	}

	/**
	 * 清空所有缓存
	 */
	clear() {
		this.memoryCache.clear();
		this.stats = { hits: 0, misses: 0, sets: 0 };
	}

	/**
	 * 获取缓存统计信息
	 */
	getStats() {
		const stats = {
			total: this.memoryCache.size,
			byType: {},
			hitRate: this.stats.hits + this.stats.misses > 0 
				? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
				: '0%',
			...this.stats
		};

		for (const [key, value] of this.memoryCache.entries()) {
			const type = value.type;
			stats.byType[type] = (stats.byType[type] || 0) + 1;
		}

		return stats;
	}

	/**
	 * 清理过期缓存 - 优化版
	 */
	cleanup() {
		const now = Date.now();
		let cleanedCount = 0;

		for (const [key, value] of this.memoryCache.entries()) {
			if (now > value.expireTime) {
				this.memoryCache.delete(key);
				cleanedCount++;
			}
		}

		return cleanedCount;
	}
	
	/**
	 * 预热缓存 - 提前加载常用数据
	 */
	async preheat(dataLoaders) {
		const promises = [];
		for (const [key, loader] of Object.entries(dataLoaders)) {
			promises.push(
				loader().then(data => {
					this.set(key, data, 'default');
				}).catch(err => {
					console.error(`预热缓存失败: ${key}`, err);
				})
			);
		}
		await Promise.all(promises);
	}
}

// 创建全局缓存管理器实例
const cacheManager = new CacheManager();

// 定时清理过期缓存（每5分钟）
setInterval(() => {
	cacheManager.cleanup();
}, 5 * 60 * 1000);

export default cacheManager;

/**
 * 缓存装饰器 - 为异步函数添加缓存功能
 * @param {string} cacheKey - 缓存键
 * @param {string} type - 缓存类型
 * @returns {Function} 装饰器函数
 */
export function withCache(cacheKey, type = 'default') {
	return function(target, propertyName, descriptor) {
		const method = descriptor.value;

		descriptor.value = async function(...args) {
			// 生成带参数的缓存键
			const key = cacheManager.generateKey(cacheKey, JSON.stringify(args));
			
			// 尝试从缓存获取
			const cached = cacheManager.get(key);
			if (cached) {
				return cached;
			}

			// 执行原始方法
			try {
				const result = await method.apply(this, args);
				// 缓存结果
				cacheManager.set(key, result, type);
				return result;
			} catch (error) {
				// 发生错误时不缓存
				throw error;
			}
		};

		return descriptor;
	};
}

/**
 * 简单的缓存获取函数
 * @param {string} key - 缓存键  
 * @param {Function} fetcher - 数据获取函数
 * @param {string} type - 缓存类型
 * @returns {Promise} 数据
 */
export async function getCachedData(key, fetcher, type = 'default') {
	// 尝试从缓存获取
	const cached = cacheManager.get(key);
	if (cached) {
		return cached;
	}

	// 执行获取函数
	try {
		const result = await fetcher();
		// 缓存结果
		cacheManager.set(key, result, type);
		return result;
	} catch (error) {
		throw error;
	}
}
