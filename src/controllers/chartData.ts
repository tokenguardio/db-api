import { Request, Response } from "express";
import * as chartDataService from "../db/services/chartDataService";

const performGroupByOperation = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { schema, table } = req.params;
    const { groupByColumns, aggregateColumns, filters } = req.body as {
      groupByColumns: chartDataService.IGroupByColumn[];
      aggregateColumns: chartDataService.IAggregateColumn[];
      filters?: chartDataService.IFilterColumn[];
    };

    const result = await chartDataService.executeGroupByOperation(
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
