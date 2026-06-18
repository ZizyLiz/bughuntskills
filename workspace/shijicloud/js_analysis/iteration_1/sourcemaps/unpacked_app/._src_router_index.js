import Vue from 'vue'
import VueRouter from 'vue-router'

// 引入 SEP 登录页面
import SEPLogin from '../views/SEPLogin'

// 引入重置密码页面
import ChangePassword from '../views/ChangePassword'

// 引入退出中转页面
import LogOut from '../views/LogOut'

// 引入 普通登录页面
import NormalLogin from '../views/NormalLogin'

// 引入 退出登录页面
import TransFerLogOut from '../views/transferLogOut'

// 引入 小程序复制链接页面
import AppletShow from '../views/AppletShow'

// 引入 不用ac的普通登录
import ACNormalLogin from '../views/ACNormalLogin'

// 引入问卷的登录页面
import QuestionnaireLogin from '../views/questionnaireLogin'

// 引入shiti email登录页面
import shijiEmailLogin from '../views/shijiEmailLogin'


Vue.use(VueRouter)

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'NormalLogin',
    component: NormalLogin,
  },
  {
    path: '/changePassword',
    name: 'ChangePassword',
    component: ChangePassword
  },
  {
    path: '/sepLogin',
    name: 'SEPLogin',
    meta: {
      requiresAuth: true
    },
    component: SEPLogin
  },
  {
    path: '/logout',
    name: 'LogOut',
    component: LogOut
  },
  {
    path: '/transfer',
    name: 'TransFerLogOut',
    component: TransFerLogOut
  },
  {
    path: '/appletShow',
    name: 'AppletShow',
    component: AppletShow
  },
  {
    path: '/acNormalLogin',
    name: 'ACNormalLogin',
    component: ACNormalLogin
  },
  {
    path: '/questionnaireLogin',
    name: 'QuestionnaireLogin',
    component: QuestionnaireLogin
  },
  {
    path: '/shijiEmailLogin',
    name: 'shijiEmailLogin',
    component: shijiEmailLogin
  },
]



const router = new VueRouter({
  base: process.env.BASE_URL,
  routes
})
// 拦截判断是否有token
const isToken = localStorage.getItem('access_token')
// router.beforeEach((to, from, next) => {
//   if (to.meta.requiresAuth) { // 判断该路由是否需要登录权限
//     if (isToken) { // 通过本地存储获取当前的token是否存在
//       next();
//     }
//     else {
//       next({
//         path: '/login',
//         // query: {redirect: to.fullPath} // 将跳转的路由path作为参数，登录成功后跳转到该路由
//       })
//     }
//   }
//   else {
//     next();
//   }
// });


export default router
