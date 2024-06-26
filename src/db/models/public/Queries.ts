// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { StoredParameters } from "../../../types/queries";

/** Identifier type for public.queries */
export type QueriesId = number & { __brand: "QueriesId" };

/** Represents the table public.queries */
export default interface Queries {
  id: QueriesId;

  query: string;

  parameters: StoredParameters | null;

  databases: string;

  created_at: Date | null;

  updated_at: Date | null;

  label: string | null;
  version_history: string | null;
  description: string | null;
}

/** Represents the initializer for the table public.queries */
export interface QueriesInitializer {
  /** Default value: nextval('queries_id_seq'::regclass) */
  id?: QueriesId;

  query: string;

  parameters?: StoredParameters | null;

  databases: string;

  /** Default value: CURRENT_TIMESTAMP */
  created_at?: Date | null;

  /** Default value: CURRENT_TIMESTAMP */
  updated_at?: Date | null;

  label?: string | null;
  description?: string | null;
}

/** Represents the mutator for the table public.queries */
export interface QueriesMutator {
  id?: QueriesId;

  query?: string;

  parameters?: StoredParameters | null;

  database?: string;

  created_at?: Date | null;

  updated_at?: Date | null;

  label?: string | null;
  description?: string | null;
}
