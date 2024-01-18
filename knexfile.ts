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
      host: process.env.DEV_INTERNAL_HOST,
      user: process.env.DEV_INTERNAL_USER,
      password: process.env.DEV_INTERNAL_PASSWORD,
      database: process.env.DEV_INTERNAL_DB_NAME,
      port: parseInt(process.env.DEV_INTERNAL_PORT || "", 10) || 5432,
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
      host: process.env.DEV_INTERNAL_HOST,
      user: process.env.DEV_INTERNAL_USER,
      password: process.env.DEV_INTERNAL_PASSWORD,
      database: process.env.DEV_INTERNAL_DB_NAME,
      port: parseInt(process.env.DEV_INTERNAL_PORT || "", 10) || 5432,
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
