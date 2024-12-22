import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import sharp from 'sharp'
import fs from 'fs/promises';
import Character from '../models/character.js';
import transmit from "@adonisjs/transmit/services/main"
import Map from '../models/map.js'
export default class CharactersController {
    async createCharacter (ctx : HttpContext){
        const user = ctx.auth.user;

        const { name, health, armour, speed, fov, map_id, info_url, is_npc, numNPC } = ctx.request.all();

        if (!user) {
            return ctx.response.unauthorized({ message: 'Unauthorized', status: 401 });
        }

        const avatar = ctx.request.file('avatar', {
            size: '5mb',
            extnames: ['jpg', 'png', 'jpeg'],
        });

        console.log("All data: " + name + " " + health + " " + armour + " " + speed + " " + fov + " " + map_id + " " + info_url);
        console.log("File: " + avatar?.clientName);

        const avatarName = `${cuid()}.png`; // Ensure the final output is PNG
        const avatarPath = app.makePath('storage/characters');
        const avatarUrl = `${avatarPath}/${avatarName}`;

        try {
            // Save the uploaded file temporarily
            await avatar?.move(avatarPath, { name: avatarName });

            const inputPath = `${avatarPath}/${avatarName}`;

            // Create a temporary output path for the cropped image
            const tempOutputPath = `${avatarPath}/temp_${avatarName}`;

            // Create a circular cropped image
            const circleMask = Buffer.from(
                `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="150" cy="150" r="150" fill="white"/>
                </svg>`
            );

            await sharp(inputPath)
                .resize(300, 300) // Resize to 300x300
                .composite([
                    {
                        input: circleMask, // Apply the circular mask
                        blend: 'dest-in',  // Use 'dest-in' to keep only the circle
                    },
                ])
                .png() // Ensure the output format is PNG
                .toFile(tempOutputPath); // Save the cropped image to a temporary file

            // Move the temporary file to the final destination
            await fs.rename(tempOutputPath, avatarUrl);

            // Create a new character
            const character = await Character.create({
                name: name,
                infoUrl: info_url,
                avatarUrl : avatarName,
            });

            console.log("Character created: " + character.id);

            if(is_npc){

                for(let i = 0; i < numNPC; i++){
                    // Attach the character to the Map
                    await character.related('maps').attach(
                        {[map_id]:
                            {
                                user_id: user.id,
                                x: -1,
                                y: -1,
                                health: health,
                                current_health: health,
                                armour: armour,
                                speed: speed,
                                fov: fov,
                                status: 'npc'
                            }
                        });
                }
            
            }else{
                // Attach the character to the Map
                await character.related('maps').attach(
                    {[map_id]:
                        {
                            user_id: user.id,
                            x: -1,
                            y: -1,
                            health: health,
                            current_health: health,
                            armour: armour,
                            speed: speed,
                            fov: fov,
                            status: ''
                        }
                    });
            }

            return ctx.response.ok({ message: 'File uploaded and cropped', status: 200 });
        } catch (e) {
            console.error(e);
            return ctx.response.badRequest({ message: e.message, status: 400 });
        }

    }


    async listCharactersMapSpecific (ctx : HttpContext){
        const user = ctx.auth.user;

        const map_id = ctx.request.input('map_id');
        const npcs = ctx.request.input('npcs');

        const map = await Map.findOrFail(map_id);

        if (!user) {
            return ctx.response.unauthorized({ message: 'Unauthorized', status: 401 });
        }

        console.log("Map ID: " + map_id);
        let charactersTemp : any;

        if(npcs){
            
            charactersTemp = await map.related('characters').pivotQuery()
            .where('map_id', map_id)
            .whereLike('status', '%npc%');

        }else{
            // List the pivot tables for characters and maps based on the user
            charactersTemp = await map.related('characters').pivotQuery()
            .where('map_id', map_id)
            .whereRaw("status NOT LIKE ?", ['%npc%']);
        }

        let characters : Object[] = []

        for (const character of charactersTemp) {
            const characterTemp = await Character.find(character.character_id);
        
            characters.push({
                id: characterTemp?.id,
                name: characterTemp?.name,
                avatarUrl: characterTemp?.avatarUrl,
                x: character.x,
                y: character.y,
                health: character.health,
                current_health: character.current_health,
                armour: character.armour,
                speed: character.speed,
                fov: character.fov,
                status: character.status,
                user_id: character.user_id,
                pivot_id: character.id,
                hidden: character.hidden
            });
        }

        return ctx.response.ok({ characters: characters, status: 200 });
    }

