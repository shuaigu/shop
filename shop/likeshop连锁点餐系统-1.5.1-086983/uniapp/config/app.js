// 开发者环境：开|关	【注：方便微信小程序发行测试】
const SWITCH_DEVELOPMENT = false;

/** S 是否H5端 **/
// #ifdef H5
const IS_H5 = true;
// #endif

// #ifndef H5
const IS_H5 = false;
// #endif
/** E 是否H5端 **/

/** S API BaseURL **/
const baseURLMap = {
	// 开发环境 - 修改为您的后端地址
	development: "http://localhost/server/public",  // 本地开发地址
	// 生产环境 - 修改为您的线上服务器地址
	production: "https://shop.jingle0350.cn",
};

const baseURL = SWITCH_DEVELOPMENT ?
	baseURLMap["development"] :
	baseURLMap["production"];
/** E API BaseURL **/

// 打印当前使用的API地址，方便调试
console.log('📡 当前API地址:', baseURL);

module.exports = {
	version: "1.5.1", // 版本号
	baseURL, // API Base URL
};