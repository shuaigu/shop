import theme from '@/uni.scss'
import {
	THEME_CONFIG
} from '@/config/cachekey';
import Cache from '@/utils/cache'
import {
	apiDecorateConfig
} from '@/api/store'
const state = {
	theme: theme,
	config: Cache.get(THEME_CONFIG) || {}
};

const mutations = {
	setDecorateConfig(state, data) {
		state.config = data
		Cache.set(THEME_CONFIG, data);
	},
};

const actions = {
	getDecorateConfig({
		state,
		commit
	}) {
		apiDecorateConfig().then(res => {
			commit('setDecorateConfig', res.data)
		})
	}
};

export default {
	state,
	mutations,
	actions
};
