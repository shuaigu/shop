<template>
    <div class="marketing-chat-config">
        <el-card>
            <div slot="header">
                <span>营销聊天配置</span>
            </div>

            <el-form :model="form" label-width="120px">
                <!-- 横幅配置 -->
                <el-divider content-position="left">横幅设置</el-divider>
                
                <el-form-item label="横幅标题">
                    <el-input v-model="form.banner_title" placeholder="我们帮您把业务/产品推广出去"></el-input>
                </el-form-item>

                <el-form-item label="横幅副标题">
                    <el-input v-model="form.banner_subtitle" placeholder="您只需要等着客户主动找上门"></el-input>
                </el-form-item>

                <!-- 客服设置 -->
                <el-divider content-position="left">客服设置</el-divider>
                
                <el-form-item label="客服头像">
                    <el-upload
                        class="avatar-uploader"
                        :action="uploadUrl"
                        :show-file-list="false"
                        :on-success="handleAvatarSuccess"
                        :before-upload="beforeAvatarUpload"
                    >
                        <img v-if="form.service_avatar" :src="form.service_avatar" class="avatar" />
                        <i v-else class="el-icon-plus avatar-uploader-icon"></i>
                    </el-upload>
                </el-form-item>

                <!-- 对话流程配置 -->
                <el-divider content-position="left">对话流程配置</el-divider>
                
                <el-form-item label="对话流程">
                    <el-button @click="addMessage" type="primary" size="small">添加消息</el-button>
                    <el-button @click="showJsonEditor = true" type="success" size="small">JSON编辑器</el-button>
                </el-form-item>

                <!-- 消息列表 -->
                <div v-for="(msg, index) in form.chat_flow" :key="index" class="message-item">
                    <el-card shadow="hover">
                        <div class="message-header">
                            <span>消息 {{ index + 1 }}</span>
                            <div>
                                <el-button @click="moveUp(index)" size="mini" icon="el-icon-arrow-up" :disabled="index === 0"></el-button>
                                <el-button @click="moveDown(index)" size="mini" icon="el-icon-arrow-down" :disabled="index === form.chat_flow.length - 1"></el-button>
                                <el-button @click="deleteMessage(index)" size="mini" type="danger" icon="el-icon-delete"></el-button>
                            </div>
                        </div>

                        <el-form-item label="消息类型">
                            <el-select v-model="msg.type" placeholder="请选择">
                                <el-option label="客服消息" value="service"></el-option>
                                <el-option label="用户消息" value="user"></el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item label="消息内容">
                            <el-input v-model="msg.content" type="textarea" :rows="3"></el-input>
                        </el-form-item>

                        <el-form-item label="延迟(毫秒)">
                            <el-input-number v-model="msg.delay" :min="0" :step="100"></el-input-number>
                        </el-form-item>

                        <el-form-item label="等待响应">
                            <el-switch v-model="msg.waitForResponse"></el-switch>
                        </el-form-item>

                        <el-form-item v-if="msg.waitForResponse" label="响应键名">
                            <el-input v-model="msg.responseKey" placeholder="例如: hasCustomerProblem"></el-input>
                        </el-form-item>

                        <!-- 按钮配置 -->
                        <el-form-item v-if="msg.waitForResponse" label="按钮选项">
                            <el-button @click="addButton(msg)" size="small" type="primary">添加按钮</el-button>
                            <div v-for="(btn, btnIndex) in msg.buttons" :key="btnIndex" class="button-item">
                                <el-input v-model="btn.text" placeholder="按钮文字" size="small" style="width: 120px;"></el-input>
                                <el-input v-model="btn.value" placeholder="按钮值" size="small" style="width: 120px;"></el-input>
                                <el-select v-model="btn.type" placeholder="样式" size="small" style="width: 100px;">
                                    <el-option label="默认" value=""></el-option>
                                    <el-option label="主要" value="primary"></el-option>
                                    <el-option label="警告" value="warning"></el-option>
                                </el-select>
                                <el-button @click="deleteButton(msg, btnIndex)" size="small" type="danger" icon="el-icon-delete"></el-button>
                            </div>
                        </el-form-item>

                        <!-- 条件显示 -->
                        <el-form-item label="条件显示">
                            <el-switch v-model="msg.hasCondition" @change="toggleCondition(msg)"></el-switch>
                        </el-form-item>

                        <template v-if="msg.hasCondition">
                            <el-form-item label="条件键名">
                                <el-input v-model="msg.condition.key" placeholder="例如: acceptPrice"></el-input>
                            </el-form-item>
                            <el-form-item label="期望值">
                                <el-input v-model="msg.condition.value" placeholder="例如: true"></el-input>
                            </el-form-item>
                        </template>
                    </el-card>
                </div>

                <!-- 底部信息 -->
                <el-divider content-position="left">底部设置</el-divider>
                
                <el-form-item label="底部信息">
                    <el-input v-model="form.footer_text" placeholder="页面信息及服务由XXX企业管理有限公司提供"></el-input>
                </el-form-item>

                <!-- 保存按钮 -->
                <el-form-item>
                    <el-button type="primary" @click="saveConfig">保存配置</el-button>
                    <el-button @click="loadConfig">重新加载</el-button>
                    <el-button @click="previewConfig" type="success">预览</el-button>
                </el-form-item>
            </el-form>
        </el-card>

        <!-- JSON 编辑器对话框 -->
        <el-dialog title="JSON 编辑器" :visible.sync="showJsonEditor" width="70%">
            <el-input 
                v-model="jsonText" 
                type="textarea" 
                :rows="20"
                placeholder="请输入 JSON 格式的对话流程"
            ></el-input>
            <span slot="footer" class="dialog-footer">
                <el-button @click="showJsonEditor = false">取消</el-button>
                <el-button type="primary" @click="applyJson">应用</el-button>
            </span>
        </el-dialog>
    </div>
