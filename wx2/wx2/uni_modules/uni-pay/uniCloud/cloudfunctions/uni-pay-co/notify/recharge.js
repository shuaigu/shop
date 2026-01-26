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
		// 检查是否是买断订单（通过 custom 参数判断）
		if (custom && custom.buyout_id) {
			console.log('检测到买断订单，开始处理买断逻辑...', custom);
			
			const db = uniCloud.database();
			const dbCmd = db.command;
			
			// 1. 验证买断订单金额
			const buyoutOrderRes = await db.collection('buyout_orders')
				.where({
					order_no: order_no
				})
				.get();
			
			if (!buyoutOrderRes.data || buyoutOrderRes.data.length === 0) {
				console.error('买断订单不存在:', order_no);
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
			
			// 3. 更新买断订单状态为已支付
			const now = Date.now();
			await db.collection('buyout_orders').doc(buyoutOrder._id).update({
				status: 1, // 已支付
				update_time: now,
				complete_time: now
			});
			
			console.log('✅ 买断订单状态已更新为已支付');
			
			// 4. 检查是否已存在买断记录（防止重复创建）
			const existingBargainRes = await db.collection('kanjia')
				.where({
					article_id: buyoutOrder.article_id,
					initiator_id: buyoutOrder.user_id,
					is_buyout: true
				})
				.get();
			
			if (!existingBargainRes.data || existingBargainRes.data.length === 0) {
				// 5. 创建买断记录
				const bargainRecord = {
					article_id: buyoutOrder.article_id,
					initiator_id: buyoutOrder.user_id,
					initiator_nickname: buyoutOrder.user_info.nickname,
					initiator_avatar: buyoutOrder.user_info.avatar,
					user_id: buyoutOrder.user_id,
					nickname: buyoutOrder.user_info.nickname,
					avatar: buyoutOrder.user_info.avatar,
					bargain_amount: buyoutOrder.buyout_price,
					current_price: 0,
					buyout_price: buyoutOrder.buyout_price,
					is_buyout: true,
					is_complete: true,
					create_time: now
				};
				
				await db.collection('kanjia').add(bargainRecord);
				console.log('✅ 买断记录已创建');
			} else {
				console.log('⚠️ 买断记录已存在，跳过创建');
			}
			
			// 6. 更新文章状态（幂等操作，可重复执行）
			await db.collection('articleList').doc(buyoutOrder.article_id).update({
				bargain_buyout_price: buyoutOrder.buyout_price,
				bargain_buyout_time: now,
				bargain_completed: true
			});
			console.log('✅ 文章状态已更新');
			
			// 7. 更新用户积分（只在第一次处理时奖励）
			const rewardPoints = Math.floor(buyoutOrder.buyout_price);
			if (rewardPoints > 0 && !isAlreadyProcessed) {
				try {
					await db.collection('user').doc(buyoutOrder.user_id).update({
						points: dbCmd.inc(rewardPoints)
					});
					console.log('✅ 用户积分已更新，奖励:', rewardPoints);
				} catch (err) {
					console.error('更新用户积分失败:', err);
					// 积分更新失败不影响主流程
				}
			}
			
			console.log('🎉 买断支付回调处理完成！');
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