<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 日历数据
const currentDate = ref(new Date());
const selectedDate = ref(null);
const eventList = ref([]);

// 首页按钮设置
const indexSettings = ref({
  showHomeButton: false,
  homeButtonText: '返回首页',
  homeButtonIcon: '🏠'
});

// 是否正在加载设置
const isLoadingSettings = ref(true);

// 获取当前年份和月份
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonth = computed(() => currentDate.value.getMonth() + 1);

// 获取当月天数
const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth() + 1;
  return new Date(year, month, 0).getDate();
});

// 获取当月第一天是星期几
const firstDayOfMonth = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  return new Date(year, month, 1).getDay();
});

// 生成日历网格数据
const calendarDays = computed(() => {
  const days = [];
  const totalDays = daysInMonth.value;
  const firstDay = firstDayOfMonth.value;
  
  // 添加上个月的日期填充空白
  for (let i = 0; i < firstDay; i++) {
    days.push({
      day: null,
      isCurrentMonth: false,
      hasEvent: false,
      isToday: false
    });
  }
  
  // 当前日期
  const today = new Date();
  const isCurrentMonthAndYear = today.getFullYear() === currentYear.value && today.getMonth() === currentDate.value.getMonth();
  
  // 添加当月的日期
  for (let i = 1; i <= totalDays; i++) {
    const date = new Date(currentYear.value, currentDate.value.getMonth(), i);
    
    // 检查该日期是否有事件
    const hasEvent = eventList.value.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === i && 
             eventDate.getMonth() === date.getMonth() && 
             eventDate.getFullYear() === date.getFullYear();
    });
    
    days.push({
      day: i,
      date: date,
      isCurrentMonth: true,
      hasEvent: hasEvent,
      isToday: isCurrentMonthAndYear && today.getDate() === i,
      isSelected: selectedDate.value && 
                 selectedDate.value.getDate() === i && 
                 selectedDate.value.getMonth() === date.getMonth() && 
                 selectedDate.value.getFullYear() === date.getFullYear()
    });
  }
  
  return days;
});

// 日历控制方法
const goToPreviousMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
};

const goToNextMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() + 1);
  currentDate.value = newDate;
};

const goToToday = () => {
  currentDate.value = new Date();
};

// 选择日期
const selectDate = (day) => {
  if (day.day === null || !day.isCurrentMonth) return;
  selectedDate.value = day.date;
  
  // 根据选中的日期获取事件
  getEventsForDate(day.date);
};

// 获取选中日期的事件
const currentEvents = ref([]);

const getEventsForDate = (date) => {
  if (!date) return;
  
  // 这里可以调用API获取该日期的事件数据
  // 模拟数据
  setTimeout(() => {
    const events = eventList.value.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === date.getDate() && 
             eventDate.getMonth() === date.getMonth() && 
             eventDate.getFullYear() === date.getFullYear();
    });
    
    currentEvents.value = events;
  }, 100);
};

// 添加新事件
const newEventTitle = ref('');
const newEventTime = ref('');
const showAddEventForm = ref(false);

const toggleAddEventForm = () => {
  showAddEventForm.value = !showAddEventForm.value;
};

const addNewEvent = () => {
  if (!selectedDate.value || !newEventTitle.value) return;
  
  const newEvent = {
    id: Date.now(),
    title: newEventTitle.value,
    date: selectedDate.value,
    time: newEventTime.value,
    completed: false
  };
  
  eventList.value.push(newEvent);
  currentEvents.value.push(newEvent);
  
  // 重置表单
  newEventTitle.value = '';
  newEventTime.value = '';
  showAddEventForm.value = false;
  
  // 更新日历视图
  calendarDays.value.forEach(day => {
    if (day.date && 
        day.date.getDate() === selectedDate.value.getDate() && 
        day.date.getMonth() === selectedDate.value.getMonth() && 
        day.date.getFullYear() === selectedDate.value.getFullYear()) {
      day.hasEvent = true;
    }
  });
};

// 模拟一些事件数据
const initEventData = () => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  eventList.value = [
    {
      id: 1,
      title: '产品评审会议',
      date: today,
      time: '10:00',
      completed: false
    },
    {
      id: 2,
      title: '客户拜访',
      date: tomorrow,
      time: '14:30',
      completed: false
    },
    {
      id: 3,
      title: '团队周会',
      date: today,
      time: '16:00',
      completed: true
    }
  ];
  
  // 默认选中今天
  selectedDate.value = today;
  getEventsForDate(today);
};

// 完成/取消完成事件
const toggleEventCompleted = (event) => {
  event.completed = !event.completed;
};

// 删除事件
const deleteEvent = (eventId) => {
  eventList.value = eventList.value.filter(event => event.id !== eventId);
  currentEvents.value = currentEvents.value.filter(event => event.id !== eventId);
  
  // 更新日历视图中的事件标记
  updateCalendarEvents();
};

