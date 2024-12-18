import { DateTime } from 'luxon'
import { BaseModel, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import type { HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Map from './map.js'
import Note from './note.js'

export default class Campaign extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()

  declare description: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => User,{
    pivotTable: 'campaign_user',
    pivotForeignKey: 'campaign_id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['campaign_id','user_id','is_dm'],
    pivotTimestamps: true
  })
  declare users: ManyToMany<typeof User>

  @manyToMany(() => Map,{
    pivotTable: 'campaign_map',
    pivotForeignKey: 'campaign_id',
    pivotRelatedForeignKey: 'map_id',
    pivotColumns: ['campaign_id', 'map_id','grid_x','grid_y'],
    pivotTimestamps: true
  })
  declare maps: ManyToMany<typeof Map>

  @hasOne(() => Note)
  declare note: HasOne<typeof Note>
}