import type { HttpContext } from '@adonisjs/core/http'
import transmit from "@adonisjs/transmit/services/main"
import Character from '../models/character.js'


export default class CombatsController {

    async initiate(ctx: HttpContext){
        const user = ctx.auth.user

        const action = 'initiate'

        if(!user){
            console.log("User not found")
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_id, map_id, character_id, initiative, random_roll, owner_id, pivot_id} = ctx.request.all()

        console.log("Inciting combat for campaign: " + campaign_id + " and map: " + map_id)

        try{
            const character = await Character.findOrFail(character_id)

            transmit.broadcast(`campaign:${campaign_id}map:${map_id}:combat`,{
                action: action,
                initiative: initiative,
                random_roll: random_roll,
                character_name: character.name,
                owner_id : owner_id,
                pivot_id: pivot_id
            })

            return ctx.response.ok({message: "Combat initiated", status: 200})

        }catch(e){
            console.log("Error initiating combat: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async start(ctx: HttpContext){

        const user = ctx.auth.user

        if(!user){
            console.log("User not found")
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_id, map_id} = ctx.request.all()

        // Check if user is the DM of the campaign

        const campaign = await user.related('campaigns').query().where('campaign_id', campaign_id).where('is_dm',true).first()

        if(!campaign){
            console.log("User is not the DM of the campaign")
            return ctx.response.badRequest({message: "User is not the DM of the campaign", status: 404})
        }

        console.log("Starting combat for campaign: " + campaign_id + " and map: " + map_id)

        transmit.broadcast(`campaign:${campaign_id}map:${map_id}:combat`,{
            action: 'start'
        })

        return ctx.response.ok({message: "Combat started", status: 200})
    }

    async next(ctx: HttpContext){
            
            const user = ctx.auth.user
    
            if(!user){
                console.log("User not found")
                return ctx.response.badRequest({message: "User not found", status: 404})
            }
    
            const {campaign_id, map_id} = ctx.request.all()
    
            // Check if user is the DM of the campaign
    
            const campaign = await user.related('campaigns').query().where('campaign_id', campaign_id).where('is_dm',true).first()
    
            if(!campaign){
                console.log("User is not the DM of the campaign")
                return ctx.response.badRequest({message: "User is not the DM of the campaign", status: 404})
            }
    
            console.log("Next turn for campaign: " + campaign_id + " and map: " + map_id)
    
            transmit.broadcast(`campaign:${campaign_id}map:${map_id}:combat`,{
                action: 'next'
            })
    
            return ctx.response.ok({message: "Next turn", status: 200})
        }
}