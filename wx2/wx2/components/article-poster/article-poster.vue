<template>
	<view class="article-poster">
		<!-- 生成海报按钮 -->
		<view class="poster-btn" :class="{'disabled': disabled}" @click="handlePosterButtonClick">
			<uni-icons type="image-filled" size="24" :color="disabled ? '#cccccc' : '#444444'"></uni-icons>
			<view class="text" :style="{color: disabled ? '#cccccc' : '#444444'}">
				海报
			</view>
		</view>
		
		<!-- 隐藏的canvas用于绘制海报 -->
		<canvas 
			canvas-id="article-poster-canvas" 
			id="article-poster-canvas" 
			:style="{position: 'absolute', left: '-9999px', width: canvasWidth + 'px', height: canvasHeight + 'px'}"
		></canvas>
		
		<!-- 海报预览弹窗 -->
		<uni-popup ref="posterPreview" type="center">
			<view class="poster-preview">
				<view class="preview-content">
					<image 
						v-if="posterPath" 
						:src="posterPath" 
						mode="widthFix" 
						class="poster-image"
						@longpress="savePosterToAlbum"
					></image>
				</view>
				<view class="preview-actions">
					<button class="action-btn save-btn" @click="savePosterToAlbum">保存到相册</button>
					<button class="action-btn cancel-btn" @click="closePosterPreview">取消</button>
				</view>
			</view>
		</uni-popup>
	</view>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { fixImageUrl, getDefaultImage } from '@/utils/domainConfig.js';

// 定义 props
const props = defineProps({
	// 文章ID
	articleId: {
		type: String,
		required: true
	},
	// 文章内容
	content: {
		type: String,
		default: ''
	},
	// 文章分类
	category: {
		type: String,
		default: ''
	},
	// 文章图片列表
	images: {
		type: Array,
		default: () => []
	},
	// 分享者昵称（当前登录用户）
	authorName: {
		type: String,
		default: ''
	},
	// 分享者头像（当前登录用户）
	authorAvatar: {
		type: String,
		default: ''
	},
	// 发布时间
	publishTime: {
		type: [String, Number],
		default: ''
	},
	// 浏览量
	viewCount: {
		type: Number,
		default: 0
	},
	// 是否禁用（用于海报生成中禁用按钮）
	disabled: {
		type: Boolean,
		default: false
	}
});

// 响应式数据
const posterPath = ref(''); // 生成的海报路径
const canvasWidth = ref(750); // canvas宽度(px)
const canvasHeight = ref(1334); // canvas高度(px) - 移动端海报比例，会根据内容动态调整
const isGenerating = ref(false); // 是否正在生成
const posterPreview = ref(null); // 弹窗引用
const qrcodeBase64 = ref(''); // 小程序码base64

// 定义 emits
const emit = defineEmits(['posterGenerated']);

// 监听外部触发生成海报的事件（支持静默模式）
uni.$on('generatePoster', (options) => {
	const silent = options?.silent || false;
	console.log(silent ? '🔇 静默生成海报...' : '收到生成海报事件，开始生成...');
	generatePoster(silent);
});

// 组件卸载时移除事件监听
onBeforeUnmount(() => {
	uni.$off('generatePoster');
});

// 处理用户点击海报按钮（显示加载和预览）
const handlePosterButtonClick = () => {
	// 如果按钮禁用，不响应点击
	if (props.disabled) {
		uni.showToast({
			title: '海报生成中，请稍候...',
			icon: 'none',
			duration: 1500
		});
		return;
	}
	
	if (posterPath.value) {
		// 如果海报已生成，直接显示预览
		showPosterPreview();
	} else {
		// 如果海报未生成，生成并显示（非静默模式）
		generatePoster(false);
	}
};

