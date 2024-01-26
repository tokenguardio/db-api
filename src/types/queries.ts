export type SingleValue = string | number | Date;
export type ValueArray = SingleValue[];

export type SaveQueryValueParameter = {
  name: string;
  type: "string" | "number" | "date" | "string[]" | "number[]" | "date[]";
};

export type SaveQueryParameters = {
  values: SaveQueryValueParameter[];
};

export type SaveQueryRequestBody = {
  query: string;
  database: string;
  label?: string;
  parameters?: SaveQueryParameters;
};

export type StoredValueParameter = SaveQueryValueParameter; // Same structure as SaveQueryValueParameter

export type StoredParameters = {
  values: StoredValueParameter[];
  identifiers: string[]; // Assuming identifiers are always strings
};

export type ExecuteQueryValueParameter = {
  name: string;
  value: SingleValue | ValueArray;
};

export type ExecuteQueryIdentifier = {
  name: string;
  value: string; // Assuming identifiers are always strings
};

export type ExecuteQueryParameters = {
  values: ExecuteQueryValueParameter[];
  identifiers: ExecuteQueryIdentifier[];
};

export type ExecuteQueryRequestBody = {
  id: number;
  parameters?: ExecuteQueryParameters;
};

export interface BindConfig {
  [key: string]: SingleValue;
}
