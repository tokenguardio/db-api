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

interface ArgCondition {
  operator: ">" | "<" | ">=" | "<=" | "=" | "!=" | string;
  value: number | string | boolean;
}

interface ArgFilter {
  type: "integer" | "string" | "boolean";
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

interface ResultEntry {
  addresses: string[];
  dimension: string;
  contract?: string;
  [key: string]: any;
}

type ResultArray = ResultEntry[][];

const buildQuery = (
  dAppId: string,
  baseQuery: string,
  theFilter: Filter
): { query: string; values: any[] } => {
  const dapp_activity_table = `"dapp_analytics"."dapp_analytics_${dAppId}"`;
  const conditions: string[] = [];
  const values: any[] = [];

  if (theFilter.name) {
    conditions.push(`${dapp_activity_table}.name ILIKE ?`);
    values.push(`%${theFilter.name}%`);
  }

  if (theFilter.args) {
    for (const [key, filter] of Object.entries(theFilter.args)) {
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

  if (theFilter.type) {
    conditions.push(`${dapp_activity_table}.type = ?`);
    values.push(theFilter.type);
  }

  const whereClause =
    conditions.length > 0 ? `AND ${conditions.join(" AND ")}` : "";

  const query = `${baseQuery} ${whereClause}`.trim();

  return { query, values };
};

export const getDappDataMetrics = async (
  dAppId: string,
  metric: string,
  body: GetMetricsRequest
): Promise<object[]> => {
  const defaultNoneFilter: Filter = {
    name: null,
    type: null,
    args: {},
  };
  const dapp_activity_table = `"dapp_analytics"."dapp_analytics_${dAppId}"`;
  const commonQueryPart = `
    WITH RECURSIVE date_series AS (
        SELECT CURRENT_DATE - INTERVAL '89 days' AS day
        UNION ALL
        SELECT day + INTERVAL '1 day'
        FROM date_series
        WHERE day + INTERVAL '1 day' <= CURRENT_DATE
    )
    SELECT 
        TO_CHAR(date_series.day, 'YYYY-MM-DD') AS dimension,
        COALESCE(<<METRIC>>, 0) AS ${metric},
        ${
          body.breakdown
            ? `COALESCE(${dapp_activity_table}.contract, 'Unknown') AS contract,`
            : ""
        }
        COALESCE(
            CASE 
                WHEN COUNT(DISTINCT ${dapp_activity_table}.caller) > 0 
                  THEN JSON_AGG(DISTINCT ${dapp_activity_table}.caller)::jsonb
                ELSE '[]'::jsonb
            END,
            '[]'::jsonb
        ) AS addresses
    FROM 
        date_series
    LEFT JOIN 
        ${dapp_activity_table} 
            ON DATE(${dapp_activity_table}.timestamp) = date_series.day
  `;

  let metricQueryPart: string;
  switch (metric) {
    case "wallets":
      metricQueryPart = `
        COUNT(DISTINCT ${dapp_activity_table}.caller)
      `;
      break;
    case "transferredTokens":
      metricQueryPart = `
        SUM(${dapp_activity_table}.value)
      `;
      break;
    case "interactions":
      metricQueryPart = `
        COUNT(${dapp_activity_table}.timestamp)
      `;
      break;
    default:
      throw new Error("Invalid metric");
  }

  const baseQuery = commonQueryPart.replace(/<<METRIC>>/g, metricQueryPart);

  const results: ResultEntry[][] = [];

  for (const filter of body.filters || [defaultNoneFilter]) {
    const { query, values } = buildQuery(dAppId, baseQuery, filter);

    const finalQuery = `${query} ${
      body.breakdown
        ? `GROUP BY date_series.day, ${dapp_activity_table}.contract`
        : `GROUP BY date_series.day, ${dapp_activity_table}.type`
    } ORDER BY date_series.day`;

    try {
      console.log(`Final Query: ${finalQuery}`);
      console.log(`Values: ${values}`);

      const result = await externalKnexInstances[
        process.env.DAPP_ANALYTICS_DB_NAME
      ].raw(finalQuery, values);
      results.push(result.rows as ResultEntry[]);
    } catch (error) {
      throw new Error(`Error executing query: ${error.message}`);
    }
  }

  const combinedResult = intersectResults(results, metric);
  return combinedResult;
};

const intersectResults = (arr: ResultArray, metric: string): ResultEntry[] => {
  if (!arr || arr.length === 0) {
    return [];
  }

  const finalResult: ResultEntry[] = arr[0].map((entry1) => {
    const dimension = entry1.dimension;

    const matchingEntries = arr.map((result) => {
      return result.find((entry) => entry.dimension === dimension);
    });

    const addresses = matchingEntries.reduce<string[]>(
      (intersection, entry) => {
        if (!entry) return intersection;

        console.log(`Entry: ${JSON.stringify(entry, null, 2)}`);
        console.log(`Intersection: ${JSON.stringify(intersection)}`);

        const entryAddresses = entry.addresses || [];
        return intersection.filter((address) =>
          entryAddresses.includes(address)
        );
      },
      entry1.addresses || []
    );

    const matchingAddresses = (entry1.addresses || []).filter((address) =>
      addresses.includes(address)
    );

    const contract = matchingEntries.find((entry) =>
      entry ? entry.contract !== "Unknown" : false
    )?.contract;

    // Prepare the final entry object
    const finalEntry: ResultEntry = {
      dimension: entry1.dimension,
      addresses: matchingAddresses,
    };
    finalEntry[metric] = matchingAddresses.length;

    if (contract && contract !== "Unknown") {
      finalEntry.contract = contract;
    }

    return finalEntry;
  });

  return finalResult;
};
