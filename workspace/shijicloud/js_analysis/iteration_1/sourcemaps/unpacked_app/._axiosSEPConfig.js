import axios from 'axios'
import qs from 'qs'
import store from '@/store'

axios.defaults.timeout = 50000

//创建实列
let httpService = axios.create({
    // 这个里面可以设置一些请求头之类的配置 
    // timeout: 1000 * 12,
     headers: { 'Content-Type': 'application/x-www-form-urlencoded'}
  })

  //全局默认配置
  httpService.defaults.retry = 4
  httpService.defaults.retryDelay = 1000
  
  // A request interceptor
httpService.interceptors.request.use(config => {
    config.data = config.data || {};
    // 可以在这里添加全局统一的关卡  比如说token userid等等   
    // 判断是否拥有登录有则添加到请求参数中去 也就是 data中去  这样只要请求就会带   
    // userid 与token，就不需要再在每个接口中写全局统一的参数
    // console.log(`==httpService==config.headers=`,config.config.headers['AC-Property-ID'])

    // const token = store.state.validate.token
    // token && (config.headers.Authorization = `Bearer ${token}`)
    config.headers = config.config.headers

    // 在headers中添加配置AC-Property-ID
   // config.headers['AC-Property-ID'] = config.config.headers['AC-Property-ID']

    if (config.method.toLocaleLowerCase() === 'post') {
        //把一个参数对象序列化为一个字符串
        config.data = qs.stringify(config.data, { encode: false })
    }

    //  最后return config
    return config

}, error => {
    // Do something with request error
    // console.log(error) // for debug
    console.log(`=httpService=res==555=`, error)
    return new Promise((resove, reject) => { reject(error) })
}
)

// A response interceptor
httpService.interceptors.response.use( response => {
  //拦截响应，做统一处理 
   const res = response 
   if(res.status === 200 || res.status === 204){
       return new Promise((resove,reject)=>{resove(res.data)})
   }
  console.log(`=httpService=res===`,res)
  // 请求成功,但是接口报错
  if (!res.result) {
  // 根据返回的错误码可以做一些响应的处理
    if (res.errorCode === 10001) {
    // 处理代码
    } else if (res.errorCode === 90000) {
    // 处理代码
    }
   // 没有响应代码处理  可以返回一个Promise对象
  //===  return Promise.reject({
  //===     code: res.errorCode,
  //===     msg: res.txtMessage
  //===   });
  } else {
    return res;
  }
},
 // 请求失败在error中显示出来 并返回错误
 // 请求拦截其中也有error  一般用不到
error => {
 // console.log( `====error.response=====`,error.response)
     return new Promise((resove,reject)=>{reject(error)})
  }
)

export default httpService
