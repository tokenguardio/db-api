import { Request, Response } from "express";
import { Parser } from "node-sql-parser";
import pg from "../config/knex";

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
  const { query, parameters } = req.body;

  // Initialize the SQL parser
  const parser = new Parser();

  try {
    // Check the SQL syntax
    parser.parse(query);

    // Serialize the parameters to store as JSON
    const serializedParameters = JSON.stringify(parameters);

    // Insert the query and parameters into the database
    const [id] = await pg("queries")
      .insert({ query, parameters: serializedParameters })
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

interface SavedParameter {
  name: string;
  type: string;
}

export const executeQuery = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { id, queryParams } = req.body;

  try {
    const savedQuery = await pg("queries").where({ id }).first();

    if (!savedQuery) {
      return res.status(404).send("Query not found");
    }

    const savedParameters =
      typeof savedQuery.parameters === "string"
        ? JSON.parse(savedQuery.parameters)
        : savedQuery.parameters;

    // Validate parameter types
    for (const param of savedParameters) {
      const queryParam = queryParams.find(
        (p: SavedParameter) => p.name === param.name
      );
      if (!queryParam || !isValueOfType(queryParam.value, param.type)) {
        return res.status(400).send(`Invalid type for parameter ${param.name}`);
      }
    }

    // Extract the values from queryParams in the order of the saved parameters
    const values = savedParameters.map(
      (param: SavedParameter) =>
        queryParams.find((p: SavedParameter) => p.name === param.name).value
    );

    const result = await pg.raw(savedQuery.query, values);

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing the query:", error);
    return res.status(500).send("Error executing the query");
  }
};