// 生成海报（支持静默模式）
const generatePoster = async (silent = false) => {
	if (isGenerating.value) {
		return;
	}
	
	isGenerating.value = true;
	
	// 🔥 每次生成前清空缓存，确保使用最新数据
	qrcodeBase64.value = '';
	posterPath.value = ''; // 清空海报路径缓存
	console.log('🗑️ 已清空海报缓存（小程序码+路径）');
	
	// 只在非静默模式下显示加载提示
	if (!silent) {
		uni.showLoading({
			title: '生成海报中...',
			mask: true
		});
	}
	
	try {
		// 先生成小程序码
		await generateArticleQRCode();
		
		// 等待小程序码生成完成（最多等3秒）
		let waitCount = 0;
		while (!qrcodeBase64.value && waitCount < 30) {
			await new Promise(resolve => setTimeout(resolve, 100));
			waitCount++;
		}
		
		if (!qrcodeBase64.value) {
			console.warn('⚠️ 小程序码生成超时，将继续生成海报（使用占位图）');
		} else {
			console.log('✅ 小程序码已准备就绪');
		}
		
		// 然后绘制海报
		// #ifdef MP-WEIXIN
		// 微信小程序使用canvas 2D API
		const query = uni.createSelectorQuery();
		query.select('#article-poster-canvas')
			.fields({ node: true, size: true })
			.exec(async (res) => {
				if (!res[0] || !res[0].node) {
					// 降级方案：使用离屏canvas
					try {
						const canvas = wx.createOffscreenCanvas({ 
							type: '2d', 
							width: canvasWidth.value, 
							height: canvasHeight.value 
						});
						await drawPoster(canvas, silent);
					} catch (err) {
						console.error('离屏canvas创建失败:', err);
						if (!silent) {
							uni.hideLoading();
							uni.showToast({
								title: '生成失败，请重试',
								icon: 'none'
							});
						}
						isGenerating.value = false;
					}
				} else {
					const canvas = res[0].node;
					canvas.width = canvasWidth.value;
					canvas.height = canvasHeight.value;
					await drawPoster(canvas, silent);
				}
			});
		// #endif
		
		// #ifndef MP-WEIXIN
		// 非微信小程序环境
		if (!silent) {
			uni.hideLoading();
			uni.showToast({
				title: '仅支持微信小程序',
				icon: 'none'
			});
		}
		isGenerating.value = false;
		// #endif
		
	} catch (err) {
		console.error('生成海报失败:', err);
		if (!silent) {
			uni.hideLoading();
			uni.showToast({
				title: '生成失败，请重试',
				icon: 'none'
			});
		}
		isGenerating.value = false;
	}
};

