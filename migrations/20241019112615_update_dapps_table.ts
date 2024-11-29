import { Knex } from "knex";

exports.up = async function (knex: Knex): Promise<void> {
  const airdropContractExists = await knex.schema
    .withSchema("dapp_analytics")
    .hasColumn("dapps", "airdrop_contract");
  const airdropCurrencyExists = await knex.schema
    .withSchema("dapp_analytics")
    .hasColumn("dapps", "airdrop_currency_contract");

  // Perform the table alteration based on column existence
  return knex.schema
    .withSchema("dapp_analytics")
    .alterTable("dapps", function (table) {
      if (!airdropContractExists) {
        table.text("airdrop_contract");
      }
      if (!airdropCurrencyExists) {
        table.text("airdrop_currency_contract");
      }
    });
};

exports.down = function (knex: Knex): Promise<void> {
  return knex.schema
    .withSchema("dapp_analytics")
    .alterTable("dapps", function (table) {
      table.dropColumn("airdrop_contract");
      table.dropColumn("airdrop_currency_contract");
    });
};
