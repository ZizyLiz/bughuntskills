<template>
  <div class="login-page">
    <!-- 背景图片 -->
    <!-- <background-image></background-image> -->
    <!-- 登录面板 -->
    <div class="login-body">
      <!-- logo图片 -->
      <!-- <logo-image></logo-image> -->
      <div class="logo_big">
        <img class="logo-image" src="../assets/img/shiji-logo-v2.png" />
      </div>
      <div class="logo_small">
        <img class="logo-image" src="../assets/img/shiji-logo-white.png" />
      </div>
      <!-- 登录成功后的提示 -->
      <!-- <h1 class="succeeded" v-if="succeeded">Login succeeded</h1> -->
      <!-- <div v-else>
        登录文字
        <h1 class="login-h1">Log In Using Default Account</h1>
        登录报错提示
        <div class="notification-container notification-error">
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
        登录表单
        <div>
          <el-form ref="form" :model="form">
            用户名
            <div class="ac-field">
              <label class="label-size">{{
                $t("lang.SIGNIN.label_username")
              }}</label>
              <el-input
                required
                ref="userName"
                size="small"
                v-model="form.userName"
                placeholder="Fill"
                autocomplete="off"
              ></el-input>
            </div>
            密码
            <div class="ac-field">
              <label class="label-size">{{
                $t("lang.SIGNIN.label_password")
              }}</label>
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
              <el-checkbox size="medium" v-model="rememberPassword"
                >Remember Password</el-checkbox
              >
            </div>
            按钮
            <div>
              <button
                ref="button"
                type="submit"
                class="loginButton"
                @click="login"
              >
                Login
              </button>
            </div>
          </el-form>
          返回登录
          <div class="distance-button">
            <div class="distance-Log">
              <div>
                <router-link class="a-style" replace to="/acNormalLogin">
                  Log In Using Normal Account
                </router-link>
              </div>
              <router-link class="a-style" replace to="/sepLogin">
                Log In Using SEP Account
              </router-link>
              <div class="a-style sis-style" @click="gotoSIS">
                Log In Using SIS Account
              </div>
            </div>
          </div>
        </div>
      </div> -->
      <!-- 登录脚部 -->
      <!-- <div class="distance-button">
        <div class="distance-Log">
          <div>
            <router-link class="a-style" replace to="/acNormalLogin">
              Log In Using Normal Account
            </router-link>
          </div>
          <router-link class="a-style" replace to="/sepLogin">
            Log In Using SEP Account
          </router-link>
          <div class="a-style sis-style" @click="gotoSIS">
            Log In Using SIS Account
          </div>
        </div>
      </div> -->
      <feet></feet>
    </div>
    <!-- 加载动画 -->
    <Spinner v-show="isLoading" />
  </div>
</template>

<script>
import { mapState, mapActions, mapMutations } from "vuex";
import Spinner from "../components/Spinner.vue";
import backgroundImage from "../components/backGroundImage.vue";
import logoImage from "../components/logoImage.vue";
import feet from "../components/Feet.vue";
import {
  LOGIN_API,
  SIS_TOKEN_API,
  NORMAL_IDENTITY_TITLE,
  IDENTITY_ADDRESS,
  SEP_IDENTITY_TITLE,
} from "../../config-json.js";
const NORMAL_API = `${LOGIN_API}`;
const SIS_API = `${SIS_TOKEN_API}`;

