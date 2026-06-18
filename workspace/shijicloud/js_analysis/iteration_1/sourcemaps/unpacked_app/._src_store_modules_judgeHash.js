// state
const state = {
    processPage: ''
}
const mutations = {

    // 设置登录处理
    ADD_PROCESS_PAGE(state) {
        state.processPage = true
    },

}
export default {
    namespaced: true,
    state,
    mutations
}