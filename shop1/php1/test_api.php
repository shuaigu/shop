<?php
/**
 * API测试页面
 * 用于测试聊天系统API功能
 */
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>聊天系统API测试</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .section {
            margin-bottom: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #fafafa;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input, select, textarea {
            width: 100%;
            padding: 8px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #0056b3;
        }
        .response {
            margin-top: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .token-input {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            background: white;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .tab {
            overflow: hidden;
            border: 1px solid #ccc;
            background-color: #f1f1f1;
            border-radius: 5px 5px 0 0;
        }
        .tab button {
            background-color: inherit;
            float: left;
            border: none;
            outline: none;
            cursor: pointer;
            padding: 14px 16px;
            transition: 0.3s;
            color: black;
        }
        .tab button:hover {
            background-color: #ddd;
        }
        .tab button.active {
            background-color: #007bff;
            color: white;
        }
        .tabcontent {
            display: none;
            padding: 20px;
            border: 1px solid #ccc;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>聊天系统API测试</h1>
        
        <div class="token-input">
            <div class="form-group">
                <label for="authToken">认证令牌:</label>
                <input type="text" id="authToken" placeholder="输入JWT令牌">
            </div>
            <button onclick="saveToken()">保存令牌</button>
        </div>
        
        <div class="tab">
            <button class="tablinks active" onclick="openTab(event, 'user')">用户API</button>
            <button class="tablinks" onclick="openTab(event, 'conversation')">会话API</button>
            <button class="tablinks" onclick="openTab(event, 'message')">消息API</button>
        </div>

        <!-- 用户API -->
        <div id="user" class="tabcontent" style="display: block;">
            <h3>用户API测试</h3>
            
            <div class="section">
                <h4>用户注册</h4>
                <div class="form-group">
                    <label>用户名:</label>
                    <input type="text" id="regUsername" placeholder="输入用户名">
                </div>
                <div class="form-group">
                    <label>密码:</label>
                    <input type="password" id="regPassword" placeholder="输入密码">
                </div>
                <div class="form-group">
                    <label>昵称:</label>
                    <input type="text" id="regNickname" placeholder="输入昵称">
                </div>
                <button onclick="registerUser()">注册用户</button>
                <div id="regResponse" class="response"></div>
            </div>
            
            <div class="section">
                <h4>用户登录</h4>
                <div class="form-group">
                    <label>用户名:</label>
                    <input type="text" id="loginUsername" placeholder="输入用户名">
                </div>
                <div class="form-group">
                    <label>密码:</label>
                    <input type="password" id="loginPassword" placeholder="输入密码">
                </div>
                <button onclick="loginUser()">登录</button>
                <div id="loginResponse" class="response"></div>
            </div>
            
            <div class="section">
                <h4>获取用户资料</h4>
                <button onclick="getProfile()">获取资料</button>
                <div id="profileResponse" class="response"></div>
            </div>
        </div>

        <!-- 会话API -->
        <div id="conversation" class="tabcontent">
            <h3>会话API测试</h3>
            
            <div class="section">
                <h4>获取会话列表</h4>
                <div class="form-group">
                    <label>页码:</label>
                    <input type="number" id="convPage" value="1">
                </div>
                <div class="form-group">
                    <label>每页数量:</label>
                    <input type="number" id="convLimit" value="10">
                </div>
                <button onclick="getConversations()">获取会话列表</button>
                <div id="convListResponse" class="response"></div>
            </div>
            
            <div class="section">
                <h4>创建单聊会话</h4>
                <div class="form-group">
                    <label>目标用户ID:</label>
                    <input type="number" id="targetUserId" placeholder="输入目标用户ID">
                </div>
                <button onclick="createSingleConversation()">创建单聊会话</button>
                <div id="createSingleConvResponse" class="response"></div>
            </div>
        </div>

        <!-- 消息API -->
        <div id="message" class="tabcontent">
            <h3>消息API测试</h3>
            
            <div class="section">
                <h4>发送消息</h4>
                <div class="form-group">
                    <label>会话ID:</label>
                    <input type="number" id="msgConversationId" placeholder="输入会话ID">
                </div>
                <div class="form-group">
                    <label>消息类型:</label>
                    <select id="msgType">
                        <option value="text">文本</option>
                        <option value="image">图片</option>
                        <option value="file">文件</option>
                        <option value="audio">音频</option>
                        <option value="video">视频</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>消息内容:</label>
                    <textarea id="msgContent" rows="3" placeholder="输入消息内容"></textarea>
                </div>
                <button onclick="sendMessage()">发送消息</button>
                <div id="sendMsgResponse" class="response"></div>
            </div>
            
            <div class="section">
                <h4>获取会话消息</h4>
                <div class="form-group">
                    <label>会话ID:</label>
                    <input type="number" id="getMsgConvId" placeholder="输入会话ID">
                </div>
                <div class="form-group">
                    <label>页码:</label>
                    <input type="number" id="msgPage" value="1">
                </div>
                <div class="form-group">
                    <label>每页数量:</label>
                    <input type="number" id="msgLimit" value="10">
                </div>
                <button onclick="getMessages()">获取消息</button>
                <div id="getMsgResponse" class="response"></div>
            </div>
        </div>
    </div>

    <script>
        let authToken = localStorage.getItem('chatAuthToken') || '';

        // 页面加载时设置令牌输入框值
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('authToken').value = authToken;
        });

        function saveToken() {
            authToken = document.getElementById('authToken').value;
            localStorage.setItem('chatAuthToken', authToken);
            alert('令牌已保存！');
        }

        function openTab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tablinks");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }

        function showResponse(elementId, response) {
            document.getElementById(elementId).innerHTML = JSON.stringify(response, null, 2);
        }

        async function apiCall(url, method, data = null) {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (authToken) {
                options.headers['Authorization'] = 'Bearer ' + authToken;
            }

            if (data) {
                options.body = JSON.stringify(data);
            }

            try {
                const response = await fetch(url, options);
                const result = await response.json();
                return result;
            } catch (error) {
                return { success: false, message: '请求失败: ' + error.message };
            }
        }

        // 用户API
        async function registerUser() {
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const nickname = document.getElementById('regNickname').value;

            if (!username || !password) {
                alert('用户名和密码不能为空');
                return;
            }

            const response = await apiCall('api.php/register', 'POST', {
                username: username,
                password: password,
                nickname: nickname
            });

            showResponse('regResponse', response);
        }

        async function loginUser() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            if (!username || !password) {
                alert('用户名和密码不能为空');
                return;
            }

            const response = await apiCall('api.php/login', 'POST', {
                username: username,
                password: password
            });

            if (response.success && response.data && response.data.token) {
                authToken = response.data.token;
                document.getElementById('authToken').value = authToken;
                localStorage.setItem('chatAuthToken', authToken);
            }

            showResponse('loginResponse', response);
        }

        async function getProfile() {
            const response = await fetch('api.php', {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            const result = await response.json();
            showResponse('profileResponse', result);
        }

        // 会话API
        async function getConversations() {
            const page = document.getElementById('convPage').value;
            const limit = document.getElementById('convLimit').value;

            const url = `api.php?path=conversations&page=${page}&limit=${limit}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            const result = await response.json();
            showResponse('convListResponse', result);
        }

        async function createSingleConversation() {
            const targetUserId = document.getElementById('targetUserId').value;

            if (!targetUserId) {
                alert('目标用户ID不能为空');
                return;
            }

            const response = await apiCall('api.php/conversations/single', 'POST', {
                target_user_id: parseInt(targetUserId)
            });

            showResponse('createSingleConvResponse', response);
        }

        // 消息API
        async function sendMessage() {
            const conversationId = document.getElementById('msgConversationId').value;
            const msgType = document.getElementById('msgType').value;
            const content = document.getElementById('msgContent').value;

            if (!conversationId || !content) {
                alert('会话ID和消息内容不能为空');
                return;
            }

            const response = await apiCall('api.php/conversations/messages', 'POST', {
                conversation_id: parseInt(conversationId),
                message_type: msgType,
                content: content
            });

            showResponse('sendMsgResponse', response);
        }

        async function getMessages() {
            const convId = document.getElementById('getMsgConvId').value;
            const page = document.getElementById('msgPage').value;
            const limit = document.getElementById('msgLimit').value;

            if (!convId) {
                alert('会话ID不能为空');
                return;
            }

            const url = `api.php?path=conversations/${convId}/messages&page=${page}&limit=${limit}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + authToken
                }
            });
            
            const result = await response.json();
            showResponse('getMsgResponse', result);
        }
    </script>
</body>
</html>