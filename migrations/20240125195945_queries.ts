import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  const exists = await knex.schema.hasColumn("queries", "label");
  if (!exists) {
    return knex.schema.alterTable("queries", function (table) {
      table.text("label");
    });
  }
};

exports.down = function (knex: Knex): Promise<void> {
  return knex.schema.alterTable("queries", function (table) {
    table.dropColumn("label");
  });
};
