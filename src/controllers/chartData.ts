import { Request, Response } from "express";
import * as chartDataService from "../db/services/chartDataService";
import * as databaseInfoService from "../db/services/databaseInfoService";

const performGroupByOperation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { dbname, schema, table } = req.params;
    const { groupByColumns, aggregateColumns, filters } = req.body as {
      groupByColumns: chartDataService.IGroupByColumn[];
      aggregateColumns: chartDataService.IAggregateColumn[];
      filters?: chartDataService.IFilterColumn[];
    };
    const databases = await databaseInfoService.fetchAllDatabases();
    const foundDatabase = databases.find(
      (db: { datname: string }) => db.datname === dbname
    );

    if (!foundDatabase) {
      return res.status(404).send(`Database ${dbname} not found`);
    }
    const result = await chartDataService.executeGroupByOperation(
      dbname,
      schema,
      table,
      groupByColumns,
      aggregateColumns,
      filters
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in controller performing group by operation:", error);
    if (error.message.startsWith("Invalid operator")) {
      return res.status(400).send({ message: error.message });
    }
    return res.status(500).send({ message: "Error performing group by operation" });
  }
};

export { performGroupByOperation };
