<template>
  <div>
    <!-- 背景图片 -->
    <div
      class="login-image"
      :style="{ backgroundImage: 'url(' + backgroundImage + ')' }"
    ></div>
  </div>
</template>

<script>
export default {
    data(){
        return{
           backgroundImage:
        "https://op-api-gateway.shijicloud.com/lostfound-web/assets/img/city.5eec713d.jpg", 
        }
    }
};
</script>

<style>
</style>