import Vue from 'vue'
// 引入 ElementUI
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
// // rem转换器
// import 'lib-flexible'
// 引入混入公共方法
import mixins from './mixins/mixin'
Vue.mixin(mixins)
// 引入配置好的 axios
import httpService from '../axiosConfig.js'

// 引入 cookies
import VueCookies from "vue-cookies";
Vue.use(VueCookies);
VueCookies.config("会话");


// 引入SEPAxios
import httpServiceSEP from '../axiosSEPConfig'
// 引入表单验证器
// import Vuelidate from 'vuelidate'
// 引入国际化
import VueI18n from 'vue-i18n';
Vue.use(VueI18n);
const i18n = new VueI18n({
  locale: 'en',
  messages: {
    'zh': require('./locales/zh-CN'),
    'en': require('./locales/en-US'),
    'tw': require('./locales/zh-TW'),
  },
  // 隐藏警告
  silentTranslationWarn: true
});
import App from './App.vue'
import router from './router'
import store from './store'
// // 引入cookies
// import VueCookies from 'vue-cookies'
// Vue.prototype.cookie = VueCookies
Vue.prototype.$httpService = httpService //全局注册，使用方法为:this.$httpService
Vue.prototype.$httpServiceSEP = httpServiceSEP //SEP 单独的
Vue.config.productionTip = false
Vue.use(ElementUI);
// Vue.use(Vuelidate)
// 引入剪贴板
import VueClipboard from 'vue-clipboard2'

Vue.use(VueClipboard)

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
