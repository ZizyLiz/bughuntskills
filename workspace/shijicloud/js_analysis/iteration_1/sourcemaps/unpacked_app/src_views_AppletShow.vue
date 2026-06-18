<template>
  <div class="container">
    <!-- <web-view :webview-styles="webviewStyles" :src='url'></web-view> -->
    <h2>小程序暂不支持SIS,请复制链接后打开浏览器访问</h2>
    <h3>{{h5_applet_address}}</h3>
    <el-button class="mainButton" type="primary" @click="copyUrl()"
      >复制链接</el-button
    >
  </div>
</template>

<script>
import { H5_APPLET_ADDRESS } from "../../config-json.js";
export default {
  data() {
    return {
      h5_applet_address: H5_APPLET_ADDRESS,
    };
  },
  created() {
    // // webview.loadUrl('')
    // let time = new Date().getTime();
    // this.url = `https://op-api-gateway.shijicloud.com/dev-lostfound-h5/?timeStamp = ${time}`
    // console.log(this.url)
  },
  methods: {
    copyUrl() {
      this.link = this.h5_applet_address;
      let that = this;
      this.$copyText(this.link).then(
        function (e) {
          that.$notify({
            title: "链接复制成功",
            type: "success",
          });
        },
        function (e) {
          that.$notify({
            title: "链接复制失败",
            type: "error",
          });
        }
      );
    },
    // getLook(){
    // 	uni.getClipboardData({
    // 		success: function (res) {
    // 			console.log(res.data);
    // 		}
    // 	});
    // },
  },
};
</script>

<style scoped>
.container {
  padding: 20px;
}
h2 {
  text-align: center;
  margin-top: 150px;
  margin-bottom: 50px;
}

h3 {
  text-align: center;
  margin-bottom: 50px;
}
.mainButton {
  width: 100%;
}
</style>
