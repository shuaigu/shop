# PHP聊天系统API文档

这是一个为uniapp小程序设计的聊天系统后端API文档。

## 目录
- [基础配置](#基础配置)
- [认证](#认证)
- [用户API](#用户api)
- [会话API](#会话api)
- [消息API](#消息api)
- [实时通信API](#实时通信api)

## 基础配置

### 服务器URL
```
http://localhost/api
```

### 请求头
所有请求都需要包含以下请求头：
```
Content-Type: application/json
Authorization: Bearer {token}
```

## 认证

### 注册
- **URL**: `/register`
- **方法**: `POST`
- **描述**: 用户注册
- **请求体**:
```json
{
  "username": "string",
  "password": "string",
  "nickname": "string",
  "email": "string",
  "phone": "string"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "string",
  "data": {
    "id": "number"
  }
}
```

### 登录
- **URL**: `/login`
- **方法**: `POST`
- **描述**: 用户登录
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "string",
  "data": {
    "token": "string",
    "user": {
      "id": "number",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    }
  }
}
```

## 用户API

### 获取用户资料
- **URL**: `/profile`
- **方法**: `GET`
- **描述**: 获取当前用户资料
- **请求头**: 需要Authorization
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "number",
    "username": "string",
    "nickname": "string",
    "avatar": "string",
    "email": "string",
    "phone": "string",
    "created_at": "string"
  }
}
```

### 更新用户资料
- **URL**: `/profile`
- **方法**: `PUT`
- **描述**: 更新当前用户资料
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "nickname": "string",
  "avatar": "string",
  "email": "string",
  "phone": "string"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "string"
}
```

### 修改密码
- **URL**: `/change-password`
- **方法**: `POST`
- **描述**: 修改当前用户密码
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "old_password": "string",
  "new_password": "string"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "string"
}
```

### 搜索用户
- **URL**: `/search-users?q={username}&limit={limit}`
- **方法**: `GET`
- **描述**: 根据用户名搜索用户
- **请求头**: 需要Authorization
- **参数**:
  - q: 搜索关键词
  - limit: 结果限制，默认10
- **响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    }
  ]
}
```

## 会话API

### 获取会话列表
- **URL**: `/conversations?page={page}&limit={limit}`
- **方法**: `GET`
- **描述**: 获取当前用户的会话列表
- **请求头**: 需要Authorization
- **参数**:
  - page: 页码，默认1
  - limit: 每页数量，默认20
- **响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "type": "string",
      "name": "string",
      "avatar": "string",
      "created_at": "string",
      "updated_at": "string",
      "message_count": "number",
      "last_message_time": "string",
      "last_message_content": "string",
      "last_message_sender_id": "number",
      "participants": [
        {
          "id": "number",
          "username": "string",
          "nickname": "string",
          "avatar": "string"
        }
      ]
    }
  ]
}
```

### 创建会话
- **URL**: `/conversations`
- **方法**: `POST`
- **描述**: 创建新的会话
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "type": "single|group",
  "name": "string",
  "members": [1, 2, 3]
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "number"
  }
}
```

### 创建单聊会话
- **URL**: `/conversations/single`
- **方法**: `POST`
- **描述**: 创建与指定用户的单聊会话
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "target_user_id": "number"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "number"
  }
}
```

## 消息API

### 获取会话消息
- **URL**: `/conversations/{conversationId}/messages?page={page}&limit={limit}`
- **方法**: `GET`
- **描述**: 获取指定会话的消息历史
- **请求头**: 需要Authorization
- **参数**:
  - page: 页码，默认1
  - limit: 每页数量，默认50
- **响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "sender_id": "number",
      "message_type": "text|image|file|audio|video|system",
      "content": "string",
      "file_url": "string",
      "reply_to_message_id": "number",
      "is_read": "boolean",
      "created_at": "string",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    }
  ]
}
```

### 发送消息
- **URL**: `/messages/send`
- **方法**: `POST`
- **描述**: 发送消息到指定会话
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "conversation_id": "number",
  "message_type": "text|image|file|audio|video|system",
  "content": "string",
  "file_url": "string",
  "reply_to_message_id": "number"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "string",
  "data": {
    "id": "number",
    "conversation_id": "number",
    "sender_id": "number",
    "message_type": "string",
    "content": "string",
    "file_url": "string",
    "reply_to_message_id": "number",
    "created_at": "string"
  }
}
```

### 标记消息为已读
- **URL**: `/messages/mark-read`
- **方法**: `POST`
- **描述**: 标记消息为已读
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "message_ids": [1, 2, 3]
}
```
- **响应**:
```json
{
  "success": true,
  "message": "string"
}
```

### 获取未读消息数量
- **URL**: `/messages/unread-count`
- **方法**: `GET`
- **描述**: 获取当前用户的未读消息数量
- **请求头**: 需要Authorization
- **响应**:
```json
{
  "success": true,
  "data": {
    "unread_count": "number"
  }
}
```

## 实时通信API

### 轮询新消息
- **URL**: `/realtime/poll-messages`
- **方法**: `POST`
- **描述**: 轮询新消息（用于实现伪实时通信）
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "last_check_time": "number"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "new_messages": [],
    "newest_timestamp": "number",
    "count": "number"
  }
}
```

### 同步会话
- **URL**: `/realtime/sync-conversations`
- **方法**: `POST`
- **描述**: 同步会话列表更新
- **请求头**: 需要Authorization
- **请求体**:
```json
{
  "last_sync_time": "number"
}
```
- **响应**:
```json
{
  "success": true,
  "data": {
    "updated_conversations": [],
    "new_conversations": [],
    "sync_timestamp": "number"
  }
}
```

## WebSocket服务

除了HTTP API，还提供了一个WebSocket服务用于真正的实时通信：

- **地址**: `ws://localhost:8080`
- **连接后需先发送登录消息**:
```json
{
  "action": "login",
  "token": "your-jwt-token"
}
```
- **加入会话**:
```json
{
  "action": "join_conversation",
  "conversation_id": "number"
}
```
- **发送消息**:
```json
{
  "action": "send_message",
  "conversation_id": "number",
  "content": "string",
  "message_type": "text"
}
```

## 错误响应格式

所有错误响应格式如下：
```json
{
  "success": false,
  "message": "错误信息"
}
```