import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'characters'

  public async up() {
    // Create the characters table
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table.string('name').notNullable() // Character name
      // table.integer('health').notNullable() // Character health,
      // table.integer('current_health').nullable() // Character current health
      // table.integer('speed').nullable() // Character speed
      // table.integer('armour').notNullable() // Character armour
      // table.string('status').nullable() // Character status
      table.text('info_url').nullable() // Character information or backstory
      table.text('avatar_url').notNullable() // Character avatar
      // table.float('fov').notNullable() // Field of view
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(this.now())
    })
  }

  public async down() {
    // Drop the characters table
    this.schema.dropTable(this.tableName)
  }
}
