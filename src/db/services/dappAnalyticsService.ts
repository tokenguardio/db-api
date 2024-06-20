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

const buildQuery = (
  dAppId: string,
  baseQuery: string,
  filters: Filter[]
): { query: string; values: any[] } => {
  const dapp_activity_table = `"dapp_analytics"."dapp_analytics_${dAppId}"`;
  const conditions: string[] = [];
  const values: any[] = [];

  for (const filter of filters) {
    if (filter.name) {
      conditions.push(`${dapp_activity_table}.name ILIKE ?`);
      values.push(`%${filter.name}%`);
    }

    if (filter.args) {
      for (const [key, argFilter] of Object.entries(filter.args)) {
        if (argFilter.type === "integer" && argFilter.conditions) {
          for (const condition of argFilter.conditions) {
            if (condition.operator && condition.value !== undefined) {
              conditions.push(
                `(decoded_args->>'${key}')::integer ${condition.operator} ?`
              );
              values.push(condition.value);
            }
          }
        } else if (argFilter.type === "string" && argFilter.value) {
          conditions.push(`decoded_args->>'${key}' ILIKE ?`);
          values.push(`%${argFilter.value}%`);
        } else if (
          argFilter.type === "boolean" &&
          argFilter.value !== undefined
        ) {
          conditions.push(`(decoded_args->>'${key}')::boolean = ?`);
          values.push(argFilter.value);
        }
      }
    }

    if (filter.type) {
      conditions.push(`${dapp_activity_table}.type = ?`);
      values.push(filter.type);
    }
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

  // Combine all filters into a single query
  const filters = body.filters || [defaultNoneFilter];
  const { query, values } = buildQuery(dAppId, baseQuery, filters);

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

    const allDifferentials = new Set(
      result.rows
        .map((row) => row.contract)
        .filter((contract) => contract !== "Unknown")
    );

    // Transform and fill missing entries
    const transformedResult = [];
    const dateMap = new Map();

    for (const row of result.rows) {
      const dimension = row.dimension;
      const contract = row.contract || "Unknown";
      const wallets = row.wallets;

      if (!dateMap.has(dimension)) {
        dateMap.set(dimension, new Map());
      }
      dateMap.get(dimension).set(contract, wallets);
    }

    for (const [dimension, contractsMap] of dateMap.entries()) {
      for (const differential of allDifferentials) {
        transformedResult.push({
          dimension,
          differential,
          wallets: contractsMap.get(differential) || 0,
        });
      }
    }

    return transformedResult;
  } catch (error) {
    throw new Error(`Error executing query: ${error.message}`);
  }
};
