import type { HttpContext } from '@adonisjs/core/http'
import transmit from "@adonisjs/transmit/services/main"
import Campaign from '../models/campaign.js'
import User from '../models/user.js'

export default class CampaignsController {
    async create(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {name, description} = ctx.request.all()
        const isDm = true

        console.log("New campaign with name: " + name + " and description: " + description)

        try{
            const newCampaign = await Campaign.create({ name, description })

            await newCampaign.related('users').attach({
                [user.id]: {
                    is_dm: isDm
                }
            })

            const temp_campaign = await user
            .related('campaigns')
            .query()
            .where('campaign_id', newCampaign.id)
            .firstOrFail()

            // Creating my own format for response with added atributes in the $extras object

            const campaign ={
                    id: temp_campaign.id,
                    name: temp_campaign.name,
                    description: temp_campaign.description,
                    dm: temp_campaign.$extras.pivot_is_dm ? user : null,
                }

            return ctx.response.ok({campaign, status: 200})
        }catch(e){
            console.log("Error creating campaign: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async listCampaigns(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        try{

            const temp_campaigns = await user
            .related('campaigns')
            .query()
            .orderBy('created_at', 'asc')

            const campaigns : Object[] = []

            // Creating my own format for response with added atributes in the $extras object

            for(let i = 0; i < temp_campaigns.length; i++){
                
                const dm : User = await temp_campaigns[i]
                    .related('users')
                    .query()
                    .wherePivot('is_dm', true)
                    .firstOrFail()

                campaigns.push({
                    id: temp_campaigns[i].id,
                    name: temp_campaigns[i].name,
                    description: temp_campaigns[i].description,
                    dm: dm,
                })
            }
        
            return ctx.response.ok({campaigns, status: 200})
            
        }catch(e){
            console.log("Error getting user campaigns: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async deleteCampaign(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_id} = ctx.request.all()

        //Check if user is DM of campaign

        const isDM = await user.related('campaigns').query().where('campaign_id', campaign_id).wherePivot('is_dm', true).first()

        if(!isDM){
            return ctx.response.badRequest({message: "User is not DM", status: 401})
        }

        try{
            const campaign = await user
            .related('campaigns')
            .query()
            .where('campaign_id', campaign_id)
            .firstOrFail()

            // Test if user is DM
            if(!campaign.$extras.pivot_is_dm){
                return ctx.response.badRequest({message: "User is not DM", status: 401})
            }

            await campaign.delete()

            return ctx.response.ok({message: "Campaign deleted", status: 200})
        }catch(e){
            console.log("Error deleting campaign: " + e)
            return ctx.response.badRequest(e)

        }
    }

    async updateCampaign(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_id, name, description} = ctx.request.all()

        const isDM = await user.related('campaigns').query().where('campaign_id', campaign_id).wherePivot('is_dm', true).first()

        if(!isDM){
            return ctx.response.badRequest({message: "User is not DM", status: 401})
        }

        try{
            const campaign = await user
            .related('campaigns')
            .query()
            .where('campaign_id', campaign_id)
            .firstOrFail()

            // Test if user is DM
            if(!campaign.$extras.pivot_is_dm){
                return ctx.response.badRequest({message: "User is not DM", status: 401})
            }

            campaign.name = name
            campaign.description = description

            await campaign.save()

            return ctx.response.ok({message: "Campaign updated", status: 200})
        }catch(e){
            console.log("Error updating campaign: " + e)
            return ctx.response.badRequest(e)

        }
    }

    async getCampaign(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        console.log(ctx.request.all())

        const {campaign_id} = ctx.request.all()

        try{
            const campaign = await user
            .related('campaigns')
            .query()
            .where('campaign_id', campaign_id)
            .firstOrFail()

            return ctx.response.ok({campaign, status: 200})
        }catch(e){
            console.log("Error getting campaign: " + e)
            return ctx.response.badRequest(e)
        }

    }

    async getDmOfCampaign(ctx: HttpContext) {

        const {campaign_id} = ctx.request.all()

        try{
            const campaign = await Campaign.findOrFail(campaign_id)

            const dm : User = await campaign
            .related('users')
            .query()
            .wherePivot('is_dm', true)
            .firstOrFail()

            return ctx.response.ok({dm_id: dm.id, status: 200})
        }catch(e){
            console.log("Error getting DM of campaign: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async assignedUsers(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_id} = ctx.request.all()

        try{
            const campaign = await user
            .related('campaigns')
            .query()
            .where('campaign_id', campaign_id)
            .firstOrFail()

            const users = await campaign
            .related('users')
            .query()
            .orderBy('created_at', 'asc')

            return ctx.response.ok({users, status: 200})
        }catch(e){
            console.log("Error getting assigned users: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async joinCampaign(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }

        const {campaign_name} = ctx.request.all()

        try{
            const campaignOrigin = await Campaign.findByOrFail('name', campaign_name)

            console.log("Joining campaign: " + campaign_name, "User: " + user.login)

            // Check if user is already in campaign

            const isAlreadyInCampaign = await user.related('campaigns')
            .query()
            .where('campaign_id', campaignOrigin.id)
            .first()

            if(isAlreadyInCampaign){
                return ctx.response.badRequest({message: "User already in campaign", status: 400})
            }

            await campaignOrigin.related('users').attach({
                [user.id]: {
                    is_dm: false
                }
            })

            const dm : User = await campaignOrigin
            .related('users')
            .query()
            .wherePivot('is_dm', true)
            .firstOrFail()

            console.log("DM of campaign: " + dm.login)

            const campaign = {
                id: campaignOrigin.id,
                name: campaignOrigin.name,
                description: campaignOrigin.description,
                dm: dm
            }

            return ctx.response.ok({campaign: campaign, message: "User joined campaign", status: 200})
        }catch(e){
            console.log("Error joining campaign: " + e)
            return ctx.response.badRequest(e)
        }
    }

}