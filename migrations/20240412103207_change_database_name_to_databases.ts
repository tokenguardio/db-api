import type { Knex } from "knex";

exports.up = function (knex: Knex): Promise<void> {
  return knex.schema.table("queries", function (table) {
    table.renameColumn("database", "databases");
  });
};

exports.down = function (knex: Knex): Promise<void> {
  return knex.schema.table("queries", function (table) {
    table.renameColumn("databases", "database");
  });
};
