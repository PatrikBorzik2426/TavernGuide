/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import {middleware} from '#start/kernel'
import transmit from '@adonisjs/transmit/services/main'

transmit.registerRoutes()

const AuthController = () => import('#controllers/auth_controller')
const CampaignsController = () => import('#controllers/campaigns_controller')
const MapsController = () => import('#controllers/maps_controller')

router.group(() => {
  router.post('/register',[AuthController,'register']),
  router.post('/login',[AuthController,'login']),
  router.post('/simpleAuth',[AuthController,'simpleAuthorization']).use(middleware.auth()),
  router.post('/logout',[AuthController,'logout']).use(middleware.auth())
}).prefix('auth')

router.group(()=>{
  router.post('/create',[CampaignsController,'create']).use(middleware.auth()),
  router.post('/list',[CampaignsController,'listCampaigns']).use(middleware.auth()),
  router.post('/delete',[CampaignsController,'deleteCampaign']).use(middleware.auth()),
  router.post('/update',[CampaignsController,'updateCampaign']).use(middleware.auth()),
  router.post('/get',[CampaignsController,'getCampaign']).use(middleware.auth())
}).prefix('campaigns')

router.group(()=>{
  router.post('/create',[MapsController,'create']).use(middleware.auth()),
  router.post('/list',[MapsController,'listMaps']).use(middleware.auth()),
  router.post('/delete',[MapsController,'deleteMap']).use(middleware.auth()),
  router.post('/update',[MapsController,'updateMap']).use(middleware.auth())
}).prefix('maps')