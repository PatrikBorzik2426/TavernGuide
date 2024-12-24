import type { HttpContext } from '@adonisjs/core/http'
import MapObject from '../models/map_object.js'
import Map from '../models/map.js'

export default class MapObjectsController {
    async createNumerousWalls(ctx: HttpContext){
        const user = ctx.auth.user

        const {arrayOfObjects, map_id, campaign_id} = ctx.request.all()

        console.log("Array of objects: ", arrayOfObjects)

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }
        
        try{
            const map = await Map.findOrFail(map_id)
            const mapObjectWall = await MapObject.findByOrFail('name', 'wall')

            if(map && mapObjectWall){
            
            // DElete all walls from the map

            await mapObjectWall.related('maps')
            .query()
            .where('map_id', map_id)
            .delete()

            arrayOfObjects.forEach(async (element : any) => {
                await mapObjectWall.related('maps').attach({
                    [map_id]: {
                        campaign_id: campaign_id,
                        x: element.x,
                        y: element.y,
                        size: element.id
                        }
                    })
                });


                const newMapObject = await mapObjectWall.related('maps').query().where('map_id', map.id)
                return ctx.response.ok({newMapObject, status: 200})
            }

        }catch(e){
            console.log("Error creating walls: " + e)
            return ctx.response.badRequest(e)
        }

    }

    async listWalls(ctx: HttpContext){
        const user = ctx.auth.user

        const {campaign_id, map_id} = ctx.request.all()

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        try{
            const map = await Map.findOrFail(map_id)
            const mapObjectWall = await MapObject.findBy('name', 'wall')

            if(map && mapObjectWall){
                const walls = await map.related('map_objects').pivotQuery()
                .where('campaign_id', campaign_id)
                .where('map_id', map_id)
                .where('map_object_id', mapObjectWall.id)

                return ctx.response.ok({walls, status: 200})
            }

        }catch(e){
            console.log("Error listing walls: " + e)
            return ctx.response.badRequest(e)
        }
    }
}