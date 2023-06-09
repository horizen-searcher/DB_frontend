// 包含Login表单所需的数据类型form，约束rules以及处理函数commit
import {computed, reactive, ref} from "vue";
import {ElMessage, FormInstance} from "element-plus";
import api from "../../service"
import store from "../../store";
import {closeAllDialogs} from "../DialogVisible";
import router from "../../router";
import {setCookie} from "../../service/cookie";
import {visible} from "../BarVisible";

export const baseForm = ref<FormInstance>();
export const loginData = reactive({
    loginForm: {
        userNumber: "",
        password: ""
    }
})
export const loginRules = reactive ({
    userNumber: [
        {
            required: true,
            trigger: "blur",
            message: "Please input your phone number",
        },
    ],
    password: [
        {
            required: true,
            trigger: "blur",
            message: "Please input your password",
        },
    ],
})
export const commitLogin = async () => {
    if (!baseForm.value)
        return
    // 注意：这个await很可能并没有处于等待状态！
    await baseForm.value.validate( async (valid: any) => {
        if (valid) {
            try {
                const response = await api.postLogin(loginData.loginForm); // 不能传入submitForm！
                if (response.data.code == 1){
                    store.commit('setUserID', loginData.loginForm.userNumber)
                    ElMessage.success("登陆成功！")
                    await getUserProfile()
                    visible.value = true;
                    closeAllDialogs()
                    // 存储cookie
                    setCookie("userNumber", loginData.loginForm.userNumber, 7)
                    setCookie("password", loginData.loginForm.password, 7)
                    if(baseForm.value)
                        baseForm.value.resetFields() // 清空表单，关闭所有弹窗
                    await router.replace({path: '/square'})
                }
                else{
                    ElMessage.error(response.data.msg)
                }

            } catch (error: any) {
                ElMessage.error(error.code+': 提交失败，请检查网络或联系管理员')
            }
        } else {
            ElMessage.error('验证失败，请检查数据是否完整且正确')
        }
    })
}

export const commitLogin_cookie = async () => {
    const response = await api.postLogin(loginData.loginForm);
    if (response.data.code == 1){
        store.commit('setUserID', loginData.loginForm.userNumber)
        visible.value = true;
        closeAllDialogs()
        await getUserProfile()
        if(baseForm.value)
            baseForm.value.resetFields() // 清空表单，关闭所有弹窗
        if(router.currentRoute.value.path == "/hello")
            await router.replace("/square")
    }
    else {
        ElMessage.warning("您还没有登录，请先登录")
        await router.replace("/hello")
    }
}

const getUserProfile = async () => {
    const userID = computed(() => store.getters.getUserID).value
    const response = await api.getUserImage({user_student_number: userID})
    if (response.data.code == 1){
        store.commit('setUserPhoto', response.data.data)
    }
}
