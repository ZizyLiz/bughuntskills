<template>
  <div class="login-page">
    <!-- 背景图片 -->
    <!-- <background-image></background-image> -->
    <!-- 登录面板 -->
    <div class="login-body" :class="{ weChatBody: showWeChatBody }">
      <!-- logo图片 -->
      <!-- <logo-image></logo-image> -->
      <div class="logo_big">
        <img class="logo-image" src="../assets/img/shiji-logo-v2.png" />
      </div>
      <div class="logo_small">
        <img class="logo-image" src="../assets/img/shiji-logo-white.png" />
      </div>
      <!-- 登录成功提示 -->
      <h1 class="succeeded" v-show="succeeded">
        <span v-show="showLanguage == 'en' || !showLanguage"
          >Login succeeded</span
        >
        <p
          style="margin-top: 20px"
          v-show="showLanguage == 'zh' || !showLanguage"
        >
          登录成功
        </p>
      </h1>
      <!-- 登录界面 -->
      <div v-show="!succeeded">
        <!-- 登录文字 -->
        <h1
          class="login-h1"
          v-show="(showLanguage == 'en' || !showLanguage) && !showTenantFlag"
        >
          Log In Using ShiJi Email Credential
        </h1>
        <h1
          class="login-h1"
          v-show="(showLanguage == 'zh' || !showLanguage) && !showTenantFlag"
        >
          使用石基邮箱凭据登录
        </h1>
        <!-- 登录报错提示 -->
        <div
          v-show="!showErrorMessage"
          class="notification-container notification-error"
        >
          <div class="alert alert-danger" v-show="showError">
            <svg
              t="1642388674564"
              class="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="6650"
              width="15"
              height="15"
            >
              <path
                d="M512 0C229.23 0 0 229.23 0 512s229.23 512 512 512c282.768 0 512-229.23 512-512C1024 229.23 794.77 0 512 0zM746.76 656.252c7.808 7.808 7.806 20.472 0.002 28.284l-62.228 62.224c-7.808 7.808-20.47 7.814-28.286 0.002L512 602.51l-144.25 144.25c-7.81 7.812-20.474 7.808-28.284 0l-62.226-62.224c-7.81-7.808-7.812-20.472 0-28.284L421.492 512l-144.25-144.25c-7.81-7.808-7.81-20.474 0-28.284l62.226-62.224c7.81-7.812 20.474-7.81 28.284 0L512 421.49l144.252-144.25c7.806-7.812 20.47-7.81 28.282 0l62.226 62.224c7.806 7.812 7.808 20.474 0 28.284L602.51 512 746.76 656.252z"
                p-id="6651"
                fill="#FF0000"
              ></path>
            </svg>

            <div class="notification-content" v-html="showErrorMSg"></div>
          </div>
        </div>
        <!-- 登录表单 -->
        <div>
          <el-form ref="form" :model="form">
            <div v-show="!showTenantFlag">
              <!-- 承租人 记住状态-->
              <div class="ac-field" v-show="judgeTenantId">
                <div>
                  <label class="label-size">
                    <span v-show="showLanguage == 'en' || !showLanguage"
                      >Selected Tenant</span
                    >
                    <span v-show="!showLanguage"> | </span>
                    <span v-show="showLanguage == 'zh' || !showLanguage"
                      >选定环境</span
                    ></label
                  >
                </div>
                <span class="tenantId_style">{{ form.TenantId }}</span>
                <a
                  style="display: inline-block; font-size: 11px"
                  href="javaScript:void(0)"
                  class="a-style"
                  @click="removeTenant"
                  ><span v-show="showLanguage == 'en' || !showLanguage"
                    >Click to Forget</span
                  ><span v-show="!showLanguage"> | </span>
                  <span v-show="showLanguage == 'zh' || !showLanguage"
                    >单击以忽略</span
                  ></a
                >
              </div>
              <!-- 承租人 没记住状态-->
              <div class="ac-field" v-show="!judgeTenantId">
                <label class="label-size">
                  <span v-show="showLanguage == 'en' || !showLanguage"
                    >Tenant</span
                  >
                  <span v-show="!showLanguage"> | </span>
                  <span v-show="showLanguage == 'zh' || !showLanguage"
                    >环境</span
                  ></label
                >
                <el-input
                  class="animation"
                  required
                  ref="TenantId"
                  size="small"
                  v-model="form.TenantId"
                  :placeholder="fillName"
                  autocomplete="off"
                ></el-input>
                <div style="height: 7px"></div>
                <div class="margin-bottom">
                  <el-checkbox
                    size="medium"
                    v-model="rememberTenantId"
                    class="check_flex_style"
                  >
                    <p v-show="showLanguage == 'en' || !showLanguage">
                      Remember Tenant on this Device
                    </p>
                    <p v-show="showLanguage == 'zh' || !showLanguage">
                      记住此设备上的环境
                    </p>
                  </el-checkbox>
                </div>
              </div>
            </div>

            <!-- 用户名 -->
            <div class="ac-field">
              <label class="label-size"
                ><span v-show="showLanguage == 'en' || !showLanguage"
                  >Login</span
                ><span v-show="!showLanguage"> | </span
                ><span v-show="showLanguage == 'zh' || !showLanguage"
                  >用户名</span
                ></label
              >
              <el-input
                required
                ref="userName"
                size="small"
                v-model="form.userName"
                :placeholder="fillName"
                autocomplete="off"
              ></el-input>
            </div>
            <!-- 密码 -->
            <div class="ac-field">
              <label class="label-size"
                ><span v-show="showLanguage == 'en' || !showLanguage"
                  >Password </span
                ><span v-show="!showLanguage"> | </span
                ><span v-show="showLanguage == 'zh' || !showLanguage"
                  >密码</span
                ></label
              >
              <el-input
                required
                ref="passWord"
                size="small"
                v-model="form.passWord"
                :placeholder="fillName"
                autocomplete="off"
                show-password
              ></el-input>
            </div>
            <div class="margin-bottom">
              <!-- <el-checkbox size="medium" v-model="rememberPassword"
                  >Remember Password</el-checkbox
                > -->
            </div>
            <!-- 保持登录 -->
            <!-- <div class="margin-bottom">
              <el-checkbox
                class="check_flex_style"
                size="medium"
                v-model="keepLoginVal"
                ><p v-show="showLanguage == 'en' || !showLanguage">
                  Stay Logged In
                </p>
                <p v-show="showLanguage == 'zh' || !showLanguage">
                  保持登录状态
                </p></el-checkbox
              >
            </div> -->

            <!-- 按钮 -->
            <div>
              <button
                ref="button"
                type="submit"
                class="loginButton"
                @click="login"
              >
                <span v-show="showLanguage == 'en' || !showLanguage">Login</span
                ><span v-show="!showLanguage"> | </span
                ><span v-show="showLanguage == 'zh' || !showLanguage"
                  >登录</span
                >
              </button>
            </div>
          </el-form>

          <!-- 重设密码和外部登录 -->
          <div v-show="!showFeet" class="distance-button">
            <!-- <div class="distance-Log">
              <router-link class="a-style" to="/reset"
                >Reset Password</router-link
              >
            </div> -->
            <div v-show="showAll">
              <div>
                <!-- <router-link
                  v-show="showPasswordFlag"
                  class="a-style"
                  replace
                  to="/changePassword"
                >
                  <span>Change Password</span><span> | </span
                  ><span>修改密码</span>
                </router-link> -->
                <div v-show="showSepFlag">
                  <router-link class="a-style" replace to="/sepLogin">
                    <span v-show="showLanguage == 'en' || !showLanguage"
                      >Login With DAYLIGHT PMS Account </span
                    ><span v-show="!showLanguage"> | </span
                    ><span v-show="showLanguage == 'zh' || !showLanguage"
                      >使用DAYLIGHT PMS帐户登录</span
                    >
                  </router-link>
                </div>
              </div>
              <div v-show="showLocal">
                <router-link class="a-style" replace to="/acNormalLogin">
                  <span v-show="showLanguage == 'en' || !showLanguage"
                    >Login With Local Account</span
                  ><span v-show="!showLanguage"> | </span
                  ><span v-show="showLanguage == 'zh' || !showLanguage"
                    >使用本地用户登录</span
                  >
                </router-link>
              </div>
              <div v-show="showSis" class="a-style sis-style" @click="gotoSIS">
                <span v-show="showLanguage == 'en' || !showLanguage"
                  >Login With SSO Account</span
                ><span v-show="!showLanguage"> | </span
                ><span v-show="showLanguage == 'zh' || !showLanguage"
                  >使用SSO帐户登录</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 登录脚部 -->
      <feet v-show="!showFeet"></feet>
    </div>
    <!-- 加载动画 -->
    <Spinner v-show="isLoading" />
  </div>