// 绘制海报
const drawPoster = async (canvas, silent = false) => {
	return new Promise(async (resolve, reject) => {
		try {
			const ctx = canvas.getContext('2d');
			const dpr = 2; // 设备像素比，提高清晰度
						
			// 设置画布尺寸
			const width = canvasWidth.value;
			
			// 根据图片数量动态计算高度
			const imageCount = props.images?.length || 0;
			const displayImageCount = Math.min(imageCount, 8); // 最多显示8张
			const userInfoHeight = 95; // 用户信息栏
			const descHeight = 115; // 描述区
			
			// 根据图片数量计算图片区高度
			let imgAreaHeight = 0;
			if (displayImageCount === 0) {
				imgAreaHeight = 0;
			} else if (displayImageCount === 1) {
				imgAreaHeight = 310; // 1张图：单张大图
			} else if (displayImageCount === 2 || displayImageCount === 3) {
				imgAreaHeight = 310; // 2-3张：左大右小布局
			} else if (displayImageCount === 4) {
				imgAreaHeight = 430; // 4张：2x2宫格
			} else if (displayImageCount <= 6) {
				imgAreaHeight = 430; // 5-6张：2行布局
			} else {
				imgAreaHeight = 640; // 7-8张：3行布局
			}
			
			const footerHeight = 240; // 底部区
			const imgToFooterGap = 30; // 图片到底部区的间距
			const topPadding = 30; // 顶部间距（增加一点间距）
			const bottomPadding = 15; // 底部间距
			
			const height = topPadding + userInfoHeight + descHeight + imgAreaHeight + imgToFooterGap + footerHeight + bottomPadding;
			canvas.height = height; // 动态设置画布高度
						
			// 🔥 关键优化：先用不透明白色填充整个画布，确保无透明度
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, width, height);
			
			// 绘制外层背景（纯色紫色，不透明）
			ctx.fillStyle = '#667eea';
			ctx.fillRect(0, 0, width, height);
			
			// ===== 白色主内容卡片区域 =====
			const contentAreaY = topPadding;
			// 白色卡片高度 = 用户信息 + 描述 + 图片 + 底部小间距
			const contentAreaHeight = userInfoHeight + descHeight + imgAreaHeight + 1;
			const cardX = 30;
			const cardWidth = width - 60;
			
			// 白色内容卡片背景（带圆角）
			ctx.fillStyle = '#ffffff';
			// 手动绘制圆角矩形
			const radius = 20;
			ctx.beginPath();
			ctx.moveTo(cardX + radius, contentAreaY);
			ctx.lineTo(cardX + cardWidth - radius, contentAreaY);
			ctx.arcTo(cardX + cardWidth, contentAreaY, cardX + cardWidth, contentAreaY + radius, radius);
			ctx.lineTo(cardX + cardWidth, contentAreaY + contentAreaHeight - radius);
			ctx.arcTo(cardX + cardWidth, contentAreaY + contentAreaHeight, cardX + cardWidth - radius, contentAreaY + contentAreaHeight, radius);
			ctx.lineTo(cardX + radius, contentAreaY + contentAreaHeight);
			ctx.arcTo(cardX, contentAreaY + contentAreaHeight, cardX, contentAreaY + contentAreaHeight - radius, radius);
			ctx.lineTo(cardX, contentAreaY + radius);
			ctx.arcTo(cardX, contentAreaY, cardX + radius, contentAreaY, radius);
			ctx.closePath();
			ctx.fill();
			
			// 🔥 优化：移除半透明阴影，改用不透明的浅灰色边框效果
			ctx.fillStyle = '#e8e8e8';
			ctx.fillRect(cardX + 2, contentAreaY + contentAreaHeight, cardWidth - 4, 3);
			ctx.fillStyle = '#f0f0f0';
			ctx.fillRect(cardX + 4, contentAreaY + contentAreaHeight + 3, cardWidth - 8, 2);
						
			// 当前绘制位置Y坐标（从白色卡片内部开始）
			let currentY = contentAreaY + 35;
						
			// ===== 1. 用户信息栏（左头像+名称+分类  右侧浏览量）=====
			const avatarSize = 60;
			const avatarX = 60;
			const avatarY = currentY;
			
			// 绘制头像（圆形）- 直接使用数据库URL
			if (props.authorAvatar) {
				try {
					let avatarUrl = String(props.authorAvatar || '');
					
					// 检查是否为空或默认头像
					if (!avatarUrl || avatarUrl.includes('/static/images/touxiang.png')) {
						console.log('🎨[海报头像] 使用默认');
						ctx.fillStyle = '#e5e5e5';
						ctx.beginPath();
						ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
						ctx.fill();
					} else {
						// 🔥 关键修复: 添加时间戳防止缓存
						const timestamp = Date.now();
						const separator = avatarUrl.includes('?') ? '&' : '?';
						avatarUrl = `${avatarUrl}${separator}_t=${timestamp}`;
						console.log('🎨[海报头像] 加载 URL(防缓存):', avatarUrl);
						
						// 加载真实头像
						const avatarImg = canvas.createImage();
						let loaded = false;
						
						await new Promise((resolve) => {
							const timeout = setTimeout(() => {
								if (!loaded) {
									console.warn('🎨[海报头像] 加载超时');
									ctx.fillStyle = '#e5e5e5';
									ctx.beginPath();
									ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
									ctx.fill();
									resolve();
								}
							}, 8000);
							
							avatarImg.onload = () => {
								loaded = true;
								clearTimeout(timeout);
								console.log('🎨[海报头像] 加载成功 ✅');
								// 绘制圆形头像
								ctx.save();
								ctx.beginPath();
								ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
								ctx.closePath();
								ctx.clip();
								ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
								ctx.restore();
								resolve();
							};
							
							avatarImg.onerror = (err) => {
								loaded = true;
								clearTimeout(timeout);
								console.error('🎨[海报头像] 加载失败 ❌', err);
								ctx.fillStyle = '#e5e5e5';
								ctx.beginPath();
								ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
								ctx.fill();
								resolve();
							};
							
							// 🔥 关键: 在设置src前清空之前的图片
							avatarImg.src = ''; // 先清空
							setTimeout(() => {
								avatarImg.src = avatarUrl; // 再设置新URL
							}, 10);
						});
					}
				} catch (err) {
					console.error('🎨[海报头像] 异常:', err);
					ctx.fillStyle = '#e5e5e5';
					ctx.beginPath();
					ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
					ctx.fill();
				}
			} else {
				console.log('🎨[海报头像] 无头像数据，使用默认');
				ctx.fillStyle = '#e5e5e5';
				ctx.beginPath();
				ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
				ctx.fill();
			}
			
			// 用户名称和分类
			const textX = avatarX + avatarSize + 20; // 增大与头像的间距
			const textBaseY = avatarY + avatarSize / 2 + 10; // 垂直居中对齐
			ctx.fillStyle = '#333333';
			ctx.font = 'bold 32px sans-serif';
			const userName = props.authorName || '分享者';
			ctx.fillText(userName, textX, textBaseY);
			
			// 分隔符和分类
			if (props.category) {
				ctx.fillStyle = '#999999';
				ctx.font = '28px sans-serif';
				const userNameWidth = ctx.measureText(userName).width;
				ctx.fillText('|', textX + userNameWidth + 20, textBaseY);
				ctx.fillText(props.category, textX + userNameWidth + 50, textBaseY);
			}
			
			// 绘制浏览量（右侧，垂直居中）
			ctx.fillStyle = '#666666';
			ctx.font = '28px sans-serif';
			ctx.textAlign = 'right';
			const viewText = `${props.viewCount || 0}浏览`;
			ctx.fillText(viewText, width - 60, textBaseY);
			ctx.textAlign = 'left';
			
			currentY += avatarSize + 45; // 增大与下方描述区的间距
			
			// ===== 2. 文章内容描述区 =====
			ctx.fillStyle = '#333333';
			ctx.font = '32px sans-serif';
			const description = props.content || '这里是文章内容描述...';
			
			// 多行文本处理
			const maxDescWidth = width - 120;
			const descLines = wrapText(ctx, description, maxDescWidth, 32);
			const displayLines = descLines.slice(0, 2); // 最多显示2行
			
			displayLines.forEach((line, index) => {
				let displayLine = line;
				if (index === 1 && descLines.length > 2) {
					// 第二行超出时添加省略号
					displayLine = line.substring(0, Math.min(line.length, 30)) + '...';
				}
				ctx.fillText(displayLine, 60, currentY + index * 45);
			});
			
			currentY += displayLines.length * 45 - 8; // 文字与图片间距
			
			// ===== 3. 图片展示区（根据数量自适应布局）=====
			if (props.images && props.images.length > 0) {
				const imgAreaX = 60;
				const imgAreaWidth = width - 120;
				const displayImages = props.images.slice(0, 8); // 最多8张
				const count = displayImages.length;
				
				// 加载所有图片
				const imagePromises = displayImages.map((imgData, index) => {
					return new Promise((resolve) => {
						const img = canvas.createImage();
						img.onload = () => resolve({ img, index });
						img.onerror = () => resolve({ img: null, index });
						img.src = fixImageUrl(imgData.compressedURL || imgData.url || '');
					});
				});
				
				const loadedImages = await Promise.all(imagePromises);
				
				// 根据图片数量选择布局
				if (count === 1) {
					// 1张图：居中大图
					const { img } = loadedImages[0];
					if (img) {
						const imgWidth = imgAreaWidth;
						const imgHeight = 280;
						ctx.fillStyle = '#f5f5f5';
						ctx.fillRect(imgAreaX, currentY, imgWidth, imgHeight);
						drawImageFit(ctx, img, imgAreaX, currentY, imgWidth, imgHeight);
						currentY += imgHeight; // 无间距
					}
				} else if (count === 2 || count === 3) {
					// 2-3张：左大右小布局
					const largeImgWidth = imgAreaWidth * 0.58;
					const imgHeight = 280;
					const smallImgHeight = (imgHeight - 12) / 2;
					
					loadedImages.forEach(({ img, index }) => {
						if (!img) return;
						
						let x, y, w, h;
						if (index === 0) {
							x = imgAreaX;
							y = currentY;
							w = largeImgWidth;
							h = imgHeight;
						} else if (index === 1) {
							x = imgAreaX + largeImgWidth + 12;
							y = currentY;
							w = imgAreaWidth - largeImgWidth - 12;
							h = smallImgHeight;
						} else {
							x = imgAreaX + largeImgWidth + 12;
							y = currentY + smallImgHeight + 12;
							w = imgAreaWidth - largeImgWidth - 12;
							h = smallImgHeight;
						}
						
						ctx.fillStyle = '#f5f5f5';
						ctx.fillRect(x, y, w, h);
						drawImageFit(ctx, img, x, y, w, h);
					});
					currentY += imgHeight; // 无间距
				} else {
					// 4-8张：九宫格布局（3列）
					const gridSize = (imgAreaWidth - 24) / 3; // 3列，间距12px
					const rows = Math.ceil(count / 3);
					
					loadedImages.forEach(({ img, index }) => {
						if (!img) return;
						
						const row = Math.floor(index / 3);
						const col = index % 3;
						
						const x = imgAreaX + col * (gridSize + 12);
						const y = currentY + row * (gridSize + 12);
						
						ctx.fillStyle = '#f5f5f5';
						ctx.fillRect(x, y, gridSize, gridSize);
						drawImageFit(ctx, img, x, y, gridSize, gridSize);
					});
					
					currentY += rows * (gridSize + 12); // 无间距
				}
			}
			
			// ===== 4. 底部引导区域 =====
			const footerY = height - footerHeight - bottomPadding;
							
			// 绘制白色底部卡片
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, footerY, width, footerHeight);
			
			// 左侧二维码区域
			const qrSize = 180;
			const qrX = 60;
			const qrY = footerY + 30; // 上边距减小至10px
							
			// 绘制二维码背景
			ctx.fillStyle = '#f5f5f5';
			ctx.fillRect(qrX, qrY, qrSize, qrSize);
							
			// 加载并绘制小程序码
			try {
				if (qrcodeBase64.value) {
					console.log('开始绘制小程序码...');
					console.log('base64长度:', qrcodeBase64.value.length);
					console.log('base64前100字符:', qrcodeBase64.value.substring(0, 100));
					
					const qrcodeImg = canvas.createImage();
					await new Promise((qrResolve) => {
						const timeout = setTimeout(() => {
							console.warn('⚠️ 小程序码加载超时');
							qrResolve();
						}, 5000); // 增加到5秒
						
						qrcodeImg.onload = () => {
							clearTimeout(timeout);
							console.log('✅ 小程序码加载成功，尺寸:', qrcodeImg.width, 'x', qrcodeImg.height);
							console.log('绘制位置:', {x: qrX + 10, y: qrY + 10, w: qrSize - 20, h: qrSize - 20});
							try {
								ctx.drawImage(qrcodeImg, qrX + 10, qrY + 10, qrSize - 20, qrSize - 20);
								console.log('✅ 绘制完成');
							} catch (drawErr) {
								console.error('❌ drawImage失败:', drawErr);
							}
							qrResolve();
						};
						
						qrcodeImg.onerror = (err) => {
							clearTimeout(timeout);
							console.error('❌ 小程序码图片加载失败');
							console.error('错误详情:', err);
							console.error('src值:', qrcodeBase64.value.substring(0, 100));
							qrResolve();
						};
						
						// 设置src触发加载
						console.log('设置图片src...');
						qrcodeImg.src = qrcodeBase64.value;
					});
				} else {
					console.warn('小程序码未生成，绘制占位提示');
					// 绘制占位文字
					ctx.fillStyle = '#cccccc';
					ctx.font = '24px sans-serif';
					ctx.textAlign = 'center';
					ctx.fillText('小程序码', qrX + qrSize / 2, qrY + qrSize / 2 - 10);
					ctx.fillText('生成中', qrX + qrSize / 2, qrY + qrSize / 2 + 20);
					ctx.textAlign = 'left';
				}
			} catch (err) {
				console.error('❌ 绘制小程序码异常:', err);
				console.error('异常堆栈:', err.stack);
			}
			
			// 右侧引导文字
			const guideTextX = qrX + qrSize + 40;
			const guideTextStartY = qrY + (qrSize - 80) / 2 + 15; // 微调垂直位置
			
			// 绘制数字序号和提示文字
			const guideIcon1X = guideTextX;
			const guideIcon1Y = guideTextStartY;
			
			// ① 保存图片到相册
			ctx.fillStyle = '#999999';
			ctx.font = '28px sans-serif';
			ctx.fillText('①', guideIcon1X, guideIcon1Y);
			ctx.fillStyle = '#666666';
			ctx.font = '26px sans-serif';
			ctx.fillText('保存图片到相册', guideIcon1X + 45, guideIcon1Y);
			
			// ② 扫码查看详情
			const guideIcon2Y = guideIcon1Y + 50;
			ctx.fillStyle = '#999999';
			ctx.font = '28px sans-serif';
			ctx.fillText('②', guideIcon1X, guideIcon2Y);
			ctx.fillStyle = '#666666';
			ctx.font = '26px sans-serif';
			ctx.fillText('扫码查看详情', guideIcon1X + 45, guideIcon2Y);
			
			// 底部装饰图标
			const heartX = width - 180;
			const heartY = footerY + 130; // 微调位置
			ctx.fillStyle = '#667eea';
			ctx.font = '80px sans-serif';
			ctx.fillText('💜', heartX, heartY);
			
			// 导出图片（使用jpg格式，确保无透明度）
			uni.canvasToTempFilePath({
				canvas: canvas,
				x: 0,
				y: 0,
				width: width,
				height: height,
				destWidth: width * dpr,
				destHeight: height * dpr,
				fileType: 'jpg', // 🔥 使用jpg格式，不支持透明度
				quality: 1,
				success: (res) => {
					console.log('🎨[海报生成] 成功');
					posterPath.value = res.tempFilePath;
					
					// 触发事件，通知父组件海报生成成功
					try {
						emit('posterGenerated', res.tempFilePath);
					} catch (emitErr) {
						console.error('🎨[海报生成] emit失败:', emitErr);
					}
									
					// 只在非静默模式下显示海报预览
					if (!silent) {
						uni.hideLoading();
						showPosterPreview();
					}
					isGenerating.value = false;
					resolve(res.tempFilePath);
				},
				fail: (err) => {
					console.error('导出海报失败:', err);
					if (!silent) {
						uni.hideLoading();
						uni.showToast({
							title: '生成失败，请重试',
							icon: 'none'
						});
					}
					isGenerating.value = false;
					reject(err);
				}
			});
			
		} catch (err) {
			console.error('绘制海报失败:', err);
			if (!silent) {
				uni.hideLoading();
			}
			isGenerating.value = false;
			reject(err);
		}
	});
};

