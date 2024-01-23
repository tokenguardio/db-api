import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

interface KnexConfigMap {
  [key: string]: Knex.Config;
}

const config: KnexConfigMap = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.QUERIES_DB_HOST,
      user: process.env.QUERIES_DB_USER,
      password: process.env.QUERIES_DB_PASSWORD,
      database: process.env.QUERIES_DB_NAME,
      port: parseInt(process.env.QUERIES_DB_PORT || "", 10) || 5432,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  production: {
    client: "postgresql",
    connection: {
      host: process.env.QUERIES_DB_HOST,
      user: process.env.QUERIES_DB_USER,
      password: process.env.QUERIES_DB_PASSWORD,
      database: process.env.QUERIES_DB_NAME,
      port: parseInt(process.env.QUERIES_DB_PORT || "", 10) || 5432,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};

// Export the configuration based on the NODE_ENV value
const exportedConfig =
  process.env.NODE_ENV === "production"
    ? config["production"]
    : config["development"];

export default exportedConfig;
