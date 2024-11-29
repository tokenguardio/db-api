import { externalKnexInstances } from "../knex-instances";
import Segment, { SegmentInitializer } from "../models/dapp_analytics/Segment";
import { SegmentMembersInitializer } from "../models/dapp_analytics/SegmentMembers";

const buildWhereStatement = (filters: any): string => {
  const conditions: string[] = [];

  if (filters.isAirdropRecipient !== undefined) {
    conditions.push(`is_airdrop_recipient = ${filters.isAirdropRecipient}`);
  }

  if (filters.airdropTokenAddress) {
    // Escaping single quotes to prevent SQL injection
    const tokenAddress = filters.airdropTokenAddress.replace(/'/g, "''");
    conditions.push(`airdrop_token_address = '${tokenAddress}'`);
  }

  if (filters.airdropValueMin !== undefined) {
    conditions.push(`airdrop_value >= ${filters.airdropValueMin}`);
  }

  if (filters.airdropValueMax !== undefined) {
    conditions.push(`airdrop_value <= ${filters.airdropValueMax}`);
  }

  if (filters.firstAirdropTimestampMin) {
    const formattedDate = new Date(
      filters.firstAirdropTimestampMin
    ).toISOString();
    conditions.push(`first_airdrop_timestamp >= '${formattedDate}'`);
  }

  if (filters.firstAirdropTimestampMax) {
    const formattedDate = new Date(
      filters.firstAirdropTimestampMax
    ).toISOString();
    conditions.push(`first_airdrop_timestamp <= '${formattedDate}'`);
  }

  if (filters.otherDappsUsed && filters.otherDappsUsed.length > 0) {
    const dappsArray = filters.otherDappsUsed
      .map((dapp: string) => `'${dapp.replace(/'/g, "''")}'`)
      .join(", ");
    conditions.push(`other_dapps_used && ARRAY[${dappsArray}]::text[]`);
  }

  if (filters.firstInteractionMin) {
    const formattedDate = new Date(filters.firstInteractionMin).toISOString();
    conditions.push(`dapp_first_interaction >= '${formattedDate}'`);
  }

  if (filters.firstInteractionMax) {
    const formattedDate = new Date(filters.firstInteractionMax).toISOString();
    conditions.push(`dapp_first_interaction <= '${formattedDate}'`);
  }

  if (filters.usedFunctions && filters.usedFunctions.length > 0) {
    const functionsArray = filters.usedFunctions
      .map((func: string) => `'${func.replace(/'/g, "''")}'`)
      .join(", ");
    conditions.push(`used_functions && ARRAY[${functionsArray}]::text[]`);
  }

  if (filters.lastObservationMin) {
    const formattedDate = new Date(filters.lastObservationMin).toISOString();
    conditions.push(`last_observation >= '${formattedDate}'`);
  }

  if (filters.lastObservationMax) {
    const formattedDate = new Date(filters.lastObservationMax).toISOString();
    conditions.push(`last_observation <= '${formattedDate}'`);
  }

  return conditions.length > 0 ? conditions.join(" AND ") : "TRUE"; // Default to TRUE if no filters
};


export const createSegment = async (
  dappId: string,
  segmentId: string,
  segmentName: string,
  filters: object
): Promise<Segment> => {
  const schemaName = "dapp_analytics";
  const segmentTable = `segment_${dappId}`;
  const segmentMembersTable = `segment_members_${dappId}`;

  try {
    const whereStatement = buildWhereStatement(filters);

    // Retrieve all accounts matching the whereStatement
    const accounts: SegmentMembersInitializer[] = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ]
      .withSchema(schemaName)
      .select([
        "user_address",
        "is_airdrop_recipient",
        "airdrop_token_address",
        "airdrop_value",
        "first_airdrop_timestamp",
        "other_dapps_used",
        "dapp_first_interaction",
        "used_functions",
        "last_observation",
      ])
      .from(`users_profile_${dappId}`)
      .whereRaw(whereStatement);

    const segmentData: SegmentInitializer = {
      segment_id: segmentId,
      dapp_id: dappId,
      segment_name: segmentName,
      creation_timestamp: new Date(),
      members_count: accounts.length,
      where_statement: whereStatement,
    };

    const [segmentResult] = await externalKnexInstances[
      process.env.DAPP_ANALYTICS_DB_NAME
    ]
      .withSchema(schemaName)
      .insert(segmentData)
      .into(segmentTable)
      .returning("*");

    // Insert accounts into segment_members_<dappId> table
    await insertSegmentMembers(
      segmentId,
      dappId,
      accounts,
      segmentMembersTable
    );

    return segmentResult;
  } catch (error) {
    console.error("Failed to create segment in Postgres:", error);
    throw error;
  }
};

const insertSegmentMembers = async (
  segmentId: string,
  dappId: string,
  accounts: SegmentMembersInitializer[],
  segmentMembersTable: string
) => {
  await externalKnexInstances[process.env.DAPP_ANALYTICS_DB_NAME].transaction(
    async (trx) => {
      for (const account of accounts) {
        const accountData: SegmentMembersInitializer = {
          segment_id: segmentId,
          dapp_id: dappId,
          user_address: account.user_address,
          is_airdrop_recipient: account.is_airdrop_recipient,
          airdrop_token_address: account.airdrop_token_address,
          airdrop_value: account.airdrop_value,
          first_airdrop_timestamp: account.first_airdrop_timestamp,
          other_dapps_used: account.other_dapps_used,
          dapp_first_interaction: account.dapp_first_interaction,
          used_functions: account.used_functions,
          last_observation: account.last_observation,
        };

        await trx
          .withSchema("dapp_analytics")
          .insert(accountData)
          .into(segmentMembersTable);
      }
    }
  );
};
