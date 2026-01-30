<?php
namespace app\admin\controller;

use app\common\basics\AdminBase;
use app\common\server\ConfigServer;
use app\common\server\JsonServer;
use app\common\server\UrlServer;

/**
 * 营销聊天配置控制器
 * Class MarketingChat
 * @package app\admin\controller
 */
class MarketingChat extends AdminBase
{
    /**
     * 获取配置
     */
    public function getConfig()
    {
        $chat_flow = ConfigServer::get('marketing_chat', 'chat_flow', '');
        
        // 如果是JSON字符串，解码
        if (is_string($chat_flow) && !empty($chat_flow)) {
            $chat_flow = json_decode($chat_flow, true);
        }
        
        // 如果为空，使用默认配置
        if (empty($chat_flow)) {
            $chat_flow = $this->getDefaultChatFlow();
        }
        
        $service_avatar = ConfigServer::get('marketing_chat', 'service_avatar', '');
        if ($service_avatar) {
            $service_avatar = UrlServer::getFileUrl($service_avatar);
        }

        $config = [
            'chat_flow' => $chat_flow,
            'banner_title' => ConfigServer::get('marketing_chat', 'banner_title', '我们帮您把业务/产品推广出去'),
            'banner_subtitle' => ConfigServer::get('marketing_chat', 'banner_subtitle', '您只需要等着客户主动找上门'),
            'footer_text' => ConfigServer::get('marketing_chat', 'footer_text', '页面信息及服务由XXX企业管理有限公司提供'),
            'service_avatar' => $service_avatar,
        ];
        
        return JsonServer::success('获取成功', $config);
    }

    /**
     * 保存配置
     */
    public function saveConfig()
    {
        $post = $this->request->post();
        
        try {
            if (isset($post['chat_flow'])) {
                // 如果是数组，转为JSON字符串
                $chat_flow = is_array($post['chat_flow']) 
                    ? json_encode($post['chat_flow'], JSON_UNESCAPED_UNICODE) 
                    : $post['chat_flow'];
                ConfigServer::set('marketing_chat', 'chat_flow', $chat_flow);
            }
            
            if (isset($post['banner_title'])) {
                ConfigServer::set('marketing_chat', 'banner_title', $post['banner_title']);
            }
            
            if (isset($post['banner_subtitle'])) {
                ConfigServer::set('marketing_chat', 'banner_subtitle', $post['banner_subtitle']);
            }
            
            if (isset($post['footer_text'])) {
                ConfigServer::set('marketing_chat', 'footer_text', $post['footer_text']);
            }
            
            if (isset($post['service_avatar'])) {
                ConfigServer::set('marketing_chat', 'service_avatar', $post['service_avatar']);
            }

            return JsonServer::success('保存成功');
        } catch (\Exception $e) {
            return JsonServer::error($e->getMessage());
        }
    }

    /**
     * 配置页面
     */
    public function index()
    {
        // 获取当前配置
        $chat_flow = ConfigServer::get('marketing_chat', 'chat_flow', '');
        if (is_string($chat_flow) && !empty($chat_flow)) {
            $chat_flow_array = json_decode($chat_flow, true);
        } else {
            $chat_flow_array = $this->getDefaultChatFlow();
        }
        
        $banner_title = ConfigServer::get('marketing_chat', 'banner_title', '我们帮您把业务/产品推广出去');
        $banner_subtitle = ConfigServer::get('marketing_chat', 'banner_subtitle', '您只需要等着客户主动找上门');
        $footer_text = ConfigServer::get('marketing_chat', 'footer_text', '页面信息及服务由XXX企业管理有限公司提供');
        
        // 输出完整的HTML页面
        $html = $this->renderSimplePage($banner_title, $banner_subtitle, $footer_text, $chat_flow_array);
        echo $html;
        exit;
    }
    
