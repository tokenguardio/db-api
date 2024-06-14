import { format } from "util";
import Dapps, {
  DappsInitializer,
  DappsMutator,
} from "../models/dapp_analytics/Dapps";
import { externalKnexInstances } from "../knex-instances";

export const saveDapp = async (
  dappData: DappsInitializer
): Promise<Pick<Dapps, "id">> => {
  try {
    const [result] = await externalKnexInstances["dbapi"]
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
  const dapp = await externalKnexInstances["dbapi"]
    .withSchema("dapp_analytics")
    .from("dapps")
    .where("id", id)
    .first();

  return dapp;
};

export const getAllDapps = async (): Promise<Dapps[] | undefined> => {
  try {
    const dapps = await externalKnexInstances["dbapi"]
      .withSchema("dapp_analytics")
      .select()
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
    const updateCount = await externalKnexInstances["dbapi"]
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

interface DecodedArgCondition {
  operator: ">" | "<" | ">=" | "<=" | "=" | "!=" | string;
  value: number | string | boolean;
}

interface DecodedArgFilter {
  type: "integer" | "string" | "boolean";
  conditions?: DecodedArgCondition[];
  value?: string | boolean;
}

interface Filters {
  name?: string;
  type?: string;
  breakdown?: boolean;
  args?: Record<string, DecodedArgFilter>;
}

interface User {
  address: string;
}

interface ResultEntry {
  day: Date;
  contract?: string;
  user_count: number;
  users: User[];
}
type ResultArray = ResultEntry[][];


const buildQuery = (
  baseQuery: string,
  filters: Filters
): { query: string; values: any[] } => {
  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.name) {
    conditions.push("dapp_analytics.dapp_activity.name ILIKE ?");
    values.push(`%${filters.name}%`);
  }

  if (filters.args) {
    for (const [key, filter] of Object.entries(filters.args)) {
      if (filter.type === "integer" && filter.conditions) {
        for (const condition of filter.conditions) {
          if (condition.operator && condition.value !== undefined) {
            conditions.push(
              `(decoded_args->>'${key}')::integer ${condition.operator} ?`
            );
            values.push(condition.value);
          }
        }
      } else if (filter.type === "string" && filter.value) {
        conditions.push(`decoded_args->>'${key}' ILIKE ?`);
        values.push(`%${filter.value}%`);
      } else if (filter.type === "boolean" && filter.value !== undefined) {
        conditions.push(`(decoded_args->>'${key}')::boolean = ?`);
        values.push(filter.value);
      }
    }
  }

  if (filters.type) {
    conditions.push("dapp_analytics.dapp_activity.type = ?");
    values.push(filters.type);
  }

  const whereClause =
    conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  const query = `${baseQuery} ${whereClause}`.trim();

  return { query, values };
};

export const getDappDataMetrics = async (
  id: string,
  metric: string,
  filters: { breakdown: boolean; filters: Filters[] }
): Promise<object[]> => {
  const commonQueryPart = `
    WITH RECURSIVE date_series AS (
        SELECT CURRENT_DATE - INTERVAL '89 days' AS day
        UNION ALL
        SELECT day + INTERVAL '1 day'
        FROM date_series
        WHERE day + INTERVAL '1 day' <= CURRENT_DATE
    )
    SELECT 
        date_series.day,
        COALESCE(COUNT(DISTINCT dapp_analytics.dapp_activity.caller), 0) AS user_count,
        ${
          filters.breakdown
            ? "COALESCE(dapp_analytics.dapp_activity.contract, 'Unknown') AS contract,"
            : ""
        }
        COALESCE(
            CASE 
                WHEN COUNT(DISTINCT dapp_analytics.dapp_activity.caller) > 0 
                THEN JSON_AGG(DISTINCT JSON_BUILD_OBJECT('address', dapp_analytics.dapp_activity.caller)::jsonb)::jsonb
                ELSE '[]'::jsonb
            END,
            '[]'::jsonb
        ) AS users
    FROM 
        date_series
    LEFT JOIN 
        dapp_analytics.dapp_activity 
            ON DATE(dapp_analytics.dapp_activity.timestamp) = date_series.day
  `;

  const results = [];

  for (const filter of filters.filters) {
    const { query, values } = buildQuery(commonQueryPart, filter);

    const finalQuery = `${query} ${
      filters.breakdown
        ? "GROUP BY date_series.day, dapp_analytics.dapp_activity.contract"
        : "GROUP BY date_series.day, dapp_analytics.dapp_activity.type"
    } ORDER BY date_series.day`;

    try {
      console.log(`Final Query: ${finalQuery}`);
      console.log(`Values: ${values}`);

      const result = await externalKnexInstances["azero_mainnet_squid"].raw(
        finalQuery,
        values
      );
      results.push(result.rows);
    } catch (error) {
      throw new Error(`Error executing query: ${error.message}`);
    }
  }

  const combinedResult = intersectResults(results);

  // Transform combinedResult to include 'users' array
  // console.log(combinedResult[0].users);
  // const transformedResult = combinedResult.map((row) => ({
  //   ...row,
  //   users: row.users,
  // }));

  return combinedResult;
};

const intersectResults = (arr: ResultArray): ResultEntry[] => {
  if (!arr || arr.length === 0) {
    return [];
  }

  const finalResult: ResultEntry[] = arr[0].map((entry1) => {
    const day = entry1.day;

    const matchingEntries = arr.map((result) => {
      return result.find((entry) => entry.day.getTime() === day.getTime());
    });

    const addresses = matchingEntries.reduce(
      (intersection, entry) => {
        if (!entry) return intersection;

        const entryAddresses = entry.users.map((user) => user.address);

        return intersection.filter((address) =>
          entryAddresses.includes(address)
        );
      },
      entry1.users.map((user) => user.address)
    );

    const matchingUsers = entry1.users.filter((user) =>
      addresses.includes(user.address)
    );

    const contract = matchingEntries.find((entry) =>
      entry ? entry.contract !== "Unknown" : false
    )?.contract;

    const finalEntry: ResultEntry = {
      day: entry1.day,
      user_count: matchingUsers.length,
      users: matchingUsers,
    };

    if (contract && contract !== "Unknown") {
      finalEntry.contract = contract;
    }

    return finalEntry;
  });

  return finalResult;
};