// 文字换行处理
const wrapText = (ctx, text, maxWidth, fontSize) => {
	const lines = [];
	if (!text) return lines;
	
	let line = '';
	let testLine = '';
	const chars = text.split('');
	
	for (let i = 0; i < chars.length; i++) {
		testLine += chars[i];
		const metrics = ctx.measureText(testLine);
		const testWidth = metrics.width;
		
		if (testWidth > maxWidth && i > 0) {
			lines.push(line);
			line = chars[i];
			testLine = chars[i];
		} else {
			line = testLine;
		}
	}
	
	lines.push(line);
	return lines;
};

// 图片填满居中显示辅助函数（cover模式）
const drawImageFit = (ctx, img, x, y, w, h) => {
	const imgWidth = img.width;
	const imgHeight = img.height;
	const targetRatio = w / h;
	const imgRatio = imgWidth / imgHeight;
	
	let sx, sy, sw, sh;
	
	if (imgRatio > targetRatio) {
		// 图片更宽，以高度为准，裁剪左右
		sh = imgHeight;
		sw = imgHeight * targetRatio;
		sx = (imgWidth - sw) / 2;
		sy = 0;
	} else {
		// 图片更高，以宽度为准，裁剪上下
		sw = imgWidth;
		sh = imgWidth / targetRatio;
		sx = 0;
		sy = (imgHeight - sh) / 2;
	}
	
	ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
};

