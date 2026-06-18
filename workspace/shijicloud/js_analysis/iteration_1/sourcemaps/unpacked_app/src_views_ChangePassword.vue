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
        <!-- 忘记密码文字 -->
        <h1 class="login-h1">重置您的密码</h1>
        <!-- 登录表单 -->
        <div>
          <!-- 阻止表单的自动提交 -->
          <el-form ref="form" @submit.native.prevent>
            <!-- 原密码 -->
            <div class="ac-field">
              <label class="label-size">原始密码</label>
              <el-input
                required
                size="small"
                placeholder="必填"
                autocomplete="off"
                show-password
                v-model="originalPassword"
              ></el-input>
            </div>
            <!-- 新密码 -->
            <div class="ac-field">
              <label class="label-size">新的密码</label>
              <el-input
                required
                size="small"
                placeholder="必填"
                autocomplete="off"
                show-password
                v-model="newPassword"
                @input="verifyFocus"
              ></el-input>
            </div>
            <!-- 确认新密码 -->
            <div class="ac-field">
              <label class="label-size">确认密码</label>
              <el-input
                required
                size="small"
                placeholder="必填"
                autocomplete="off"
                show-password
                v-model="confirmPassword"
                @input="verifyPassword"
              ></el-input>
            </div>
            <!-- 密码验证是否一致提示 -->
            <div>
              <el-alert
                v-if="PasswordVerification == 1"
                title="两次输入的密码不一致"
                type="error"
                center
                show-icon
                :closable="false"
              >
              </el-alert>
              <el-alert
                v-if="PasswordVerification == 2"
                title="两次输入的密码一致"
                type="success"
                center
                show-icon
                :closable="false"
              >
              </el-alert>
            </div>
            <div class="margin-bottom"></div>
            <!-- 按钮 -->
            <div>
              <button
                ref="button"
                type=""
                class="loginButton"
                @click="changePassword"
              >
                修改密码
              </button>
            </div>
          </el-form>
          <!-- 返回登录 -->
          <div class="distance-button">
            <div class="distance-Log">
              <span class="a-style" @click="goToLogin"> 去登录 </span>
            </div>
          </div>
        </div>
      </div>
      <!-- 登录脚部 -->
      <feet></feet>
    </div>
    <!-- 加载动画 -->
    <Spinner v-show="isLoading" />
  </div>
</template>

<script>
import Spinner from "../components/Spinner.vue";
import feet from "../components/Feet.vue";
import { USER_TYPE_API, SEP_IDENTITY_TITLE } from "../../config-json.js";
import { Notification } from "element-ui";
// 修改密码API
const CHANGE_PASSWORD_API = `${USER_TYPE_API}`;

export default {
  name: "",
  components: {
    Spinner,
    feet,
  },
  data() {
    return {
      originalPassword: "",
      newPassword: "",
      confirmPassword: "",
      PasswordVerification: false,
      // 获取当前登录的token
      sepToken: this.$cookies.get(
        SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
      ),
      isLoading: false,
    };
  },
  created() {},
  mounted() {},
  methods: {
    // 修改密码
    changePassword() {
      console.log("修改密码--->>");
      if (
        this.originalPassword &&
        this.newPassword &&
        this.confirmPassword != "" &&
        this.newPassword === this.confirmPassword
      ) {
        this.isLoading = true;
        if (this.sepToken) {
          let config = {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.sepToken.access_token}`,
            },
          };
          this.$httpService({
            url: `${CHANGE_PASSWORD_API}user/password`,
            config: config,
            method: "put",
            data: {
              orgPassword: this.originalPassword,
              newPassword: this.confirmPassword,
            },
          }).then((res) => {
            console.log(res, "修改密码的");
            if (res.status == 204) {
              this.originalPassword = "";
              this.newPassword = "";
              this.confirmPassword = "";
              this.removeSharedAuthCookie(
                SEP_IDENTITY_TITLE + "-" + "SEP_access_token"
              );
              Notification.success({
                message: "修改成功",
              });
              this.PasswordVerification = false;
            }
            this.isLoading = false;
          });
        } else {
          Notification.error({
            title: "error",
            message: "无 Token",
          });
          this.isLoading = false;
          return;
        }
      }
    },
    // 验证两次输入的密码是否一样
    verifyPassword() {
      if (this.newPassword && this.confirmPassword) {
        if (this.confirmPassword === this.newPassword) {
          this.PasswordVerification = 2;
        } else {
          this.PasswordVerification = 1;
        }
        if (!this.confirmPassword) {
          this.PasswordVerification = false;
        }
      }

      console.log(this.confirmPassword, this.newPassword, "验证密码");
    },
    // 得到焦点时验证
    verifyFocus() {
      // 如果两个输入框不为空
      if (this.newPassword && this.confirmPassword) {
        console.log(this.newPassword, this.confirmPassword, "焦点验证");
        if (this.confirmPassword === this.newPassword) {
          this.PasswordVerification = 2;
        } else {
          this.PasswordVerification = 1;
        }
        if (!this.newPassword) {
          this.PasswordVerification = false;
        }
      }
    },

    // 登录返回
    goToLogin() {
      this.$router.replace("/acNormalLogin");
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
.a-style {
  cursor: pointer;
}
</style>
