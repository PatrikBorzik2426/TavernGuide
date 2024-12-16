import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'campaigns'

  public async up() {
    // Create the campaigns table
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table.string('name').notNullable() // Campaign name
      table.text('description').nullable() // Campaign description
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    // Create the campaign_map pivot table
    this.schema.createTable('campaign_map', (table) => {
      table.increments('id') // Optional primary key for the pivot table
      table
        .integer('campaign_id')
        .unsigned()
        .references('id')
        .inTable('campaigns')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('map_id')
        .unsigned()
        .references('id')
        .inTable('maps')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('grid_x').notNullable() // X-coordinate on the grid
      table.integer('grid_y').notNullable() // Y-coordinate on the grid
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    // Drop pivot tables first to avoid foreign key conflicts
    this.schema.dropTable('campaign_map')
    // Drop the campaigns table
    this.schema.dropTable(this.tableName)
  }
}
