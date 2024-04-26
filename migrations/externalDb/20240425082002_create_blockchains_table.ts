import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable("blockchains_dict").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("blockchains_dict", function (table) {
        table.uuid("id").primary();
        table.string("name").notNullable();
        table.string("network").notNullable();
        table.string("slug").notNullable().unique();
        table.string("logo").notNullable();
        table.boolean("active").notNullable();
        table.boolean("growthindex").notNullable();
        table.boolean("dappgrowth").notNullable().defaultTo(false);
        table.string("database").defaultTo("");
        table.timestamps(true, true);
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("blockchains_dict");
}
