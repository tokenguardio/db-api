import { format } from "util";
import * as _ from "lodash";
import Dapps, {
  DappsInitializer,
  DappsMutator,
} from "../models/dapp_analytics/Dapps";
import { externalKnexInstances } from "../knex-instances";

export const saveDapp = async (
  dappData: DappsInitializer
): Promise<Pick<Dapps, "id">> => {
  try {
    const [result] = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ]
      .withSchema("dapp_analytics")
      .insert({
        name: dappData.name,
        logo: dappData.logo,
        blockchain: dappData.blockchain,
        website: dappData.website,
        from_block: dappData.from_block,
        added_by: dappData.added_by,
        abis: JSON.stringify(dappData.abis),
        created_at: new Date(),
        updated_at: new Date(),
      })
      .into("dapps")
      .returning("id");

    return result;
  } catch (error) {
    console.error("Error saving the dApp:", error);
    throw error;
  }
};

export const getDapp = async (id: string): Promise<Dapps | undefined> => {
  const dapp = await externalKnexInstances[process.env.DAPP_ANALYTICS_DB_NAME]
    .withSchema("dapp_analytics")
    .from("dapps")
    .where("id", id)
    .first();

  return dapp;
};

export const getAllDapps = async (): Promise<Dapps[] | undefined> => {
  try {
    const dapps = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ]
      .withSchema("dapp_analytics")
      .select(
        "id",
        "name",
        "blockchain",
        "logo",
        "website",
        "added_by",
        "created_at",
        "updated_at"
      )
      .from("dapps");
    return dapps;
  } catch (error) {
    console.error("Failed to retrieve all dApps:", error);
    throw error;
  }
};

export const updateDapp = async (
  id: string,
  dappData: DappsMutator
): Promise<boolean> => {
  try {
    const updateCount = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ]
      .withSchema("dapp_analytics")
      .from("dapps")
      .where("id", id)
      .update({
        name: dappData.name,
        logo: dappData.logo,
        blockchain: dappData.blockchain,
        website: dappData.website,
        from_block: dappData.from_block,
        added_by: dappData.added_by,
        abis: dappData.abis ? JSON.stringify(dappData.abis) : undefined,
        updated_at: new Date(),
      });

    return updateCount > 0;
  } catch (error) {
    console.error("Error updating the dApp:", error);
    return false;
  }
};

export const getDappIndexerStatus = async (
  id: string
): Promise<Dapps | undefined> => {
  try {
    const dappStatus = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ]
      .withSchema(`${id}_state`)
      .from("status")
      .select("height")
      .first();
    return dappStatus;
  } catch (error) {
    console.error("Error reading dApp status:", error);
    return null;
  }
};

interface ArgCondition {
  operator: ">" | "<" | ">=" | "<=" | "=" | "!=" | string;
  value: number | string | boolean;
}

interface ArgFilter {
  type: "number" | "string" | "boolean" | "integer";
  conditions?: ArgCondition[];
  value?: string | boolean;
}

interface GetMetricsRequest {
  breakdown?: boolean;
  filters?: Filter[];
}
interface Filter {
  name?: string;
  type?: string;
  args?: Record<string, ArgFilter>;
}

const generateDateSeries = (): string[] => {
  const dates = [];
  const currentDate = new Date();
  for (let i = 0; i < 90; i++) {
    const date = new Date(currentDate);
    date.setDate(currentDate.getDate() - i);
    dates.push(date.toISOString().split("T")[0]);
  }
  return dates.reverse();
};

