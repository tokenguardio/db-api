import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("queries", function (table) {
    table
      .jsonb("version_history")
      .defaultTo("[]")
      .comment(
        "Array of previous versions of the query, parameters, database, and label"
      );
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable("queries", function (table) {
    table.dropColumn("version_history");
  });
}
