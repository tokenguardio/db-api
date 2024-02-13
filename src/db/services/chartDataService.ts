import knex from "knex";
import externalKnexConfigs from "../../../knexfile-external";

interface IGroupByColumn {
  columnName: string;
}

interface IAggregateColumn {
  columnName: string;
  operator: string;
}

interface IFilterColumn {
  columnName: string;
  filterValue: string | number | { start: string; end: string };
}

function validateOperators(
  aggregateColumns: IAggregateColumn[]
): string | null {
  const validOperators = ["SUM", "AVG", "COUNT", "MAX", "MIN"];
  for (const col of aggregateColumns) {
    if (!validOperators.includes(col.operator.toUpperCase())) {
      return col.operator;
    }
  }
  return null;
}

function constructSelectClause(
  groupByColumns: IGroupByColumn[],
  aggregateColumns: IAggregateColumn[]
): string {
  const selectGroupBy = groupByColumns
    .map((col) => `"${col.columnName}"`)
    .join(", ");
  const selectAggregate = aggregateColumns
    .map(
      (col) =>
        `${col.operator}("${col.columnName}") AS "${col.columnName}_${col.operator}"`
    )
    .join(", ");

  return `${selectGroupBy}, ${selectAggregate}`;
}

function constructGroupByClause(groupByColumns: IGroupByColumn[]): string {
  return groupByColumns.map((col) => `"${col.columnName}"`).join(", ");
}

function constructWhereClause(filters?: IFilterColumn[]): string {
  if (!filters || filters.length === 0) {
    return "";
  }

  const filterClauses = filters.map((filter) => {
    if (
      typeof filter.filterValue === "object" &&
      filter.filterValue.start &&
      filter.filterValue.end
    ) {
      // Handling time interval
      // IMPORTANT: Ensure proper escaping or parameterization to prevent SQL injection
      return `"${filter.columnName}" BETWEEN '${filter.filterValue.start}' AND '${filter.filterValue.end}'`;
    } else {
      return `"${filter.columnName}" = '${filter.filterValue}'`;
    }
  });

  return "WHERE " + filterClauses.join(" AND ");
}

const executeGroupByOperation = async (
  schema: string,
  table: string,
  groupByColumns: IGroupByColumn[],
  aggregateColumns: IAggregateColumn[],
  filters: IFilterColumn[]
) => {
  const invalidOperator = validateOperators(aggregateColumns);
  if (invalidOperator) {
    throw new Error("Invalid operator: " + invalidOperator);
  }

  const selectClause = constructSelectClause(groupByColumns, aggregateColumns);
  const groupByClause = constructGroupByClause(groupByColumns);
  const whereClause = constructWhereClause(filters); // Construct the WHERE clause

  const query = `SELECT ${selectClause} FROM "${schema}"."${table}" ${whereClause} GROUP BY ${groupByClause}`;
  console.log("query", query);

  try {
    const result = await knex(externalKnexConfigs["crosschain"]).raw(query);
    return result.rows;
  } catch (error) {
    console.error("Error executing group by operation:", error);
    throw error;
  }
};

export {
  executeGroupByOperation,
  IGroupByColumn,
  IAggregateColumn,
  IFilterColumn,
};
