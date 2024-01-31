import { BindConfig } from "../../types/queries";
import { externalKnexInstances } from "../knex-instances";

export const executeQuery = async (
  database: string,
  query: string,
  bindConfig: BindConfig
): Promise<any[]> => {
  const result = await externalKnexInstances[database].raw(query, bindConfig);
  return result.rows || [];
};
