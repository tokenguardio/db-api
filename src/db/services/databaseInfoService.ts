import knex from "knex";
import externalKnexConfigs from "../../../knexfile-external";

const fetchAllDatabases = async () => {
  const query = "SELECT datname FROM pg_database WHERE datistemplate = false;";
  try {
    const result = await knex(externalKnexConfigs["crosschain"]).raw(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching databases:", error);
    throw error;
  }
};

const fetchAllSchemas = async () => {
  const query = "SELECT schema_name FROM information_schema.schemata;";
  try {
    const result = await knex(externalKnexConfigs["crosschain"]).raw(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching schemas:", error);
    throw error;
  }
};

const fetchAllTables = async () => {
  const query =
    "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog');";
  try {
    const result = await knex(externalKnexConfigs["crosschain"]).raw(query);
    return result.rows;
  } catch (error) {
    console.error("Error fetching tables:", error);
    throw error;
  }
};

const fetchTableColumns = async (schema: string, table: string) => {
  const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ? AND table_schema = ?;
    `;
  try {
    const result = await knex(externalKnexConfigs["crosschain"]).raw(query, [
      table,
      schema,
    ]);
    return result.rows;
  } catch (error) {
    console.error(
      `Error fetching columns for table ${schema}.${table}:`,
      error
    );
    throw error;
  }
};

export {
  fetchAllDatabases,
  fetchAllSchemas,
  fetchAllTables,
  fetchTableColumns,
};
