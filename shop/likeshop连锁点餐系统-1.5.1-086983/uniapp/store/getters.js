export default {
    themeName: state => state.decorate.config.theme || 'green_theme',
    // 主题颜色
    themeColor: state => {
        const {
            theme,
            config
        } = state.decorate
        return theme[config.theme] || '#92C73B'
    },
    userInfo: state => state.app.userInfo || {},
    token: state => state.app.token,
    isLogin: state => !!state.app.token,
    appConfig: state => state.app.config,
    shopData: state => state.location.shopData,
	location: state => state.location.location
};
