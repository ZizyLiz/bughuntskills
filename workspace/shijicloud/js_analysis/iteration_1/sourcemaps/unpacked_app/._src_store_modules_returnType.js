// state
const state = {
    showOther: [],
    showTenant: '',
    showLanguage: '',
    processPage: ''
}
const mutations = {
    // 添加底部其他的链接参数数据
    ADD_RETURN_OTHER(state, data) {
        if (data) {
            state.showOther = data.split(',')
        } else {
            state.showOther = []
        }

        console.log(state.showOther, ' state.showOther')
    },
    // 添加Tenant数据
    ADD_RETURN_TENANT(state, data) {
        state.showTenant = data
        console.log(state.showTenant, ' state.showTenant')
    },
    // 添加语言参数
    ADD_LANGUAGE_DATA(state, data) {
        state.showLanguage = data
    },

    // 设置登录处理
    ADD_PROCESS_PAGE(state) {
        state.processPage = true
    },

    // 清空vueX数据
    DELETE_RETURN_TYPE_DATA(state) {
        state.showOther = []
        state.showTenant = ''
        state.showLanguage = ''
    }

}
export default {
    namespaced: true,
    state,
    mutations
}