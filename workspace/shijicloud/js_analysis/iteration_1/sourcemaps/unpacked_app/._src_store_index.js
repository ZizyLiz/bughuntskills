import Vue from 'vue'
import Vuex from 'vuex'
import { RETURN_TOKEN_NAME } from '../../config-json.js'
// 引入vuex持久化存储插件
import createPersistedState from 'vuex-persistedstate'
// 引入return参数模块
import returnType from './modules/returnType'
// 引入 applyToken模块
import applyToken from './modules/applyToken'
// 引入登录的模型
import validate from './modules/validate'
// 引入哈希路由的判断
import judgeHash from './modules/judgeHash.js'

Vue.use(Vuex)
console.log(RETURN_TOKEN_NAME, 'RETURN_TOKEN_NAME')

//创建仓库 store 
const store = new Vuex.Store({
  modules: {
    validate,
    returnType,
    applyToken,
    judgeHash
  },
  plugins: [
    createPersistedState({
      key: `${RETURN_TOKEN_NAME}_Return`,// 存数据的key名   自定义的  要有语义化
      storage: window.sessionStorage,
      paths: ['returnType']
    }),
    createPersistedState({
      key: `${RETURN_TOKEN_NAME}_Token`,// 存数据的key名   自定义的  要有语义化
      storage: window.sessionStorage,
      paths: ['applyToken']
    }),
  ]

})
//导出仓库
export default store