// 生成文章小程序码
const generateArticleQRCode = async () => {
	return new Promise(async (resolve, reject) => {
		try {
			const wxacodeApi = uniCloud.importObject('getWxacode', { customUI: true });
			const res = await wxacodeApi.generateArticleQRCode({
				article_id: props.articleId
			});
						
			if (res.errCode === 0 && res.qrcodeBase64) {
				// #ifdef MP-WEIXIN
				// Canvas可以直接使用base64，不需要转换为文件
				qrcodeBase64.value = res.qrcodeBase64;
				resolve(res.qrcodeBase64);
				// #endif
							
				// #ifndef MP-WEIXIN
				qrcodeBase64.value = res.qrcodeBase64;
				resolve(res.qrcodeBase64);
				// #endif
			} else {
				console.error('🎨[海报] 小程序码生成失败:', res.errMsg);
				qrcodeBase64.value = ''; // 清空
				resolve('');
			}
		} catch (err) {
			console.error('🎨[海报] 调用云函数失败:', err.message);
			qrcodeBase64.value = ''; // 清空
			resolve('');
		}
	});
};

// 显示海报预览
const showPosterPreview = () => {
	posterPreview.value.open();
};

// 关闭海报预览
const closePosterPreview = () => {
	posterPreview.value.close();
};

