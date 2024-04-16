import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.table("queries", function (table) {
    table.text("description").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.table("queries", function (table) {
    table.dropColumn("description");
  });
}
