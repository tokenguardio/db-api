// import { Parser } from "node-sql-parser";
import { Request, Response } from "express";
import knex from "knex";
import internalKnexConfig from "../../knexfile";
import externalKnexConfigs from "../../knexfile-external";
import { Parameter } from "../types/queries";

const isValueOfType = (value: any, type: string): boolean => {
  switch (type) {
    case "number":
      // Check if the value is a number or can be converted to a number
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    case "string":
      return typeof value === "string";
    case "date":
      // Ensure the value is a string and can be converted to a valid date
      return typeof value === "string" && !isNaN(Date.parse(value));
    default:
      return false;
  }
};

export const saveQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { query, database, parameters = [] } = req.body; // Default to an empty array if not provided

  // Check if the specified database exists in pgInstances
  if (!externalKnexConfigs[database]) {
    return res.status(400).send("Specified database is not available");
  }

  const decodedQuery = Buffer.from(query, "base64").toString("utf8");

  try {
    // Initialize the SQL parser
    // const parser = new Parser();
    // Check the SQL syntax - doesn't work for more complicated but correct queries
    // parser.parse(decodedQuery);

    // Since parameters defaults to [], we can safely serialize it directly
    const serializedParameters = JSON.stringify(parameters);

    // Insert the query and parameters into the database
    const [id] = await knex(internalKnexConfig)("queries")
      .insert({
        query: decodedQuery,
        database,
        parameters: serializedParameters as any, // parameters will be an empty array if not provided
      })
      .returning("id");

    // Return the ID of the saved query
    return res.status(201).json({ id, message: "Query saved successfully" });
  } catch (error) {
    console.error("Error:", error);
    return res
      .status(error instanceof SyntaxError ? 400 : 500)
      .send(`Error: ${error.message}`);
  }
};

export const executeQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id, queryParams = [] } = req.body;

  try {
    const savedQuery = await knex(internalKnexConfig)("queries")
      .where({ id })
      .first();

    if (!savedQuery) {
      return res.status(404).send("Query not found");
    }

    const savedParameters = savedQuery.parameters;

    // If there are saved parameters, validate the types against queryParams
    if (savedParameters.length > 0) {
      for (const param of savedParameters) {
        const queryParam = queryParams.find(
          (p: Parameter) => p.name === param.name
        );
        // Check if the parameter is required (not null) and if it has the correct type
        if (!queryParam || !isValueOfType(queryParam.value, param.type)) {
          return res
            .status(400)
            .send(`Invalid type for parameter ${param.name}`);
        }
      }

      // Extract the values from queryParams in the order of the saved parameters
      const values = savedParameters.map(
        (param: Parameter) =>
          queryParams.find((p: Parameter) => p.name === param.name).value
      );

      // Execute the saved query with the provided parameters
      const result = await knex(externalKnexConfigs[savedQuery.database]).raw(
        savedQuery.query,
        values
      );

      return res.status(200).json({ data: result.rows });
    } else {
      // Execute the saved query without parameters
      const result = await knex(externalKnexConfigs[savedQuery.database]).raw(
        savedQuery.query
      );

      return res.status(200).json({ data: result.rows });
    }
  } catch (error) {
    console.error("Error executing the query:", error);
    return res.status(500).send("Error executing the query");
  }
};
