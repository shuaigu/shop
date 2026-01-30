/**
 * 图片预览工具函数
 * 统一管理图片预览功能，通过路由跳转到独立页面
 */

import { addImageParams } from './domainConfig.js'

/**
 * 预览多张图片
 * @param {Array} images - 图片URL数组
 * @param {Number} current - 当前图片索引，默认为0
 */
export function previewImages(images, current = 0) {
	if (!images || !Array.isArray(images) || images.length === 0) {
		uni.showToast({
			title: '没有可预览的图片',
			icon: 'none'
		});
		return;
	}
	
	// 过滤掉无效的图片URL
	const validImages = images.filter(img => {
		if (typeof img === 'string') {
			return img && (img.startsWith('http') || img.startsWith('/'));
		}
		return false;
	}).map(img => addImageParams(img, { preset: 'listWidth' }));
	
	if (validImages.length === 0) {
		uni.showToast({
			title: '图片无法预览',
			icon: 'none'
		});
		return;
	}
	
	// 确保current在有效范围内
	const safeCurrentIndex = Math.max(0, Math.min(current, validImages.length - 1));
	
	// 跳转到图片预览页面
	uni.navigateTo({
		url: `/pages/image-preview/image-preview?images=${encodeURIComponent(JSON.stringify(validImages))}&current=${safeCurrentIndex}`
	});
}

/**
 * 预览单张图片
 * @param {String} imageUrl - 图片URL
 */
export function previewImage(imageUrl) {
	if (!imageUrl || typeof imageUrl !== 'string') {
		uni.showToast({
			title: '图片无法预览',
			icon: 'none'
		});
		return;
	}
	
	// 调用previewImages，传入单张图片数组
	previewImages([imageUrl], 0);
}
