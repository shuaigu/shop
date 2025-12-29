// 获取文章点赞状态
const getArticleLikeStatus = async () => {
  try {
    if (!props.article_id || !userStore.userInfo.uid) {
      console.log('获取点赞状态失败：文章ID或用户ID为空', {
        article_id: props.article_id,
        user_id: userStore.userInfo.uid
      });
      return;
    }
    
    console.log('开始获取文章点赞状态:', {
      article_id: props.article_id,
      user_id: userStore.userInfo.uid
    });
    
    // 调用云对象获取点赞状态
    const likeApi = uniCloud.importObject('likeRecord', { customUI: true });
    const result = await likeApi.getLikeRecord(props.article_id, userStore.userInfo.uid);
    
    // 添加防御性检查，确保result不为undefined
    if (!result) {
      console.error('获取点赞状态失败：返回结果为空');
      return;
    }
    
    console.log('获取点赞状态API返回结果:', result);
    
    // 检查返回结果的结构，确保能正确访问数据
    // 根据API返回结构调整访问方式
    let isLiked = false;
    let likeCountValue = 0;
    
    // 处理不同的返回结构情况
    if (result.code === 0) {
      // 新版API返回格式
      isLiked = result.isLiked === true;
      likeCountValue = result.like_count || 0;
      
      console.log('解析API返回结果:', {
        isLiked,
        likeCountValue
      });
    } else if (result.res && Array.isArray(result.res.data)) {
      // 旧版API返回格式
      isLiked = result.res.data.length > 0;
      likeCountValue = result.like_count || 0;
    } else {
      console.warn('未知的API返回格式:', result);
      // 使用默认值
      isLiked = false;
      likeCountValue = articleDetail.value ? (articleDetail.value.like_count || 0) : 0;
    }
    
    // 更新点赞状态
    isArticleLiked.value = isLiked;
    
    // 更新点赞数
    if (articleDetail.value) {
      // 如果文章详情存在，更新文章详情中的点赞数
      articleDetail.value.like_count = likeCountValue;
      likeCount.value = likeCountValue;
    } else {
      likeCount.value = likeCountValue;
    }
    
    console.log('点赞状态已更新:', {
      isArticleLiked: isArticleLiked.value,
      likeCount: likeCount.value
    });
    
    // 发送事件通知其他组件更新点赞状态
    uni.$emit('updateArticleLikeStatus', {
      articleId: props.article_id,
      isLiked: isArticleLiked.value,
      likeCount: likeCount.value
    });
    
    // 获取幸运用户信息（无论当前用户是否点赞）
    try {
      // 获取文章的幸运用户信息
      const luckyUsersResult = await likeApi.getLuckyUsers(props.article_id);
      
      // 添加防御性检查
      if (!luckyUsersResult) {
        console.log('获取幸运用户信息失败：返回结果为空');
        showLuckyUserBanner.value = false;
        return;
      }
      
      console.log('获取幸运用户信息结果:', luckyUsersResult);
      
      // 检查返回结果的结构
      if (luckyUsersResult.code === 0 && luckyUsersResult.data && luckyUsersResult.data.length > 0) {
        // 获取第一个幸运用户（通常是第1位点赞的用户）
        const luckyUser = luckyUsersResult.data[0];
        
        console.log('获取到幸运用户信息:', luckyUser);
        
        // 更新幸运用户信息
        luckyUserRank.value = luckyUser.like_rank || 1;
        luckyUserInfo.value = {
          avatar: luckyUser.avatar || '/static/images/default-avatar.png',
          nickname: luckyUser.nickname || '幸运用户'
        };
        
        // 显示幸运用户横幅
        showLuckyUserBanner.value = true;
        
        console.log('显示幸运用户横幅:', {
          rank: luckyUserRank.value,
          userInfo: luckyUserInfo.value
        });
      } else {
        console.log('没有找到幸运用户或者还没有人点赞');
        showLuckyUserBanner.value = false;
      }
    } catch (err) {
      console.error('获取幸运用户信息失败:', err);
      showLuckyUserBanner.value = false;
    }
  } catch (err) {
    console.error('获取点赞状态失败:', err);
    // 设置默认值，避免UI显示错误
    isArticleLiked.value = false;
    if (articleDetail.value) {
      likeCount.value = articleDetail.value.like_count || 0;
    } else {
      likeCount.value = 0;
    }
  }
}; 