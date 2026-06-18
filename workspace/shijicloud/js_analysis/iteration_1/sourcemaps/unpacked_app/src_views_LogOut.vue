<template>
  <div></div>
</template>
<script>
import { mapState, mapActions, mapMutations } from "vuex";
export default {
  created() {
    // 获取web-token
    let web_access_token = this.getUrlParam("web_access_token");
    console.log("web_access_token--->", web_access_token);

    //获取小程序SEPtoken
    let applet_access_token = this.getUrlParam("applet_access_token");
    console.log("applet_access_token--->", applet_access_token);

    //获取manage_web_token
    let manage_web_access_token = this.getUrlParam("manage_web_access_token");
    console.log("manage_web_access_token--->", manage_web_access_token);

    // 合并对象
    let data = {
      web_access_token: web_access_token,
      applet_access_token: applet_access_token,
      manage_web_access_token: manage_web_access_token,
    };

    // 储存data到vueX
    this.SET_APPLY_TOKEN(data);

    let url = window.location.href; //获取当前页面的url
    if (url.indexOf("?") != -1) {
      //判断是否存在参数
      url = url.replace(/(\?|#)[^'"]*/, ""); //去除参数
      window.history.pushState({}, 0, url);
    }
    this.$router.replace("/transfer");
  },
  methods: {
    ...mapMutations("applyToken", ["SET_APPLY_TOKEN"]),
  },
};
</script>

<style>
</style>
