import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import DronesList from '../views/DronesList.vue'
import DroneDetail from '../views/DroneDetail.vue'
import MissionsList from '../views/MissionsList.vue'
import MissionDetail from '../views/MissionDetail.vue'
import MaintenanceLogs from '../views/MaintenanceLogs.vue'

const APP_NAME = 'SkyOps Mission Control'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: Dashboard, meta: { title: 'Dashboard' } },
    { path: '/drones', component: DronesList, meta: { title: 'Drones' } },
    { path: '/drones/:id', component: DroneDetail, meta: { title: 'Drone Detail' } },
    { path: '/missions', component: MissionsList, meta: { title: 'Missions' } },
    { path: '/missions/:id', component: MissionDetail, meta: { title: 'Mission Detail' } },
    { path: '/maintenance', component: MaintenanceLogs, meta: { title: 'Maintenance Logs' } },
  ],
})

router.afterEach((to) => {
  const title = to.meta.title as string | undefined
  document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
})

export default router
