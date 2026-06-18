export default {
    namespaced: true,
    state: {
        token: null,
        expiresIn: 0,
        tokenTimeStamp: 0,
        userName: null,
        password: null,
        loginedUser: null,
        userId: null,
        logined: null,
        permission: null,
        tenant_id: null
    },
    actions: {},
    mutations: {
        setToken(state, token) {
            state.token = token
            console.log('查看state--->>>',state)
            console.log('查看token--->>>',token)
            localStorage.setItem('access_token', token)
        },
        SetExpiresIn(state, expiresIn) {
            state.expiresIn = expiresIn
            localStorage.setItem('expiresIn', expiresIn)
        },
        SetTokenTimeStamp(state, tokenTimeStamp) {
            state.tokenTimeStamp = tokenTimeStamp
            localStorage.setItem('tokenTimeStamp', tokenTimeStamp)
        },
        SetPermission(state, permission) {
            state.permission = permission
            localStorage.setItem('permission', permission)
        },
        setTenantId(state, tenantId) {
            state.tenant_id = tenantId
            localStorage.setItem('tenant_id', tenantId)
        },
        SetUserName(state, userName) {
            state.userName = userName
            localStorage.setItem('userName', userName)
        },
        SetPassword(state, password) {
            state.password = password
            localStorage.setItem('password', password)
        },
        SetLoginedUser(state, user) {
            state.loginedUser = user
            localStorage.setItem('loginedUser', user)
        },
        SetUserId(state, userId) {
            state.userId = userId
            localStorage.setItem('userId', userId)
        },
        setLogined(state, logined) {
            state.logined = logined
            localStorage.setItem('logined', logined)
        },
    },
    getters: {}
}