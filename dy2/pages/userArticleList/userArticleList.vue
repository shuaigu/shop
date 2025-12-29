<script>
// 使用选项式API定义分享方法，这是微信小程序最稳定的方式
import { useUserInfoStore } from '@/store/user.js'
import { testLogin } from '@/utils/isLogin'
import { useAuthSwitchStore } from '@/store/authSwitch'


export default {
	components: {
	},
	data() {
		return {
			// 视频播放相关
			videoUrl: '', // 默认视频地址
			videoVisible: false, // 控制视频组件显示状态
			isVideoPlaying: false, // 视频是否正在播放
			videoContext: null, // 视频上下文对象
			userClosedVideo: false, // 用户是否主动关闭了视频
			isVideoSpeedUp: false, // 视频是否正在倍速播放
			videoDefinition: null, // 视频清晰度配置
			
			// 用户信息和文章列表
			userArticleData: [],
			userArticleInfo: {
				avatarUrl: '/static/images/default-avatar.png',
				nickName: '加载中...',
				mobile: '未填写'
			},
			
			// 最新文章图片
			latestArticleImages: [],
			
			// 分页相关
			pageNo: 1,
			pageSize: 8, // 每页加载的数据条数，与后端默认值保持一致
			
			// 加载状态
			status: 'more', // 初始状态为 'more'
			isLoading: false, // 是否正在加载
			hasMore: true, // 是否还有更多数据
			loadMoreText: {
				contentdown: '上拉加载更多',
				contentrefresh: '加载中...',
				contentnomore: '~ 已经到底啦 ~'
			},
			
			// 用户信息store
			userStore: null,
			
			// 头像点击控制状态
			avatarClickEnabled: true,
			
			// 下拉刷新相关
			isRefreshing: false,
			refreshStartTime: 0, // 记录开始刷新的时间
			
			// 添加触底加载防抖变量
			scrollToLowerTimer: null,
			isScrollLoading: false,
			totalArticleCount: 0, // 文章总数
			
			// 黑名单相关
			blacklistedUrls: [],
			
			// 视频重试计数
			videoRetryCount: 0,
			
			// 视频字段优先级顺序
			videoFieldPriority: [
				'videoURL', // 首先检查大写URL
				'videoUrl', // 然后检查首字母大写URL
				'video_url',
				'videoSrc',
				'video',
				'video_src',
				'url'
			],
		}
	},
	
	props: {
		userId: String
	},

	computed: {
		// 计算文章总数，便于在模板和分享中使用
		articleTotal() {
			return this.totalArticleCount || 0;
		}
	},

	
	// 页面加载时设置分享数据
	onLoad(options) {
		// 保存userId
		if (options.userId) {
			this.shareUserId = options.userId;
		}
		
		// 初始化store
		this.userStore = useUserInfoStore();
		
		// 获取权限状态
		this.getSendOnState();
		
		// 获取文章总数
		this.getUserArticleCount();
		
		// 获取文章列表
		this.getArticelList(true);
		
		// 尝试直接初始化视频
		this.initVideoFromUrl();
		
		// 监听浏览量更新事件
		uni.$on('viewCountUpdated', (articleId) => {
			this.updateLocalViewCount(articleId);
		});
		
		// 监听头像点击状态变化事件
		uni.$on('avatarClickChanged', (newState) => {
			console.log('用户文章列表页面收到头像点击状态变化事件:', newState);
			this.avatarClickEnabled = newState;
		});
		
		// 监听全局刷新事件，用于发布后返回刷新列表
		uni.$on('globalRefresh', (data) => {
			console.log('用户文章列表收到全局刷新事件:', data);
			// 检查是否需要刷新当前页面
			if (data && data.pages && data.pages.includes('userArticleList')) {
				console.log('正在刷新用户文章列表...');
				// 刷新时重新获取文章总数
				this.getUserArticleCount();
				this.getArticelList(true);
			}
		});
		
		// 不在页面加载时生成分享图，改为按需生成
		// setTimeout(() => {
		// this.generateShareImage();
		// }, 1500);
	},
	
	
	
	// 页面卸载时移除事件监听
	onUnload() {
		uni.$off('viewCountUpdated');
		uni.$off('avatarClickChanged');
		uni.$off('globalRefresh');
		
		// 清理防抖定时器
		if (this.scrollToLowerTimer) {
			clearTimeout(this.scrollToLowerTimer);
			this.scrollToLowerTimer = null;
		}
	},
	
	// 组件销毁前清理资源
	beforeDestroy() {
		// 清理所有定时器
		if (this.scrollToLowerTimer) {
			clearTimeout(this.scrollToLowerTimer);
			this.scrollToLowerTimer = null;
		}
	},
	
	// 监听页面触底事件
	onReachBottom() {
		console.log('原生触底事件被触发');
		// 如果已经在处理中，则跳过
		if (this.isScrollLoading || this.scrollToLowerTimer) {
			return;
		}
		// 调用通用的触底加载方法
		this.scrolltolower();
	},
	
	methods: {
		// 检查第一篇文章是否包含视频URL字段
		checkFirstArticleVideo() {
			// 如果用户主动关闭了视频，不检查视频
			if (this.userClosedVideo) {
				console.log('用户已主动关闭视频，跳过视频检查');
				return false;
			}
			
			// 如果已经有视频在播放，不检查视频
			if (this.videoVisible && this.videoUrl) {
				console.log('已有视频在播放，跳过视频检查');
				return false;
			}
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法检查视频');
				return false;
			}
			
			// 获取第一篇文章
			const firstArticle = this.userArticleData[0];
			
			// 使用通用方法获取视频URL
			const videoUrl = this.getVideoUrlFromArticle(firstArticle);
			
			// 如果找到视频URL
			if (videoUrl) {
				// 检查URL是否在黑名单中
				if (this.isUrlBlacklisted(videoUrl)) {
					console.log('视频URL在黑名单中，跳过:', videoUrl);
					return false;
				}
				
				this.videoUrl = videoUrl;
				this.videoVisible = true;
				
				// 在下一个渲染周期初始化视频上下文
				this.$nextTick(() => {
					this.initVideoContext();
				});
				
				return true;
			}
			
			return false;
		},
		
		// 尝试从URL直接初始化视频（处理数据库中的直接videoURL字段）
		initVideoFromUrl() {
			// 检查是否有当前路由参数中的videoURL
			const pages = getCurrentPages();
			const currentPage = pages[pages.length - 1];
			
			if (currentPage && currentPage.options) {
				console.log('检查页面参数是否包含视频URL');
				
				// 检查所有可能的视频URL参数名
				const possibleParams = ['videoURL', 'videoUrl', 'video_url', 'video'];
				let videoUrl = null;
				
				for (const param of possibleParams) {
					if (currentPage.options[param]) {
						videoUrl = decodeURIComponent(currentPage.options[param]);
						console.log(`在页面参数中找到视频URL(${param}):`, videoUrl);
						break;
					}
				}
				
				// 如果在参数中找到视频URL
				if (videoUrl && this.isValidVideoUrl(videoUrl)) {
					console.log('设置从页面参数中提取的视频URL:', videoUrl);
					this.videoUrl = videoUrl;
					this.videoVisible = true;
					
					// 在下一个渲染周期初始化视频上下文
					this.$nextTick(() => {
						this.initVideoContext();
					});
					
					return true;
				}
			}
			
			return false;
		},
		
		// 获取权限开关状态
		async getSendOnState() {
			try {
				console.log('正在获取按钮状态...');
				
				const sendOnApi = uniCloud.importObject('sendOn', { customUI: true });
				const res = await sendOnApi.get();
				
				if (res && res.data && res.data.length > 0) {
					// 获取头像点击状态
					const serverAvatarClickState = res.data[0].avatarClick !== undefined ? res.data[0].avatarClick : true;
					
					// 更新头像点击状态
					this.avatarClickEnabled = serverAvatarClickState;
					
					console.log('头像点击状态:', this.avatarClickEnabled);
				} else {
					console.error('获取按钮状态失败: 数据格式不正确');
				}
			} catch (err) {
				console.error('获取按钮状态失败:', err);
			}
		},
		
		// 请求云对象获取文章总数
		async getUserArticleCount() {
			if (!this.userId) {
				console.log('用户ID不存在，无法获取文章总数');
				return;
			}
			
			console.log('通过云对象请求文章总数，用户ID:', this.userId);
			
			try {
				// 使用getArticleList方法获取文章总数
				// 由于getUserArticleCount方法在部署的云对象中不存在（Method[getUserArticleCount] was not found in index.obj.js）
				const articleApi = uniCloud.importObject('articleDy', { customUI: true });
				// 设置pageSize为1，只获取总数
				const result = await articleApi.getArticleList(this.userId, 1, 1);
				
				if (result && result.total !== undefined) {
					// 更新文章总数
					this.totalArticleCount = result.total;
					console.log('云对象通过getArticleList获取到文章总数:', this.totalArticleCount);
					
					return this.totalArticleCount;
				} else {
					console.error('云对象获取文章总数失败: 未返回total字段');
					return null;
				}
			} catch (err) {
				console.error('云对象获取文章总数出错:', err);
				
				// 出错时，将文章总数设为0
				this.totalArticleCount = 0;
				console.log('云对象请求失败，设置文章总数为0');
				
				return null;
			}
		},
		
		// 获取用户文章列表（首次加载或重置）
		async getArticelList(isReset = false) {
			this.isLoading = true;
			this.status = 'loading';
			
			if (isReset) {
				this.pageNo = 1;
				this.userArticleData = [];
			}
			
			return new Promise(async (resolve, reject) => {
				try {
					const articleApi = uniCloud.importObject('articleDy', { customUI: true });
					const res = await articleApi.getArticleList(this.userId, this.pageNo, this.pageSize);
					
					// 保存API返回的文章总数
					if (res && res.total !== undefined) {
						this.totalArticleCount = res.total;
						console.log('获取到文章总数:', this.totalArticleCount);
					}
					
					// 添加空值检查
					if (res && res.userInfo) {
						this.userArticleInfo = res.userInfo;
						// 如果当前用户是登录用户，可以更新全局用户信息
						if (this.userId === this.userStore.userInfo.uid) {
							this.userStore.setUserInfo({
								...this.userStore.userInfo,
								nickName: res.userInfo.nickName || this.userStore.userInfo.nickName,
								avatarUrl: res.userInfo.avatarUrl || this.userStore.userInfo.avatarUrl
							});
						}
						
						// 数据加载完成后
						this.$nextTick(() => {
							// 获取最新文章的图片
							this.extractLatestArticleImages();
							// 尝试直接从第一篇文章检查视频字段
							this.checkFirstArticleVideo();
							// 尝试从文章中提取视频
							this.extractVideoFromArticles();
						});
					} else {
						if (isReset) {
							this.userArticleData = [];
						}
						this.hasMore = false;
						this.status = 'noMore';
					}
					
					// 处理文章数据
					if (res && res.data) {
						if (isReset) {
							this.userArticleData = res.data;
						} else {
							this.userArticleData = [...this.userArticleData, ...res.data];
						}
						
						// 确保每篇文章都有用户信息
						this.userArticleData.forEach(article => {
							// 如果文章没有用户信息，使用从API获取的用户信息
							if (!article.user_avatarUrl && this.userArticleInfo.avatarUrl) {
								article.user_avatarUrl = this.userArticleInfo.avatarUrl;
							}
							if (!article.user_nickName && this.userArticleInfo.nickName) {
								article.user_nickName = this.userArticleInfo.nickName;
							}
						});
						
						// 判断是否还有更多数据
						this.hasMore = res.data.length >= this.pageSize;
						this.status = this.hasMore ? 'more' : 'noMore';
						
						// 文章数据更新后
						this.$nextTick(() => {
							// 获取最新文章的图片
							this.extractLatestArticleImages();
							// 尝试直接从第一篇文章检查视频字段
							this.checkFirstArticleVideo();
							// 尝试从文章中提取视频
							this.extractVideoFromArticles();
						});
					} else {
						if (isReset) {
							this.userArticleData = [];
						}
						this.hasMore = false;
						this.status = 'noMore';
					}
					
					resolve();
				} catch (err) {
					console.error('获取用户文章列表失败:', err);
					if (isReset) {
						this.userArticleData = [];
					}
					this.userArticleInfo = {};
					this.status = 'noMore';
					this.hasMore = false;
					
					// 显示错误提示
					uni.showToast({
						title: '获取数据失败，请重试',
						icon: 'none'
					});
					
					reject(err);
				} finally {
					this.isLoading = false;
					// 重置下拉刷新状态
					this.isRefreshing = false;
				}
			});
		},
		
		// 触底加载时，不影响视频状态
		scrolltolower() {
			console.log('触底加载被触发，状态:', { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
			
			// 如果正在加载或已经没有更多数据，直接返回
			if (this.isLoading || !this.hasMore || this.isScrollLoading) {
				console.log('跳过加载: ' + (this.isLoading ? '正在加载中' : (this.isScrollLoading ? '防抖期间' : '没有更多数据')));
				return;
			}
			
			// 设置防抖标志
			this.isScrollLoading = true;
			
			// 先展示加载提示
			this.status = 'loading';
			
			// 清除之前的定时器
			if (this.scrollToLowerTimer) {
				clearTimeout(this.scrollToLowerTimer);
			}
			
			// 记录当前视频状态，以便加载后恢复
			let savedVideoState = null;
			if (this.videoVisible && this.videoContext) {
				savedVideoState = {
					isPlaying: this.isVideoPlaying,
					position: 0,
					visible: this.videoVisible
				};
				
				// 获取当前播放位置
				try {
					this.videoContext.pause(); // 临时暂停以便获取准确的当前位置
					savedVideoState.position = this.videoContext.currentTime || 0;
					// 如果之前是播放状态，则恢复播放
					if (savedVideoState.isPlaying) {
						this.videoContext.play();
					}
				} catch (e) {
					console.error('保存视频状态时出错:', e);
				}
			}
			
			// 设置防抖定时器，300毫秒内只执行一次
			this.scrollToLowerTimer = setTimeout(() => {
				console.log('开始加载更多数据 (防抖后)，保存的视频状态:', savedVideoState);
				
				// 传递保存的视频状态
				this.loadMoreData(savedVideoState);
			}, 500);
		},
		
		// 加载更多数据
		async loadMoreData(savedVideoState = null) {
			if (this.isLoading || !this.hasMore) {
				console.log('跳过加载更多:', { isLoading: this.isLoading, hasMore: this.hasMore });
				this.isScrollLoading = false;
				return;
			}
			
			console.log(`开始加载第${this.pageNo + 1}页数据，视频状态:`, savedVideoState);
			this.status = 'loading';
			this.isLoading = true;
			
			// 视觉上显示加载延迟，避免加载过快用户无感知
			const loadStartTime = Date.now();
			const minLoadingTime = 500; // 最小加载时间，提供更好的视觉反馈
			
			this.pageNo++;
			try {
				await this.getArticelList();
				
				// 计算已经过去的时间
				const loadDuration = Date.now() - loadStartTime;
				
				// 如果加载太快，添加小延迟使加载状态对用户可见
				if (loadDuration < minLoadingTime) {
					await new Promise(resolve => setTimeout(resolve, minLoadingTime - loadDuration));
				}
				
				console.log(`第${this.pageNo}页数据加载完成, 当前状态:`, { 
					articleCount: this.userArticleData.length,
					hasMore: this.hasMore,
					status: this.status
				});
				
				// 恢复视频状态
				this.$nextTick(() => {
					this.restoreVideoState(savedVideoState);
				});
			} catch (err) {
				// 静默处理"请求进行中"错误，避免在控制台显示错误信息
				if (err && err.message === '请求进行中') {
					console.log('忽略并发请求:', err.message);
				} else {
					console.error('加载更多数据失败:', err);
				}
				
				// 发生错误时恢复页码，以便下次重试
				this.pageNo--;
				this.status = 'more';
				
				// 即使出错也恢复视频状态
				this.$nextTick(() => {
					this.restoreVideoState(savedVideoState);
				});
			} finally {
				this.isLoading = false;
				this.isScrollLoading = false;
			}
		},
		
		// 恢复视频状态的方法
		restoreVideoState(savedVideoState) {
			if (!savedVideoState) return;
			
			console.log('尝试恢复视频状态:', savedVideoState, '用户关闭标记:', this.userClosedVideo);
			
			// 如果用户主动关闭了视频，不恢复视频状态
			if (this.userClosedVideo) {
				console.log('用户已主动关闭视频，不恢复视频状态');
				return;
			}
			
			// 确保视频组件可见性与之前一致
			if (savedVideoState.visible !== this.videoVisible) {
				this.videoVisible = savedVideoState.visible;
			}
			
			// 仅当视频组件可见且有视频URL时恢复状态
			if (this.videoVisible && this.videoUrl) {
				// 需要重新获取视频上下文
				this.videoContext = uni.createVideoContext('myVideo', this);
				
				if (this.videoContext) {
					try {
						// 设置播放位置
						if (savedVideoState.position > 0) {
							this.videoContext.seek(savedVideoState.position);
						}
						
						// 恢复播放状态
						if (savedVideoState.isPlaying) {
							this.videoContext.play();
							this.isVideoPlaying = true;
						} else {
							this.videoContext.pause();
							this.isVideoPlaying = false;
						}
						
						console.log('视频状态恢复成功');
					} catch (e) {
						console.error('恢复视频状态时出错:', e);
					}
				}
			}
		},
		
		// 处理删除
		async handleDelete(article_id) {
			try {
				// 添加确认提示
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这篇文章吗？',
					success: async (result) => {
						if (result.confirm) {
							// 显示加载中提示
							uni.showLoading({
								title: '删除中...',
								mask: true
							});
							
							// 调用删除API
							const articleApi = uniCloud.importObject('articleDy', { customUI: true });
							const res = await articleApi.del(article_id, this.userStore.userInfo.uid);
							
							console.log('删除返回结果:', res);
							
							// 检查删除是否成功
							if (res && res.deleted) {
								// 从本地数据列表中移除已删除的文章
								const index = this.userArticleData.findIndex(item => item._id === article_id);
								if (index !== -1) {
									this.userArticleData.splice(index, 1);
								}
								
								// 显示成功提示
								uni.hideLoading();
								uni.showToast({
									title: '删除成功',
									icon: 'success',
									duration: 1500
								});
							} else {
								throw new Error('删除失败，请重试');
							}
						}
					}
				});
			} catch (err) {
				console.error('删除出错:', err);
				uni.hideLoading();
				uni.showToast({
					title: err.message || '删除失败，请重试',
					icon: 'none',
					duration: 2000
				});
			}
		},
		
		// 图片预览
		previewImage(urls, current) {
			uni.previewImage({
				urls,
				current
			});
		},
		
		// 处理联系方式
		handleContact() {
			if (!this.userArticleInfo || this.userArticleInfo.mobile === '未填写') {
				return uni.showToast({
					icon: 'none',
					title: '他并不想让人联系'
				});
			}
			
			uni.makePhoneCall({
				phoneNumber: this.userArticleInfo.mobile
			});
		},
		
		// 文章列表触底时触发
		scrolltolower() {
			console.log('触底加载被触发，状态:', { isLoading: this.isLoading, hasMore: this.hasMore, isScrollLoading: this.isScrollLoading });
			
			// 如果正在加载或已经没有更多数据，直接返回
			if (this.isLoading || !this.hasMore || this.isScrollLoading) {
				console.log('跳过加载: ' + (this.isLoading ? '正在加载中' : (this.isScrollLoading ? '防抖期间' : '没有更多数据')));
				return;
			}
			
			// 设置防抖标志
			this.isScrollLoading = true;
			
			// 先展示加载提示
			this.status = 'loading';
			
			// 清除之前的定时器
			if (this.scrollToLowerTimer) {
				clearTimeout(this.scrollToLowerTimer);
			}
			
			// 记录当前视频状态，以便加载后恢复
			let savedVideoState = null;
			if (this.videoVisible && this.videoContext) {
				savedVideoState = {
					isPlaying: this.isVideoPlaying,
					position: 0,
					visible: this.videoVisible
				};
				
				// 获取当前播放位置
				try {
					this.videoContext.pause(); // 临时暂停以便获取准确的当前位置
					savedVideoState.position = this.videoContext.currentTime || 0;
					// 如果之前是播放状态，则恢复播放
					if (savedVideoState.isPlaying) {
						this.videoContext.play();
					}
				} catch (e) {
					console.error('保存视频状态时出错:', e);
				}
			}
			
			// 设置防抖定时器，300毫秒内只执行一次
			this.scrollToLowerTimer = setTimeout(() => {
				console.log('开始加载更多数据 (防抖后)，保存的视频状态:', savedVideoState);
				
				// 传递保存的视频状态
				this.loadMoreData(savedVideoState);
			}, 500);
		},
		
		// 更新本地文章浏览量数据
		updateLocalViewCount(articleId) {
			// 更新本地数据，立即显示增加后的浏览量
			const article = this.userArticleData.find(item => item._id === articleId);
			if (article) {
				if (article.look_count !== undefined) {
					article.look_count++;
				} else {
					article.look_count = 1;
				}
			}
		},
		
		// 预览最新文章图片
		previewLatestImages(index) {
			if (this.latestArticleImages && this.latestArticleImages.length > 0) {
				uni.previewImage({
					current: this.latestArticleImages[index],
					urls: this.latestArticleImages
				});
			}
		},
		
		// 获取文章的图片
		getArticleImages(article) {
			const images = [];
			
			if (!article) return images;
			
			// 处理新版图片结构 (images 数组)
			if (article.images && article.images.length > 0) {
				article.images.forEach(img => {
					// 优先使用缩略图
					if (img.thumbnailURL) {
						images.push(this.processImageUrl(img.thumbnailURL));
					}
					// 其次使用压缩图
					else if (img.compressedURL) {
						images.push(this.processImageUrl(img.compressedURL));
					}
					// 再次使用原图
					else if (img.url) {
						images.push(this.processImageUrl(img.url));
					}
					// 如果是字符串直接使用
					else if (typeof img === 'string') {
						images.push(this.processImageUrl(img));
					}
				});
			}
			
			// 处理旧版图片结构 (imgArr 数组)
			if (article.imgArr && article.imgArr.length > 0) {
				article.imgArr.forEach(img => {
					images.push(this.processImageUrl(img));
				});
			}
			
			// 尝试使用封面图
			if (article.coverImage && images.length === 0) {
				images.push(this.processImageUrl(article.coverImage));
			}
			
			return images;
		},
		
		// 预览文章图片
		previewArticleImage(article, index) {
			const images = this.getArticleImages(article);
			if (images && images.length > 0) {
				uni.previewImage({
					current: images[index],
					urls: images
				});
			}
		},
		
		// 下拉刷新
		onRefresh() {
			this.isRefreshing = true;
			this.refreshStartTime = Date.now(); // 记录开始刷新的时间
			
			this.getArticelList(true).then(() => {
				// 确保刷新动画至少显示800毫秒，提供良好的用户体验
				const refreshDuration = Date.now() - this.refreshStartTime;
				const minimumDuration = 800;
				
				if (refreshDuration < minimumDuration) {
					setTimeout(() => {
						this.isRefreshing = false;
						// 刷新成功提示
						uni.showToast({
							title: '刷新成功',
							icon: 'success',
							duration: 1500
						});
					}, minimumDuration - refreshDuration);
				} else {
					this.isRefreshing = false;
					// 刷新成功提示
					uni.showToast({
						title: '刷新成功',
						icon: 'success',
						duration: 1500
					});
				}
			}).catch(() => {
				// 确保刷新动画至少显示800毫秒
				const refreshDuration = Date.now() - this.refreshStartTime;
				const minimumDuration = 800;
				
				if (refreshDuration < minimumDuration) {
					setTimeout(() => {
						this.isRefreshing = false;
						// 刷新失败提示
						uni.showToast({
							title: '刷新失败',
							icon: 'none',
							duration: 1500
						});
					}, minimumDuration - refreshDuration);
				} else {
					this.isRefreshing = false;
					// 刷新失败提示
					uni.showToast({
						title: '刷新失败',
						icon: 'none',
						duration: 1500
					});
				}
			});
		},
		
		// 隐藏分享引导蒙层
		hideShareGuide() {
			this.showShareArrow = false;
		},
		
		// 视频相关方法
		// 初始化视频上下文
		initVideoContext() {
			// 只有当视频组件可见且有视频URL时才初始化
			if (this.videoVisible && this.videoUrl) {
				console.log('初始化视频上下文');
				// 处理视频URL，确保适合抖音/头条小程序播放
				const processedUrl = this.adjustVideoUrlForToutiao(this.videoUrl);
				
				// 检查URL是否有变化
				if (processedUrl !== this.videoUrl) {
					console.log('视频URL已处理:', processedUrl);
					this.videoUrl = processedUrl;
				}
				
				// 尝试设置多清晰度选项
				this.setVideoDefinitions(this.videoUrl);
				
				// 创建视频上下文
				this.$nextTick(() => {
					this.videoContext = uni.createVideoContext('myVideo', this);
					
					// 初始化重试计数
					this.videoRetryCount = 0;
				});
			} else {
				console.log('视频组件不可见或没有视频URL，跳过初始化');
			}
		},
		
		// 处理视频URL使其适合头条/抖音小程序
		adjustVideoUrlForToutiao(url) {
			if (!url) return url;
			
			// 确保URL使用https
			if (url.startsWith('http://')) {
				url = url.replace('http://', 'https://');
				console.log('视频URL已更改为https:', url);
			}
			
			// 特殊处理百度静态资源URL，确保格式正确
			if (url.includes('bdstatic.com')) {
				// 检查链接是否完整
				const parts = url.split('/');
				const lastPart = parts[parts.length - 1];
				
				// 如果URL不是以.mp4结尾，尝试添加扩展名
				if (!lastPart.endsWith('.mp4')) {
					url = `${url}.mp4`;
					console.log('百度CDN视频URL已修正:', url);
				}
				
				// 确保使用正确的协议和域名
				if (!url.startsWith('https://vd3.bdstatic.com')) {
					const urlParts = url.split('/');
					const domainParts = urlParts[2].split('.');
					// 尝试修正域名前缀
					if (domainParts[0] !== 'vd3') {
						domainParts[0] = 'vd3';
						urlParts[2] = domainParts.join('.');
						url = urlParts.join('/');
						console.log('百度CDN域名已修正:', url);
					}
				}
			}
			
			// 专门处理抖音视频适配问题
			// 确保视频文件格式是mp4或mov，抖音小程序仅支持这两种格式
			const isMP4 = url.toLowerCase().endsWith('.mp4');
			const isMOV = url.toLowerCase().endsWith('.mov');
			
			if (!isMP4 && !isMOV) {
				// 尝试检测文件类型，默认添加.mp4扩展名
				if (url.includes('.')) {
					const extension = url.split('.').pop().toLowerCase();
					// 如果不是mp4或mov格式，尝试将其转换为mp4
					if (!['mp4', 'mov'].includes(extension)) {
						console.log(`检测到不支持的视频格式: ${extension}，转换为mp4`);
						url = url.substring(0, url.lastIndexOf('.')) + '.mp4';
					}
				} else {
					// 如果URL没有扩展名，直接添加.mp4
					url = url + '.mp4';
					console.log('视频URL没有扩展名，添加.mp4:', url);
				}
			}
			
			// 过滤查询参数，保留基本URL
			if (url.includes('?')) {
				const baseUrl = url.split('?')[0];
				console.log('视频URL查询参数已移除:', baseUrl);
				return baseUrl;
			}
			
			return url;
		},
		
		// 视频播放事件处理
		onVideoPlay() {
			console.log('视频开始播放');
			this.isVideoPlaying = true;
		},
		
		// 视频暂停事件处理
		onVideoPause() {
			console.log('视频暂停播放');
			this.isVideoPlaying = false;
		},
		
		// 视频播放结束事件处理
		onVideoEnded() {
			console.log('视频播放结束');
			this.isVideoPlaying = false;
		},
		
		// 视频播放错误事件处理
		onVideoError(e) {
			console.error('视频播放错误:', e);
			
			// 记录当前错误的URL
			const currentErrorUrl = this.videoUrl;
			
			// 尝试自动修复视频URL格式
			const fixedUrl = this.tryFixVideoUrl(currentErrorUrl);
			if (fixedUrl && fixedUrl !== currentErrorUrl) {
				console.log('尝试使用修复后的URL播放:', fixedUrl);
				this.videoUrl = fixedUrl;
				
				// 在下一个渲染周期重新初始化视频上下文
				this.$nextTick(() => {
					this.initVideoContext();
				});
				
				return;
			}
			
			// 显示错误提示，并提供重试选项
			uni.showModal({
				title: '视频加载失败',
				content: '当前视频格式可能不被支持，是否尝试其他视频？',
				confirmText: '尝试其他',
				cancelText: '关闭视频',
				success: (res) => {
					if (res.confirm) {
						// 重置视频URL，再次尝试查找
						this.videoUrl = '';
						this.videoVisible = false;
						
						// 延迟执行以确保UI更新
						setTimeout(() => {
							// 从黑名单中排除当前URL，避免再次尝试播放
							this.addUrlToBlacklist(currentErrorUrl);
							
							// 再次尝试查找其他视频
							this.findNextVideo();
						}, 300);
					} else {
						// 用户选择关闭视频
						this.hideVideo();
					}
				}
			});
		},
		
		// 尝试修复视频URL格式
		tryFixVideoUrl(url) {
			if (!url) return null;
			
			let fixedUrl = url;
			
			// 确保URL使用https
			if (fixedUrl.startsWith('http://')) {
				fixedUrl = fixedUrl.replace('http://', 'https://');
				console.log('视频URL转换为https:', fixedUrl);
			}
			
			// 特殊处理百度静态资源URL
			if (fixedUrl.includes('bdstatic.com')) {
				// 进一步处理百度视频URL
				
				// 1. 确保正确的域名前缀 (vd3)
				if (!fixedUrl.includes('vd3.bdstatic.com')) {
					const urlParts = fixedUrl.split('/');
					if (urlParts[2] && urlParts[2].includes('bdstatic.com')) {
						const domainParts = urlParts[2].split('.');
						domainParts[0] = 'vd3';
						urlParts[2] = domainParts.join('.');
						fixedUrl = urlParts.join('/');
						console.log('修正百度CDN域名前缀:', fixedUrl);
					}
				}
				
				// 2. 检查是否有mda-前缀部分
				if (!fixedUrl.includes('/mda-')) {
					// 这种情况太复杂，无法自动修复
					console.log('百度视频URL格式不正确，缺少mda-前缀');
					return null;
				}
				
				// 3. 确保路径包含必要的部分（360p/h264等）
				if (!fixedUrl.includes('/360p/') && !fixedUrl.includes('/h264/')) {
					// 从URL中提取mda-ID
					const mdaMatch = fixedUrl.match(/\/mda-([a-zA-Z0-9]+)/);
					if (mdaMatch && mdaMatch[1]) {
						const mdaId = mdaMatch[1];
						// 构建完整的URL格式
						const timestamp = Date.now(); // 使用当前时间戳模拟
						fixedUrl = `https://vd3.bdstatic.com/mda-${mdaId}/360p/h264/${timestamp}/mda-${mdaId}.mp4`;
						console.log('重构的百度视频完整URL:', fixedUrl);
					}
				}
				
				// 4. 确保URL以.mp4结尾
				if (!fixedUrl.endsWith('.mp4')) {
					fixedUrl = `${fixedUrl}.mp4`;
					console.log('添加.mp4扩展名:', fixedUrl);
				}
			}
			
			// 确保抖音小程序支持的视频格式
			// 根据抖音小程序文档，只支持mp4和mov格式，并且建议使用4K以下分辨率
			if (!fixedUrl.endsWith('.mp4') && !fixedUrl.endsWith('.mov')) {
				// 尝试检测文件类型并修正
				if (fixedUrl.includes('.')) {
					const extension = fixedUrl.split('.').pop().toLowerCase();
					// 如果不是mp4或mov格式，尝试将其转换为mp4
					if (!['mp4', 'mov'].includes(extension)) {
						console.log(`检测到不支持的视频格式: ${extension}，尝试转换为mp4`);
						// 移除原有扩展名并添加.mp4
						fixedUrl = fixedUrl.substring(0, fixedUrl.lastIndexOf('.')) + '.mp4';
					}
				} else {
					// 如果URL没有扩展名，直接添加.mp4
					fixedUrl = fixedUrl + '.mp4';
					console.log('视频URL没有扩展名，添加.mp4:', fixedUrl);
				}
			}
			
			// 如果URL包含高分辨率参数，尝试降低分辨率
			if (fixedUrl.includes('4k') || fixedUrl.includes('2160p') || fixedUrl.includes('3840')) {
				console.log('检测到高分辨率视频，尝试降低为1080p');
				fixedUrl = fixedUrl.replace(/4k/gi, '1080p')
					.replace(/2160p/gi, '1080p')
					.replace(/3840/g, '1920');
			}
			
			// 过滤查询参数，保留基本URL
			if (fixedUrl.includes('?')) {
				fixedUrl = fixedUrl.split('?')[0];
				console.log('移除URL查询参数:', fixedUrl);
			}
			
			// 返回修复后的URL，如果没有变化，则表示无法修复
			return fixedUrl !== url ? fixedUrl : null;
		},
		
		// 添加URL到黑名单
		addUrlToBlacklist(url) {
			if (!this.blacklistedUrls) {
				this.blacklistedUrls = [];
			}
			if (url && !this.blacklistedUrls.includes(url)) {
				this.blacklistedUrls.push(url);
				console.log('已将视频URL添加到黑名单:', url);
			}
		},
		
		// 检查URL是否在黑名单中
		isUrlBlacklisted(url) {
			return this.blacklistedUrls && this.blacklistedUrls.includes(url);
		},
		
		// 查找下一个可用视频
		findNextVideo() {
			console.log('查找下一个可用视频');
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法查找视频');
				return false;
			}
			
			// 存储找到的所有视频URL
			const allVideoUrls = [];
			
			// 查找所有视频URLs
			for (let article of this.userArticleData) {
				// 检查所有可能的视频字段
				const possibleVideoFields = ['videoUrl', 'video_url', 'video', 'videoSrc', 'video_src', 'url'];
				for (let field of possibleVideoFields) {
					if (article[field] && typeof article[field] === 'string' && this.isValidVideoUrl(article[field])) {
						// 排除当前已尝试过的URL和黑名单中的URL
						if (article[field] !== this.videoUrl && !this.isUrlBlacklisted(article[field])) {
							allVideoUrls.push(article[field]);
						}
					}
				}
				
				// 检查视频数组
				const possibleVideoArrayFields = ['videos', 'videoArr', 'video_arr', 'videoList', 'video_list'];
				for (let field of possibleVideoArrayFields) {
					if (article[field] && Array.isArray(article[field])) {
						for (let videoItem of article[field]) {
							if (typeof videoItem === 'string' && this.isValidVideoUrl(videoItem)) {
								// 检查URL是否在黑名单中
								if (this.isUrlBlacklisted(videoItem)) {
									console.log(`跳过黑名单中的视频URL(${field}数组):`, videoItem);
									continue;
								}
								
								this.videoUrl = videoItem;
								this.videoVisible = true;
							} 
							// 如果是对象，尝试获取url字段
							else if (typeof videoItem === 'object') {
								const possibleUrlProps = ['url', 'src', 'source', 'path', 'videoUrl'];
								for (let prop of possibleUrlProps) {
									if (videoItem[prop] && typeof videoItem[prop] === 'string' && this.isValidVideoUrl(videoItem[prop])) {
										// 检查URL是否在黑名单中
										if (this.isUrlBlacklisted(videoItem[prop])) {
											console.log(`跳过黑名单中的视频URL(${field}.${prop}):`, videoItem[prop]);
											continue;
										}
										
										this.videoUrl = videoItem[prop];
										this.videoVisible = true;
										break;
									}
								}
							}
						}
					}
				}
				
				// 从内容中提取
				if (article.content) {
					const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
					if (videoUrlMatch && videoUrlMatch !== this.videoUrl && !this.isUrlBlacklisted(videoUrlMatch)) {
						allVideoUrls.push(videoUrlMatch);
					}
				}
			}
			
			// 如果找到了其他视频
			if (allVideoUrls.length > 0) {
				console.log('找到其他视频:', allVideoUrls[0]);
				this.videoUrl = allVideoUrls[0];
				this.videoVisible = true;
				
				// 在下一个渲染周期初始化视频上下文
				this.$nextTick(() => {
					this.initVideoContext();
				});
				
				return true;
			} else {
				console.log('没有找到其他可用视频');
				uni.showToast({
					title: '未找到其他视频',
					icon: 'none'
				});
				return false;
			}
		},
		
		// 全屏状态变化事件处理
		handleFullscreenChange(e) {
			console.log('全屏状态变化:', e.detail.fullScreen);
		},
		
		// 隐藏视频
		hideVideo() {
			console.log('隐藏视频组件被调用');
			// 标记用户主动关闭了视频
			this.userClosedVideo = true;
			// 暂停视频
			if (this.videoContext) {
				this.videoContext.pause();
			}
			// 隐藏视频组件
			this.videoVisible = false;
			this.videoUrl = ''; // 清空视频URL，确保组件完全隐藏
		},
		
		// 显示视频
		showVideo() {
			// 重置用户关闭标记
			this.userClosedVideo = false;
			this.videoVisible = true;
			// 在下一个渲染周期重新初始化视频上下文
			this.$nextTick(() => {
				this.initVideoContext();
			});
		},
		
		// 从文章列表中提取视频URL
		extractVideoFromArticles() {
			console.log('尝试从文章中提取视频链接');
			
			// 如果用户主动关闭了视频，不提取新视频
			if (this.userClosedVideo) {
				console.log('用户已主动关闭视频，跳过视频提取');
				return false;
			}
			
			// 如果已经有视频在播放，不提取新视频
			if (this.videoVisible && this.videoUrl) {
				console.log('已有视频在播放，跳过视频提取');
				return false;
			}
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法提取视频');
				return false;
			}
			
			// 创建一个包含文章索引的数组，按照文章的创建时间降序排序（最新的优先）
			const sortedArticleIndices = this.userArticleData
				.map((article, index) => ({ index, time: article.create_time || article.createTime || article.time || 0 }))
				.sort((a, b) => {
					// 尝试按照时间排序，如果时间相同或不存在，保持原有顺序
					if (typeof a.time === 'string' && typeof b.time === 'string') {
						return new Date(b.time) - new Date(a.time);
					} else if (typeof a.time === 'number' && typeof b.time === 'number') {
						return b.time - a.time;
					} else {
						return a.index - b.index; // 保持原有顺序
					}
				})
				.map(item => item.index);
			
			console.log('按时间排序后的文章索引:', sortedArticleIndices);
			
			// 根据排序后的索引遍历文章
			for (let i = 0; i < sortedArticleIndices.length; i++) {
				const articleIndex = sortedArticleIndices[i];
				const article = this.userArticleData[articleIndex];
				
				console.log(`检查第 ${i+1} 新的文章(索引:${articleIndex})是否包含视频`);
				
				// 使用通用方法获取视频URL
				const videoUrl = this.getVideoUrlFromArticle(article);
				
				// 如果找到视频URL
				if (videoUrl) {
					// 检查URL是否在黑名单中
					if (this.isUrlBlacklisted(videoUrl)) {
						console.log('视频URL在黑名单中，跳过:', videoUrl);
						continue;
					}
					
					this.videoUrl = videoUrl;
					this.videoVisible = true;
					
					// 在下一个渲染周期初始化视频上下文
					this.$nextTick(() => {
						this.initVideoContext();
					});
					
					return true;
				}
			}
			
			console.log('未在文章中找到有效的视频链接');
			return false;
		},
		
		// 检查URL是否是有效的视频URL
		isValidVideoUrl(url) {
			if (!url || typeof url !== 'string') return false;
			
			// 检查常见视频扩展名
			const videoExtensions = ['.mp4', '.mov']; // 抖音小程序仅支持mp4和mov格式
			const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
			
			// 如果URL显式包含支持的视频扩展名，直接返回true
			if (hasVideoExtension) {
				return true;
			}
			
			// 检查常见视频域名 - 针对抖音/头条小程序调整
			const videoDomains = [
				'youku', 
				'vimeo', 
				'bilibili', 
				'qq.com/video', 
				'douyin', 
				'bspapp.com', 
				'ixigua.com', 
				'kuaishou.com', 
				'bdstatic.com', // 百度静态资源
				'cdn'
			];
			const hasVideoDomain = videoDomains.some(domain => url.toLowerCase().includes(domain));
			
			// 特殊处理百度静态资源链接
			if (url.toLowerCase().includes('bdstatic.com/mda-')) {
				// bdstatic的mda开头视频链接是合法的，即使没有明确的扩展名
				return true;
			}
			
			// 尝试检查是否为有效HTTP(S)URL
			const isHttpUrl = /^https?:\/\//.test(url);
			
			// 如果URL中有这些参数，很可能是视频URL
			const videoParams = ['mp4', 'mov', 'video', 'media', 'play'];
			const hasVideoParams = videoParams.some(param => url.toLowerCase().includes(param));
			
			return (hasVideoDomain || hasVideoParams) && isHttpUrl;
		},
		
		// 从内容中提取视频URL
		extractVideoUrlFromContent(content) {
			if (!content || typeof content !== 'string') return null;
			
			// 尝试匹配常见视频URL模式
			const videoUrlRegexes = [
				// 常见视频文件扩展名
				/https?:\/\/[^\s<>"']+\.(mp4|avi|mov|wmv|flv|mkv|webm|m3u8|3gp|rm|rmvb)/gi,
				// 特定视频平台
				/https?:\/\/v\.qq\.com\/[^\s<>"']+/gi,
				/https?:\/\/www\.youtube\.com\/watch\?v=[^\s<>"']+/gi,
				/https?:\/\/youtu\.be\/[^\s<>"']+/gi,
				/https?:\/\/vimeo\.com\/[^\s<>"']+/gi,
				/https?:\/\/www\.bilibili\.com\/video\/[^\s<>"']+/gi,
				/https?:\/\/www\.ixigua\.com\/[^\s<>"']+/gi,
				/https?:\/\/www\.kuaishou\.com\/[^\s<>"']+/gi,
				// 通用CDN和文件存储链接
				/https?:\/\/[^\s<>"']+\.bspapp\.com\/[^\s<>"']+/gi,
				/https?:\/\/[^\s<>"']+\.cdn[^\s<>"']*\/[^\s<>"']+/gi,
				// 微信视频
				/https?:\/\/mp\.weixin\.qq\.com\/[^\s<>"']*video[^\s<>"']+/gi,
				/https?:\/\/wxsnsdy\.wxs\.qq\.com\/[^\s<>"']+/gi
			];
			
			for (let regex of videoUrlRegexes) {
				const matches = content.match(regex);
				if (matches && matches.length > 0) {
					return matches[0];
				}
			}
			
			return null;
		},
		
		// 跳转到发布页面
		goToPublish() {
			// 发布功能已禁用
			uni.showToast({
				title: '发布功能已禁用',
				icon: 'none',
				duration: 2000
			});
		},
		
		// 处理图片URL，确保可以正确加载
		processImageUrl(url) {
			if (!url) return '';
			
			// 如果是本地路径或临时路径，直接返回
			if (url.startsWith('/static/') || 
				url.startsWith('wxfile://') || 
				url.startsWith('http://tmp/')) {
				return url;
			}
			
			try {
				// 处理URL中的特殊字符
				// 对于包含水印参数的URL，可能需要特殊处理
				if (url.includes('watermark') || url.includes('imageMogr2')) {
					// 尝试获取基本URL部分（去除参数）
					const baseUrl = url.split('?')[0];
					if (baseUrl) {
						return baseUrl;
					}
				}
				
				return url;
			} catch (e) {
				console.error('处理图片URL出错:', e);
				return '';
			}
		},
		
		// 从文章列表中提取最新的图片
		extractLatestArticleImages() {
			console.log('提取最新文章图片');
			
			// 如果没有文章数据，直接返回
			if (!this.userArticleData || this.userArticleData.length === 0) {
				console.log('没有文章数据，无法提取图片');
				this.latestArticleImages = [];
				return [];
			}
			
			// 创建一个包含文章索引的数组，按照文章的创建时间降序排序（最新的优先）
			const sortedArticleIndices = this.userArticleData
				.map((article, index) => ({ index, time: article.create_time || article.createTime || article.time || 0 }))
				.sort((a, b) => {
					// 尝试按照时间排序，如果时间相同或不存在，保持原有顺序
					if (typeof a.time === 'string' && typeof b.time === 'string') {
						return new Date(b.time) - new Date(a.time);
					} else if (typeof a.time === 'number' && typeof b.time === 'number') {
						return b.time - a.time;
					} else {
						return a.index - b.index; // 保持原有顺序
					}
				})
				.map(item => item.index);
			
			// 收集所有图片
			const allImages = [];
			
			// 根据排序后的索引遍历文章，最多提取5张图片
			for (let i = 0; i < sortedArticleIndices.length && allImages.length < 5; i++) {
				const articleIndex = sortedArticleIndices[i];
				const article = this.userArticleData[articleIndex];
				
				// 获取当前文章的所有图片
				const articleImages = this.getArticleImages(article);
				
				if (articleImages && articleImages.length > 0) {
					// 添加到总图片集合，避免重复
					for (let img of articleImages) {
						if (!allImages.includes(img) && allImages.length < 5) {
							allImages.push(img);
						}
					}
				}
			}
			
			// 更新最新文章图片数组
			this.latestArticleImages = allImages;
			console.log('提取到的最新文章图片:', this.latestArticleImages);
			
			return this.latestArticleImages;
		},
		
		// 直接从文章中获取视频URL
		getVideoUrlFromArticle(article) {
			if (!article) return null;
			
			console.log('尝试从文章中获取视频URL:', article._id);
			
			// 根据优先级顺序检查视频字段
			for (const field of this.videoFieldPriority) {
				if (article[field] && typeof article[field] === 'string' && this.isValidVideoUrl(article[field])) {
					console.log(`在文章中找到视频字段(${field}):`, article[field]);
					return article[field];
				}
			}
			
			// 检查videoURL字段是否直接位于文章对象中
			if (article.videoURL && typeof article.videoURL === 'string' && this.isValidVideoUrl(article.videoURL)) {
				console.log('在文章中找到videoURL字段:', article.videoURL);
				return article.videoURL;
			}
			
			// 检查视频数组
			const possibleVideoArrayFields = ['videos', 'videoArr', 'video_arr', 'videoList', 'video_list'];
			for (const field of possibleVideoArrayFields) {
				if (article[field] && Array.isArray(article[field]) && article[field].length > 0) {
					const videoItem = article[field][0];
					
					// 如果数组项是字符串，直接使用
					if (typeof videoItem === 'string' && this.isValidVideoUrl(videoItem)) {
						console.log(`在文章视频数组(${field})中找到视频:`, videoItem);
						return videoItem;
					}
					
					// 如果是对象，尝试获取url字段
					if (typeof videoItem === 'object') {
						const possibleUrlProps = ['url', 'src', 'source', 'path', 'videoUrl', 'videoURL'];
						for (const prop of possibleUrlProps) {
							if (videoItem[prop] && typeof videoItem[prop] === 'string' && this.isValidVideoUrl(videoItem[prop])) {
								console.log(`在文章视频数组对象(${field}.${prop})中找到视频:`, videoItem[prop]);
								return videoItem[prop];
							}
						}
					}
				}
			}
			
			// 从内容中提取视频URL
			if (article.content) {
				const videoUrlMatch = this.extractVideoUrlFromContent(article.content);
				if (videoUrlMatch) {
					console.log('从文章内容中提取到视频URL:', videoUrlMatch);
					return videoUrlMatch;
				}
			}
			
			console.log('未在文章中找到视频URL');
			return null;
		},
		
		// 视频长按事件处理（倍速播放）
		handleVideoLongTap() {
			console.log('视频长按，开始倍速播放');
			if (this.videoContext) {
				// 设置为2倍速播放
				this.videoContext.playbackRate(2.0);
				// 显示倍速提示
				this.isVideoSpeedUp = true;
				
				// 添加短震动反馈
				try {
					// 抖音小程序特有API
					if (typeof tt !== 'undefined' && tt.vibrateShort) {
						tt.vibrateShort({ type: 'light' });
					} else if (typeof uni !== 'undefined') {
						uni.vibrateShort({ success: () => {} });
					}
				} catch (e) {
					console.error('震动反馈失败:', e);
				}
			}
		},
		
		// 视频触摸结束事件处理（恢复正常速度）
		handleVideoTouchEnd() {
			console.log('视频触摸结束，恢复正常播放速度');
			if (this.videoContext && this.isVideoSpeedUp) {
				// 恢复正常播放速度
				this.videoContext.playbackRate(1.0);
				// 隐藏倍速提示
				this.isVideoSpeedUp = false;
			}
		},
		
		// 设置视频清晰度选项
		setVideoDefinitions(url) {
			// 如果不是mp4格式，不尝试设置清晰度
			if (!url || (!url.toLowerCase().includes('.mp4') && !url.toLowerCase().includes('/mp4'))) {
				this.videoDefinition = null;
				return;
			}
			
			// 尝试根据当前视频URL构建多清晰度选项
			try {
				// 从URL中提取基础部分，删除末尾的清晰度标识（如果有）
				let baseUrl = url;
				
				// 清晰度后缀模式1: 如 xxx_720p.mp4
				const resPattern1 = /_(1080p|720p|480p|360p|240p|4k|2k)\./i;
				// 清晰度后缀模式2: 如 xxx_hd.mp4
				const resPattern2 = /_(hd|sd|ld)\./i;
				// 清晰度路径模式: 如 /720/xxx.mp4
				const resPattern3 = /\/(1080|720|480|360|240|4k|2k|hd|sd|ld)\//i;
				
				// 移除清晰度标识，获取基础URL
				if (resPattern1.test(baseUrl)) {
					baseUrl = baseUrl.replace(resPattern1, '.');
				} else if (resPattern2.test(baseUrl)) {
					baseUrl = baseUrl.replace(resPattern2, '.');
				} else if (resPattern3.test(baseUrl)) {
					// 此种情况较复杂，暂不处理
					this.videoDefinition = null;
					return;
				}
				
				// 构建清晰度列表
				const definitionList = [];
				
				// 基础URL（无后缀）和文件扩展名
				const urlWithoutExt = baseUrl.substring(0, baseUrl.lastIndexOf('.'));
				const extension = baseUrl.substring(baseUrl.lastIndexOf('.'));
				
				// 检查URL是否包含可能的清晰度信息，以确定最高支持的清晰度
				const has4K = url.toLowerCase().includes('4k') || url.toLowerCase().includes('2160p');
				const has2K = url.toLowerCase().includes('2k') || url.toLowerCase().includes('1440p');
				const has1080 = url.toLowerCase().includes('1080') || url.toLowerCase().includes('hd');
				const has720 = url.toLowerCase().includes('720');
				const has480 = url.toLowerCase().includes('480') || url.toLowerCase().includes('sd');
				
				// 添加清晰度选项，从低到高
				definitionList.push({
					name: "流畅",
					url: `${urlWithoutExt}_360p${extension}`
				});
				
				definitionList.push({
					name: "标清",
					url: `${urlWithoutExt}_480p${extension}`
				});
				
				definitionList.push({
					name: "高清",
					url: `${urlWithoutExt}_720p${extension}`
				});
				
				if (has1080 || has4K || has2K) {
					definitionList.push({
						name: "超清",
						url: `${urlWithoutExt}_1080p${extension}`
					});
				}
				
				if (has2K || has4K) {
					definitionList.push({
						name: "2K",
						url: `${urlWithoutExt}_2k${extension}`
					});
				}
				
				if (has4K) {
					definitionList.push({
						name: "4K",
						url: `${urlWithoutExt}_4k${extension}`
					});
				}
				
				// 设置视频清晰度
				this.videoDefinition = {
					list: definitionList,
					// 默认选择当前清晰度或720P
					defaultDefinition: has720 ? "高清" : (has480 ? "标清" : "流畅")
				};
				
				console.log('设置视频清晰度选项:', this.videoDefinition);
			} catch (e) {
				console.error('设置视频清晰度选项失败:', e);
				this.videoDefinition = null;
			}
		},
		
		onGroupChange(e) {
			this.selectedGroupIndex = e.detail.value;
		},
		goToDetail(item) {
			// 跳转到详情页，传递文章id
			uni.navigateTo({
				url: `/pages/article/articleDetail?article_id=${item._id}`
			});
		},
	},

}
</script>

<template>
	<view class="userArticleList">
		
		<scroll-view 
			@scrolltolower="scrolltolower" 
			:scroll-y="true" 
			class="scroll-view-article"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			show-scrollbar="true"
			enable-passive="true" 
			enable-back-to-top="true"
			enhanced="true"
			bounces="true"
			refresher-threshold="80"
			refresher-background="#f2f2f2">
			<view class="content">
				<!-- 用户信息头部 -->
				<view class="head">
					<user-header @contact="handleContact" :articleTotal="articleTotal"
						:userInfo="userArticleInfo"></user-header>
				</view>
				
				<!-- 视频播放组件 -->
				<view class="video-container" v-if="videoUrl && videoUrl.length > 0">
					<video 
						id="myVideo"
						:src="videoUrl"
						class="video-player"
						object-fit="contain" 
						controls 
						@play="onVideoPlay"
						@pause="onVideoPause"
						:loop="false"
						enable-progress-gesture
						enable-play-gesture
						show-fullscreen-btn
						show-play-btn
						show-center-play-btn
						initial-time="0"
						codec="hardware"
						http-cache
						direction="0"
						show-mute-btn
						enable-danmu="false"
					>
					</video>
				</view>
				
				<!-- 文章列表 -->
				<articleItem v-if="userArticleData && userArticleData.length > 0"
					@preview="goToDetail"
					@contact="handleContact"
					@delete="handleDelete" v-for="item in userArticleData" :item="item" :key="item._id"
					:avatarClickEnabled="avatarClickEnabled">
				</articleItem>
				<view v-else class="empty-state">
					<text>暂无文章</text>
				</view>
				
				<!-- 加载状态 - 优化显示 -->
				<view style="margin-bottom: 120rpx; padding-bottom: 90rpx;">
					<uni-load-more color="#d6d6d6" :status="status" :content-text="loadMoreText" />
				</view>
				
				<!-- 底部安全区域间距 -->
				<view class="safe-area-inset-bottom"></view>
			</view>
		</scroll-view>
	</view>
</template>

<style lang="scss" scoped>
	.userArticleList {
		height: 100vh;
		background-color: $pyq-pages-bg-color;
		position: relative;
		display: flex;
		flex-direction: column;
		touch-action: pan-y; /* 优化触摸响应 */

		.content {
			padding-bottom: env(safe-area-inset-bottom);
			padding: 20rpx;
			-webkit-overflow-scrolling: touch; /* iOS流畅滚动 */

			.head {
				margin-bottom: 2rpx;
			}
			
			.empty-state {
				display: flex;
				justify-content: center;
				align-items: center;
				padding: 40rpx 0;
				color: #999;
				font-size: 28rpx;
			}
		}
		
		.scroll-view-article {
			flex: 1;
			height: 0; /* 使用flex布局时，设置height为0使其自动扩展 */
			padding-bottom: 120rpx; /* 为底部按钮留出空间 */
			-webkit-overflow-scrolling: touch; /* iOS流畅滚动 */
		}
		
		/* 文本省略样式 */
		.ellipsis {
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		.ellipsis-2 {
			display: -webkit-box;
			-webkit-box-orient: vertical;
			-webkit-line-clamp: 2;
			overflow: hidden;
			text-overflow: ellipsis;
			word-break: break-all;
		}
		
		/* 正方形图片样式 */
		.square-image {
			width: 100%;
			height: 100%;
			border-radius: 8rpx;
			object-fit: cover; /* 确保图片填充容器并裁剪到最短边 */
		}
		
		.safe-area-inset-bottom {
			height: 0rpx;
			padding-bottom: env(safe-area-inset-bottom);
		}
		
		/* 防止滚动时出现白色间隙 */
		overflow: hidden;
	}
	
	/* 视频播放器相关样式 */
	.video-container {
		position: relative;
		margin: 20rpx auto 20rpx;
		border-radius: 12rpx;
		overflow: hidden;
	}
	
	.video-player {
		width: 100%;
		height: 420rpx; /* 16:9 宽高比 */
		background-color: #000;
		border-radius: 5rpx;
	}
	
	.join-group-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 90%;
		margin: 32rpx auto 0 auto;
		padding: 24rpx 0;
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
		background: linear-gradient(90deg, #ff5b78 0%, #ff8a00 100%);
		border: none;
		border-radius: 48rpx;
		box-shadow: 0 8rpx 32rpx rgba(255,91,120,0.18);
		text-align: center;
		letter-spacing: 2rpx;
		transition: background 0.2s;
		.group-icon {
			width: 48rpx;
			height: 48rpx;
			margin-right: 16rpx;
		}
	}
	.join-group-btn:active {
		background: linear-gradient(90deg, #ff8a00 0%, #ff5b78 100%);
		opacity: 0.92;
	}
</style>

<!-- 移除全局样式中的标签选择器，避免微信小程序的限制 -->
<!-- 注意：这些样式应该在组件内部使用类选择器实现，而不是在这里全局覆盖 -->