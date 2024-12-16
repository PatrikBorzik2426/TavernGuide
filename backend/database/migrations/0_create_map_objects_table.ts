import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'map_objects'

  public async up() {
    // Create the map_objects table
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table.string('name').notNullable() // Name of the map object
      table.enum('type', ['interactive', 'static']).notNullable() // Type of the map object
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    // Drop the map_objects table
    this.schema.dropTable(this.tableName)
  }
}
