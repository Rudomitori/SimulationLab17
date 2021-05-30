import Vue from "vue"
import App from "./app.vue"
import { Table, Progress } from 'buefy'
import 'buefy/dist/buefy.css'

Vue.use(Table)
Vue.use(Progress)

new App({
    el: "#app",
})