// 更新日历中的事件标记
const updateCalendarEvents = () => {
  calendarDays.value.forEach(day => {
    if (!day.date) return;
    
    day.hasEvent = eventList.value.some(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day.date.getDate() && 
             eventDate.getMonth() === day.date.getMonth() && 
             eventDate.getFullYear() === day.date.getFullYear();
    });
  });
};

// 从云函数获取首页设置
const getIndexSettings = async () => {
  try {
    isLoadingSettings.value = true;
    
    const indexYunApi = uniCloud.importObject('indexYun', { customUI: true });
    const result = await indexYunApi.getIndexSettings();
    
    if (result.code === 0) {
      indexSettings.value = {
        showHomeButton: result.showHomeButton,
        homeButtonText: result.homeButtonText || '返回首页',
        homeButtonIcon: result.homeButtonIcon || '🏠'
      };
    }
  } catch (error) {
    console.error('获取首页设置失败:', error);
  } finally {
    isLoadingSettings.value = false;
  }
};

// 跳转到首页
const goToIndexPage = () => {
  uni.switchTab({
    url: '/pages/index/index'
  });
};

// 监听首页按钮状态变化
onMounted(() => {
  getIndexSettings();
  
  // 监听来自管理页面的状态变化
  uni.$on('homeButtonChanged', (newState) => {
    indexSettings.value.showHomeButton = newState;
  });
});

// 在组件销毁时移除事件监听
onUnmounted(() => {
  uni.$off('homeButtonChanged');
});

// 初始化
onMounted(() => {
  initEventData();
});
</script>

