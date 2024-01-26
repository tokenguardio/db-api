import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("queries", function (table) {
    table.text("label");
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("queries", function (table) {
    table.dropColumn("label");
  });
}
