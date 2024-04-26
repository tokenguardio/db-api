import knex from "knex";
import externalConfigs from "../../knexfile-external";

const configs = externalConfigs;

async function runMigrations(): Promise<void> {
  for (const dbName of Object.keys(configs)) {
    console.log(`Running migrations on ${dbName}`);
    const db = knex(configs[dbName]);
    try {
      await db.migrate.latest();
      console.log(`Migrations complete for ${dbName}`);
    } catch (error) {
      console.error(
        `Error running migrations for ${dbName}: ${(error as Error).message}`
      );
    } finally {
      await db.destroy();
    }
  }
}

runMigrations();
