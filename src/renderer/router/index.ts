import auth from '@/renderer/middleware/auth'
import { MainScreen } from '@/renderer/screens'
import NewProject from '@/renderer/pages/NewProject'
import RipsList from '@/renderer/pages/RipsList'
import Login from '@/renderer/pages/Login'
import User from '@/renderer/pages/User'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '@/renderer/store/user'


const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      titleKey: 'title.main',
      middleware: auth
    }
  },
  {
    path: '/',
    name: 'NewProject',
    component: NewProject,
    meta: { requiresAuth: true, middleware: auth }
  },
  {
    path: '/rips-list',
    name: 'RipsList',
    component: RipsList,
    meta: { requiresAuth: true, middleware: auth }
  },
  {
    path: '/user',
    name: 'User',
    component: User,
    meta: { requiresAuth: true, middleware: auth }
  },
  // {
  //   path: '/second',
  //   component: () => import('@/renderer/screens/SecondScreen.vue'),
  //   meta: {
  //     titleKey: 'title.second'
  //   }
  // },
  // {
  //   path: '/error',
  //   component: () => import('@/renderer/screens/ErrorScreen.vue'),
  //   meta: {
  //     titleKey: 'title.error'
  //   }
  // },
  // {
  //   path: '/:pathMatch(.*)*',
  //   redirect: '/'
  // }
]
const router = createRouter({
  history: createWebHashHistory(),
  routes
})


router.beforeEach(async (to, from) => {
  // console.log('beforeEach ', store.state.auth.status)
  const authStore = useUserStore();
  let isAuthenticated = authStore.user.loggedIn
  console.log('isAuthenticated ', isAuthenticated, to)
  if (!isAuthenticated && to.name !== 'Login') {
    // redirect the user to the login page
    return { name: 'Login' }
  } 
})

export default router
