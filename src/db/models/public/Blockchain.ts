/** Represents the table public.blockchains_dict */
export default interface Blockchain {
  id: string; // UUID, non-nullable as it will always have a value

  name: string;

  network: string;

  slug: string;

  logo: string;

  active: boolean;

  growthindex: boolean;

  dappgrowth: boolean;

  database: string | null;

  created_at: Date; // Non-nullable, default CURRENT_TIMESTAMP

  updated_at: Date; // Non-nullable, default CURRENT_TIMESTAMP
}

/** Represents the initializer for the table public.blockchains_dict */
export interface BlockchainInitializer {
  /** Default value: automatically set by the UUID generation in PostgreSQL */
  id?: string;

  name: string;

  network: string;

  slug: string;

  logo: string;

  active: boolean;

  growthindex: boolean;

  dappgrowth: boolean;

  database?: string;

  /** Default value: CURRENT_TIMESTAMP */
  created_at?: Date;

  /** Default value: CURRENT_TIMESTAMP */
  updated_at?: Date;
}

/** Represents the mutator for the table public.blockchains_dict */
export interface BlockchainMutator {
  id?: string;

  name?: string;

  network?: string;

  slug?: string;

  logo?: string;

  active?: boolean;

  growthindex?: boolean;

  dappgrowth?: boolean;

  database?: string;

  created_at?: Date;

  updated_at?: Date;
}
