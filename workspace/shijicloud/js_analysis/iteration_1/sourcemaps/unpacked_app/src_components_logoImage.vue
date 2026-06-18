<template>
  <div>
    <!-- logo图片 -->
    <div class="logo">
      <img v-if="isShowImg" class="logo-image" :src="logoImg_big" />
      <img v-else class="logo-image" :src="logoImg_Small" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      logoImg_big:
        "https://cn1.identity.uat.development.abovecloud.net.cn/account/shiji-logo-v2.png",
      logoImg_Small:
        "https://op-api-gateway.shijicloud.com/lostfound-web/img/png-icon/shiji-logo-white.png",
      screenWidth: document.body.clientWidth,
      isShowImg: true,
    };
  },
  mounted() {
    let that = this;
    window.addEventListener("resize", function () {
      return (() => {
        window.screenWidth = document.body.clientWidth;
        that.screenWidth = window.screenWidth;
      })();
    });
  },
  watch: {
    screenWidth: {
      handler(newVal, oldVal) {
        // 为了避免频繁触发resize函数导致页面卡顿，使用定时器
        if (!this.timer) {
          // 一旦监听到的screenWidth值改变，就将其重新赋给data里的screenWidth
          this.screenWidth = newVal;
          this.timer = true;
          let that = this;
          setTimeout(function () {
            // 打印screenWidth变化的值
            console.log(that.screenWidth);
            that.timer = false;
            if (that.screenWidth <= 768) {
              that.isShowImg = false;
            } else {
              that.isShowImg = true;
            }
            //执行自己的逻辑
          }, 400);
        }
      },
      immediate: true,
    },
  },
};
</script>

<style>
</style>