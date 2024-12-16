import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Campaign from './campaign.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare content: string

  @belongsTo(() => Campaign,{
    foreignKey: 'campaign_id'
  })
  declare campaign: BelongsTo<typeof Campaign>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}