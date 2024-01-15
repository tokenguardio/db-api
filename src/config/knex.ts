import knex from "knex";

const createKnexInstance = (
  dbName: string,
  dbUser: string,
  dbPassword: string,
  dbHost: string,
  dbPort: string
): knex.Knex => {
  return knex({
    client: "pg",
    connection: {
      connectionString: `postgres://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`,
      ssl:
        process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
    },
    searchPath: ["public"],
  });
};

// Define an interface for the pgInstances object
interface PgInstances {
  [key: string]: knex.Knex<any, unknown[]>;
}

const pgInstances: PgInstances = {
  azeroTestnetSquid: createKnexInstance(
    process.env.AZERO_TESTNET_SQUID_NAME,
    process.env.AZERO_TESTNET_SQUID_USER,
    process.env.AZERO_TESTNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  reefMainnetSquid: createKnexInstance(
    process.env.REEF_MAINNET_SQUID_NAME,
    process.env.REEF_MAINNET_SQUID_USER,
    process.env.REEF_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  polkadotMainnetSquid: createKnexInstance(
    process.env.POLKADOT_MAINNET_SQUID_NAME,
    process.env.POLKADOT_MAINNET_SQUID_USER,
    process.env.POLKADOT_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  kusamaMainnetSquid: createKnexInstance(
    process.env.KUSAMA_MAINNET_SQUID_NAME,
    process.env.KUSAMA_MAINNET_SQUID_USER,
    process.env.KUSAMA_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  astarMainnetSquid: createKnexInstance(
    process.env.ASTAR_MAINNET_SQUID_NAME,
    process.env.ASTAR_MAINNET_SQUID_USER,
    process.env.ASTAR_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  arbitrumMainnetSquid: createKnexInstance(
    process.env.ARBITRUM_MAINNET_SQUID_NAME,
    process.env.ARBITRUM_MAINNET_SQUID_USER,
    process.env.ARBITRUM_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  crosschain: createKnexInstance(
    process.env.CROSSCHAIN_NAME,
    process.env.CROSSCHAIN_USER,
    process.env.CROSSCHAIN_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  azeroMainnetSquid: createKnexInstance(
    process.env.AZERO_MAINNET_SQUID_NAME,
    process.env.AZERO_MAINNET_SQUID_USER,
    process.env.AZERO_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  moonbeamMainnetSquid: createKnexInstance(
    process.env.MOONBEAM_MAINNET_SQUID_NAME,
    process.env.MOONBEAM_MAINNET_SQUID_USER,
    process.env.MOONBEAM_MAINNET_SQUID_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  offchain: createKnexInstance(
    process.env.OFFCHAIN_NAME,
    process.env.OFFCHAIN_USER,
    process.env.OFFCHAIN_PASSWORD,
    process.env.DB_HOST,
    process.env.DB_PORT
  ),
  local: createKnexInstance(
    process.env.LOCAL_DB_NAME,
    process.env.LOCAL_DB_USER,
    process.env.LOCAL_DB_PASSWORD,
    process.env.LOCAL_DB_HOST,
    process.env.LOCAL_DB_PORT
  ),
};

export default pgInstances;
