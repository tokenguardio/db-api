import type { Knex } from "knex";
import dotenv from "dotenv";
import { types } from "pg";

dotenv.config({ path: ".env" });

types.setTypeParser(types.builtins.DATE, (val) => val);
types.setTypeParser(types.builtins.INT8, "text", parseInt);
types.setTypeParser(types.builtins.NUMERIC, Number);

interface Configs {
  [key: string]: Knex.Config;
}

const createKnexConfig = (dbName: string, directory?: string): Knex.Config => ({
  client: "postgresql",
  connection: {
    host: process.env.DATA_DB_HOST,
    user: process.env.DATA_DB_USER,
    password: process.env.DATA_DB_PASSWORD,
    database: dbName,
    port: parseInt(process.env.DATA_DB_PORT || "5432", 10),
  },
  pool: {
    min: 0,
    max: 10,
  },
  migrations: {
    directory: directory || "./migrations", // Use the default directory or a custom one
    tableName: "knex_migrations",
  },
});

const databaseNames =
  process.env.NODE_ENV === "development"
    ? ["crosschain"]
    : (process.env.DATA_DB_NAMES || "").split(",");

const externalConfigs: Configs = databaseNames.reduce(
  (configs: Configs, dbName: string) => {
    const migrationsDirectory =
      dbName === "crosschain" && process.env.NODE_ENV === "development"
        ? "./migrations/externalDb"
        : "./migrations";

    configs[dbName] = createKnexConfig(dbName, migrationsDirectory);
    return configs;
  },
  {}
);

export default externalConfigs;
