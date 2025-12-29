// 云对象教程: https://uniapp.dcloud.net.cn/uniCloud/cloud-obj
// jsdoc语法提示教程：https://ask.dcloud.net.cn/docs/#//ask.dcloud.net.cn/article/129
module.exports = {
	_before: function () { // 通用预处理器

	},
	/**
	 * 获取抽奖奖品列表
	 * @returns {object} 奖品列表及相关配置
	 */
	getPrizes() {
		// 返回九宫格布局的奖品列表
		const prizes = [
			{ id: 1, name: '评论用户', type: 'reward', avatar: '/static/images/loading.png' },
			{ id: 2, name: '评论用户', type: 'empty', avatar: '/static/images/loading.png' },
			{ id: 3, name: '评论用户', type: 'reward', avatar: '/static/images/loading.png' },
			{ id: 4, name: '评论用户', type: 'reward', avatar: '/static/images/loading.png' },
			{ id: 5, name: '抽奖', type: 'center', avatar: '' },
			{ id: 6, name: '评论用户', type: 'empty', avatar: '/static/images/loading.png' },
			{ id: 7, name: '评论用户', type: 'reward', avatar: '/static/images/loading.png' },
			{ id: 8, name: '评论用户', type: 'empty', avatar: '/static/images/loading.png' },
			{ id: 9, name: '评论用户', type: 'reward', avatar: '/static/images/loading.png' },
		];
		const sequence = [0, 1, 2, 5, 8, 7, 6, 3]; // 抽奖灯光走向顺序
		
		// 随机头像数组
		const avatars = [
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
			'/static/images/defalut.png',
		];
		
		// 随机打乱头像数组
		const shuffledAvatars = avatars.sort(() => Math.random() - 0.5);
		
		// 为每个奖品分配随机头像
		prizes.forEach((prize, index) => {
			prize.avatar = shuffledAvatars[index];
		});
		
		return {
			prizes,
			sequence
		};
	},
	
	/**
	 * 执行抽奖操作
	 * @param {object} params 抽奖参数，可能包含用户ID等
	 * @returns {object} 抽奖结果
	 */
	doLottery(params = {}) {
		// 随机选择奖品（根据概率）
		const randomValue = Math.random();
		let selectedIndex;
		let prizeType;
		
		// 高概率抽中谢谢参与
		if (randomValue < 0.6) {
			// 随机选择一个谢谢参与的索引(1, 5, 7)
			const thankIndices = [1, 5, 7];
			selectedIndex = thankIndices[Math.floor(Math.random() * thankIndices.length)];
			prizeType = 'empty';
		} else if (randomValue < 0.85) {
			// 中等概率抽中2元红包(0, 6)
			const smallIndices = [0, 6];
			selectedIndex = smallIndices[Math.floor(Math.random() * smallIndices.length)];
			prizeType = 'small';
		} else if (randomValue < 0.95) {
			// 较低概率抽中8元红包(2, 8)
			const mediumIndices = [2, 8];
			selectedIndex = mediumIndices[Math.floor(Math.random() * mediumIndices.length)];
			prizeType = 'medium';
		} else {
			// 很低概率抽中20元红包(3)
			selectedIndex = 3;
			prizeType = 'large';
		}
		
		// 获取奖品列表和顺序数组
		const prizeData = module.exports.getPrizes();
		const prizes = prizeData.prizes;
		const sequence = prizeData.sequence;
		
		// 转换为sequence中的位置
		const targetPosition = sequence.findIndex(item => item === selectedIndex);
		
		// 记录抽奖结果（在实际应用中，这里可能需要写入数据库）
		// const recordResult = await this.recordLotteryResult({
		//     userId: params.userId,
		//     prizeId: prizes[sequence[targetPosition]].id,
		//     prizeName: prizes[sequence[targetPosition]].name,
		//     timestamp: Date.now()
		// });
		
		// 返回抽奖结果
		return {
			success: true,
			selectedIndex,            // 选中的奖品索引
			targetPosition,           // 在sequence中的位置
			prize: prizes[sequence[targetPosition]], // 中奖奖品信息
			prizeType                 // 奖品类型
		}
	}
}
