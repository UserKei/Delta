import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/fa',
      name: 'fa',
      component: () => import('../views/FAView.vue'),
    },
    {
      path: '/ll1',
      name: 'll1',
      component: () => import('../views/LL1View.vue'),
    },
  ],
})

export default router