<template>
  <view class="page-container">
    <!-- 日历部分 -->
    <view class="calendar-container">
      <!-- 日历头部 -->
      <view class="calendar-header">
        <view class="header-title">
          <text class="year-month">{{ currentYear }}年{{ currentMonth }}月</text>
        </view>
        <view class="header-actions">
          <text class="action-btn" @click="goToPreviousMonth">上个月</text>
          <text class="action-btn today-btn" @click="goToToday">今天</text>
          <text class="action-btn" @click="goToNextMonth">下个月</text>
        </view>
      </view>
      
      <!-- 星期标题 -->
      <view class="weekdays">
        <text class="weekday">日</text>
        <text class="weekday">一</text>
        <text class="weekday">二</text>
        <text class="weekday">三</text>
        <text class="weekday">四</text>
        <text class="weekday">五</text>
        <text class="weekday">六</text>
      </view>
      
      <!-- 日历网格 -->
      <view class="calendar-grid">
        <view 
          v-for="(day, index) in calendarDays" 
          :key="index" 
          :class="[
            'calendar-day', 
            !day.isCurrentMonth ? 'inactive-day' : '',
            day.isToday ? 'today' : '',
            day.isSelected ? 'selected-day' : '',
            day.hasEvent ? 'has-event' : ''
          ]"
          @click="selectDate(day)"
        >
          <text class="day-number">{{ day.day }}</text>
          <view v-if="day.hasEvent" class="event-dot"></view>
        </view>
      </view>
      
      <!-- 选中日期的事件列表 -->
      <view class="events-container">
        <view class="events-header">
          <text class="events-title">
            {{ selectedDate ? selectedDate.getFullYear() + '年' + (selectedDate.getMonth() + 1) + '月' + selectedDate.getDate() + '日' : '未选择日期' }}
          </text>
          <view class="add-event-btn" @click="toggleAddEventForm">
            <text class="add-icon">+</text>
            <text>添加行程</text>
          </view>
        </view>
        
        <!-- 添加事件表单 -->
        <view v-if="showAddEventForm" class="add-event-form">
          <input 
            type="text" 
            class="event-input" 
            placeholder="行程内容" 
            v-model="newEventTitle" 
          />
          <input 
            type="time" 
            class="event-input" 
            placeholder="时间" 
            v-model="newEventTime" 
          />
          <view class="form-actions">
            <button class="cancel-btn" @click="toggleAddEventForm">取消</button>
            <button class="confirm-btn" @click="addNewEvent">确定</button>
          </view>
        </view>
        
        <!-- 事件列表 -->
        <view v-if="currentEvents.length > 0" class="event-list">
          <view 
            v-for="event in currentEvents" 
            :key="event.id" 
            :class="['event-item', event.completed ? 'completed-event' : '']"
          >
            <view class="event-time">{{ event.time }}</view>
            <view class="event-content">
              <text class="event-title">{{ event.title }}</text>
              <view class="event-actions">
                <text class="complete-btn" @click="toggleEventCompleted(event)">
                  {{ event.completed ? '已完成' : '完成' }}
                </text>
                <text class="delete-btn" @click="deleteEvent(event.id)">删除</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 没有事件时显示 -->
        <view v-else class="no-events">
          <text class="no-events-text">今天没有行程安排</text>
        </view>
      </view>
      
      <!-- 底部返回首页按钮 -->
      <view v-if="indexSettings.showHomeButton" class="bottom-button-container">
        <button class="home-button" @click="goToIndexPage">
          <text class="home-icon">{{ indexSettings.homeButtonIcon }}</text>
          <text class="home-text">{{ indexSettings.homeButtonText }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 日历模块样式 */
.calendar-container {
  padding: 30rpx;
  background-color: #fff;
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  padding-bottom: 120rpx; /* 为底部按钮留出空间 */
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.header-title {
  .year-month {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  
  .action-btn {
    padding: 10rpx 20rpx;
    margin: 0 10rpx;
    font-size: 28rpx;
    color: #666;
    background-color: #f5f5f5;
    border-radius: 8rpx;
    
    &.today-btn {
      background-color: #fe2c55;
      color: #fff;
    }
  }
}

.weekdays {
  display: flex;
  margin-bottom: 20rpx;
  
  .weekday {
    flex: 1;
    text-align: center;
    font-size: 28rpx;
    color: #999;
    padding: 10rpx 0;
  }
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
  border-bottom: 1px solid #eee;
  padding-bottom: 20rpx;
}

.calendar-day {
  width: 14.28%;
  height: 90rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 10rpx;
  
  .day-number {
    font-size: 32rpx;
    font-weight: 500;
    height: 60rpx;
    width: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }
  
  &.inactive-day {
    .day-number {
      color: #ccc;
    }
  }
  
  &.today {
    .day-number {
      background-color: #fe2c55;
      color: #fff;
    }
  }
  
  &.selected-day {
    .day-number {
      background-color: rgba(254, 44, 85, 0.1);
      color: #fe2c55;
      border: 2rpx solid #fe2c55;
    }
  }
  
  .event-dot {
    width: 8rpx;
    height: 8rpx;
    background-color: #fe2c55;
    border-radius: 50%;
    position: absolute;
    bottom: 8rpx;
  }
}

.events-container {
  flex: 1;
  margin-top: 30rpx;
  overflow-y: auto;
}

.events-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
  
  .events-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
  }
  
  .add-event-btn {
    display: flex;
    align-items: center;
    color: #fe2c55;
    font-size: 28rpx;
    
    .add-icon {
      font-size: 36rpx;
      margin-right: 6rpx;
    }
  }
}

.add-event-form {
  background-color: #f8f8f8;
  padding: 20rpx;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  
  .event-input {
    background-color: #fff;
    height: 80rpx;
    border-radius: 8rpx;
    padding: 0 20rpx;
    margin-bottom: 20rpx;
    font-size: 28rpx;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    
    button {
      margin-left: 20rpx;
      height: 70rpx;
      line-height: 70rpx;
      font-size: 28rpx;
      border-radius: 8rpx;
    }
    
    .cancel-btn {
      background-color: #f5f5f5;
      color: #666;
    }
    
    .confirm-btn {
      background-color: #fe2c55;
      color: #fff;
    }
  }
}

.event-list {
  .event-item {
    display: flex;
    padding: 20rpx 0;
    border-bottom: 1px solid #eee;
    
    &.completed-event {
      opacity: 0.6;
      
      .event-title {
        text-decoration: line-through;
      }
    }
    
    .event-time {
      width: 120rpx;
      font-size: 28rpx;
      color: #666;
    }
    
    .event-content {
      flex: 1;
      
      .event-title {
        font-size: 30rpx;
        margin-bottom: 10rpx;
      }
      
      .event-actions {
        display: flex;
        
        text {
          font-size: 24rpx;
          padding: 4rpx 12rpx;
          border-radius: 6rpx;
          margin-right: 10rpx;
        }
        
        .complete-btn {
          background-color: #f2f8ff;
          color: #4680fe;
        }
        
        .delete-btn {
          background-color: #fff2f2;
          color: #fe4646;
        }
      }
    }
  }
}

.no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}

/* 底部返回首页按钮样式 */
.bottom-button-container {
  position: fixed;
  bottom: 30rpx;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 50rpx;
  z-index: 100;
}

.home-button {
  background: linear-gradient(135deg, #ff4081, #fe2c55);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  box-shadow: 0 6rpx 16rpx rgba(254, 44, 85, 0.3);
  transition: all 0.3s ease;
  width: 100%;
  max-width: 400rpx;
  border: none;
}

.home-button:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 8rpx rgba(254, 44, 85, 0.3);
}

.home-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.home-text {
  font-size: 32rpx;
  font-weight: 500;
}
</style>
