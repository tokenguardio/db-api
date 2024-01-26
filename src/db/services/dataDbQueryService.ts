import knex from "knex";
import { Knex } from "knex";
import { BindConfig } from "../../types/queries";

export const executeQuery = async (
  databaseConfig: Knex.Config,
  query: string,
  bindConfig: BindConfig
): Promise<any[]> => {
  const result = await knex(databaseConfig).raw(query, bindConfig);
  return result.rows || [];
};
