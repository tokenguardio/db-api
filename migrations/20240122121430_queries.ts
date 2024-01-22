import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("queries", function (table) {
    table.increments("id").primary();
    table.text("query").notNullable();
    table
      .json("parameters")
      .comment("@type(Parameters, '../../types/queries', true, false, false)");
    table.text("database").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("queries");
}