</template>

<script>
//判断当前页面环境
import wx from "weixin-js-sdk";
import { mapState } from "vuex";
import Spinner from "../components/Spinner.vue";
import backgroundImage from "../components/backGroundImage.vue";
import logoImage from "../components/logoImage.vue";
import feet from "../components/Feet.vue";
import { mapMutations } from "vuex";
import IsKeep from "../components/keepLogin.vue";
import {
  TOKEN,
  TOKEN_AIP,
  SIS_TOKEN_API,
  SEP_IDENTITY_TITLE,
  IDENTITY_ADDRESS,
  Shiji_Email_Token,
} from "../../config-json.js";

const SIGIN_API = `${TOKEN_AIP}`;
const SIS_API = `${SIS_TOKEN_API}`;

export default {
  name: "Main",
  components: {
    // logoImage,
    feet,
    Spinner,
    // IsKeep,
  },
  data() {
    return {
      showError: false,
      showErrorMSg: false,
      judgeTenantId: false,
      succeeded: false,
      isLoading: false,
      isKeep: false,
      rememberIsKeep: false,
      rememberTenantId: false,
      rememberPassword: false,
      form: {
        TenantId: "",
        userName: "",
        passWord: "",
      },
      signinFormData: Shiji_Email_Token,
      showFeet: false,
      showErrorMessage: false,
      showSEP: false,
      showWeChatBody: false,
      expires_in: "",
      ReturnUrl: "",
      showWebView: false,
      showAll: true,
      showSepFlag: true,
      showTenantFlag: false,
      showPasswordFlag: true,
      showLanguageCH: false,
      realmNameUrl: "", // 网站的域名
      fillName: "Fill | 必填",
      showSis: true,
      showLocal: true,
      refreshToken: "",
      keepLoginVal: false,
    };
  },
  created() {
    console.log(this.processPage, "this.processPage-->NoAC");
    // 判断页面是否去了处理逻辑的页面
    if (!this.processPage) {
      this.$router.replace("/");
      return;
    }

    // // 获取路径信息
    this.ReturnUrl = this.sanitizeLoginReturnUrl(this.getUrlParam("ReturnUrl"));
    if (this.ReturnUrl) {
      // 获取returnUrl后面的域名
      this.getReturnUrlDomain(this);
    }
    // 获取保持登录的状态
    this.isKeep = this.$cookies.get(SEP_IDENTITY_TITLE + "-" + "KeepLoginType");

    // 判断语言
    switch (this.showLanguage) {
      case "en":
        this.fillName = "Fill";
        break;
      case "zh":
        this.fillName = "必填";
    }
    console.log("Return-->url", this.ReturnUrl);
    console.log(window.location);

    // 判断 vueX数据
    if (this.showOther.length) {
      for (let item of this.showOther) {
        switch (item) {
          case "none":
            this.showAll = false;
            break;
          case "all":
            this.showAll = true;
            break;
          case "sep":
            this.showSis = false;
            this.showLocal = false;
            this.showSepFlag = true;
            break;
          case "sis":
            this.showLocal = false;
            this.showSepFlag = false;
            this.showSis = true;
            break;
          case "local":
            this.showSis = false;
            this.showSepFlag = false;
            this.showLocal = true;
            break;
        }
      }
    }
    // 判断有无 tenant
    if (this.showTenant) {
      this.showTenantFlag = true;
      this.form.TenantId = this.showTenant;
      // if (this.showTenant == "questionnaire") {
      //   this.showPasswordFlag = false;
      // }
    }

    // 小程序参数
    let isWeChat = this.getUrlParam("isWeChat");
    if (isWeChat == "true") {
      this.showFeet = true;
      this.showErrorMessage = true;
      this.showWeChatBody = true;
    } else {
      this.showFeet = false;
      this.showErrorMessage = false;
      this.showWeChatBody = false;
    }
    // 判断是否通过按钮登出
    let logOut = this.getUrlParam("logOut");
    // 判断小程序401
    let tokenOverdue = this.getUrlParam("tokenOverdue");
    if (logOut == "true") {
      //删除token
      this.removeSharedAuthCookie(SEP_IDENTITY_TITLE + "-" + "SEP_access_token");
    }
    if (tokenOverdue == "true") {
      //删除token
      this.removeSharedAuthCookie(SEP_IDENTITY_TITLE + "-" + "SEP_access_token");
    }
    // 判断运行的环境为小程序 webview
    let environment = this.getUrlParam("environment");
    if (environment == "webView") {
      this.showWebView = true;
    } else {
      this.showWebView = false;
    }

    // 是否拿到code
    let loginCode = this.getUrlParam("code");
    console.log("获取地址栏code-->", loginCode);

    // 输入框聚焦
    this.inputFocus();
    // 判断本地存储中有没有密码
    if (
      localStorage.getItem(SEP_IDENTITY_TITLE + "-" + "sepPassWord") != null
    ) {
      this.form.passWord = localStorage.getItem(
        SEP_IDENTITY_TITLE + "-" + "sepPassWord"
      );
      this.rememberPassword = Boolean(
        localStorage.getItem(SEP_IDENTITY_TITLE + "-" + "sepRememberPassword")
      );
    } else {
      this.form.passWord = "";
      this.rememberPassword = false;
    }
    //判断本地存储中有没有承租人
    if (
      localStorage.getItem(SEP_IDENTITY_TITLE + "-" + "shijiEmail_TenantId") !=
        null &&
      !this.showTenant
    ) {
      this.form.TenantId = localStorage.getItem(
        SEP_IDENTITY_TITLE + "-" + "shijiEmail_TenantId"
      );
      this.judgeTenantId = true;
    }
  },
  mounted() {
    // 输入框聚焦
    this.$refs.userName.focus();

    //获取 token 数据
    let tokenVal = this.$cookies.get(
      SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
    );

    // 获取 refresh_token数据
    this.refreshToken = this.$cookies.get(
      SEP_IDENTITY_TITLE + "-" + "refreshToken"
    );

    if (tokenVal != null) {
      let timestamp = Date.parse(new Date());
      timestamp = timestamp / 1000;
      console.log(timestamp, "当前的时间--->");
      console.log("获取数据", tokenVal);

      if (this.ReturnUrl != null && timestamp < tokenVal.afterTime) {
        this.succeeded = true;
        this.redirectToReturnUrlWithToken(
          SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
          tokenVal
        );
      }
      if (timestamp >= tokenVal.afterTime) {
        this.removeSharedAuthCookie(SEP_IDENTITY_TITLE + "-" + "SEP_access_token");

        this.judgeKeepLogin();
      }
    } else {
      this.judgeKeepLogin();
    }
  },

  methods: {
    ...mapMutations("validate", [
      "setToken",
      "SetExpiresIn",
      "SetTokenTimeStamp",
      "SetUserName",
      "SetPassword",
      "setTenantId",
      "SetUserId",
      "SetLoginedUser",
      "SetPermission",
      "setLogined",
    ]),
    inputFocus() {
      this.$nextTick(() => {
        //正确写法
        if (!this.succeeded) {
          if (!this.form.TenantId) {
            this.$refs.TenantId.focus();
          }
          if (this.judgeTenantId) {
            this.$refs.userName.focus();
          }
        }
      });
    },
    gotoSIS() {
      if (!this.ReturnUrl) {
        return;
      }
      // 判断属于那个环境下
      let ua = window.navigator.userAgent.toLowerCase();
      let that = this;
      // console.log(ua,'uuuu')
      if (ua.match(/MicroMessenger/i) == "micromessenger") {
        console.log("微信环境");
        //微信环境下
        wx.miniProgram.getEnv(function (res) {
          if (res.miniprogram) {
            // 小程序环境下逻辑
            console.log("小程序环境下");
            that.$router.push("/appletShow");
          } else {
            //非小程序环境下逻辑
            console.log("非小程序环境下");
            let sisUrl = encodeURIComponent(
              `${IDENTITY_ADDRESS}?ReturnUrl=${that.ReturnUrl}`
            );
            window.location.href =
              "https://sisstage.shijicloud.com/auth/realms/shijiminiuat/protocol/openid-connect/auth?redirect_uri=" +
              sisUrl +
              "&client_id=shijimini&response_type=code&login=true&scope=openid&socialLogin=sep-pkce-oidc";
          }
        });
      } else {
        console.log("浏览器环境");
        let sisUrl = encodeURIComponent(
          `${IDENTITY_ADDRESS}?ReturnUrl=${that.ReturnUrl}`
        );
        window.location.href =
          "https://sisstage.shijicloud.com/auth/realms/shijiminiuat/protocol/openid-connect/auth?redirect_uri=" +
          sisUrl +
          "&client_id=shijimini&response_type=code&login=true&scope=openid&socialLogin=sep-pkce-oidc";
      }
    },
    // isNo() {},
    // isYes() {},
    removeTenant() {
      // 点击清除 sepTenantId
      localStorage.removeItem(SEP_IDENTITY_TITLE + "-" + "shijiEmail_TenantId");
      this.form.TenantId = "";
      this.judgeTenantId = false;
      // 输入框聚焦
      this.inputFocus();
    },
    getForemData() {
      this.signinFormData.tenant_name = encodeURIComponent(this.form.TenantId);
      this.signinFormData.username = encodeURIComponent(this.form.userName);
      this.signinFormData.password = encodeURIComponent(this.form.passWord);
    },
    login() {
      //console.log('---文字-->>',this.$t('lang.SIGNIN.label_tenant'))
      if (
        this.form.TenantId != "" &&
        this.form.userName != "" &&
        this.form.passWord != ""
      ) {
        // console.log(this.$refs.button.type)
        this.$refs.button.type = "button";
      } else {
        this.$refs.button.type = "submit";
      }
      let config = {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      };
      if (
        this.form.TenantId != "" &&
        this.form.userName != "" &&
        this.form.passWord != ""
      ) {
        this.getForemData();
        this.isLoading = true;
        this.$httpServiceSEP({
          url: `${SIGIN_API}`,
          config: config,
          method: "post",
          data: this.signinFormData,
        })
          .then((res) => {
            //console.log(this.signinFormData,'查看--->')
            // 记住承租人
            if (this.rememberTenantId == true) {
              localStorage.setItem(
                SEP_IDENTITY_TITLE + "-" + "shijiEmail_TenantId",
                this.form.TenantId
              );
              // localStorage.setItem("sepRememberTenantId", this.rememberTenantId);
            }
            // 记住密码：
            if (this.rememberPassword == true) {
              localStorage.setItem(
                SEP_IDENTITY_TITLE + "-" + "sepPassWord",
                this.form.passWord
              );
              localStorage.setItem(
                SEP_IDENTITY_TITLE + "-" + "sepRememberPassword",
                this.rememberPassword
              );
            } else {
              localStorage.removeItem(SEP_IDENTITY_TITLE + "-" + "sepPassWord");
              localStorage.removeItem(
                SEP_IDENTITY_TITLE + "-" + "sepRememberPassword"
              );
            }
            this.isLoading = false;
            this.succeeded = true;
            //储存过期时间戳
            let timestamp = Date.parse(new Date());
            timestamp = timestamp / 1000;
            let SEPToken = {
              access_token: res.access_token,
              afterTime: timestamp + res.expires_in - 3600,
            };
            this.setSharedAuthCookie(
              SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
              SEPToken
            );

            // 如果保持登录存在
            if (this.keepLoginVal) {
              // 存当前的保持登录状态
              this.$cookies.set(
                SEP_IDENTITY_TITLE + "-" + "KeepLoginType",
                this.keepLoginVal
              );

              // 存当前的refresh_token
              this.$cookies.set(
                SEP_IDENTITY_TITLE + "-" + "refreshToken",
                res.refresh_token
              );
            } else {
              // 清除保持登录状态
              this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "KeepLoginType");
              // 清除refresh_token
              this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "refreshToken");
            }

            console.log("登录成功---->>>", res);
            // 储存石基邮箱登录的登录方式
            this.$cookies.set(
              `${this.realmNameUrl}_shijiEmail`,
              "shijiEmailLogin"
            );
            // 删除其余登录方式
            this.$cookies.remove(`${this.realmNameUrl}_sis`);
            this.$cookies.remove(`${this.realmNameUrl}_sep`);
            this.$cookies.remove(`${this.realmNameUrl}_local`);

            // 去登录
            this.GoToReturnLogin();
          })
          .catch((err) => {
            console.log("查看err--->", err);
            let error = this.handleError(this, err);
            console.log(`==error===`, error);
            this.showError = error.showError;
            this.showErrorMSg = error.errMsg;
            this.isLoading = false;
            console.log("登录失败---->>>", err);
            if (this.showErrorMessage) {
              this.$notify.error({
                title: "登录失败",
              });
            }
          });
      }

      // console.log("TenantId--->>", this.form.TenantId);
      // console.log(1111);
    },
    // 获取保持登录的状态
    getIsKeepData(data) {
      console.log(data, "保持登录状态");
      if (data) {
        // 储存保持登录状态
        this.$cookies.set(`${this.realmNameUrl}_KeepLogin`, data);

        this.GoToReturnLogin();
      }
    },
    // 判断是否有保持登录
    judgeKeepLogin() {
      // 如果有保持登录
      if (this.isKeep && this.refreshToken) {
        let config = {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        };
        this.isLoading = true;
        // 调用refresh_token接口
        this.$httpServiceSEP({
          url: `${SIGIN_API}?grant_type=refresh_token&refresh_token=${this.refreshToken}&client_id=client&client_secret=123456`,
          method: "post",
          config: config,
        })
          .then((res) => {
            this.succeeded = true;
            //储存过期时间戳
            let timestamp = Date.parse(new Date());
            timestamp = timestamp / 1000;
            let SEPToken = {
              access_token: res.access_token,
              afterTime: timestamp + res.expires_in - 3600,
            };
            this.setSharedAuthCookie(
              SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
              SEPToken
            );

            // 跳转登录
            this.GoToReturnLogin();
          })
          .catch((err) => {
            console.log("查看err--->", err);
            let error = this.handleError(this, err);
            console.log(`==error===`, error);
            this.showError = error.showError;
            this.showErrorMSg = error.errMsg;
            this.isLoading = false;
            console.log("登录失败---->>>", err);
            if (this.showErrorMessage) {
              this.$notify.error({
                title: "登录失败",
              });
            }
          });
      } else {
        this.succeeded = false;
      }
    },

    // 跳转登录
    GoToReturnLogin() {
      this.isLoading = false;
      this.succeeded = true;
      // 获取token
      let tokenVal = this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
      );
      // 跳转到登录
      if (this.ReturnUrl != null) {
        this.redirectToReturnUrlWithToken(
          SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
          tokenVal
        );
      }
    },
  },
  computed: {
    ...mapState("returnType", ["showOther", "showTenant", "showLanguage"]),
    ...mapState("judgeHash", ["processPage"]),
  },
};
</script>