export default {
  name: "Reset",
  components: {
    // logoImage,
    feet,
    Spinner,
  },
  data() {
    return {
      showErrorMSg: "",
      showError: false,
      succeeded: false,
      isLoading: false,
      rememberPassword: false,
      ReturnUrl: "",
      form: {
        userName: "",
        passWord: "",
      },
      returnParameter: "", // return后面带的参数
      realmNameUrl: "", // 网站的域名
      sisFlagLogin: false,
      sisCode: "",
    };
  },
  created() {
    // 获取sis的code
    this.sisCode = this.getUrlParam("code");
    // let url = "https://op-app-dev.shijicloud.com////?login=abc&hh=av";
    // console.log(url.replace(/([\w\W]+)\/$/, "$1"),'11111');

    // // 获取路径信息 (去掉连续的斜杠)
    this.ReturnUrl = this.sanitizeLoginReturnUrl(this.getUrlParam("ReturnUrl"));
    console.log(this.ReturnUrl, "returnURL");

    // 解决无限循环问题
    let circulateCurrentDate = Date.parse(new Date()) / 1000;
    let circulateLastDate = this.$cookies.get("circulateLastDate");
    let circulateNumber = this.$cookies.get("circulateNumber");
    if (circulateLastDate != null) {
      circulateNumber++;
      this.$cookies.set("circulateNumber", circulateNumber);
      if (
        circulateCurrentDate - circulateLastDate < 10 &&
        circulateNumber > 5
      ) {
        this.removeSharedAuthCookie(SEP_IDENTITY_TITLE + "-" + "SEP_access_token");
        this.$cookies.remove("circulateLastDate");
        this.$cookies.remove("circulateNumber");
      } else if (circulateCurrentDate - circulateLastDate > 10) {
        this.$cookies.set("circulateNumber", 1);
        this.$cookies.set("circulateLastDate", circulateCurrentDate);
      }
    } else {
      this.$cookies.set("circulateLastDate", circulateCurrentDate);
      this.$cookies.set("circulateNumber", 1);
    }

    if (this.ReturnUrl) {
      // 获取returnUrl后面的域名
      this.getReturnUrlDomain(this);
      // 判断多种参数情况
      this.judgeReturnParameter();
    }

    // 判断当前是哪种登录cookies
    let loginCookies = this.judgeCookies();
    if (
      loginCookies == "sepLogin" ||
      loginCookies == "localLogin" ||
      loginCookies == "shijiEmailLogin"
    ) {
      return;
    }
    // sis的登录保存token和判断

    // 判断token是否存在和过期了
    this.judgeSEPToken();

    if (!this.succeeded) {
      // 是否拿到code
      let loginCode = this.getUrlParam("code");
      console.log(loginCode, "拿到code--->>");
      if (loginCode != null) {
        let config = {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        };
        let sisUrl = encodeURIComponent(
          `${IDENTITY_ADDRESS}?ReturnUrl=${this.ReturnUrl}`
        );
        this.$httpService({
          url: `${SIS_API}`,
          config: config,
          method: "post",
          params: {
            code: loginCode,
            redirect_uri: sisUrl,
          },
        }).then((res) => {
          console.log(res, "SIS-->TOKEN-->>");
          if (res.status == 200) {
            //储存过期时间戳
            let timestamp = Date.parse(new Date());
            timestamp = timestamp / 1000;
            let SEPToken = {
              access_token: res.data.access_token,
              afterTime: timestamp + res.data.expires_in - 3600,
            };
            this.setSharedAuthCookie(
              SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
              SEPToken
            );

            let urlSlash = this.sanitizeLoginReturnUrl(this.getUrlParam("ReturnUrl"));

            console.log(urlSlash, "urlSlash");
            if (!urlSlash) {
              this.succeeded = false;
              return;
            }
            this.ReturnUrl = urlSlash;
            if (this.ReturnUrl.indexOf("?") != -1) {
              this.ReturnUrl = this.ReturnUrl.replace(/(\?|#)[^'"]*/, "");
            }
            // 储存sis的登录方式
            this.$cookies.set(`${this.realmNameUrl}_sis`, "sisLogin");
            // 删除其余登录方式
            this.$cookies.remove(`${this.realmNameUrl}_local`);
            this.$cookies.remove(`${this.realmNameUrl}_sep`);
            this.$cookies.remove(`${this.realmNameUrl}_shijiEmail`);

            // 获取token
            if (SEPToken) {
              // 去登录
              this.redirectToReturnUrlWithToken(
                SEP_IDENTITY_TITLE + "-" + "SEP_access_token",
                SEPToken
              );
            }
          }
        });
      }
    }
  },
  methods: {
    ...mapMutations("returnType", [
      "ADD_RETURN_OTHER",
      "ADD_RETURN_TENANT",
      "DELETE_RETURN_TYPE_DATA",
      "ADD_LANGUAGE_DATA",
    ]),
    ...mapMutations("judgeHash", ["ADD_PROCESS_PAGE"]),
    gotoSIS() {
      if (!this.ReturnUrl) {
        return;
      }
      let sisUrl = encodeURIComponent(
        `${IDENTITY_ADDRESS}?ReturnUrl=${this.ReturnUrl}`
      );
      window.location.href =
        "https://sisstage.shijicloud.com/auth/realms/shijiminiuat/protocol/openid-connect/auth?redirect_uri=" +
        sisUrl +
        "&client_id=shijimini&response_type=code&login=true&scope=openid&socialLogin=sep-pkce-oidc";
    },

    // 判断return后面的参数情况
    judgeReturnParameter() {
      // 获取return后面参数
      this.returnParameter = this.queryURLParams(this.ReturnUrl);
      console.log(this.returnParameter, "return后面的参数");
      if (Object.keys(this.returnParameter).length) {
        // 判断loginType
        switch (this.returnParameter.loginType) {
          // sis登录
          case "sis":
            if (!this.sisCode) {
              this.$cookies.remove(`${this.realmNameUrl}_local`);
              this.$cookies.remove(`${this.realmNameUrl}_sep`);
              this.$cookies.remove(`${this.realmNameUrl}_shijiEmail`);
              // 清空vueX数据
              this.DELETE_RETURN_TYPE_DATA();
              // 去sis登录
              this.gotoSIS();
            }
            break;

          // sep登录
          case "sep":
            this.$cookies.remove(`${this.realmNameUrl}_sis`);
            this.$cookies.remove(`${this.realmNameUrl}_local`);
            this.$cookies.remove(`${this.realmNameUrl}_shijiEmail`);
            // 清空vueX数据
            this.DELETE_RETURN_TYPE_DATA();
            this.goToSepLogin();
            break;

          // 普通的登录
          case "local":
            this.$cookies.remove(`${this.realmNameUrl}_sis`);
            this.$cookies.remove(`${this.realmNameUrl}_sep`);
            this.$cookies.remove(`${this.realmNameUrl}_shijiEmail`);
            // 清空vueX数据
            this.DELETE_RETURN_TYPE_DATA();
            this.goToAcNormalLogin();
            break;
          // 石基邮箱的登录
          case "shiji_email":
            this.$cookies.remove(`${this.realmNameUrl}_sis`);
            this.$cookies.remove(`${this.realmNameUrl}_sep`);
            this.$cookies.remove(`${this.realmNameUrl}_local`);
            // 清空vueX数据
            this.DELETE_RETURN_TYPE_DATA();
            this.goToShjiEmailLogin();
            break;
        }
        // 判断loginOther
        if (this.returnParameter.loginOther) {
          this.ADD_RETURN_OTHER(this.returnParameter.loginOther);

          // 如果剩余两个参数没有,就清除
          if (!this.returnParameter.tenant) {
            this.ADD_RETURN_TENANT("");
          }
          if (!this.returnParameter.language) {
            this.ADD_LANGUAGE_DATA("");
          }
        }
        // 判断Tenant
        if (this.returnParameter.tenant) {
          this.ADD_RETURN_TENANT(this.returnParameter.tenant);

          // 如果剩余两个参数没有,就清除
          if (!this.returnParameter.loginOther) {
            this.ADD_RETURN_OTHER("");
          }
          if (!this.returnParameter.language) {
            this.ADD_LANGUAGE_DATA("");
          }
        }
        // 判断当前的语言
        if (this.returnParameter.language) {
          this.ADD_LANGUAGE_DATA(this.returnParameter.language);

          // 如果剩余两个参数没有,就清除
          if (!this.returnParameter.loginOther) {
            this.ADD_RETURN_OTHER("");
          }
          if (!this.returnParameter.tenant) {
            this.ADD_RETURN_TENANT("");
          }
        }
      }
    },

    // 判断当前登录的cookies是哪种
    judgeCookies() {
      let loginCookies = "";
      // 获取普通登录的cookies
      let localFlag = this.$cookies.get(`${this.realmNameUrl}_local`);
      // 获取 sis的登录cookies
      let sisLoginFlag = this.$cookies.get(`${this.realmNameUrl}_sis`);
      // 获取 sep的登录cookies
      let sepFlag = this.$cookies.get(`${this.realmNameUrl}_sep`);
      // 获取 石基邮箱登录cookies
      let shijiEmailFlag = this.$cookies.get(`${this.realmNameUrl}_shijiEmail`);

      // 判断哪个cookies存在
      if (localFlag) {
        loginCookies = localFlag;
      } else if (sisLoginFlag) {
        loginCookies = sisLoginFlag;
      } else if (sepFlag) {
        loginCookies = sepFlag;
      } else if (shijiEmailFlag) {
        loginCookies = shijiEmailFlag;
      }
      console.log(loginCookies, "loginCookies");
      // switch判断当前该执行的操作
      switch (loginCookies) {
        case "localLogin":
          this.goToAcNormalLogin();
          break;
        case "sisLogin":
          if (!this.sisCode) {
            this.gotoSIS();
          }
          break;
        case "sepLogin":
          this.goToSepLogin();
          break;
        case "shijiEmailLogin":
          this.goToShjiEmailLogin();
          break;
        case "":
          this.judgeAutomatic();
          break;
      }
      return loginCookies;
    },
    // 判断第二种情况的参数(不是手动在后面加入的那个)
    judgeAutomatic() {
      if (
        !Object.keys(this.returnParameter).length ||
        !this.returnParameter.loginType
      ) {
        // 登录类型参数为空 默认SEP页面 local 代表本地的登录
        let loginType = this.getUrlParam("loginType");
        this.judgeOtherParameter();
        if (!this.sisCode) {
          if (loginType == "local") {
            this.goToAcNormalLogin();
          } else if (loginType == "shiji_email") {
            this.goToShjiEmailLogin();
          } else {
            this.goToSepLogin();
          }
        }
      }
    },
    // 判断是否有参数没有就清除
    judgeOtherParameter() {
      if (
        !this.returnParameter.tenant &&
        !this.returnParameter.loginOther &&
        !this.returnParameter.language
      ) {
        // 清空vueX数据
        this.DELETE_RETURN_TYPE_DATA();
      }
    },
    // 去不要AC的页面
    goToAcNormalLogin() {
      this.$router.replace("/acNormalLogin");
      this.ADD_PROCESS_PAGE();
    },
    // 去SEP页面
    goToSepLogin() {
      this.$router.replace("/sepLogin");
      this.ADD_PROCESS_PAGE();
    },
    // 去 SHIJI_Email页面
    goToShjiEmailLogin() {
      this.$router.replace("/shijiEmailLogin");
      this.ADD_PROCESS_PAGE();
    },
    // 判断token是否存在没过期
    judgeSEPToken() {
      //获取 token 数据
      let tokenVal = this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
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
          this.succeeded = false;
        }
      } else {
        this.succeeded = false;
      }
    },

    login() {
      if (this.form.userName != "" && this.form.passWord != "") {
        this.$refs.button.type = "button";
      } else {
        this.$refs.button.type = "submit";
      }
      let config = {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      };
      if (this.form.userName != "" && this.form.passWord != "") {
        this.isLoading = true;
        this.$httpService({
          url: `${NORMAL_API}`,
          config: config,
          method: "post",
          data: {
            username: this.form.userName,
            password: this.form.passWord,
          },
        })
          .then((res) => {
            this.isLoading = false;

            // 记住密码：
            if (this.rememberPassword == true) {
              localStorage.setItem("passWord", this.form.passWord);
              localStorage.setItem("rememberPassword", this.rememberPassword);
            } else {
              localStorage.removeItem("passWord");
              localStorage.removeItem("rememberPassword");
            }
            if (res.status == 200) {
              this.isLoading = false;
              this.succeeded = true;

              //储存过期时间戳
              let timestamp = Date.parse(new Date());
              timestamp = timestamp / 1000;
              let normalToken = {
                access_token: res.data.access_token,
                afterTime: timestamp + res.data.expires_in - 3600,
              };
              // 用cookies会话存储token
              this.setSharedAuthCookie(NORMAL_IDENTITY_TITLE, normalToken);

              // 获取token
              let tokenVal = normalToken;
              console.log("获取token---》》》", tokenVal);

              if (Object.keys(tokenVal).length > 0) {
                // console.log(access_token, "获取的access_token");
                if (this.ReturnUrl != null) {
                  this.redirectToReturnUrlWithToken(
                    NORMAL_IDENTITY_TITLE,
                    tokenVal
                  );
                }
                console.log("登录成功---->>>", res);
              }
            }

            // let access_token = localStorage.getItem("access_token");
          })
          .catch((err) => {
            let error = this.handleError(this, err);
            console.log(`==error===`, error);
            this.showError = error.showError;
            this.showErrorMSg = error.errMsg;
            this.isLoading = false;
            console.log("登录失败---->>>", err);
            this.$message.error("登录失败!");
          });
      }
    },
  },
};
</script>

<style scoped>
.sis-style {
  cursor: pointer;
}
@media (max-width: 768px) {
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
.enter-login {
  font-size: 13px;
  font-weight: 400;
}
.login-footer {
  margin-top: 150px;
  border-top: 2px solid #bdbdbd;
}
.succeeded {
  font-size: 27px;
  font-weight: 400;
  margin-bottom: 200px;
}
</style>
