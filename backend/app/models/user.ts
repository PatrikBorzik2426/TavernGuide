import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import Campaign from './campaign.js'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Character from './character.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare login: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  @manyToMany(() => Campaign,{
    pivotTable: 'campaign_user',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'campaign_id',
    pivotColumns: ['user_id','campaign_id','is_dm'],
    pivotTimestamps: true
  })
  declare campaigns: ManyToMany<typeof Campaign> 

  @manyToMany(() => Character,{
    pivotTable: 'character_user',
    pivotForeignKey: 'user_id',
    pivotRelatedForeignKey: 'character_id',
    pivotColumns: ['user_id','character_id'],
    pivotTimestamps: true
  })
  declare characters: ManyToMany<typeof Character>
}