// 保存海报到相册
const savePosterToAlbum = () => {
	if (!posterPath.value) {
		uni.showToast({
			title: '请先生成海报',
			icon: 'none'
		});
		return;
	}
	
	uni.saveImageToPhotosAlbum({
		filePath: posterPath.value,
		success: () => {
			uni.showToast({
				title: '保存成功',
				icon: 'success'
			});
			closePosterPreview();
		},
		fail: (err) => {
			console.error('保存失败:', err);
			// 可能是权限问题
			if (err.errMsg.indexOf('auth') !== -1) {
				uni.showModal({
					title: '提示',
					content: '需要授权保存相册权限',
					success: (res) => {
						if (res.confirm) {
							uni.openSetting();
						}
					}
				});
			} else {
				uni.showToast({
					title: '保存失败',
					icon: 'none'
				});
			}
		}
	});
};
</script>

<style lang="scss" scoped>
.article-poster {
	display: inline-block;
	
	.poster-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4rpx;
		cursor: pointer;
		transition: all 0.3s;
		
		&:active {
			opacity: 0.6;
		}
		
		/* 禁用状态 */
		&.disabled {
			opacity: 0.4;
			pointer-events: none;
			cursor: not-allowed;
		}
		
		.text {
			color: #444444;
			font-size: 24rpx;
		}
	}
}

.poster-preview {
	width: 640rpx;
	// background-color: #ffffff;
	border-radius: 24rpx;
	overflow: hidden;
	margin-top: -100rpx; // 海报整体上移50px（100rpx）
	
	.preview-content {
		padding: 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		
		.poster-image {
			width: 100%;
			border-radius: 12rpx;
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
		}
	}
	
	.preview-actions {
		display: flex;
		justify-content: center; // 水平居中
		align-items: center; // 垂直居中
		padding: 12rpx 32rpx 24rpx;
		gap: 24rpx;
		
		.action-btn {
			flex: 1;
			height: 80rpx;
			border-radius: 12rpx;
			font-size: 28rpx;
			font-weight: 500;
			border: none;
			
			&.save-btn {
				background: linear-gradient(135deg, #667eea 0%, #667eea 100%);
				color: #ffffff;
			}
			
			&.cancel-btn {
				background-color: #f5f5f5;
				color: #666666;
			}
			
			&:active {
				opacity: 0.8;
			}
		}
	}
}
</style>