</template>

<script>
export default {
    name: 'MarketingChatConfig',
    data() {
        return {
            uploadUrl: '/api/file/upload',
            showJsonEditor: false,
            jsonText: '',
            form: {
                banner_title: '',
                banner_subtitle: '',
                footer_text: '',
                service_avatar: '',
                chat_flow: []
            }
        }
    },
    mounted() {
        this.loadConfig()
    },
    methods: {
        // 加载配置
        async loadConfig() {
            try {
                const res = await this.$http.get('/admin/marketing_chat/getConfig')
                if (res.code === 1) {
                    this.form = { ...this.form, ...res.data }
                    // 确保 chat_flow 是数组
                    if (typeof this.form.chat_flow === 'string') {
                        this.form.chat_flow = JSON.parse(this.form.chat_flow)
                    }
                    // 处理条件显示
                    this.form.chat_flow.forEach(msg => {
                        msg.hasCondition = !!msg.condition
                        if (!msg.condition) {
                            msg.condition = { key: '', value: '' }
                        }
                        if (!msg.buttons) {
                            msg.buttons = []
                        }
                    })
                    this.$message.success('配置加载成功')
                }
            } catch (error) {
                this.$message.error('加载配置失败')
            }
        },

        // 保存配置
        async saveConfig() {
            try {
                // 清理数据
                const chatFlow = this.form.chat_flow.map(msg => {
                    const cleanMsg = {
                        type: msg.type,
                        content: msg.content,
                        delay: msg.delay || 500
                    }
                    if (msg.waitForResponse) {
                        cleanMsg.waitForResponse = true
                        cleanMsg.responseKey = msg.responseKey
                        cleanMsg.buttons = msg.buttons
                    }
                    if (msg.hasCondition && msg.condition.key) {
                        cleanMsg.condition = {
                            key: msg.condition.key,
                            value: msg.condition.value
                        }
                    }
                    return cleanMsg
                })

                const data = {
                    banner_title: this.form.banner_title,
                    banner_subtitle: this.form.banner_subtitle,
                    footer_text: this.form.footer_text,
                    service_avatar: this.form.service_avatar,
                    chat_flow: chatFlow
                }

                const res = await this.$http.post('/admin/marketing_chat/saveConfig', data)
                if (res.code === 1) {
                    this.$message.success('保存成功')
                } else {
                    this.$message.error(res.msg || '保存失败')
                }
            } catch (error) {
                this.$message.error('保存失败')
            }
        },

        // 添加消息
        addMessage() {
            this.form.chat_flow.push({
                type: 'service',
                content: '',
                delay: 500,
                waitForResponse: false,
                responseKey: '',
                buttons: [],
                hasCondition: false,
                condition: { key: '', value: '' }
            })
        },

        // 删除消息
        deleteMessage(index) {
            this.$confirm('确定删除这条消息吗？', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                this.form.chat_flow.splice(index, 1)
            })
        },

        // 上移
        moveUp(index) {
            if (index === 0) return
            const temp = this.form.chat_flow[index]
            this.$set(this.form.chat_flow, index, this.form.chat_flow[index - 1])
            this.$set(this.form.chat_flow, index - 1, temp)
        },

        // 下移
        moveDown(index) {
            if (index === this.form.chat_flow.length - 1) return
            const temp = this.form.chat_flow[index]
            this.$set(this.form.chat_flow, index, this.form.chat_flow[index + 1])
            this.$set(this.form.chat_flow, index + 1, temp)
        },

        // 添加按钮
        addButton(msg) {
            if (!msg.buttons) {
                this.$set(msg, 'buttons', [])
            }
            msg.buttons.push({
                text: '',
                value: '',
                type: ''
            })
        },

        // 删除按钮
        deleteButton(msg, index) {
            msg.buttons.splice(index, 1)
        },

        // 切换条件
        toggleCondition(msg) {
            if (!msg.hasCondition) {
                msg.condition = { key: '', value: '' }
            }
        },

        // 头像上传成功
        handleAvatarSuccess(res, file) {
            this.form.service_avatar = res.data.url
        },

        // 头像上传前验证
        beforeAvatarUpload(file) {
            const isImage = file.type.startsWith('image/')
            const isLt2M = file.size / 1024 / 1024 < 2

            if (!isImage) {
                this.$message.error('只能上传图片文件!')
            }
            if (!isLt2M) {
                this.$message.error('图片大小不能超过 2MB!')
            }
            return isImage && isLt2M
        },

        // 应用JSON
        applyJson() {
            try {
                const parsed = JSON.parse(this.jsonText)
                if (!Array.isArray(parsed)) {
                    throw new Error('必须是数组格式')
                }
                this.form.chat_flow = parsed.map(msg => ({
                    ...msg,
                    hasCondition: !!msg.condition,
                    condition: msg.condition || { key: '', value: '' },
                    buttons: msg.buttons || []
                }))
                this.showJsonEditor = false
                this.$message.success('应用成功')
            } catch (error) {
                this.$message.error('JSON 格式错误: ' + error.message)
            }
        },

        // 预览配置
        previewConfig() {
            this.jsonText = JSON.stringify(this.form.chat_flow, null, 2)
            this.showJsonEditor = true
        }
    }
}
</script>

<style scoped>
.marketing-chat-config {
    padding: 20px;
}

.message-item {
    margin-bottom: 20px;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    font-weight: bold;
}

.button-item {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    align-items: center;
}

.avatar-uploader .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
}

.avatar-uploader .el-upload:hover {
    border-color: #409EFF;
}

.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 178px;
    height: 178px;
    line-height: 178px;
    text-align: center;
}

.avatar {
    width: 178px;
    height: 178px;
    display: block;
}
</style>
