const DOMIN = 'op-api-uat-ap1.shijicloud.com'//'op-api-gateway.shijicloud.com' // RESTfulAPI服务器的 ip地址或域名 https://op-api-gateway.shijicloud.com/
const GATEWAY = '/'                // api前缀
const AC_PREFIX = 'ac/'                       // ac前缀
const PREFIX = 'lostfound/'                      // api前缀
const VERSION = 'v1'                           // 版本 
const TOKEN_PATH = 'oauth/login'
const TOKEN_LOGOUT = 'oauth/logout'
const SIS_TOKEN_PATH = 'oauth/sis/token'
const PROTOCOL = 'https'
const PORT = '443'      // '3300', // 端口； 
const AC_DOMIN_URL = ''//'https://cn1.api.uat.development.abovecloud.net.cn/'//'https://eu1.api.uat.development.abovecloud.io/'
const REGIONCODE = "cn1"
const LOGIN_PATH = 'oauth/login'
const __PORT = (PORT != '443') ? `:${PORT}` : ``
const NORMAL_IDENTITY_TITLE = 'NORMAL-uat-identity'
const SEP_IDENTITY_TITLE = 'SEP-uat_aws-identity'
const RETURN_TOKEN_NAME = 'token_name_uat_'
const IDENTITY_ADDRESS = 'https://op-identity-uat-ap1.shijicloud.com'
const WEB_LOST_FOUND_ADDRESS = 'https://op-web-uat-ap1.shijicloud.com'
const H5_APPLET_ADDRESS = 'https://op-app-uat-ap1.shijicloud.com'
const MANAGE_WEB_ADDRESS ='https://op-manage-uat-ap1.shijicloud.com'
const USER_TYPE_PREFIX = 'system/' // user接口的前缀
const __TOKEN = {
   username: '',        // 客户输入  roxanne.yao
   password: '',//  // 客户输入  '@#$Wer234'
   grant_type: 'password',
   // client_id: 'client',
   // client_secret: '123456',
   login_type: 'ac',
   tenant_name: '',   // 客户输入 dial7
   ac_client_id: 'Integ.WeChat',// 开发环境id
   //ac_client_id:'shiji.wechat_mini_app' ,// 测试||正式环境id
}
const NO_AC_Normal_TOKEN = {
   username: '',        // 客户输入  roxanne.yao
   password: '',//  // 客户输入  '@#$Wer234'
   grant_type: 'password',
   // client_id: 'client',
   // client_secret: '123456',
   tenant_name: '',   // 客户输入 dial7
   ac_client_id: 'Integ.WeChat',// 开发环境id
   //ac_client_id:'shiji.wechat_mini_app' ,// 测试||正式环境id
}
const SHIJI_EMAIL_TOKEN = {
   username: '',        // 客户输入  roxanne.yao
   password: '',//  // 客户输入  '@#$Wer234'
   grant_type: 'password',
   // client_id: 'client',
   // client_secret: '123456',
   tenant_name: '',   // 客户输入 dial7
   ac_client_id: 'Integ.WeChat',// 开发环境id
   login_type: 'shiji_email'
}
const __LOST_FOUND_CONFIG_TYPE = ['type', 'location', 'place', 'color', 'handle', 'mode', 'cmmtype', 'ids', 'setting']

const config = {
   /**
    * built-in config
    * @type {Vue config}
    **/

   RETURN_TOKEN_NAME:RETURN_TOKEN_NAME,
   IDENTITY_ADDRESS:IDENTITY_ADDRESS,
   WEB_LOST_FOUND_ADDRESS:WEB_LOST_FOUND_ADDRESS,
   H5_APPLET_ADDRESS:H5_APPLET_ADDRESS,
   MANAGE_WEB_ADDRESS:MANAGE_WEB_ADDRESS,
   NORMAL_IDENTITY_TITLE:NORMAL_IDENTITY_TITLE,
   SEP_IDENTITY_TITLE:SEP_IDENTITY_TITLE,
   LFCT: __LOST_FOUND_CONFIG_TYPE,
   REGIONCODE: REGIONCODE,
   AC_URL: AC_DOMIN_URL,
   TOKEN: __TOKEN,
   Normal_TOKEN: NO_AC_Normal_TOKEN,
   Shiji_Email_Token: SHIJI_EMAIL_TOKEN,
   HEADERS_JSON: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`
   },
   HEADERS_URLENCODED: { 'Content-Type': 'application/x-www-form-urlencoded' },
   FILE_PATH: `${PROTOCOL}://${DOMIN}`,
   AIP_GATEWAY: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}`,
   AC_API: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${AC_PREFIX}${VERSION}/`,
   AIP_PREFIX: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${PREFIX}${VERSION}/`,
   AIP_luggage_PREFIX: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}luggage/${VERSION}/`,
   FILESERVER: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}fileserver/${VERSION}/`,
   VERSION: VERSION,
   TOKEN_AIP: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${TOKEN_PATH}`,
   LOGOUT_API: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${TOKEN_LOGOUT}`,
   SIS_TOKEN_API: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${SIS_TOKEN_PATH}`,
   SIGNIN_CAPTCHA: `${PROTOCOL}://${DOMIN}${__PORT}/captcha/1`,
   SIGNUP_CAPTCHA: `${PROTOCOL}://${DOMIN}${__PORT}/captcha/0`,
   UI_IMG_URL: `${PROTOCOL}://${DOMIN}/lostfound-web/img/`,
   LOGIN_API: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${LOGIN_PATH}`,
   USER_TYPE_API: `${PROTOCOL}://${DOMIN}${__PORT}${GATEWAY}${USER_TYPE_PREFIX}${VERSION}/`,
   CURRENCY: [
      { label: 'CNY', code: 'zh-ZH' },
      { label: 'EUR', code: 'de-DE' },
      { label: 'USD', code: 'en-IN' },
      { label: 'GBP', code: 'en-US' },
      { label: 'JPY', code: 'ja-JP' }
   ],
   DEFAULT_CURRENCY: { label: 'CNY', code: 'zh-ZH' },
   LUGGAGE_PROPS: [
      'luggage_type',
      'luggage_location',
      'luggage_status',
      'luggage_color'
   ],
   PERPAGETOTALS: [10, 20, 30, 40, 50],
   UPDATEFILESIZE: 2,
   RESV_STATUS: {
      DI: "Due In",
      IH: "In-House",
      DO: "Due Out",
      CO: "Checked Out",
      RS: "Reserved"
   }
}

module.exports = config
