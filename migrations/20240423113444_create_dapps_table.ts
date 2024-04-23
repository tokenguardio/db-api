import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("dapps", function (table) {
    table.uuid("id").primary();
    table.string("name").notNullable().unique();
    table.string("slug").notNullable().unique();
    table.string("icon");
    table.specificType("blockchains", "TEXT[]");
    table.boolean("active").notNullable();
    table.boolean("dapp_growth_index").notNullable();
    table.boolean("defi_growth_index").notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable("dapps");
}
