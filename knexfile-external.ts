import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

interface Configs {
  [key: string]: Knex.Config;
}

// Function to create a dynamic Knex configuration for a given database
const createKnexConfig = (dbName: string): Knex.Config => ({
  client: "postgresql",
  connection: {
    host: process.env.PROD_EXTERNAL_HOST,
    user: process.env.PROD_EXTERNAL_USER,
    password: process.env.PROD_EXTERNAL_PASSWORD,
    database: dbName,
    port: parseInt(process.env.PROD_EXTERNAL_PORT || "", 10) || 5432,
  },
});

// Get an array of database names from the DATABASE_NAMES environment variable
const databaseNames = (process.env.PROD_EXTERNAL_DB_NAMES || "").split(",");

// Generate dynamic configurations for each database name
const config: Configs = databaseNames.reduce(
  (configs: Configs, dbName: string) => {
    configs[dbName] = createKnexConfig(dbName);
    return configs;
  },
  {}
);

export default config;
