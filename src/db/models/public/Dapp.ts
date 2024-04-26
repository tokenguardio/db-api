/** Represents the table public.dapps */
export default interface Dapp {
  id: string; // This is now non-nullable as it will always have a value

  name: string;

  slug: string;

  icon: string | null; // Marked as nullable in case an icon isn't provided

  active: boolean;

  dapp_growth_index: boolean;

  defi_growth_index: boolean;

  created_at: Date;

  updated_at: Date;
}

/** Represents the initializer for the table public.dapps */
export interface DappInitializer {
  id?: string;
  name: string;
  slug: string;
  icon?: string | null;
  active: boolean;
  dapp_growth_index: boolean;
  defi_growth_index: boolean;
  blockchains?: string[]; // Use slugs instead of blockchain IDs
  created_at?: Date;
  updated_at?: Date;
}

export interface DappMutator {
  id?: string;

  name?: string;

  slug?: string;

  icon?: string | null;

  active?: boolean;

  dapp_growth_index?: boolean;

  defi_growth_index?: boolean;

  created_at?: Date;

  updated_at?: Date;
}
