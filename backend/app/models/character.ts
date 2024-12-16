import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Map from './map.js'

export default class Character extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare health: number

  @column()
  declare armour: number

  @column()
  declare status: string

  @column()
  declare info: string

  @column()
  declare fov: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Map,{
    pivotTable: 'character_map',
    pivotForeignKey: 'character_id',
    pivotRelatedForeignKey: 'map_id',
    pivotColumns: ['character_id','map_id','x','y'],
    pivotTimestamps: true
  })
  declare maps: ManyToMany<typeof Map>

  @manyToMany(() => User,{
    pivotTable: 'character_user',
    pivotForeignKey: 'character_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['character_id','user_id','is_owner'],
    pivotTimestamps: true
  })
  declare users: ManyToMany<typeof User>
}