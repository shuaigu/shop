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
        return $this->fetch();
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
                'content' => '您是否整面临获客难、成本高的问题？',
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
