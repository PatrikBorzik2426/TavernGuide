import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import Map from './map.js'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'

export default class MapObject extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare type: ['interactive', 'static']

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Map,{
    pivotTable: 'map_map_object',
    pivotForeignKey: 'map_object_id',
    pivotRelatedForeignKey: 'map_id',
    pivotColumns: ['map_object_id','map_id','x','y','size','hidden'],
    pivotTimestamps: true
  })
  declare maps: ManyToMany<typeof Map>
}