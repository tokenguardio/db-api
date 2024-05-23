import type { Knex } from "knex";
import dotenv from "dotenv";
import { types } from "pg";

dotenv.config({ path: ".env.wasabi" });

types.setTypeParser(types.builtins.DATE, (val) => val);
types.setTypeParser(types.builtins.INT8, "text", parseInt);
types.setTypeParser(types.builtins.NUMERIC, Number);

interface Configs {
  [key: string]: Knex.Config;
}

// Function to create a dynamic Knex configuration for a given database
const createKnexConfig = (dbName: string): Knex.Config => ({
  client: "postgresql",
  connection: {
    host: process.env.DATA_DB_HOST,
    user: process.env.DATA_DB_USER,
    password: process.env.DATA_DB_PASSWORD,
    database: dbName,
    port: parseInt(process.env.DATA_DB_PORT || "", 10) || 5432,
  },
  pool: {
    min: 0,
    max: 10,
  },
});

// Get an array of database names from the DATABASE_NAMES environment variable
const databaseNames = (process.env.DATA_DB_NAMES || "").split(",");

// Generate dynamic configurations for each database name
const externalConfigs: Configs = databaseNames.reduce(
  (configs: Configs, dbName: string) => {
    configs[dbName] = createKnexConfig(dbName);
    return configs;
  },
  {}
);

export default externalConfigs;
