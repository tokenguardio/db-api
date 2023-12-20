import { Request, Response } from "express";
import pg from "../config/knex";

export enum ChainName {
  AlephZero = "aleph-zero",
  Arbitrum = "arbitrum",
  Avalanche = "avalanche",
  BSC = "bsc",
  Canto = "canto",
  Ethereum = "ethereum",
  Fantom = "fantom",
  Near = "near",
  Optimism = "optimism",
  Polygon = "polygon",
  Solana = "solana",
}

export const getGrowthIndex = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    tableName,
    dateColumn,
    interval,
    aggregateColumn,
    aggregateFunction = "COUNT",
    daysAgo,
  } = req.query;

  if (
    typeof tableName !== "string" ||
    typeof dateColumn !== "string" ||
    typeof interval !== "string" ||
    typeof aggregateColumn !== "string" ||
    (aggregateFunction && typeof aggregateFunction !== "string") ||
    !daysAgo ||
    Array.isArray(daysAgo)
  ) {
    return res.status(400).send("Invalid query parameters");
  }

  try {
    // Calculate the start date based on 'daysAgo'
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(daysAgo));

    // Construct and execute the query
    const data = await pg(tableName)
      .select(pg.raw(`date_trunc('${interval}', "${dateColumn}") as interval`))
      .select(
        pg.raw(
          `${aggregateFunction}(DISTINCT "${aggregateColumn}") as aggregate`
        )
      )
      .where(`${dateColumn}`, ">=", startDate)
      .groupBy("interval")
      .orderBy("interval", "desc");

    // Return the query results
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching aggregated data:", error);
    return res.status(500).send("Error fetching aggregated data");
  }
};

export async function getGrowthIndexHistorical(
  req: Request,
  res: Response
): Promise<Response> {
  const { tableName, dateColumn, columns, daysAgo, chain } = req.query;

  // Validate the query parameters here.

  // Parse 'columns' and 'chain' query parameters
  const columnArray = typeof columns === "string" ? columns.split(",") : [];
  const chainsArray = typeof chain === "string" ? chain.split(",") : [];

  // Calculate start date based on 'daysAgo'
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(daysAgo as string));

  try {
    // Query the database
    const data = await pg(tableName as string)
      .select([...columnArray, dateColumn as string, "chain"])
      .where(dateColumn as string, ">=", startDate)
      .whereIn("chain", chainsArray)
      .orderBy(dateColumn as string, "desc");

    const groupedData = data.reduce((acc, data) => {
      const { chain, ...dataWithoutChain } = data;

      if (!acc[chain]) {
        acc[chain] = [];
      }

      acc[chain].push(dataWithoutChain);
      return acc;
    }, {});

    // Return the grouped data
    return res.json({ data: groupedData });
  } catch (error) {
    console.error("Error fetching custom data:", error);
    return res.status(500).send("Server error");
  }
}

export async function getLatestGrowthIndexData(
  req: Request,
  res: Response
): Promise<Response> {
  const { tableName, dateColumn, columns, chain } = req.query;

  // Validate the query parameters here.

  const columnArray = typeof columns === "string" ? columns.split(",") : [];
  const chainsArray = typeof chain === "string" ? chain.split(",") : [];

  try {
    // Subquery to get the latest date for each chain
    const latestDatesSubquery = pg(tableName as string)
      .select("chain")
      .max(dateColumn as string, { as: "latest_date" })
      .whereIn("chain", chainsArray)
      .groupBy("chain")
      .as("latest_dates");

    // Main query to get the full row data for the latest entries
    const rawData = await pg(tableName as string)
      .select([
        ...columnArray,
        `${tableName}.${dateColumn} as week_of_record`,
        `${tableName}.chain`,
      ])
      .join(latestDatesSubquery, function () {
        this.on(
          `${tableName}.${dateColumn}`,
          "=",
          "latest_dates.latest_date"
        ).andOn(`${tableName}.chain`, "=", "latest_dates.chain");
      });

    // Restructure the data into the desired format, remove the redundant 'chain' property, and rename 'dateColumn' to 'week_of_record'
    const formattedData = rawData.reduce((acc, data) => {
      const { chain, ...dataWithoutChain } = data;
      acc[chain] = dataWithoutChain;
      return acc;
    }, {});

    // Return the latest data points for each chain in the structured format
    return res.json({ data: formattedData });
  } catch (error) {
    console.error("Error fetching latest custom data:", error);
    return res.status(500).send("Server error");
  }
}
