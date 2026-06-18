// state
const state = {
    applyTokenObj: {}
}

const mutations = {
    // 设置各应用的token
    SET_APPLY_TOKEN(state, data) {
        state.applyTokenObj = data
    }
}

export default {
    namespaced: true,
    state,
    mutations
}