const buildQueryForFilter = (
  dAppId: string,
  filter: Filter,
  breakdown: boolean,
  metric: "wallets" | "interactions" | "transferredTokens"
): { query: string; values: any[] } => {
  const dapp_activity_table = `"dapp_analytics"."dapp_analytics_${dAppId}"`;
  const conditions: string[] = [];
  const values: any[] = [];

  if (filter.name) {
    conditions.push("src.name ILIKE ? ");
    values.push(`%${filter.name.replace("::", "_")}%`);
  }
  console.log(`Filter: ${JSON.stringify(filter)}`);
  if (filter.args) {
    for (const [key, argFilter] of Object.entries(filter.args)) {
      const actualKey = _.camelCase(key);
      console.log(`key: ${key}, actualKey: ${actualKey}`);
      if (
        (argFilter.type === "integer" || argFilter.type === "number") &&
        argFilter.conditions
      ) {
        for (const condition of argFilter.conditions) {
          if (condition.operator && condition.value !== undefined) {
            conditions.push(
              `(decoded_args->>'${actualKey}')::double precision ${condition.operator} ?`
            );
            values.push(condition.value);
          }
        }
      } else if (argFilter.type === "string" && argFilter.value) {
        conditions.push(`decoded_args->>'${actualKey}' ILIKE ?`);
        values.push(`%${argFilter.value}%`);
      } else if (
        argFilter.type === "boolean" &&
        argFilter.value !== undefined
      ) {
        const booleanValue =
          argFilter.value === true ||
          argFilter.value === "true" ||
          argFilter.value === "t" ||
          argFilter.value === "1";
        conditions.push(`(decoded_args->>'${actualKey}')::boolean = ?`);
        values.push(booleanValue);
      }
    }
  }

  if (filter.type) {
    conditions.push("src.type = ?");
    values.push(filter.type);
  }

  const whereClause =
    conditions.length > 0 ? `${conditions.join(" AND ")}` : "";

  let metricSelection;
  if (metric === "wallets") {
    metricSelection = "src.caller AS caller";
  } else if (metric === "interactions") {
    metricSelection = "COUNT(src.*) AS interactions";
  } else if (metric === "transferredTokens") {
    // eslint-disable-next-line quotes
    metricSelection = 'SUM(src.value) AS "transferredTokens"';
  }

  const metricColumn = metric === "wallets" ? ", src.caller" : " ";

  const query = `
    WITH date_series AS (
      SELECT generate_series(
        CURRENT_DATE - INTERVAL '89 days',
        CURRENT_DATE,
        '1 day'::interval
      ) AS day
    )
    SELECT 
      TO_CHAR(date_series.day, 'YYYY-MM-DD') AS dimension,
      ${metricSelection}
      ${breakdown ? ", COALESCE(src.contract, 'Unknown') AS contract" : ""}
    FROM 
      date_series
    LEFT JOIN 
      (SELECT * FROM ${dapp_activity_table} 
      WHERE timestamp >= CURRENT_DATE - INTERVAL '89 days') src      
      ON DATE(src.timestamp) = date_series.day 
      ${whereClause ? `AND ${whereClause}` : " "}
    GROUP BY
      date_series.day ${metricColumn}
      ${breakdown ? ", src.contract" : " "}
    ORDER BY
      date_series.day
  `;

  return { query, values };
};

const getDataForFilter = async (
  dAppId: string,
  filter: Filter,
  breakdown: boolean,
  metric: "wallets" | "interactions" | "transferredTokens"
): Promise<Map<string, Map<string, Set<string> | number>>> => {
  const { query, values } = buildQueryForFilter(
    dAppId,
    filter,
    breakdown,
    metric
  );

  try {
    console.log(`Final Query for Filter: ${filter.name}`);
    console.log(`Query: ${query}`);
    console.log(`Values: ${values}`);

    const result = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ].raw(query, values);

    const dApp = await getDapp(dAppId);
    if (!dApp) {
      throw new Error(`dApp with ID ${dAppId} not found`);
    }

    // Create a map to translate contract addresses to their names
    const addressToNameMap = new Map<string, string>();
    dApp.abis.forEach((abiEntry: any) => {
      addressToNameMap.set(abiEntry.address, abiEntry.name);
    });

    const dataMap = new Map<string, Map<string, Set<string> | number>>();
    result.rows.forEach((row: any) => {
      const dimension = row.dimension;
      const contractAddress = breakdown ? row.contract : "NoBreakdown";
      const contractName =
        addressToNameMap.get(contractAddress) || contractAddress;

      if (!dataMap.has(dimension)) {
        dataMap.set(dimension, new Map<string, Set<string> | number>());
      }

      if (metric === "wallets") {
        const caller = row.caller;
        if (caller !== null) {
          if (!dataMap.get(dimension)!.has(contractName)) {
            dataMap.get(dimension)!.set(contractName, new Set<string>());
          }
          (dataMap.get(dimension)!.get(contractName) as Set<string>).add(
            caller
          );
        }
      } else if (metric === "interactions") {
        const interactions = row.interactions;
        if (!dataMap.get(dimension)!.has(contractName)) {
          dataMap.get(dimension)!.set(contractName, 0);
        }
        dataMap.get(dimension)!.set(contractName, interactions);
      } else if (metric === "transferredTokens") {
        const transferredTokens = row.transferredTokens;
        if (!dataMap.get(dimension)!.has(contractName)) {
          dataMap.get(dimension)!.set(contractName, 0);
        }
        dataMap.get(dimension)!.set(contractName, transferredTokens);
      }
    });

    return dataMap;
  } catch (error) {
    throw new Error(`Error executing query for filter: ${error.message}`);
  }
};

