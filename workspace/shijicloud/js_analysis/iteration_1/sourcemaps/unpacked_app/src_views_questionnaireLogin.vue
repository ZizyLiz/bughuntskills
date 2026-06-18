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
      <h1 class="succeeded" v-if="succeeded">Login succeeded</h1>
      <!-- 登录界面 -->
      <div v-else>
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
            <!-- 用户名 -->
            <div class="ac-field">
              <label class="label-size">用户名</label>
              <el-input
                required
                ref="userName"
                size="small"
                v-model="form.userName"
                placeholder="Fill"
                autocomplete="off"
              ></el-input>
            </div>
            <!-- 密码 -->
            <div class="ac-field">
              <label class="label-size">密码</label>
              <el-input
                required
                ref="passWord"
                size="small"
                v-model="form.passWord"
                placeholder="Fill"
                autocomplete="off"
                show-password
              ></el-input>
            </div>
            <div class="margin-bottom">
              <!-- <el-checkbox size="medium" v-model="rememberPassword"
                    >Remember Password</el-checkbox
                  > -->
            </div>
            <!-- 按钮 -->
            <div>
              <button
                ref="button"
                type="submit"
                class="loginButton"
                @click="login"
              >
                登录
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
            <div>
              <div>
                <!-- <router-link class="a-style" replace to="/changePassword">
                  修改密码
                </router-link> -->
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
import Spinner from "../components/Spinner.vue";
import backgroundImage from "../components/backGroundImage.vue";
import logoImage from "../components/logoImage.vue";
import feet from "../components/Feet.vue";
import { mapMutations } from "vuex";
import {
  TOKEN,
  TOKEN_AIP,
  SIS_TOKEN_API,
  SEP_IDENTITY_TITLE,
  IDENTITY_ADDRESS,
  Normal_TOKEN,
} from "../../config-json.js";

const SIGIN_API = `${TOKEN_AIP}`;
const SIS_API = `${SIS_TOKEN_API}`;

export default {
  name: "Main",
  components: {
    // logoImage,
    feet,
    Spinner,
  },
  data() {
    return {
      showError: false,
      showErrorMSg: false,
      succeeded: false,
      isLoading: false,
      isKeep: false,
      rememberIsKeep: false,
      rememberTenantId: false,
      rememberPassword: false,
      form: {
        TenantId: "questionnaire",
        userName: "",
        passWord: "",
      },
      signinFormData: Normal_TOKEN,
      showFeet: false,
      showErrorMessage: false,
      showSEP: false,
      showWeChatBody: false,
      expires_in: "",
      ReturnUrl: "",
      showWebView: false,
      notAcFlag: false,
    };
  },
  created() {
    // // 获取路径信息
    this.ReturnUrl = this.sanitizeLoginReturnUrl(this.getUrlParam("ReturnUrl"));
    console.log("Return-->url", this.ReturnUrl);
    console.log(window.location);
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
    // 登录类型参数 ac代表SEP
    let loginType = this.getUrlParam("loginType");
    if (loginType == "ac") {
      this.showSEP = true;
    } else {
      this.showSEP = false;
    }
    // 判断是否为权限登录的
    if (loginType == "notAc") {
      this.notAcFlag = true;
    } else {
      this.notAcFlag = false;
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
  },
  mounted() {
    // 输入框聚焦
    this.$refs.userName.focus();

    //获取 token 数据
    let tokenVal = this.$cookies.get(
      SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
    );
    if (tokenVal != null) {
      this.succeeded = true;
      let timestamp = Date.parse(new Date());
      timestamp = timestamp / 1000;
      console.log(timestamp, "当前的时间--->");
      console.log("获取数据", tokenVal);
      let expires_in = this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEPotherStorage"
      ).expires_in;
      let tenant_id = this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEPotherStorage"
      ).tenant_name;
      let username = this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEPotherStorage"
      ).username;
      if (this.ReturnUrl != null && timestamp < tokenVal.afterTime) {
        this.redirectToReturnUrlWithToken(
          SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
          tokenVal,
          {
            expires_in: expires_in,
            tenant_id: tenant_id,
            username: username,
          }
        );
      }
      if (timestamp >= tokenVal.afterTime) {
        this.removeSharedAuthCookie(SEP_IDENTITY_TITLE + "-" + "SEP_access_token");
        this.succeeded = false;
      }
    } else {
      this.succeeded = false;
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
          this.$refs.userName.focus();
        }
      });
    },
    gotoSIS() {
      if (!this.ReturnUrl) {
        return;
      }
      if (this.showWebView) {
        console.log(1111);
        this.$router.push("/appletShow");
      } else {
        let sisUrl = encodeURIComponent(
          `${IDENTITY_ADDRESS}?ReturnUrl=${this.ReturnUrl}`
        );
        window.location.href =
          "https://sisstage.shijicloud.com/auth/realms/shijiminiuat/protocol/openid-connect/auth?redirect_uri=" +
          sisUrl +
          "/&client_id=shijimini&response_type=code&login=true&scope=openid&socialLogin=sep-pkce-oidc";
      }
    },
    getForemData() {
      this.signinFormData.tenant_name = this.form.TenantId;
      this.signinFormData.username = this.form.userName;
      this.signinFormData.password = this.form.passWord;
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
                SEP_IDENTITY_TITLE + "-" + "not_ac_TenantId",
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
            this.isKeep = true;
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
            // 获取token
            let tokenVal = SEPToken;
            console.log(tokenVal, "cookies");
            console.log("获取SEP->token---》》》", tokenVal.access_token);
            if (tokenVal != null) {
              this.expires_in = res.expires_in;
              let SEPotherStorage = {
                expires_in: res.expires_in,
                tenant_name: this.signinFormData.tenant_name,
                username: this.signinFormData.username,
              };
              this.$cookies.set(
                SEP_IDENTITY_TITLE + "-" + "SEPotherStorage",
                SEPotherStorage
              );
              if (this.ReturnUrl != null) {
                this.redirectToReturnUrlWithToken(
                  SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
                  tokenVal,
                  {
                    expires_in: this.expires_in,
                    tenant_id: this.signinFormData.tenant_name,
                    username: this.signinFormData.username,
                  }
                );
              }
              console.log("登录成功---->>>", res);
              // 储存问卷登录的方式
              this.$cookies.set(
                SEP_IDENTITY_TITLE + "-" + "questionnaireTenant",
                "questionnaire"
              );
            }
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
    display: inline-block;
    padding-left: 10px;
    line-height: 19px;
    font-size: 14px;
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
