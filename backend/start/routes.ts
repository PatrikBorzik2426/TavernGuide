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
import { normalize, sep } from 'path'
import app from '@adonisjs/core/services/app'

transmit.registerRoutes()

const AuthController = () => import('#controllers/auth_controller')
const CampaignsController = () => import('#controllers/campaigns_controller')
const MapsController = () => import('#controllers/maps_controller')
const CharactersController = () => import('#controllers/characters_controller')
const CombatsController = () => import('#controllers/combats_controller')
const SoundsController = () => import('#controllers/sounds_controller')
const ObjectsController = () => import('#controllers/map_objects_controller')

const PATH_TRAVERSAL_REGEX = /(?:^|[\\/])\.\.(?:[\\/]|$)/

// Serve avatar files from the storage directory
router.get('/storage/characters/*', ({ request, response }) => {
  console.log("Serving avatar")

  const filePath = request.param('*').join(sep)
  const normalizedPath = normalize(filePath)

  console.log(normalizedPath)
  
  if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
    return response.badRequest('Malformed path')
  }

  const absolutePath = app.makePath('storage/characters', normalizedPath)
  return response.download(absolutePath)
})

// Serve sounds from the storage/sounds directory
router.get('/storage/sounds/*', ({ request, response }) => {
  console.log("Serving sound")

  const filePath = request.param('*').join(sep)
  const normalizedPath = normalize(filePath)

  console.log(normalizedPath)
  
  if (PATH_TRAVERSAL_REGEX.test(normalizedPath)) {
    return response.badRequest('Malformed path')
  }

  const absolutePath = app.makePath('storage/sounds', normalizedPath)
  return response.download(absolutePath)
})

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
  router.post('/get',[CampaignsController,'getCampaign']).use(middleware.auth()),
  router.post('/getUsers',[CampaignsController,'assignedUsers']).use(middleware.auth()),
  router.post('/getDm',[CampaignsController,'getDmOfCampaign']).use(middleware.auth()),
  router.post('/join',[CampaignsController,'joinCampaign']).use(middleware.auth())
}).prefix('campaigns')

router.group(()=>{
  router.post('/create',[MapsController,'create']).use(middleware.auth()),
  router.post('/list',[MapsController,'listMaps']).use(middleware.auth()),
  router.post('/listAll',[MapsController,'listAllMaps']).use(middleware.auth()),
  router.post('/delete',[MapsController,'deleteMap']).use(middleware.auth()),
  router.post('/update',[MapsController,'updateMap']).use(middleware.auth()),
  router.post('/getActive',[MapsController,'getActiveMap']).use(middleware.auth()),
  router.post('/setActive',[MapsController,'setActiveMap']).use(middleware.auth()),
  router.post('/reveal',[MapsController,'revealMap']).use(middleware.auth())
}).prefix('maps')

router.group(()=>{
  router.post('/create',[CharactersController,'createCharacter']).use(middleware.auth()),
  router.post('/listMap',[CharactersController,'listCharactersMapSpecific']).use(middleware.auth()),
  router.post('/update',[CharactersController,'updateCharacter']).use(middleware.auth()),
  router.post('/delete',[CharactersController,'deleteCharacter']).use(middleware.auth())
  router.post('/assignUser',[CharactersController,'assignUserToCharacter']).use(middleware.auth())
}).prefix('characters')

router.group(()=>{
  router.post('/initiate',[CombatsController,'initiate']).use(middleware.auth()),
  router.post('/start',[CombatsController,'start']).use(middleware.auth()),
  router.post('/next',[CombatsController,'next']).use(middleware.auth()),
  router.post('/end',[CombatsController,'end']).use(middleware.auth())
}).prefix('combats')

router.group(()=>{
  router.post('/upload',[SoundsController,'upload']).use(middleware.auth()),
  router.post('/list',[SoundsController,'list']).use(middleware.auth()),
  router.post('/play',[SoundsController,'playSound']).use(middleware.auth()),
  router.post('/stop',[SoundsController,'stopSound']).use(middleware.auth()),
  router.post('/delete',[SoundsController,'delete']).use(middleware.auth())
}).prefix('sounds')

router.group(()=>{
  router.post('/createWalls',[ObjectsController,'createNumerousWalls']).use(middleware.auth()),
  router.post('/listWalls',[ObjectsController,'listWalls']).use(middleware.auth())
}).prefix('objects')