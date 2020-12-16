// ------------------- Imports ------------------- //
import Vue from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'

import '@babel/polyfill'
import 'mutationobserver-shim'
import './plugins/bootstrap-vue'

// ------------------- Configuration ------------------- //
Vue.config.productionTip = false

axios.defaults.baseURL = '';

Vue.use(VueAxios, axios)


// ------------------- Vue Instance ------------------- //
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
