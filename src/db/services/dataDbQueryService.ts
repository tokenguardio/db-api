import knex from "knex";
import { Knex } from "knex";

export const executeQuery = async (
  databaseConfig: Knex.Config,
  query: string,
  values: (string | number | Date)[]
): Promise<any[]> => {
  const result = await knex(databaseConfig).raw(query, values);
  return result.rows || [];
};
