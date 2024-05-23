import { Knex } from "knex";
interface KnexConfigMap {
  [key: string]: Knex.Config;
}

const internalConfigs: KnexConfigMap = {
  development: {
    client: "postgresql",
    connection: {
      host: process.env.DATA_DB_HOST || "postgres",
      user: process.env.DATA_DB_USER || "postgres",
      password: process.env.DATA_DB_PASSWORD || "postgres",
      database: process.env.DATA_DB_NAMES || "azero_mainnet_squid",
      port: parseInt(process.env.DATA_DB_PORT || "", 10) || 5432,
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

export default internalConfigs;
