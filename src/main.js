// ------------------- Imports ------------------- //
import Vue from 'vue'
import App from './App.vue'
import router from './router'

import '@babel/polyfill'
import 'mutationobserver-shim'
import './plugins/bootstrap-vue'

// ------------------- Configuration ------------------- //
Vue.config.productionTip = false


// ------------------- Vue Instance ------------------- //
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
