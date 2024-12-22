import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import Campaign from './campaign.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Character from './character.js'
import MapObject from './map_object.js'

export default class Map extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare image_url: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  
  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Campaign,{
    pivotTable: 'campaign_map',
    pivotForeignKey: 'map_id',
    pivotRelatedForeignKey: 'campaign_id',
    pivotColumns: ['map_id','campaign_id','grid_x','grid_y', 'active'],
    pivotTimestamps: true
  })
  declare campaigns: ManyToMany<typeof Campaign>

  @manyToMany(() => Character,{
    pivotTable: 'character_map',
    pivotForeignKey: 'map_id',
    pivotRelatedForeignKey: 'character_id',
    pivotColumns: ['character_id','map_id','user_id','x','y','health','current_health', 'speed', 'armour', 'initiative', 'status', 'fov','hidden'],
    pivotTimestamps: true
  })
  declare characters: ManyToMany<typeof Character>

  @manyToMany(() => MapObject,{
    pivotTable: 'map_map_object',
    pivotForeignKey: 'map_id',
    pivotRelatedForeignKey: 'map_object_id',
    pivotColumns: ['map_id','map_object_id','x','y','size','hidden'],
    pivotTimestamps: true
  })
  declare map_objects: ManyToMany<typeof MapObject>
  
}