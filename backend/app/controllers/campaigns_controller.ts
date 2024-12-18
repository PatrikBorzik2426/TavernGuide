import type { HttpContext } from '@adonisjs/core/http'
import transmit from '../../config/transmit.js'
import Campaign from '../models/campaign.js'

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

            // Creating my own format for response with added atributes in the $extras object

            const campaigns = temp_campaigns.map((campaign) => {
                return {
                    id: campaign.id,
                    name: campaign.name,
                    description: campaign.description,
                    dm: campaign.$extras.pivot_is_dm ? user : null,
                }
            })
        
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

}