    /**
     * 渲染简单的配置页面
     */
    private function renderSimplePage($banner_title, $banner_subtitle, $footer_text, $chat_flow_array)
    {
        $chat_flow_json = json_encode($chat_flow_array, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        $save_url = url('marketing_chat/saveConfig');
        
        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>在线咨询配置</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/static/lib/layui/css/layui.css">
    <style>
        body { padding: 20px; background: #f8f8f8; }
        .config-container { max-width: 1200px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .section { margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px solid #eee; }
        .section:last-child { border-bottom: none; }
        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; color: #333; padding-left: 10px; border-left: 4px solid #1E9FFF; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 500; color: #666; }
        .form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
        .form-textarea { width: 100%; min-height: 400px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; line-height: 1.6; }
        .btn-group { margin-top: 20px; text-align: center; }
        .tips { background: #E7F4FD; padding: 15px; border-radius: 4px; color: #31708f; margin-bottom: 20px; line-height: 1.8; }
        .tips li { margin-bottom: 5px; }
        .success-msg { color: #52c41a; }
        .error-msg { color: #f5222d; }
    </style>
</head>
<body>
    <div class="config-container">
        <h1 style="text-align:center; margin-bottom:30px; color:#333;">在线咨询配置管理</h1>
        
        <div class="tips">
            <strong>📋 操作说明：</strong>
            <ul style="margin:10px 0 0 20px;">
                <li>✅ 修改基础设置后，点击"保存基础设置"按钮</li>
                <li>✅ 修改对话流程JSON后，点击"保存对话流程"按钮</li>
                <li>✅ 保存后，小程序端需要刷新页面才能看到效果</li>
                <li>✅ JSON格式必须正确，否则保存会失败</li>
            </ul>
        </div>

        <!-- 基础设置 -->
        <div class="section">
            <div class="section-title">基础设置</div>
            
            <div class="form-group">
                <label class="form-label">横幅标题：</label>
                <input type="text" id="banner_title" class="form-input" value="{$banner_title}" placeholder="我们帮您把业务/产品推广出去">
            </div>
            
            <div class="form-group">
                <label class="form-label">横幅副标题：</label>
                <input type="text" id="banner_subtitle" class="form-input" value="{$banner_subtitle}" placeholder="您只需要等着客户主动找上门">
            </div>
            
            <div class="form-group">
                <label class="form-label">底部信息：</label>
                <input type="text" id="footer_text" class="form-input" value="{$footer_text}" placeholder="页面信息及服务由XXX企业管理有限公司提供">
            </div>
            
            <div class="btn-group">
                <button class="layui-btn layui-btn-normal" onclick="saveBasicConfig()">
                    <i class="layui-icon layui-icon-ok"></i> 保存基础设置
                </button>
            </div>
            <div id="basic-result" style="margin-top:10px; text-align:center;"></div>
        </div>

        <!-- 对话流程配置 -->
        <div class="section">
            <div class="section-title">对话流程配置（JSON格式）</div>
            
            <div class="form-group">
                <label class="form-label">对话流程JSON：</label>
                <textarea id="chat_flow" class="form-textarea">{$chat_flow_json}</textarea>
                <div style="margin-top:10px; color:#999; font-size:12px;">
                    提示：修改后请确保JSON格式正确。每个消息对象包含 type, content, delay 等字段。
                </div>
            </div>
            
            <div class="btn-group">
                <button class="layui-btn layui-btn-normal" onclick="saveChatFlow()">
                    <i class="layui-icon layui-icon-ok"></i> 保存对话流程
                </button>
                <button class="layui-btn" onclick="formatJSON()">
                    <i class="layui-icon layui-icon-template-1"></i> 格式化JSON
                </button>
                <button class="layui-btn layui-btn-warm" onclick="validateJSON()">
                    <i class="layui-icon layui-icon-about"></i> 验证JSON
                </button>
            </div>
            <div id="flow-result" style="margin-top:10px; text-align:center;"></div>
        </div>

        <!-- 快速链接 -->
        <div class="section" style="border-bottom:none;">
            <div class="section-title">快速链接</div>
            <div style="padding:10px;">
                <a href="/admin/index/index" class="layui-btn layui-btn-primary">
                    <i class="layui-icon layui-icon-home"></i> 返回首页
                </a>
                <a href="/pages/marketing_chat/marketing_chat" class="layui-btn layui-btn-normal" target="_blank">
                    <i class="layui-icon layui-icon-website"></i> 预览前端页面
                </a>
            </div>
        </div>
    </div>

    <script src="/static/lib/layui/layui.js"></script>
    <script>
        layui.use(['layer', 'jquery'], function(){
            var layer = layui.layer;
            var $ = layui.jquery;
            
            // 保存基础设置
            window.saveBasicConfig = function() {
                var data = {
                    banner_title: document.getElementById('banner_title').value,
                    banner_subtitle: document.getElementById('banner_subtitle').value,
                    footer_text: document.getElementById('footer_text').value
                };
                
                $.ajax({
                    url: '{$save_url}',
                    type: 'POST',
                    data: data,
                    dataType: 'json',
                    success: function(res) {
                        if(res.code == 1) {
                            layer.msg('保存成功！', {icon: 1});
                            document.getElementById('basic-result').innerHTML = '<span class="success-msg">✓ 保存成功！</span>';
                        } else {
                            layer.msg(res.msg || '保存失败', {icon: 2});
                            document.getElementById('basic-result').innerHTML = '<span class="error-msg">✗ ' + (res.msg || '保存失败') + '</span>';
                        }
                    },
                    error: function() {
                        layer.msg('网络错误', {icon: 2});
                        document.getElementById('basic-result').innerHTML = '<span class="error-msg">✗ 网络错误</span>';
                    }
                });
            };
            
            // 保存对话流程
            window.saveChatFlow = function() {
                var chatFlowText = document.getElementById('chat_flow').value;
                
                try {
                    var chatFlowJSON = JSON.parse(chatFlowText);
                    
                    $.ajax({
                        url: '{$save_url}',
                        type: 'POST',
                        data: { chat_flow: JSON.stringify(chatFlowJSON) },
                        dataType: 'json',
                        success: function(res) {
                            if(res.code == 1) {
                                layer.msg('保存成功！', {icon: 1});
                                document.getElementById('flow-result').innerHTML = '<span class="success-msg">✓ 保存成功！</span>';
                            } else {
                                layer.msg(res.msg || '保存失败', {icon: 2});
                                document.getElementById('flow-result').innerHTML = '<span class="error-msg">✗ ' + (res.msg || '保存失败') + '</span>';
                            }
                        },
                        error: function() {
                            layer.msg('网络错误', {icon: 2});
                            document.getElementById('flow-result').innerHTML = '<span class="error-msg">✗ 网络错误</span>';
                        }
                    });
                } catch(e) {
                    layer.msg('JSON格式错误：' + e.message, {icon: 2, time: 3000});
                    document.getElementById('flow-result').innerHTML = '<span class="error-msg">✗ JSON格式错误：' + e.message + '</span>';
                }
            };
            
            // 格式化JSON
            window.formatJSON = function() {
                try {
                    var chatFlowText = document.getElementById('chat_flow').value;
                    var chatFlowJSON = JSON.parse(chatFlowText);
                    document.getElementById('chat_flow').value = JSON.stringify(chatFlowJSON, null, 2);
                    layer.msg('格式化成功', {icon: 1});
                } catch(e) {
                    layer.msg('JSON格式错误：' + e.message, {icon: 2, time: 3000});
                }
            };
            
            // 验证JSON
            window.validateJSON = function() {
                try {
                    var chatFlowText = document.getElementById('chat_flow').value;
                    JSON.parse(chatFlowText);
                    layer.msg('✓ JSON格式正确！', {icon: 1});
                    document.getElementById('flow-result').innerHTML = '<span class="success-msg">✓ JSON格式正确</span>';
                } catch(e) {
                    layer.msg('✗ JSON格式错误：' + e.message, {icon: 2, time: 3000});
                    document.getElementById('flow-result').innerHTML = '<span class="error-msg">✗ JSON格式错误：' + e.message + '</span>';
                }
            };
        });
    </script>
</body>
</html>
HTML;
    }

    /**
     * 获取默认配置
     */
    private function getDefaultChatFlow()
    {
        return [
            [
                'type' => 'service',
                'content' => '我们是做全行业获客的专业团队，能够帮助您精准获取客户；意向客户会主动添加您，全行业均可做；若您有需求，请认真回答以下问题。',
                'delay' => 500
            ],
            [
                'type' => 'service',
                'content' => '您是否面临获客难、成本高的问题？',
                'delay' => 1000,
                'waitForResponse' => true,
                'responseKey' => 'hasCustomerProblem',
                'buttons' => [
                    ['text' => '是', 'value' => true],
                    ['text' => '否', 'value' => false]
                ]
            ],
            [
                'type' => 'service',
                'content' => '您想要获取哪里的客户？',
                'delay' => 800,
                'waitForResponse' => true,
                'responseKey' => 'customerLocation',
                'buttons' => [
                    ['text' => '本地客户', 'value' => 'local'],
                    ['text' => '全国客户', 'value' => 'national']
                ]
            ],
            [
                'type' => 'service',
                'content' => '我们提供精准客户，您是否接受1000-3000/年的合作费用？',
                'delay' => 800,
                'waitForResponse' => true,
                'responseKey' => 'acceptPrice',
                'buttons' => [
                    ['text' => '是', 'value' => true, 'type' => 'primary'],
                    ['text' => '否', 'value' => false, 'type' => 'warning']
                ]
            ],
            [
                'type' => 'service',
                'content' => '太棒了！请留下您的联系方式，我们的专业顾问将在24小时内与您联系。',
                'delay' => 800,
                'condition' => ['key' => 'acceptPrice', 'value' => true]
            ],
            [
                'type' => 'service',
                'content' => '感谢您的关注！如果以后有需要，随时欢迎咨询我们。',
                'delay' => 800,
                'condition' => ['key' => 'acceptPrice', 'value' => false]
            ]
        ];
    }
}
