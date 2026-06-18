import axios from 'axios'
import qs from 'qs'
import store from '@/store'
import SharedSession from "shared-session";
import { Notification } from 'element-ui'
axios.defaults.timeout = 50000

//创建实列
let httpService = axios.create({
    // 这个里面可以设置一些请求头之类的配置 
    // timeout: 1000 * 12,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
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

//响应拦截
httpService.interceptors.response.use(response => {
    //接收到响应数据并成功后的一些共有处理,关闭loading等
    //console.log(response,'响应拦截')
    return response
}, error => {
    //  接收到异常响应的处理开始
    if (error && error.response) {
        console.log(error.response, 'error.response')

        //1.公共错误处理
        //2,。根据响应码具体处理
        switch (error.response.status) {
            case 400:

                Notification.error({
                    title: 'error',
                    message: 'Bad Request'
                });
                break;
            case 401:
                error.message = '未授权，请重新登录'
                break;
            case 403:
                Notification.error({
                    title: 'error',
                    message: 'Forbidden'
                });
                break;
            case 404:
                Notification.error({
                    title: 'error',
                    message: 'Not Found'
                });
                break;
            case 405:
                error.message = "请求方法未允许"
                break;
            case 408:
                error.message = '请求超时'
                break;
            case 500:
                if (error.response.data.msg) {
                    Notification.error({
                        title: 'error',
                        message: error.response.data.msg
                    });
                } else {
                    Notification.error({
                        title: 'error',
                        message: 'Internal Server Error'
                    });
                }

                break;
            case 501:
                error.message = '网络未实现'
                break;
            case 502:
                error.message = '网路错误'
                break;
            case 503:
                error.message = '服务不可用'
                break;
            case 504:
                error.message = '网络超时'
                break;
            case 505:
                error.message = 'http版本不支持该请求'
                break;
            default:
                error.message = `链接错误${error.response.status}`
        }
    } else {
        //超时处理
        if (JSON.stringify(error).includes('timeout')) {
            console.log('服务器响应超时，请刷新当前页')
        }
        error.message('连接服务器失败')
    }
    console.log(error.response)
    return Promise.resolve(error.response)
})

export default httpService