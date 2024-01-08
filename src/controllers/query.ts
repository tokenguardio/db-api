import { Request, Response } from "express";
import { Parser } from "node-sql-parser";
import pg from "../config/knex";

// Define the structure of a query parameter
interface QueryParameter {
  name: string;
  type: string;
}

export const SQLDataTypes: string[] = [
  "integer",
  "smallint",
  "tinyint",
  "mediumint",
  "bigint",
  "decimal",
  "numeric",
  "float",
  "real",
  "double",
  "bit",
  "char",
  "varchar",
  "binary",
  "varbinary",
  "blob",
  "text",
  "enum",
  "set",
  "date",
  "datetime",
  "timestamp",
  "time",
  "year",
];

// Define the expected structure for parameters
const isValidParameter = (param: QueryParameter): boolean => {
  return (
    param &&
    typeof param === "object" &&
    typeof param.name === "string" &&
    SQLDataTypes.includes(param.type)
  );
};

export const saveQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { query, parameters } = req.body;

  // Initialize the SQL parser
  const parser = new Parser();

  // Validate the request body
  const isValidQuery = typeof query === "string";
  const areParametersValid =
    Array.isArray(parameters) &&
    parameters.every((param: QueryParameter) => isValidParameter(param));

  if (!isValidQuery || !areParametersValid) {
    return res
      .status(400)
      .send(
        "Invalid request body. Ensure query is a string and parameters are an array of valid objects."
      );
  }

  // Validate the SQL syntax
  try {
    parser.parse(query); // Check the SQL syntax
  } catch (error) {
    console.error("Error parsing the query:", error);
    return res.status(400).send(`SQL Syntax Error: ${error.message}`);
  }

  try {
    // Serialize the parameters to store as JSON
    const serializedParameters = JSON.stringify(parameters);

    const [id] = await pg("queries")
      .insert({ query, parameters: serializedParameters })
      .returning("id");

    return res.status(201).json({ id, message: "Query saved successfully" });
  } catch (error) {
    console.error("Error saving the query:", error);
    return res
      .status(500)
      .send("An internal error occurred while saving the query.");
  }
};

interface SavedParameter {
  name: string;
  type: string;
}

export const executeQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id, queryParams } = req.body;

  if (typeof id !== "number" || !Array.isArray(queryParams)) {
    return res.status(400).send("Invalid request body");
  }

  try {
    const savedQuery = await pg("queries").where({ id }).first();

    if (!savedQuery) {
      return res.status(404).send("Query not found");
    }

    const savedParameters =
      typeof savedQuery.parameters === "string"
        ? JSON.parse(savedQuery.parameters)
        : savedQuery.parameters;

    // Validate that the provided queryParams match the saved parameters in number and order
    if (
      queryParams.length !== savedParameters.length ||
      !queryParams.every(
        (param, index) => savedParameters[index].name === param.name
      )
    ) {
      return res.status(400).send("Invalid query parameters");
    }

    // Extract the values from queryParams in the order of the saved parameters
    const values = savedParameters.map(
      (param: SavedParameter) =>
        queryParams.find((p) => p.name === param.name).value
    );

    const result = await pg.raw(savedQuery.query, values);

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing the query:", error);
    return res.status(500).send("Error executing the query");
  }
};
