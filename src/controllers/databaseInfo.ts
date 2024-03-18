import { Request, Response } from "express";
import * as databaseInfoService from "../db/services/databaseInfoService";

const getAllDatabases = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const databases = await databaseInfoService.fetchAllDatabases();
    return res.status(200).json(databases);
  } catch (error) {
    console.error("Error in controller fetching databases:", error);
    return res.status(500).send("Error fetching databases");
  }
};

const getAllSchemas = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { dbname } = req.params;
  try {
    const databases = await databaseInfoService.fetchAllDatabases();
    const foundDatabase = databases.find(
      (db: { datname: string }) => db.datname === dbname
    );

    if (!foundDatabase) {
      return res.status(404).send(`Database ${dbname} not found`);
    }
    const schemas = await databaseInfoService.fetchAllSchemas(dbname);
    return res.status(200).json(schemas);
  } catch (error) {
    console.error("Error in controller fetching schemas:", error);
    return res.status(500).send("Error fetching schemas");
  }
};

const getAllTables = async (req: Request, res: Response): Promise<Response> => {
  const { dbname } = req.params;
  try {
    const tables = await databaseInfoService.fetchAllTables(dbname);
    return res.status(200).json(tables);
  } catch (error) {
    console.error("Error in controller fetching tables:", error);
    return res.status(500).send("Error fetching table data");
  }
};

const getTableColumns = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { dbname, schema, table } = req.params;
  console.log("schema, table", schema, table);

  try {
    const columns = await databaseInfoService.fetchTableColumns(
      dbname,
      schema,
      table
    );
    return res.status(200).json(columns);
  } catch (error) {
    console.error(
      `Error in controller fetching columns for table ${schema}.${table}:`,
      error
    );
    return res
      .status(500)
      .send(`Error fetching column data for table ${schema}.${table}`);
  }
};

export { getAllDatabases, getAllSchemas, getAllTables, getTableColumns };
