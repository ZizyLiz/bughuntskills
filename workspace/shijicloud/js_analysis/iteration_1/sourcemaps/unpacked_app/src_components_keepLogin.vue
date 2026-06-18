<template>
  <div>
    <!-- 保持登录提醒 -->
    <div class="isKeepStyle">
      <div class="margin-bottom">
        <h1
          v-show="showLanguage == 'zh' || !showLanguage"
          class="login-h1"
          style="margin-bottom: 20px"
        >
          保持登录状态
        </h1>
        <h1
          v-show="showLanguage == 'en' || !showLanguage"
          class="login-h1"
          style="margin-bottom: 20px"
        >
          Stay Logged In
        </h1>
        <!-- 按钮 -->
        <div class="buttonFlex">
          <button class="yesButton" @click="isKeepTrue">Yes</button>
          <button class="noButton" @click="isKeepFalse">No</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  props: ["getIsKeepData"],
  data() {
    return {
      isKeepFlag: "",
    };
  },
  methods: {
    // 选择是
    isKeepTrue() {
      this.isKeepFlag = 1;
      this.getIsKeepData(this.isKeepFlag);
    },
    // 选择否
    isKeepFalse() {
      this.isKeepFlag = 2;
      this.getIsKeepData(this.isKeepFlag);
    },
  },
  computed: {
    ...mapState("returnType", ["showLanguage"]),
  },
};
</script>

<style  scoped>
@media (max-width: 768px) {
  .login-h1 {
    font-size: 24px;
    font-weight: 400;
    margin-bottom: 8px;
    color: white;
  }
}

.login-h1 {
  font-size: 24px;
  font-weight: 400;
  margin-bottom: 8px;
}
.isKeepStyle {
  margin: 50% 0;
  display: flex;
  justify-content: center;
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
  margin-right: 20px;
}
.yesButton:hover {
  cursor: pointer;
  transition: all linear 0.1s;
}
</style>
