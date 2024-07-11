import { Knex } from "knex";
interface KnexConfigMap {
  [key: string]: Knex.Config;
}

const internalConfigs: KnexConfigMap = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DAPP_ANALYTICS_DB_HOST || "postgres",
      user: process.env.DAPP_ANALYTICS_DB_USER || "postgres",
      password: process.env.DAPP_ANALYTICS_DB_PASSWORD || "postgres",
      database: process.env.DAPP_ANALYTICS_DB_NAME || "dapp_analytics",
      port: parseInt(process.env.DAPP_ANALYTICS_DB_PORT || "", 10) || 5432,
    },
    pool: {
      min: 1,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
  production: {
    client: "postgresql",
    connection: {
      host: process.env.DAPP_ANALYTICS_DB_HOST || "postgres",
      user: process.env.DAPP_ANALYTICS_DB_USER || "postgres",
      password: process.env.DAPP_ANALYTICS_DB_PASSWORD || "postgres",
      database: process.env.DAPP_ANALYTICS_DB_NAME || "dapp_analytics",
      port: parseInt(process.env.DAPP_ANALYTICS_DB_PORT || "", 10) || 5432,
    },
    pool: {
      min: 1,
      max: 10,
    },
    migrations: {
      tableName: "knex_migrations",
    },
  },
};

export default internalConfigs;