<style scoped>
.sis-style {
  cursor: pointer;
}
@media (max-width: 768px) {
  .weChatBody {
    justify-content: space-evenly !important;
  }
  .tenantId_style {
    font-size: 16px;
    font-weight: 600;
    margin-right: 15px;
    color: #ffff;
  }
  .login-page {
    background: url("../assets/img/applet.jpg") no-repeat;
    background-position: center;
    height: 100%;
    width: 100%;
    background-size: cover;
    position: fixed;
  }
  .login-h1 {
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 8px;
    color: #ffff;
  }
  .label-size {
    display: inline-block;
    order: 0;
    margin: 4px 0;
    font-size: 13px;
    line-height: 1.27;
    color: #ffff;
  }
  .el-checkbox {
    /* display: inline-block;
    padding-left: 10px;
    line-height: 19px;
    font-size: 14px; */
    color: #ffff !important;
  }
  .ac-field {
    padding: 5px 0;
    flex-direction: column;
    text-align: left;
  }
  .logo_big {
    display: none;
  }
  .logo_small {
    width: 84px;
    height: 44px;
    box-sizing: border-box;
    margin-bottom: 16px;
  }
}
@media (min-width: 768px) {
  .logo_small {
    display: none;
  }
  .tenantId_style {
    font-size: 16px;
    font-weight: 600;
    margin-right: 15px;
  }
  .logo_big {
    width: 84px;
    height: 44px;
    box-sizing: border-box;
    margin-bottom: 16px;
  }
  .login-page {
    background: url("../assets/img/web.jpg") no-repeat;
    background-position: center;
    height: 100%;
    width: 100%;
    background-size: cover;
    position: fixed;
  }
  .login-page .login-body {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 500px;
    height: auto;
    min-height: 660px;
    max-height: 95vh;
    transform: translate(-50%, -50%);
    overflow-y: auto;
    padding: 40px 48px;
    box-shadow: 0 1px 4px rgb(0 0 0 / 50%);
  }
}
.p-style {
  font-size: 11px;
}
.buttonFlex {
  display: flex;
  margin-bottom: 200px;
  font-weight: 400;
}
.noButton {
  background: #c8ced3;
  width: 120px;
  height: 32px;
  color: #ffff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  margin-top: 8px;
  outline: 0;
  border: 0;
  margin-right: 20px;
}
.noButton:hover {
  background: #71a6d6;
  color: #ffff;
  cursor: pointer;
  transition: all linear 0.1s;
}
.yesButton {
  background: #0c3c6b;
  width: 120px;
  height: 32px;
  color: #ffff;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 400;
  margin-top: 8px;
  outline: 0;
  border: 0;
}
.yesButton:hover {
  cursor: pointer;
}
.succeeded {
  font-size: 27px;
  font-weight: 400;
  margin-bottom: 200px;
}
</style>
