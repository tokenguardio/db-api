import knex, { Knex } from "knex";
import internalConfigs from "../../knexfile";
import externalConfigs from "../../knexfile-external";

interface KnexInstancesMap {
  [key: string]: Knex;
}

const internalKnexInstance =
  process.env.NODE_ENV === "production"
    ? knex(internalConfigs["production"])
    : knex(internalConfigs["development"]);

const externalKnexInstances = Object.keys(
  externalConfigs
).reduce<KnexInstancesMap>((instances, dbName) => {
  instances[dbName] = knex(externalConfigs[dbName]);
  return instances;
}, {});

export { internalKnexInstance, externalKnexInstances };
