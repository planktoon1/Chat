import AWS from "aws-sdk";
import { config } from "../../config/config";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = config.environmentConfig.aws.chatTableName;

export interface AddMembersToGroupChatInput {
  chatId: string;
  memberIds: string[];
  adminIds: string[];
}
/**
 * Add members to a group chat.
 * @param {Object} params - The input values for the function.
 */
export const addMembersToGroupChat = async (
  params: AddMembersToGroupChatInput
) => {
  const now = new Date().toISOString();
  const memberPutRequests = params.memberIds.map((memberId) => ({
    PutRequest: {
      Item: {
        CreatedAt: now,
        ChatId: params.chatId,
        SortKey: `member_${memberId}`,
        GSI1PK: `member_${memberId}`,
        GSI1SK: now,
      },
    },
  }));

  const adminPutRequests = params.adminIds.map((adminId) => ({
    PutRequest: {
      Item: {
        CreatedAt: now,
        ChatId: params.chatId,
        State: `admin`,
        SortKey: `member_${adminId}`,
        GSI1PK: `member_${adminId}`,
        GSI1SK: now,
      },
    },
  }));

  try {
    const response = await ddb
      .batchWrite({
        RequestItems: {
          [tableName]: [...memberPutRequests, ...adminPutRequests],
        },
      })
      .promise();
    console.info(
      `Successfully added "${params.memberIds}" to group: "${params.chatId}"`
    );
    return response;
  } catch (error) {
    handleCommonErrors(error);
  }
};
