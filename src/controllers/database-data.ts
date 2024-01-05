import { Request, Response } from "express";
import pg from "../config/knex";

export const getAllDatabases = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const databases = await pg.raw(
      "SELECT datname FROM pg_database WHERE datistemplate = false;"
    );
    return res.status(200).json({ databases: databases.rows });
  } catch (error) {
    console.error("Error fetching databases:", error);
    return res.status(500).send("Error fetching databases");
  }
};

export const getAllSchemas = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const schemas = await pg.raw(
      "SELECT schema_name FROM information_schema.schemata;"
    );

    return res.status(200).json(schemas.rows);
  } catch (error) {
    console.error("Error fetching schema data:", error);
    return res.status(500).send("Error fetching schema data");
  }
};

export const getAllTables = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const tables = await pg.raw(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog');"
    );

    return res.status(200).json(tables.rows);
  } catch (error) {
    console.error("Error fetching table data:", error);
    return res.status(500).send("Error fetching table data");
  }
};

export const getTableColumns = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { schemaName, tableName } = req.params;

  try {
    const columns = await pg.raw(
      `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = ? AND table_schema = ?
    `,
      [tableName, schemaName]
    );

    return res.status(200).json(columns.rows);
  } catch (error) {
    console.error(
      `Error fetching column data for table ${schemaName}.${tableName}:`,
      error
    );
    return res
      .status(500)
      .send(`Error fetching column data for table ${schemaName}.${tableName}`);
  }
};
