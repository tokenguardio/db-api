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
    const decodedQuery = Buffer.from(query, "base64").toString("utf8");

    // Since parameters defaults to [], we can safely serialize it directly
    const serializedParameters = JSON.stringify(parameters);

    // Insert the query and parameters into the database
    const [result] = await knex(internalKnexConfig)("queries")
      .insert({
        query: decodedQuery,
        database,
        parameters: serializedParameters as any, // parameters will be an empty array if not provided
      })
      .returning("id");

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
  const { id, parameters = [] } = req.body;

  try {
    const savedQuery = await knex(internalKnexConfig)("queries")
      .where({ id })
      .first();

    if (!savedQuery) {
      return res.status(404).send({ message: "Query not found" });
    }

    const savedParameters = savedQuery.parameters;

    // Check if the count of provided parameters matches the saved query's expected parameters
    if (savedParameters.length !== parameters.length) {
      return res
        .status(400)
        .send({ message: "Incorrect number of parameters provided" });
    }

    // Validate the types and names of provided parameters against saved parameters
    for (const savedParam of savedParameters) {
      const queryParam = parameters.find(
        (p: Parameter) => p.name === savedParam.name
      );

      if (!queryParam) {
        return res
          .status(400)
          .send({ message: `Parameter ${savedParam.name} is missing` });
      }

      if (!isValueOfType(queryParam.value, savedParam.type)) {
        return res
          .status(400)
          .send({ message: `Invalid type for parameter ${savedParam.name}` });
      }
    }

    // Extract the values from parameters in the order of the saved parameters
    const values = savedParameters.map(
      (param) => parameters.find((p: Parameter) => p.name === param.name).value
    );

    // Execute the saved query with the provided parameters
    const result = await knex(externalKnexConfigs[savedQuery.database]).raw(
      savedQuery.query,
      values
    );

    return res
      .status(200)
      .json({ data: result.rows || [], message: "Query executed" });
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
