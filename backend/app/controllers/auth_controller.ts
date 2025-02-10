/* eslint-disable prettier/prettier */
import type { HttpContext } from '@adonisjs/core/http'
import User from '../models/user.js'

export default class AuthController {
    async register(ctx: HttpContext) {
        const { username, password, email } = ctx.request.all()

        console.log("New registration with username: " + username + " and email: " + email)

        try{
            const user = await User.create({password: password, login: username, email: email})

            const token = await User.accessTokens.create(user)

            return ctx.response.ok({user, token, status: 200})
        }catch(e){
            return ctx.response.badRequest(e)
        }
    }

    async login(ctx: HttpContext) {
        
        const { username, password } = ctx.request.all()

        console.log("Login attempt with username: " + username)

        try{
            const user = await User.findBy('login', username)

            const validUser = await user?.verifyPassword(password)

            if(!validUser){
                return ctx.response.badRequest({message: "Invalid credentials", status: 401})
            }

            if(user){
                const token = await User.accessTokens.create(user)

                return ctx.response.ok({user, token, status: 200})
            }else{
                return ctx.response.badRequest({message: "User not found", status: 404})
            }
        }catch(e){
            return ctx.response.badRequest(e)
        }       
    }

    async simpleAuthorization(ctx: HttpContext) {
        const user = ctx.auth.user

        if(!user){
            return ctx.response.badRequest({message: "User not found",  status: 404})
        }else{
            return ctx.response.ok({message: "User found, welcome!", user: user, status: 200})
        }
    }

    async logout(ctx: HttpContext) {
        console.log("Logout attempt")
        
        const user = ctx.auth.user

        if (user){
            console.log("Logout attempt with username: " + user.login)
        }

        if(!user){
            return ctx.response.badRequest({message: "User not found", status: 404})
        }else{
            
            await User.accessTokens.delete(user, user.currentAccessToken.identifier)
            return ctx.response.ok({user,message: "User found, goodbye!", status: 200})
        }
    }

}