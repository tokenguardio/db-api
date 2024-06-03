import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex
    .raw("CREATE SCHEMA IF NOT EXISTS dapp_analytics")
    .then(() => {
      return knex.raw("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"");
    })
    .then(() => {
      return knex.schema
        .withSchema("dapp_analytics")
        .createTable("dapps", (table) => {
          table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
          table.text("name").notNullable();
          table.text("logo");
          table.text("blockchain").notNullable();
          table.text("website");
          table.bigInteger("from_block");
          table.text("added_by");
          table.jsonb("abis").notNullable().defaultTo("[]");
          table.timestamp("created_at").defaultTo(knex.fn.now());
          table.timestamp("updated_at").defaultTo(knex.fn.now());
        });
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .withSchema("dapp_analytics")
    .dropTable("dapps")
    .then(function () {
      return knex.raw("DROP EXTENSION IF EXISTS \"uuid-ossp\"");
    });
}
