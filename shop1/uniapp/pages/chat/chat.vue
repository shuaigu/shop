<template>
	<view class="container">
		<scroll-view scroll-y class="chat-list" :scroll-into-view="lastId">
			<view v-for="(item, index) in messages" :key="item.id" :id="'msg-' + item.id" class="msg-row" :class="{ 'msg-me': item.sender_id == myId }">
				<image :src="item.avatar || '/static/default_avatar.png'" class="avatar"></image>
				<view class="msg-content">
					<view v-if="item.message_type === 'text'" class="bubble">{{ item.content }}</view>
					<image v-else-if="item.message_type === 'image'" :src="item.file_url" mode="widthFix" class="img-msg"></image>
				</view>
			</view>
		</scroll-view>
		
		<view class="input-area">
			<input v-model="content" class="input" confirm-type="send" @confirm="sendMsg" />
			<button @click="sendMsg" class="send-btn">发送</button>
		</view>
	</view>
</template>

<script setup>
import { ref, nextTick, getCurrentInstance } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const id = ref('')
const name = ref('')
const messages = ref([])
const content = ref('')
const myId = ref('')
const lastId = ref('')

const { proxy } = getCurrentInstance()

onLoad((options) => {
	id.value = options.id
	name.value = options.name
	uni.setNavigationBarTitle({ title: name.value })
	const user = JSON.parse(uni.getStorageSync('user') || '{}')
	myId.value = user.id
	fetchMessages()
})

const fetchMessages = async () => {
	try {
		const res = await proxy.$request({ url: `/conversations/messages?conversation_id=${id.value}` })
		if (res.success) {
			messages.value = res.data.reverse()
			if (messages.value.length > 0) {
				nextTick(() => {
					lastId.value = 'msg-' + messages.value[messages.value.length - 1].id
				})
			}
		}
	} catch (e) {}
}

const sendMsg = async () => {
	if (!content.value) return
	try {
		const res = await proxy.$request({
			url: '/conversations/messages',
			method: 'POST',
			data: {
				conversation_id: id.value,
				content: content.value,
				message_type: 'text'
			}
		})
		if (res.success) {
			content.value = ''
			fetchMessages()
		}
	} catch (e) {}
}
</script>

<style>
	.container { display: flex; flex-direction: column; height: 100vh; background-color: #f5f5f5; }
	.chat-list { flex: 1; padding: 20rpx; }
	.msg-row { display: flex; margin-bottom: 30rpx; }
	.msg-me { flex-direction: row-reverse; }
	.avatar { width: 80rpx; height: 80rpx; border-radius: 10rpx; }
	.msg-content { margin: 0 20rpx; max-width: 70%; }
	.bubble { background-color: #fff; padding: 20rpx; border-radius: 10rpx; font-size: 30rpx; word-break: break-all; }
	.msg-me .bubble { background-color: #95ec69; }
	.img-msg { border-radius: 10rpx; width: 300rpx; }
	
	.input-area { display: flex; padding: 20rpx; background-color: #fff; border-top: 1px solid #ddd; }
	.input { flex: 1; background-color: #f5f5f5; height: 80rpx; padding: 0 20rpx; border-radius: 10rpx; }
	.send-btn { background-color: #07c160; color: #fff; height: 80rpx; line-height: 80rpx; margin-left: 20rpx; font-size: 28rpx; }
</style>
