// TODO: CHECK AND DELETE CODE BELOW

// import { Request, Response } from "express";
// import knex from "knex";
// import externalKnexConfigs from "../../knexfile-external";

// interface GroupByColumn {
//   columnName: string;
// }

// interface AggregateColumn {
//   columnName: string;
//   operator: string;
// }

// interface FilterColumn {
//   columnName: string;
//   filterValue: string | number | { start: string; end: string }; // Can be a single value or an interval
// }

// function validateOperators(aggregateColumns: AggregateColumn[]): string | null {
//   const validOperators = ["SUM", "AVG", "COUNT", "MAX", "MIN"];
//   for (const col of aggregateColumns) {
//     if (!validOperators.includes(col.operator.toUpperCase())) {
//       return col.operator;
//     }
//   }
//   return null;
// }

// function constructSelectClause(
//   groupByColumns: GroupByColumn[],
//   aggregateColumns: AggregateColumn[]
// ): string {
//   const selectGroupBy = groupByColumns
//     .map((col) => `"${col.columnName}"`)
//     .join(", ");
//   const selectAggregate = aggregateColumns
//     .map(
//       (col) =>
//         `${col.operator}("${col.columnName}") AS "${col.columnName}_${col.operator}"`
//     )
//     .join(", ");

//   return `${selectGroupBy}, ${selectAggregate}`;
// }

// function constructGroupByClause(groupByColumns: GroupByColumn[]): string {
//   return groupByColumns.map((col) => `"${col.columnName}"`).join(", ");
// }

// function constructWhereClause(filters?: FilterColumn[]): string {
//   if (!filters || filters.length === 0) {
//     return "";
//   }

//   const filterClauses = filters.map((filter) => {
//     if (
//       typeof filter.filterValue === "object" &&
//       filter.filterValue.start &&
//       filter.filterValue.end
//     ) {
//       // Handling time interval
//       // IMPORTANT: Ensure proper escaping or parameterization to prevent SQL injection
//       return `"${filter.columnName}" BETWEEN '${filter.filterValue.start}' AND '${filter.filterValue.end}'`;
//     } else {
//       // Handling single value
//       return `"${filter.columnName}" = '${filter.filterValue}'`;
//     }
//   });

//   return "WHERE " + filterClauses.join(" AND ");
// }

// export const performGroupByOperation = async (req: Request, res: Response) => {
//   try {
//     const { schema, table } = req.params;
//     console.log("log dupa1", schema, table);

//     const { groupByColumns, aggregateColumns, filters } = req.body as {
//       groupByColumns: GroupByColumn[];
//       aggregateColumns: AggregateColumn[];
//       filters?: FilterColumn[]; // Make filters optional
//     };

//     // Validate operators
//     const invalidOperator = validateOperators(aggregateColumns);
//     if (invalidOperator) {
//       return res
//         .status(400)
//         .send({ message: "Invalid operator: " + invalidOperator });
//     }

//     // Construct query clauses
//     const selectClause = constructSelectClause(
//       groupByColumns,
//       aggregateColumns
//     );
//     const groupByClause = constructGroupByClause(groupByColumns);
//     const whereClause = constructWhereClause(filters); // Construct the WHERE clause

//     // Construct and execute the full SQL query
//     const query = `SELECT ${selectClause} FROM "${schema}"."${table}" ${whereClause} GROUP BY ${groupByClause}`;
//     console.log("query", query);

//     // Use knex to execute the query
//     const result = await knex(externalKnexConfigs["crosschain"]).raw(query);
//     res.status(200).json(result.rows);
//   } catch (error) {
//     console.error("Error performing group by operation:", error);
//     res.status(500).send({ message: "Error performing group by operation" });
//   }
// };

import { Request, Response } from "express";
import * as chartDataService from "../db/services/chartDataService";

const performGroupByOperation = async (req: Request, res: Response) => {
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
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in controller performing group by operation:", error);
    if (error.message.startsWith("Invalid operator")) {
      return res.status(400).send({ message: error.message });
    }
    res.status(500).send({ message: "Error performing group by operation" });
  }
};

export { performGroupByOperation };