const intersectTransferredTokensByDay = (
  maps: Map<string, Map<string, number>>[],
  breakdown: boolean
): object[] => {
  const result: object[] = [];
  const dateSeries = generateDateSeries();
  const allContracts = new Set<string>();

  // Collect all contracts
  maps.forEach((map) => {
    map.forEach((contracts) => {
      contracts.forEach((_, contract) => {
        if (contract !== "Unknown") {
          allContracts.add(contract);
        }
      });
    });
  });

  // Iterate over each date and each contract
  dateSeries.forEach((date) => {
    if (breakdown) {
      allContracts.forEach((contract) => {
        let totalTransferredTokens = 0;
        let allFiltersHaveTransferredTokens = true;

        for (let i = 0; i < maps.length; i++) {
          const currentMap = maps[i];
          if (currentMap.has(date) && currentMap.get(date)!.has(contract)) {
            totalTransferredTokens += currentMap.get(date)!.get(contract)!;
          } else {
            allFiltersHaveTransferredTokens = false;
            break;
          }
        }

        result.push({
          dimension: date,
          differential: contract,
          transferredTokens: allFiltersHaveTransferredTokens
            ? totalTransferredTokens
            : 0,
        });
      });
    } else {
      let totalTransferredTokens = 0;
      let allFiltersHaveTransferredTokens = true;

      for (let i = 0; i < maps.length; i++) {
        const currentMap = maps[i];
        if (currentMap.has(date)) {
          let dayTransferredTokens = 0;
          currentMap.get(date)!.forEach((transferredTokens) => {
            dayTransferredTokens += transferredTokens;
          });

          if (dayTransferredTokens > 0) {
            totalTransferredTokens += dayTransferredTokens;
          } else {
            allFiltersHaveTransferredTokens = false;
            break;
          }
        } else {
          allFiltersHaveTransferredTokens = false;
          break;
        }
      }

      result.push({
        dimension: date,
        transferredTokens: allFiltersHaveTransferredTokens
          ? totalTransferredTokens
          : 0,
      });
    }
  });

  return result;
};
const intersectInteractionsByDay = (
  maps: Map<string, Map<string, number>>[],
  breakdown: boolean
): object[] => {
  const result: object[] = [];
  const dateSeries = generateDateSeries();
  const allContracts = new Set<string>();

  // Collect all contracts
  maps.forEach((map) => {
    map.forEach((contracts) => {
      contracts.forEach((_, contract) => {
        if (contract !== "Unknown") {
          allContracts.add(contract);
        }
      });
    });
  });

  // Iterate over each date and each contract
  dateSeries.forEach((date) => {
    if (breakdown) {
      allContracts.forEach((contract) => {
        let minCommonInteractions = Number.MAX_SAFE_INTEGER;
        let allFiltersHaveInteractions = true;

        for (let i = 0; i < maps.length; i++) {
          const currentMap = maps[i];
          if (currentMap.has(date) && currentMap.get(date)!.has(contract)) {
            minCommonInteractions = Math.min(
              minCommonInteractions,
              currentMap.get(date)!.get(contract)!
            );
          } else {
            allFiltersHaveInteractions = false;
            break;
          }
        }

        result.push({
          dimension: date,
          differential: contract,
          interactions: allFiltersHaveInteractions ? minCommonInteractions : 0,
        });
      });
    } else {
      let minCommonInteractions = Number.MAX_SAFE_INTEGER;
      let allFiltersHaveInteractions = true;

      for (let i = 0; i < maps.length; i++) {
        const currentMap = maps[i];
        if (currentMap.has(date)) {
          let dayInteractions = 0;
          currentMap.get(date)!.forEach((interactions) => {
            dayInteractions += interactions;
          });

          if (dayInteractions > 0) {
            minCommonInteractions = Math.min(
              minCommonInteractions,
              dayInteractions
            );
          } else {
            allFiltersHaveInteractions = false;
            break;
          }
        } else {
          allFiltersHaveInteractions = false;
          break;
        }
      }

      result.push({
        dimension: date,
        interactions: allFiltersHaveInteractions ? minCommonInteractions : 0,
      });
    }
  });

  return result;
};
const intersectWalletsByDay = (
  maps: Map<string, Map<string, Set<string>>>[],
  breakdown: boolean
): object[] => {
  const result: object[] = [];
  const dateSeries = generateDateSeries();
  const allContracts = new Set<string>();

  // Collect all contracts
  maps.forEach((map) => {
    map.forEach((contracts) => {
      contracts.forEach((_, contract) => {
        allContracts.add(contract);
      });
    });
  });

  // Iterate over each date and each contract
  dateSeries.forEach((date) => {
    if (breakdown) {
      allContracts.forEach((contract) => {
        let intersection = new Set<string>();

        for (let i = 0; i < maps.length; i++) {
          const currentMap = maps[i];
          if (currentMap.has(date) && currentMap.get(date)!.has(contract)) {
            const currentSet = currentMap.get(date)!.get(contract)!;
            if (i === 0) {
              intersection = new Set(currentSet as Set<string>);
            } else {
              intersection = new Set(
                [...intersection].filter((wallet) =>
                  (currentSet as Set<string>).has(wallet)
                )
              );
            }
          } else {
            intersection = new Set();
            break;
          }
        }

        result.push({
          dimension: date,
          differential: contract,
          wallets: intersection.size,
        });
      });
    } else {
      let intersection = new Set<string>();

      for (let i = 0; i < maps.length; i++) {
        const currentMap = maps[i];
        if (currentMap.has(date)) {
          currentMap.get(date)!.forEach((wallets) => {
            if (i === 0) {
              intersection = new Set(wallets as Set<string>);
            } else {
              intersection = new Set(
                [...intersection].filter((wallet) =>
                  (wallets as Set<string>).has(wallet)
                )
              );
            }
          });
        } else {
          intersection = new Set();
          break;
        }
      }

      result.push({
        dimension: date,
        wallets: intersection.size,
      });
    }
  });

  return result;
};
export const getUniqueWallets = async (
  dAppId: string,
  body: GetMetricsRequest
): Promise<object[]> => {
  const filters =
    body.filters.length > 0
      ? body.filters
      : [{ name: null, type: null, args: {} }];
  const breakdown = body.breakdown || false;

  const filterResults = await Promise.all(
    filters.map((filter) =>
      getDataForFilter(dAppId, filter, breakdown, "wallets")
    )
  );

  return intersectWalletsByDay(
    filterResults as Map<string, Map<string, Set<string>>>[],
    breakdown
  );
};

