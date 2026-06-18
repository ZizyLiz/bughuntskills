<template>
  <div class="ac-spinner-covering">
    <div class="ac-spinner-container">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
      <!-- 
           <span><img  src="@/assets/img/loading.svg" class="loading"  height="60" alt="loading"></span>
        -->
    </div>
  </div>
</template>
<script>
export default {
  name: "Spinner",
};
</script>
<style scoped>
@keyframes line-spinner {
  0%,
  100%,
  40% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1);
  }
}
.ac-spinner-covering {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
}
.ac-spinner-container {
  height: 15px;
  margin: 0 auto;
  font-size: 0;
  color: #0c3c6b;
  box-sizing: border-box;
  font-size: 0;
}
.ac-spinner-covering .ac-spinner-container > div:nth-child(1) {
  animation-delay: -1.2s;
}
.ac-spinner-covering .ac-spinner-container > div:nth-child(2) {
  animation-delay: -1.1s;
}
.ac-spinner-covering .ac-spinner-container > div:nth-child(3) {
  animation-delay: -1s;
}
.ac-spinner-covering .ac-spinner-container > div:nth-child(4) {
  animation-delay: -0.9s;
}
.ac-spinner-covering .ac-spinner-container > div:nth-child(5) {
  animation-delay: -0.8s;
}
.ac-spinner-covering .ac-spinner-container > div {
  display: inline-block;
  width: 8px;
  height: 25px;
  margin: 0 3px;
  background-color: #0c3c6b;
  border-color: var#0c3c6b;
  animation: line-spinner 1.2s infinite ease;
}
</style>