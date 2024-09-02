import { MainScreen } from '@/renderer/screens'
import NewProject from '@/renderer/pages/NewProject'
import RipsList from '@/renderer/pages/RipsList'
import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    // {
    //   path: '/',
    //   component: MainScreen,
    //   meta: {
    //     titleKey: 'title.main'
    //   }
    // },
    {
      path: '/',
      name: 'NewProject',
      component: NewProject,
      meta: { requiresAuth: true }
    },
    {
      path: '/rips-list',
      name: 'RipsList',
      component: RipsList,
      meta: { requiresAuth: true }
    }
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
})
