import AWS from "aws-sdk";
import { Key } from "aws-sdk/clients/dynamodb";
import { handleCommonErrors } from "../handleCommonErrors";
import { BaseGetInput } from "../sharedModels";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
import { config } from "../../config/config";
const tableName = config.environmentConfig.aws.chatTableName;

export interface GetChatsForUserInput extends BaseGetInput {
  userId: string;
  lastEvaluated?: Key;
}
/**
 * Get all chats for a specific user.
 * @param {Object} params - The input values for the function.
 */
export const getChatsForUser = async (params: GetChatsForUserInput) => {
  const after = params.after ? params.after : "-271821-04-20T00:00:00.000Z";
  const before = params.before ? params.before : new Date().toISOString();
  try {
    const messageQueryOutput: AWS.DynamoDB.DocumentClient.QueryOutput = await ddb
      .query({
        TableName: tableName,
        ScanIndexForward: false,
        IndexName: "GSI1",
        Limit: params.limit,
        KeyConditionExpression:
          "#5eb50 = :5eb50 And #41a11 BETWEEN :after AND :before",
        ExpressionAttributeValues: {
          ":5eb50": `member_${params.userId}`,
          ":after": after,
          ":before": before,
        },
        ExpressionAttributeNames: {
          "#5eb50": "GSI1PK",
          "#41a11": "GSI1SK",
        },
        ExclusiveStartKey: params.lastEvaluated
          ? params.lastEvaluated
          : undefined,
      })
      .promise();

    const result = {
      userId: params.userId,
      count: messageQueryOutput.Count,
      chats: messageQueryOutput.Items?.map((dbChat) => ({
        chatId: dbChat.ChatId,
        createdAt: dbChat.GSI1SK,
      })),
      lastEvaluated: messageQueryOutput?.LastEvaluatedKey,
    };
    return result;
  } catch (error) {
    handleCommonErrors(error);
    // TODO: Handle errors in a uniform way across the service
    return {
      userId: params.userId,
      count: 0,
      chats: [],
      lastEvaluated: undefined,
    };
  }
};
