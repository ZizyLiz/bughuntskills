
import axios from 'axios'
import router from '@/router'
import SharedSession from "shared-session";
import {
  redirectToReturnUrlWithCookie,
  removeSharedAuthCookie,
  sanitizeReturnUrl,
  setSharedAuthCookie,
} from "@/utils/authRedirect";
const mixins = {
  methods: {
    // 找到hash后面的参数
    getHashSearchParam(key) {
      const url = location.href
      // 获取 hash 值，不包含 '#' 号
      const hash = url.substring(url.indexOf("#") + 1)
      // 查找 '?' 号所在的索引
      const searchIndex = hash.indexOf("?")
      // '?' 号后面接的是索引参数，如果找到则+1，去除'?' 号
      const search = searchIndex !== -1 ? hash.substring(searchIndex + 1) : ""
      // 把搜索参数字符串提过URLSearchParams转成对象形式
      const usp = new URLSearchParams(search)
      // 通过URLSearchParams自带的get方法，查询键所对应的值
      return usp.get(key)
    },

    // 拿到returnUrl后面的域名
    getReturnUrlDomain(_SELF) {
      const safeReturnUrl = sanitizeReturnUrl(_SELF.ReturnUrl);
      if (!safeReturnUrl) {
        _SELF.ReturnUrl = null;
        _SELF.realmNameUrl = "";
        console.warn("Blocked untrusted ReturnUrl");
        return;
      }
      _SELF.ReturnUrl = safeReturnUrl;
      if (_SELF.ReturnUrl.indexOf("?") != -1) {
        _SELF.realmNameUrl = _SELF.ReturnUrl.split("?")[0];
        console.log(_SELF.realmNameUrl, "当前的域名111");
      } else {
        _SELF.realmNameUrl = _SELF.ReturnUrl;
        console.log(_SELF.realmNameUrl, "当前的域名222");
      }
    },

    // 拿到链接问号后面参数
    sanitizeLoginReturnUrl(returnUrl) {
      return sanitizeReturnUrl(returnUrl);
    },

    setSharedAuthCookie(cookieName, tokenValue) {
      return setSharedAuthCookie(this.$cookies, cookieName, tokenValue);
    },

    removeSharedAuthCookie(cookieName) {
      return removeSharedAuthCookie(this.$cookies, cookieName);
    },

    redirectToReturnUrlWithToken(cookieName, tokenValue, extraParams) {
      return redirectToReturnUrlWithCookie({
        cookies: this.$cookies,
        location: window.location,
        cookieName: cookieName,
        tokenValue: tokenValue,
        returnUrl: this.ReturnUrl,
        extraParams: extraParams,
      });
    },

    queryURLParams(url) {
      let askIn = url.indexOf('?'),
        wellIn = url.indexOf('#'),
        askText = '',
        wellText = '';
      // #不存在
      wellIn === -1 ? wellIn = url.length : null;
      // ?存在
      askIn >= 0 ? askText = url.substring(askIn + 1, wellIn) : null;
      wellText = url.substring(wellIn + 1);
      let result = {};
      wellText !== '' ? result['HASH'] = wellText : null;
      if (askText !== "") {
        let ary = askText.split('&');
        ary.forEach(item => {
          let aryText = item.split('=');
          result[aryText[0]] = aryText[1];
        })
      }
      return result;
    },
    // 得到地址栏Url参数
    getUrlParam(name) {
      var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
      var r = window.location.search.substr(1).match(reg);
      if (r != null) {
        return unescape(r[2]);
      }
      return null;
    },
    // axios httpService拦截器统一 错误处理
    handleError(self, error) {
      console.log('=mixins-handleError =error=', error.response)
      let retErrMsg = {}
      if (error.response) {
        // console.log(`==error.response.status==`,error.response.status,error.response.data  )
        let errorMage = error.response.data
        //  let errMsg = JSON.parse(errorMage.msg)

        switch (error.response.status) {

          case 400:
            console.log(`==400==errorMage==`, error.response.status)
            if (errorMage.code == '500') {
              //console.log(`====errorMage==`,errorMage)
              let errMsg = JSON.parse(errorMage.msg)
              // console.log(`====errMsg==`,errMsg)
              // retErrMsg = {errCode:errorMage.code,showError:true,errMsg:errMsg.message} 
              self.errCode = errorMage.code
              self.errMsg = errMsg.message
              self.dangerModal = true
              // self.$router.push({path:'/500',query:errMsg})
            } else if (errorMage.code == 400) {
              // Bad request 错误的请求 或 invalid hostname 不存在的域名
              //  console.log(`==400==400==errorMage==`,errorMage)   
              // let errMsg = JSON.parse(errorMage.msg)
              self.errType = 'Bad Request !'
              self.showError = error.showError
              self.showErrorMSg = error.errMsg
              self.errCode = errorMage.code
              self.errMsg = errorMage.msg
              self.dangerModal = true
            }
            else {
              retErrMsg = { errCode: 400, showError: true, errMsg: self.$t('lang.SIGNIN.response_error') }
            }

            break;
          // 401: 未登录
          // 未登录则跳转登录页面，并携带当前页面的路径
          // 在登录成功后返回当前页面，这一步需要在登录页操作。
          case 401:
            console.log('401了')
            retErrMsg = { errCode: 401, showError: true, errMsg: self.$t('lang.SIGNIN.response_error') }
            //删除token
            SharedSession.removeItem("SEP_access_token");
            // retErrMsg = {showError:true,errMsg:error.response.data.error} 
            // self.LogOut(null)
            // setTimeout(() => {
            //   if (self.$router.history.current.path === '/login') {
            //     localStorage.removeItem('userName')
            //     localStorage.removeItem('password')
            //     location.reload()
            //   } else {
            //     self.$router.push({ path: '/login' })
            //   }
            // }, 1000);

            break;

          // 403 Forbidden token过期
          // 登录过期对用户进行提示
          // 清除本地token和清空vuex中token对象
          // 跳转登录页面
          case 403:
            retErrMsg = { showError: true, errMsg: 'lang.SIGNIN.response_error' }
            //  let errorMage = error.response.data 
            self.errType = 'Forbidden !'
            self.errCode = 403
            if (errorMage.code == '500') {
              //console.log(`errorMage.code--->>>`,errorMage)
              self.errMsg = errorMage.message
              self.dangerModal = true
              // self.$router.push({path:'/500',query:errMsg})
            }


            // return new Promise((resove,reject)=>{resove({err403:true,err:error.response.data})})
            // return new Promise((resove,reject)=>{
            //   reject({err403:true,err:error.response})
            //  }) 
            // 清除token
            break;

          // 404请求不存在
          case 404:
            retErrMsg = { showError: true, errMsg: 'lang.SIGNIN.response_error' }
            self.errType = 'Not Found !'
            self.errCode = 404
            self.showError = error.showError
            self.showErrorMSg = error.errMsg
            self.errMsg = errorMage.msg
            self.dangerModal = true
            // return new Promise((resove,reject)=>{
            //  reject({err404:true})
            // }) 
            break;

          case 500:
            console.log(`==500==errorMage==`, errorMage)
            self.errType = 'Internal server error !'
            self.errCode = 500
            retErrMsg = { showError: true, errMsg: 'lang.SIGNIN.response_error' }
            self.errMsg = `msg: null,traceId: ${errorMage.traceId}, data: null`
            self.dangerModal = true

            retErrMsg = { errCode: 500, showError: true, errMsg: self.$t('lang.SIGNIN.response_error') }
            // return new Promise((resove,reject)=>{
            //   reject({err500:true})
            // }) 
            break;
          // 其他错误，直接抛出错误提示
          default:


        }
        return retErrMsg
      }

      // 处理超时的情况

      let config = error.config
      // console.log(`==error.config===`,config)
      // If config does not exist or the retry option is not set, reject
      if (!config || !config.retry) return new Promise((resove, reject) => { reject(error) })

      // Set the variable for keeping track of the retry count
      config.__retryCount = config.__retryCount || 0

      // Check if we've maxed out the total number of retries
      if (config.__retryCount >= config.retry) {
        // Reject with the error
        return new Promise((resove, reject) => { reject(error) })
      }

      // Increase the retry count
      config.__retryCount += 1

      // Create new promise to handle exponential backoff
      let backoff = new Promise(function (resolve) {
        setTimeout(function () {
          resolve()
        }, config.retryDelay || 1)
      })

      // Return the promise in which recalls axios to retry the request（ajax重新请求）
      return backoff.then(function () {
        console.log(`handleError==请求失败，重试中：${config.url}`);
        return axios(config)
      })

    },
    //处理 token 过期问题
    // overdueToken(expire, token) {
    //   console.log('mixins--->>>', expire, token)
    //   //根据时间戳 判断是否过期
    //   //生成token设置时间戳
    //   let jwt_tokenTime = {
    //     token: token,
    //     time: Date.now(),
    //     expire: expire * 1000
    //   }
    //   localStorage.setItem('jwt_token', JSON.stringify(jwt_tokenTime))
    //   jwt_tokenTime = JSON.parse(localStorage.getItem('jwt_token'))
    //   if (jwt_tokenTime) {
    //     let newTime = Date.now()
    //     let oldTime = jwt_tokenTime.time
    //     let expire = jwt_tokenTime.expire
    //     let diffTime = newTime - oldTime
    //     if (diffTime > expire) {
    //       //token过期删除localStorage
    //       localStorage.removeItem('jwt_token');
    //     } else {
    //       //不过期
    //       // token = jwt_tokenTime.token
    //     }
    //   } else {
    //     router.push('/sepLogin')
    //   }
    // }
  }
}

export default mixins