    async updateCharacter (ctx : HttpContext){
        const user = ctx.auth.user;

        console.log("Character update: ", ctx.request.all());

        const { id, name, avatarUrl, x, y, health, current_health, armour, speed, fov, status, user_id, pivot_id, hidden, initiative, action } = ctx.request.all();

        if (!user) {
            return ctx.response.unauthorized({ message: 'Unauthorized', status: 401 });
        }

        console.log("Character ID: " + id);

        try{

            // Update the character based on the user
            const characterOrigin = await Character.findOrFail(id);

            if (!characterOrigin) {
                return ctx.response.badRequest({ message: 'Character not found', status: 404 });
            }
            
            if (name){
                characterOrigin.name = name;
                characterOrigin.save();
            }

            await characterOrigin.related('maps')
            .pivotQuery()
            .where('id', pivot_id).update({
                x: x,
                y: y,
                health: health,
                current_health: current_health,
                armour: armour,
                speed: speed,
                fov: fov,
                status: status ? status : '',
                hidden: hidden ? hidden : false,
                initiative: initiative ? initiative : 0,
                user_id: user_id
            });

            const map_id = await characterOrigin.related('maps')
            .pivotQuery()
            .select('map_id')
            .first()

            const map = await Map.findOrFail(map_id.map_id);

            const campaign_id = await map.related('campaigns')
            .pivotQuery()
            .select('campaign_id')
            .first()

            const charactersTemp = await map.related('characters').pivotQuery()
            .where('map_id', map_id.map_id)
            .where('character_id', characterOrigin.id)
            .where('id', pivot_id)
            .first()

            console.log("Character updated: " + JSON.stringify(charactersTemp));

            const charBody = {
                id: characterOrigin.id,
                name: characterOrigin.name,
                avatarUrl: characterOrigin.avatarUrl,
                x: charactersTemp.x,
                y: charactersTemp.y,
                health: charactersTemp.health,
                current_health: charactersTemp.current_health,
                armour: charactersTemp.armour,
                speed: charactersTemp.speed,
                fov: charactersTemp.fov,
                status: charactersTemp.status,
                user_id: charactersTemp.user_id,
                pivot_id: charactersTemp.id,
                hidden: charactersTemp.hidden,
                initiative: charactersTemp.initiative,
            }

            transmit.broadcast(`campaign.${campaign_id.campaign_id}:map.${map_id.map_id}:characters`,{
                character: charBody,
                player_moved: user.id,
                action: action ? action : ''
            })
                      
            console.log("Character updated: "+ characterOrigin.name + "Pivot ID: "+ pivot_id + " " + charactersTemp.x  + " " + charactersTemp.y + " " + "Player action: " + JSON.stringify(user)); 
            
            return ctx.response.ok({ message: 'Character updated', status: 200 });
        }catch(e){
            console.log("Error updating character: " + e)
            return ctx.response.badRequest(e)
        }
    }

    async deleteCharacter (ctx : HttpContext){
        const user = ctx.auth.user;

        const { character_id, npc } = ctx.request.all();

        if (!user) {
            return ctx.response.unauthorized({ message: 'Unauthorized', status: 401 });
        }

        console.log("Character ID: " + character_id);

        let character;

        if(npc){
            await user.related('characters').pivotQuery()
            .where('id', character_id)
            .delete();

            return ctx.response.ok({ message: 'Character deleted', status: 200 });

        }else{
            // Delete the character based on the user
            character = await Character.findOrFail(character_id);
        }

        if (!character) {
            return ctx.response.badRequest({ message: 'Character not found', status: 404 });
        }

        await character.delete();

        return ctx.response.ok({ message: 'Character deleted', status: 200 });
    }

    async assignUserToCharacter (ctx : HttpContext){
        const user = ctx.auth.user;

        const { character_id, user_id, campaign_id, map_id } = ctx.request.all();

        if (!user) {
            return ctx.response.unauthorized({ message: 'Unauthorized', status: 401 });
        }

        // Is user dm of the campaign
        const DM = await user.related('campaigns').pivotQuery()
            .where('campaign_id', campaign_id)
            .where('is_dm', true)
            .first();

        if (!DM) {
            return ctx.response.badRequest({ message: 'User is not DM', status: 401 });
        }

        console.log("Character ID: " + character_id, "User ID: " + user_id);

        // Assign the user to the character based on the user
        const map = await Map.findOrFail(map_id);

        await map.related('characters').pivotQuery()
            .where('character_id', character_id)
            .where('map_id', map_id)
            .update({
                user_id: user_id
            });

        const character = await Character.findOrFail(character_id);

        const charactersTemp = await user.related('characters').pivotQuery()
            .where('map_id', map_id)
            .where('character_id', character_id)

        const charBody = {
            id: character_id,
            name: character.name,
            avatarUrl: character.avatarUrl,
            x: charactersTemp[0].x,
            y: charactersTemp[0].y,
            health: charactersTemp[0].health,
            current_health: charactersTemp[0].current_health,
            armour: charactersTemp[0].armour,
            speed: charactersTemp[0].speed,
            fov: charactersTemp[0].fov,
            status: charactersTemp[0].status,
            user_id: user_id,
            pivot_id: charactersTemp[0].id,
            hidden: charactersTemp[0].hidden
        }

        transmit.broadcast(`campaign.${campaign_id}:map.${map_id}:characters`,{
            character: charBody
            
        })

        console.log("Broadcasted to campaign." + campaign_id + ":map." + map_id + ":characters" + "Character" + JSON.stringify(charBody));

        return ctx.response.ok({ message: 'User assigned to character', status: 200 });
    }
}