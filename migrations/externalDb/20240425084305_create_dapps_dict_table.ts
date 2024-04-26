import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.hasTable("dapps_blockchains").then(function (exists) {
    if (!exists) {
      return knex.schema.createTable("dapps_blockchains", function (table) {
        table
          .uuid("dapp_id")
          .references("id")
          .inTable("dapps_dict")
          .onDelete("CASCADE");
        table
          .uuid("blockchain_id")
          .references("id")
          .inTable("blockchains_dict")
          .onDelete("CASCADE");
        table.primary(["dapp_id", "blockchain_id"]);
      });
    }
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("dapps_blockchains");
}
