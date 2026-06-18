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
      <div>
        <!-- 登录文字 -->
        <div class="login-text">
          <h1 class="login-h1" v-show="showLanguage == 'en' || !showLanguage">
            Log Out Completed.
          </h1>
          <h1 class="login-h1" v-show="showLanguage == 'zh' || !showLanguage">
            注销已完成.
          </h1>
          <div v-show="showLanguage == 'en' || !showLanguage">
            Please close the browser tab.
          </div>
          <div v-show="showLanguage == 'zh' || !showLanguage">
            请关闭浏览器选项卡.
          </div>
        </div>
      </div>
      <!-- 按钮 -->
      <div>
        <button
          ref="button"
          type="submit"
          class="loginButton"
          @click="goToLogin"
          style="width: 150px"
        >
          <span v-show="showLanguage == 'en' || !showLanguage">Go to login</span
          ><span v-show="!showLanguage"> | </span
          ><span v-show="showLanguage == 'zh' || !showLanguage">转到登录</span>
        </button>
      </div>
      <!-- 登录脚部 -->
      <feet></feet>

      <!-- 加载动画 -->
      <Spinner v-show="isLoading" />
    </div>
  </div>
</template>

<script>
import Spinner from "../components/Spinner.vue";
import { mapState } from "vuex";
import feet from "../components/Feet.vue";
import { LOGOUT_API } from "../../config-json.js";
const LOGOUT = `${LOGOUT_API}`;
import {
  SEP_IDENTITY_TITLE,
  RETURN_TOKEN_NAME,
  IDENTITY_ADDRESS,
  WEB_LOST_FOUND_ADDRESS,
  H5_APPLET_ADDRESS,
  NORMAL_IDENTITY_TITLE,
  MANAGE_WEB_ADDRESS,
} from "../../config-json.js";
export default {
  name: "Reset",
  components: {
    // logoImage,
    feet,
    Spinner,
  },
  data() {
    return {
      web_access_token_flag: false,
      applet_access_token_flag: false,
      manage_web_access_token_flag: false,
      isLoading: false,
      tokenExceed: false,
    };
  },
  created() {
    this.isLoading = true;
    // 清除保持登录状态
    this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "KeepLoginType");
    // 清除refresh_token
    this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "refreshToken");

    // 判断token是否过期
    this.judgeTokenTime();

    if (this.tokenExceed) {
      // 如果token过期
      if (this.applyTokenObj.web_access_token) {
        this.web_access_token_flag = true;
      } else if (this.applyTokenObj.applet_access_token) {
        this.applet_access_token_flag = true;
      } else if (this.applyTokenObj.manage_web_access_token) {
        this.manage_web_access_token_flag = true;
      }
      this.isLoading = false;
    } else {
      // 判断xueX token对象是否不为空对象
      if (Object.keys(this.applyTokenObj).length) {
        // 删除 cookies存的 token
        this.removeSharedAuthCookie(SEP_IDENTITY_TITLE + "-" + "SEP_access_token");

        // 判断各token
        if (this.applyTokenObj.web_access_token) {
          // web token
          this.logOffToken(this.applyTokenObj.web_access_token, "web_token");
        } else if (this.applyTokenObj.applet_access_token) {
          // h5 token
          this.logOffToken(this.applyTokenObj.applet_access_token, "app_token");
        } else if (this.applyTokenObj.manage_web_access_token) {
          // 权限管理 token
          this.logOffToken(
            this.applyTokenObj.manage_web_access_token,
            "manage_token"
          );
        }
      }
    }
  },
  mounted() {},
  computed: {
    ...mapState("returnType", ["showOther", "showTenant", "showLanguage"]),
    ...mapState("applyToken", ["applyTokenObj"]),
  },
  methods: {
    goToLogin() {
      if (this.web_access_token_flag) {
        window.location = `${WEB_LOST_FOUND_ADDRESS}`;
      }
      if (this.applet_access_token_flag) {
        window.location = `${H5_APPLET_ADDRESS}`;
      }
      if (this.manage_web_access_token_flag) {
        window.location = `${MANAGE_WEB_ADDRESS}`;
      }
      // this.deleteCookies()
    },
    // 清空cookies
    // deleteCookies() {
    //   this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "sepLogin");
    //   this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "localLogin");
    //   this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "sisLogin");
    //   this.$cookies.remove(SEP_IDENTITY_TITLE + "-" + "SEPotherStorage");
    // },

    // 退出登录发请求注销token
    logOffToken(tokenName, tokenCode) {
      let config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenName}`,
        },
      };
      this.$httpService({
        url: `${LOGOUT}`,
        method: "post",
        config: config,
      })
        .then((res) => {
          //if (res.status == 200) {
          console.log("logOut-->", res);
          switch (tokenCode) {
            case "web_token":
              this.web_access_token_flag = true;
              break;
            case "app_token":
              this.applet_access_token_flag = true;
              break;
            case "manage_token":
              this.manage_web_access_token_flag = true;
              break;
          }
          //}
          this.isLoading = false;
        })
        .catch((err) => {
          console.log("logOut-->err", err);
          this.isLoading = false;
        });
    },

    // 判断当前token时间是否过期
    judgeTokenTime() {
      //获取 token 数据
      let tokenVal = this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
      );
      // 当前的时间
      let timestamp = Date.parse(new Date());
      timestamp = timestamp / 1000;
      if (tokenVal) {
        if (timestamp >= tokenVal.afterTime) {
          // token 已过期
          this.tokenExceed = true;
        }
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
  .login-text {
    height: 15rem;
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
  .login-text {
    height: 15rem;
  }
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
    justify-content: space-between;
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
