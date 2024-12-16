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

router.group(() => {
  router.post('/register',[AuthController,'register']),
  router.post('/login',[AuthController,'login']),
  router.post('/simpleAuth',[AuthController,'simpleAuthorization']).use(middleware.auth())
  router.post('/logout',[AuthController,'logout']).use(middleware.auth())
}).prefix('auth')
