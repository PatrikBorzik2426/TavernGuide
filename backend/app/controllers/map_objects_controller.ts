import type { HttpContext } from '@adonisjs/core/http'
import MapObject from '../models/map_object.js'
import Map from '../models/map.js'
import transmit from "@adonisjs/transmit/services/main"

export default class MapObjectsController {
    async createNumerousWalls(ctx: HttpContext){
        const user = ctx.auth.user

        const {arrayOfObjects, map_id, campaign_id} = ctx.request.all()

        console.log("Wall data received: ", arrayOfObjects, map_id, campaign_id)

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        
        try{
            const map = await Map.findOrFail(map_id)
            const mapObjectWall = await MapObject.findByOrFail('name', 'wall')

            if(map && mapObjectWall){
            
            // DElete all walls from the map

            await mapObjectWall.related('maps')
            .pivotQuery()
            .where('map_id', map_id)
            .delete()
           
            console.log("Map object wall: ", mapObjectWall.id)

            arrayOfObjects.forEach(async (element : any) => {
                await map.related('map_objects').attach({
                    [mapObjectWall.id]: {
                        campaign_id: campaign_id,
                        x: element.x,
                        y: element.y,
                        size: element.id
                    }
                })
            })

            
            const newMapObject = await mapObjectWall.related('maps')
            .pivotQuery()
            .where('map_id', map.id)
            
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

    async informAboutFow(ctx: HttpContext){
        const user = ctx.auth.user

        const {map_id, campaign_id, fow} = ctx.request.all()

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        try{

            transmit.broadcast(`campaign:${campaign_id}:map:${map_id}`,{
                fow: fow
            })

            console.log("Informed about fow, fow is: ", fow)

        }catch(e){
            console.log("Error informing about fow: " + e)
            return ctx.response.badRequest(e)
        }
    }

}