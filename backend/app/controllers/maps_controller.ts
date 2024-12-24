import type { HttpContext } from '@adonisjs/core/http'
import transmit from "@adonisjs/transmit/services/main"
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

            const existingMap = await Map.query().where('image_url', url).where('name',name).first()

            if(existingMap){

                // Check if map is already assigned to the campaign
                const temp_map = await existingMap.related('campaigns').query().where('campaign_id', campaign_id).first()

                if(temp_map){
                    console.log("Map already assigned to campaign")
                    return ctx.response.badRequest({message: "Map already assigned to campaign", status: 400})
                }

                await existingMap.related('campaigns').attach({
                    [campaign_id]: {
                        grid_x: grid_x,
                        grid_y: grid_y,
                        active: false
                    }
                })

                const map = {
                    id: existingMap.id,
                    name: existingMap.name,
                    url: existingMap.image_url,
                    grid_x: grid_x,
                    grid_y: grid_y
                }

                return ctx.response.badRequest({map: map, status: 400})
            }
            
            const newMap = await Map.create({ name: name, image_url: url })

            await newMap.related('campaigns').attach({
                [campaign_id]: {
                    grid_x: grid_x,
                    grid_y: grid_y,
                    active: false
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

            this.delteMapsWithoutCampaign()

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

    async listAllMaps(ctx: HttpContext) { 
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }
        // Check if DM

        try{
            const mapsOrigin = await Map.all()

            const maps = mapsOrigin.map((map : Map) => {
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
            console.log("Error listing all maps: " + e)
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

            // Delete map from pivot table
            await map.related('campaigns').detach()

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

            const bodyMap = {
                id: map.id,
                name: map.name,
                url: map.image_url,
                grid_x: grid_x,
                grid_y: grid_y
            }

            transmit.broadcast(`campaign:${campaign_id}:map:active`,{
                map: bodyMap
            });

            return ctx.response.ok({message: "Map updated", status: 200})
        }catch(e){
            console.log("Error updating map: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async getActiveMap(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_id} = ctx.request.all()

        try{
            const campaign = await Campaign.findOrFail(campaign_id)

            const map = await campaign.related('maps').query().where('active', true).firstOrFail()

            const bodyMap ={
                id: map.id,
                name: map.name,
                url: map.image_url,
                grid_x: map.$extras.pivot_grid_x,
                grid_y: map.$extras.pivot_grid_y
            }

            return ctx.response.ok({map: bodyMap, status: 200})
        }catch(e){
            console.log("Error getting active map: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async setActiveMap(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {map_id, campaign_id} = ctx.request.all()

        try{
            const campaign = await Campaign.findOrFail(campaign_id)

            await campaign.related('maps').query().update({active: false})

            await campaign.related('maps').query().where('map_id', map_id).update({active: true})

            const activeMap = await campaign.related('maps').query().where('active', true).firstOrFail()

            const bodyMap = {
                id: activeMap.id,
                name: activeMap.name,
                url: activeMap.image_url,
                grid_x: activeMap.$extras.pivot_grid_x,
                grid_y: activeMap.$extras.pivot_grid_y
            }

            transmit.broadcast(`campaign:${campaign_id}:map:active`,{
                map: bodyMap
            });

            console.log("Broadcast to channel: campaign:" + campaign_id + ":map:active")

            return ctx.response.ok({message: "Map set as active", status: 200})
        }catch(e){
            console.log("Error setting active map: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async revealMap(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        console.log(ctx.request.body())

        const {map_id, campaign_id, cell_ids} = ctx.request.all()

        console.log("Revealing map with cellIds: " + cell_ids)

        try{
            
            transmit.broadcast(`campaign:${campaign_id}:map:${map_id}:reveal`,{
                cellIds: cell_ids
            })

            return ctx.response.ok({message: "Map revealed", status: 200})
        }catch(e){
            console.log("Error revealing map: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async delteMapsWithoutCampaign() {
        // Delete all maps that are not assigned to a campaign
        const maps = await Map.query().doesntHave('campaigns').delete()
        
        console.log("Deleted maps: " + maps.length)
    }

}