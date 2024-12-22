import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id') // Primary key
      table.string('login', 255).notNullable().unique() // User login
      table.string('email', 255).notNullable().unique() // User email
      table.string('password', 180).notNullable() // Encrypted password
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // Pivot table: campaign_user
    this.schema.createTable('campaign_user', (table) => {
      table.increments('id') // Primary key
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .notNullable()
      table
        .integer('campaign_id')
        .unsigned()
        .references('id')
        .inTable('campaigns')
        .onDelete('CASCADE')
        .notNullable()
      table.boolean('is_dm').notNullable().defaultTo(false) // Whether the user is the Dungeon Master
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })

    // // Pivot table: character_user
    // this.schema.createTable('character_user', (table) => {
    //   table.increments('id') // Primary key
    //   table
    //     .integer('user_id')
    //     .unsigned()
    //     .references('id')
    //     .inTable('users')
    //     .onDelete('CASCADE')
    //     .notNullable()
    //   table
    //     .integer('character_id')
    //     .unsigned()
    //     .references('id')
    //     .inTable('characters')
    //     .onDelete('CASCADE')
    //     .notNullable()
    //   table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
    //   table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    // })
  }

  public async down() {
    // this.schema.dropTable('character_user')
    this.schema.dropTable('campaign_user')
    this.schema.dropTable(this.tableName)
  }
}
