import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'maps'

  public async up() {
    // Create the maps table
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table.string('name').notNullable() // Map name
      table.string('image_url').notNullable() // URL for the map image
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    // Create the character_map pivot table
    this.schema.createTable('character_map', (table) => {
      table.increments('id') // Optional primary key for the pivot table
      table
        .integer('map_id')
        .unsigned()
        .references('id')
        .inTable('maps')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('character_id')
        .unsigned()
        .references('id')
        .inTable('characters')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('x').notNullable() // X-coordinate of the character
      table.integer('y').notNullable() // Y-coordinate of the character
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })

    // Create the map_map_object pivot table
    this.schema.createTable('map_map_object', (table) => {
      table.increments('id') // Optional primary key for the pivot table
      table
        .integer('map_id')
        .unsigned()
        .references('id')
        .inTable('maps')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('map_object_id')
        .unsigned()
        .references('id')
        .inTable('map_objects')
        .onDelete('CASCADE')
        .notNullable()
      table.integer('x').notNullable() // X-coordinate of the object
      table.integer('y').notNullable() // Y-coordinate of the object
      table.integer('size').notNullable() // Size of the object
      table.boolean('hidden').defaultTo(false) // Indicates if the object is hidden
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    // Drop pivot tables first to avoid foreign key conflicts
    this.schema.dropTable('map_map_object')
    this.schema.dropTable('character_map')
    // Drop the maps table
    this.schema.dropTable(this.tableName)
  }
}
