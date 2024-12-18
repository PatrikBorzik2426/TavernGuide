import type { HttpContext } from '@adonisjs/core/http'
import transmit from '../../config/transmit.js'
import Map from '../models/map.js'
import User from '../models/user.js'
import Campaign from '../models/campaign.js'

export default class MapsController {
    async create(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {name, url, campaign_id, grid_x, grid_y} = ctx.request.all()

        console.log("New map with name: " + name + " and url: " + url)

        try{
            const newMap = await Map.create({ name: name, image_url: url })

            await newMap.related('campaigns').attach({
                [campaign_id]: {
                    grid_x: grid_x,
                    grid_y: grid_y
                }
            })

            const temp_map = await newMap.related('campaigns').query()
            .where('campaign_id', campaign_id)
            .firstOrFail()

            const map = {
                id: newMap.id,
                name: newMap.name,
                url: newMap.image_url,
                grid_x: temp_map.$extras.pivot_grid_x,
                grid_y: temp_map.$extras.pivot_grid_y
            }

            return ctx.response.ok({map: map, status: 200})
        }catch(e){
            console.log("Error creating map: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async listMaps(ctx: HttpContext) {
        const user = ctx.auth.user

        const {campaign_id} = ctx.request.all()

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        try{

            const temp_campaign = await Campaign.findByOrFail('id', campaign_id)

            // load map based on joined table where campaign_id is the same as the one passed in the request

            const temp_maps = await temp_campaign.related('maps').query()

            const maps = temp_maps.map((map : Map) => {
                console.log("Map attributes: " + map.id + " " + map.name + " " + map.image_url + " " + map.$extras.pivot_grid_x + " " + map.$extras.pivot_grid_y)

                return {
                    id: map.id,
                    name: map.name,
                    url: map.image_url,
                    grid_x: map.$extras.pivot_grid_x,
                    grid_y: map.$extras.pivot_grid_y
                }
            })

            return ctx.response.ok({maps: maps, status: 200})
        }catch(e){
            console.log("Error listing maps: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async deleteMap(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {map_id} = ctx.request.all()

        // Check if user is dm of the campaigned assigned to the map
        const map = await Map.findOrFail(map_id)

        const campaign = await map.related('campaigns').query().firstOrFail()

        const DM = await campaign.related('users').query().where('is_dm', true).firstOrFail()

        console.log("DM: " + DM.id + " User: " + user.id)

        if(DM.id !== user.id){
            return ctx.response.badRequest({message: "User is not DM", status: 401})
        }

        try{
            const map = await Map.findOrFail(map_id)

            await map.delete()

            return ctx.response.ok({message: "Map deleted", status: 200})
        }catch(e){
            console.log("Error deleting map: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async updateMap(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {map_id, name, url, grid_x, grid_y, campaign_id} = ctx.request.all()

        try{
            const map = await Map.findOrFail(map_id)

            map.name = name
            map.image_url = url

            await map.save()

            await map.related('campaigns').query()
            .where('campaign_id', campaign_id)
            .update({
                grid_x: grid_x,
                grid_y: grid_y
            })

            return ctx.response.ok({message: "Map updated", status: 200})
        }catch(e){
            console.log("Error updating map: " + e)
            return ctx.response.badRequest(e)
        }
    }
}