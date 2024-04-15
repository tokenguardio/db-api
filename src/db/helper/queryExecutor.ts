import { BindConfig } from "queries";

interface ValueItem {
  name: string;
  value: any[] | any;
}

function constructSQLQuery(
  savedQuery: { query: string },
  providedValues: ValueItem[],
  bindConfig: BindConfig
): string {
  let sqlQuery = savedQuery.query;
  const uniqueArraySuffix = "_arr_";

  providedValues.forEach((item) => {
    if (Array.isArray(item.value)) {
      // Process each value in the array, create a unique placeholder for each, and update the bindConfig
      item.value.forEach((val, index: number) => {
        const placeholder = `${item.name}${uniqueArraySuffix}${index}`;
        bindConfig[placeholder] = val;
        // Handle array placeholders differently for $...$
        sqlQuery = sqlQuery.replace(
          new RegExp(`\\$:${item.name}\\$`, "g"),
          val // Directly place the value without quotes or additional formatting
        );
      });

      // Replace the placeholder in the SQL query with a list of new placeholders for array elements
      const placeholders = item.value
        .map((_, index: number) => `:${item.name}${uniqueArraySuffix}${index}`)
        .join(", ");
      sqlQuery = sqlQuery.replace(
        new RegExp(`:${item.name}`, "g"),
        placeholders
      );
    } else {
      // Normal non-array value, directly assign to bindConfig and use as is in the SQL query
      bindConfig[item.name] = item.value;

      // Handle single placeholders differently for $...$
      sqlQuery = sqlQuery.replace(
        new RegExp(`\\$:${item.name}\\$`, "g"),
        item.value // Replace directly with the value without quotes
      );
    }
  });

  return sqlQuery;
}

// Function to determine the selected database
function selectDatabaseForQuery(
  savedQuery: { databases: string | string[] },
  requestedDatabase?: string
): { selectedDatabase: string | undefined; error?: string } {
  let availableDatabases: string[];

  // Check if the databases are already an array or a JSON-encoded string
  if (Array.isArray(savedQuery.databases)) {
    availableDatabases = savedQuery.databases;
  } else {
    try {
      // Attempt to parse it as JSON to convert to an array
      availableDatabases = JSON.parse(savedQuery.databases);
    } catch (error) {
      availableDatabases = [savedQuery.databases];
    }
  }

  console.log("Available Databases:", availableDatabases);

  // Determine the appropriate database to use
  if (requestedDatabase) {
    if (!availableDatabases.includes(requestedDatabase)) {
      return {
        selectedDatabase: undefined,
        error: `The specified database ${requestedDatabase} is not one of the available databases for this query: ${availableDatabases.join(
          ", "
        )}`,
      };
    }
    return { selectedDatabase: requestedDatabase };
  } else if (availableDatabases.length > 1) {
    return {
      selectedDatabase: undefined,
      error: `No database selected among the available databases: ${availableDatabases.join(
        ", "
      )}`,
    };
  } else {
    return { selectedDatabase: availableDatabases[0] };
  }
}

export { constructSQLQuery, selectDatabaseForQuery };
