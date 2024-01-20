import { Request, Response } from "express";
import knex from "knex";
import internalKnexConfig from "../../knexfile";
import externalKnexConfigs from "../../knexfile-external";
import { Parameter } from "../types/queries";

export const saveQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { query, database, parameters = [] } = req.body; // Default to an empty array if not provided

  // Check if the specified database exists in pgInstances
  if (!externalKnexConfigs[database]) {
    return res.status(400).json({
      message: "Specified database is not available",
    });
  }

  try {
    // Since parameters defaults to [], we can safely serialize it directly
    const serializedParameters = JSON.stringify(parameters);

    // Insert the query and parameters into the database
    const [result] = await knex(internalKnexConfig)("queries")
      .insert({
        query,
        database,
        parameters: serializedParameters as any, // parameters will be an empty array if not provided
      })
      .returning("id");

    // Return the ID of the saved query
    return res
      .status(201)
      .json({ data: result, message: "Query saved successfully" });
  } catch (error) {
    console.error("Error saving the query:", error);
    return res.status(500).json({
      message: "Error occurred while saving the query",
    });
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
      return res.status(404).send({ message: "Query not found" });
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
            .send({ message: `Invalid type for parameter ${param.name}` });
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

      return res
        .status(200)
        .json({ data: result.rows, message: "Query executed" });
    } else {
      // Execute the saved query without parameters
      const result = await knex(externalKnexConfigs[savedQuery.database]).raw(
        savedQuery.query
      );

      return res
        .status(200)
        .json({ data: result.rows, message: "Query executed" });
    }
  } catch (error) {
    console.error("Error executing the query:", error);
    return res.status(500).send({ message: "Error executing the query" });
  }
};

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
