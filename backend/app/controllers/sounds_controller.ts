import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import transmit from "@adonisjs/transmit/services/main"
import Sound from '../models/sound.js'
import fs from 'fs'

export default class SoundsController {
    async upload(ctx: HttpContext) {

        const fileName = ctx.request.all()['file_name']
        const effect = ctx.request.all()['is_effect']

        console.log("Uploading sound", fileName)

        const sound = ctx.request.file('sound',{
            size: "100mb",
            extnames: ['mp3','wav','ogg']
        })

        if(sound){
            const soundPath = app.makePath(`storage/sounds`)
            
            await sound.move(soundPath)

            // Create a new sound record in the database
            const newSound = new Sound()

            newSound.name = fileName
            newSound.url = `storage/sounds/${fileName}`

            if (effect === '1'){
                newSound.effect = true
            }else{
                newSound.effect = false
            }

            await newSound.save()

            return ctx.response.json({message: 'Sound uploaded successfully'})
        }
    }

    async delete(ctx: HttpContext) {
        const {sound_name} = ctx.request.all()

        console.log("Deleting sound", sound_name)

        const sound = await Sound.findBy('name', sound_name)

        if(sound){
            await sound.delete()

            // Delete the file from the storage

            const soundPath = app.makePath(`storage/sounds/${sound_name}`)
            await fs.promises.unlink(soundPath)

            return ctx.response.json({message: 'Sound deleted successfully'})
        }
    }

    async list(ctx: HttpContext) {
        
        const sounds = await Sound.query()
        .select('name','url','effect')

        console.log("Sounds", sounds.length)

        return ctx.response.ok({sounds: sounds, status: 200})
    }

    async playSound(ctx: HttpContext) {
        const {sound_name, map_id} = ctx.request.all()

        const sound = await Sound.findBy('name', sound_name)

        console.log("Playing sound", sound?.name)

        if(sound){

            transmit.broadcast(`playSound:map_${map_id}`,{
                action: 'play',
                sound_url: sound.url,
                effect: sound.effect
            })
        }
    }

    async stopSound(ctx: HttpContext) {
        const {map_id} = ctx.request.all()

        transmit.broadcast(`playSound:map_${map_id}`,{
            action: 'stop'
        })
    }
}