export const getInteractions = async (
  dAppId: string,
  body: GetMetricsRequest
): Promise<object[]> => {
  const filters =
    body.filters.length > 0
      ? body.filters
      : [{ name: null, type: null, args: {} }];
  const breakdown = body.breakdown || false;

  const filterResults = await Promise.all(
    filters.map((filter) =>
      getDataForFilter(dAppId, filter, breakdown, "interactions")
    )
  );

  return intersectInteractionsByDay(
    filterResults as Map<string, Map<string, number>>[],
    breakdown
  );
};

export const getTransferredTokens = async (
  dAppId: string,
  body: GetMetricsRequest
): Promise<object[]> => {
  const filters =
    body.filters.length > 0
      ? body.filters
      : [{ name: null, type: null, args: {} }];
  const breakdown = body.breakdown || false;

  const filterResults = await Promise.all(
    filters.map((filter) =>
      getDataForFilter(dAppId, filter, breakdown, "transferredTokens")
    )
  );

  return intersectTransferredTokensByDay(
    filterResults as Map<string, Map<string, number>>[],
    breakdown
  );
};

export const getDappDataMetrics = async (
  dAppId: string,
  metric: string,
  body: GetMetricsRequest
): Promise<object[]> => {
  switch (metric) {
    case "wallets":
      return getUniqueWallets(dAppId, body);
    case "interactions":
      return getInteractions(dAppId, body);
    case "transferredTokens":
      return getTransferredTokens(dAppId, body);
    default:
      throw new Error(`Unknown metric: ${metric}`);
  }
};
