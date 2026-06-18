<template>
  <div class="login-footer">
    <div class="footer-links">
      <div>
        <a
          class="footer-a-style"
          href="https://www.shijigroup.com/privacy-policy"
          target="_blank"
        >
          Privacy Policy
        </a>
        <i class="i_con"></i>
      </div>
      <div>
        <a
          class="footer-a-style"
          href="https://www.shijigroup.com/terms/legal-notice"
          target="_blank"
        >
          Legal Notice
        </a>
        <i class="i_con"></i>
      </div>
      <div>
        <a
          class="footer-a-style"
          href="https://docs.shijigroup.com/zh-CN/bundle/Shiji_Enterprise_Platform_Contact_Details/page/CONTACT_DETAILS/concepts/c_shiji_enterprise_platform_contact_support.html"
          target="_blank"
        >
          Contact Support
        </a>
      </div>
    </div>
    <div class="shiji-footer">
      <span> © {{ currentYear }} Shiji Group. All rights reserved.</span>
      <!-- <p>© {{ currentYear }} 石基集团. 保留所有权利.</p> -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      currentYear: "",
    };
  },
  created() {
    // 获取当前的年份
    let date = new Date();
    this.currentYear = date.getFullYear();
  },
};
</script>

<style>
</style>