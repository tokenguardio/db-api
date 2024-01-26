import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable("queries", function (table) {
    table
      .json("parameters")
      .comment(
        "@type(StoredParameters, '../../../types/queries', true, false, false)"
      )
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // The down migration should revert the change made in the up migration
  return knex.schema.alterTable("queries", function (table) {
    table
      .json("parameters")
      .comment(
        "@type(Parameters, '../../../types/queries', true, false, false)"
      )
      .alter();
  });
}
