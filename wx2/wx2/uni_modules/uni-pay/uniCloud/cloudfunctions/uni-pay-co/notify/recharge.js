'use strict';
/**
 * 此处建议只改下订单状态，保证能及时返回给第三方支付服务器成功状态
 * 限制4秒内必须执行完全部的异步回调逻辑，建议将消息发送、返佣、业绩结算等业务逻辑异步处理（如用定时任务去处理这些异步逻辑）
 * 特别注意：因为金额是前端传的，需要再判断下金额和你业务系统订单中的金额是否一致，如果不一致，直接返回 return false;
 * 特别注意：因为金额是前端传的，需要再判断下金额和你业务系统订单中的金额是否一致，如果不一致，直接返回 return false;
 * 特别注意：因为金额是前端传的，需要再判断下金额和你业务系统订单中的金额是否一致，如果不一致，直接返回 return false;
 */
module.exports = async ( obj ) => {
	let user_order_success = true;
	let { data = {} } = obj;
	let {
		order_no,
		out_trade_no,
		total_fee,
		custom = {}
	} = data; // uni-pay-orders 表内的数据均可获取到

	console.log('=== 支付成功回调 recharge.js ===', {
		order_no,
		out_trade_no,
		total_fee,
		custom
	});

	// 此处写你自己的支付成功逻辑开始-----------------------------------------------------------

	try {
		// 检查是否是原价购买订单（通过 custom 参数判断）
		if (custom && custom.buyout_id) {
			console.log('检测到原价购买订单，开始处理购买逻辑...', custom);
			
			const db = uniCloud.database();
			const dbCmd = db.command;
			
			// 1. 验证购买订单金额
			const buyoutOrderRes = await db.collection('buyout_orders')
				.where({
					order_no: order_no
				})
				.get();
			
			if (!buyoutOrderRes.data || buyoutOrderRes.data.length === 0) {
				console.error('购买订单不存在:', order_no);
				return false;
			}
			
			const buyoutOrder = buyoutOrderRes.data[0];
			const expectedAmount = Math.round(buyoutOrder.buyout_price * 100); // 转换为分
			
			// 验证金额是否一致（防止篡改）
			if (total_fee !== expectedAmount) {
				console.error('支付金额不匹配！', {
					expected: expectedAmount,
					actual: total_fee,
					order_no: order_no
				});
				return false;
			}
			
			console.log('✅ 金额验证通过');
			
			// 2. 检查订单是否已经处理过（防止重复处理）
			const isAlreadyProcessed = buyoutOrder.status === 1;
			
			if (isAlreadyProcessed) {
				console.log('⚠️ 订单已完成，无需重复处理');
				return true; // 返回 true 表示处理成功（虽然是重复的）
			}
			
			console.log('开始更新订单状态...');
			
		// 3. 更新购买订单状态为已支付
		const now = Date.now();
		await db.collection('buyout_orders').doc(buyoutOrder._id).update({
			status: 1, // 已支付
			update_time: now,
			complete_time: now
		});
		
		console.log('✅ 购买订单状态已更新为已支付');
		
		// 4. 🆕 创建砍价小组的初始记录（发起人记录）
		// 这样前端才能检测到用户已经发起了砍价小组
		try {
			const kanjiaColl = db.collection('kanjia');
			const initialRecord = {
				article_id: buyoutOrder.article_id,
				user_id: buyoutOrder.user_id,
				initiator_id: buyoutOrder.user_id, // 购买者就是发起人
				initiator_nickname: buyoutOrder.user_info?.nickname || '匿名用户',
				initiator_avatar: buyoutOrder.user_info?.avatar || '/static/images/touxiang.png',
				nickname: buyoutOrder.user_info?.nickname || '匿名用户',
				avatar: buyoutOrder.user_info?.avatar || '/static/images/touxiang.png',
				bargain_amount: 0, // 初始砍价金额为0
				cashback_amount: 0, // 初始返现金额为0
				cashback_status: 1, // 1-已完成（这是购买记录，不需要返现）
				is_initiator_record: true, // 标记为发起人的初始记录
				create_time: now
			};
			
			await kanjiaColl.add(initialRecord);
			console.log('✅ 已创建砍价小组初始记录');
		} catch (initErr) {
			console.error('⚠️ 创建初始记录失败（不影响购买）:', initErr);
		}
		
		console.log('🎉 用户已成为小组长，可以开始分享砍价获得返现！');
		console.log('📝 返现上限:', buyoutOrder.cashback_limit || buyoutOrder.buyout_price, '元');
		
		user_order_success = true;
			
		} else {
			// 非买断订单，可以添加其他类型的订单处理逻辑
			console.log('普通充值订单，暂无特殊处理逻辑');
			user_order_success = true;
		}
		
	} catch (err) {
		console.error('支付回调处理失败:', err);
		user_order_success = false;
	}

	// 此处写你自己的支付成功逻辑结束-----------------------------------------------------------
	// user_order_success =  true 代表你自己的逻辑处理成功 返回 false 代表你自己的处理逻辑失败。
	return user_order_success;
};