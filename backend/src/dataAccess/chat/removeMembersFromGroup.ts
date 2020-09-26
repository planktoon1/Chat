import AWS from "aws-sdk";
import { config } from "../../config/config";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = config.environmentConfig.aws.chatTableName;

export interface RemoveMembersFromGroupInput {
  chatId: string;
  memberIds: string[];
}
/**
 * Add members to a group chat.
 * @param {Object} params - The input values for the function.
 */
export const removeMembersFromGroup = async (
  params: RemoveMembersFromGroupInput
) => {
  const memberRemoveRequests = params.memberIds.map((memberId) => ({
    DeleteRequest: {
      Key: {
        ChatId: params.chatId,
        SortKey: `member_${memberId}`,
      },
    },
  }));

  try {
    await ddb
      .batchWrite({
        RequestItems: {
          [tableName]: [...memberRemoveRequests],
        },
      })
      .promise();
    console.info(
      `Successfully removed "${params.memberIds}" from group: "${params.chatId}"`
    );
  } catch (error) {
    handleCommonErrors(error);
  }
};
