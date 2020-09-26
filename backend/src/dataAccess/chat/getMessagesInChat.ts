import AWS from "aws-sdk";
import { createId } from "../../utility/createId";
import { handleCommonErrors } from "../handleCommonErrors";
import { BaseGetInput } from "../sharedModels";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = "Chats"; //TODO: Dynamic table name

export interface GetMessagesInChatInput extends BaseGetInput {
  chatId: string;
  lastEvaluated?: string;
}
/**
 * Get messages from a specific chat.
 * @param {Object} params - The input values for the function.
 */
export const getMessagesInChat = async (params: GetMessagesInChatInput) => {
  const after = params.after ? params.after : "-271821-04-20T00:00:00.000Z";
  const before = params.before ? params.before : new Date().toISOString();

  try {
    const messageQueryOutput: AWS.DynamoDB.DocumentClient.QueryOutput = await ddb
      .query({
        TableName: tableName,
        Limit: params.limit,
        ScanIndexForward: false,
        KeyConditionExpression:
          "#41a10 = :chatId And #41a11 BETWEEN :after AND :before",
        ExpressionAttributeValues: {
          ":chatId": params.chatId,
          ":after": `message_${after}`,
          ":before": `message_${before}`,
        },
        ExpressionAttributeNames: {
          "#41a10": "ChatId",
          "#41a11": "SortKey",
        },
        ExclusiveStartKey: params.lastEvaluated
          ? {
              ChatId: params.chatId,
              SortKey: params.lastEvaluated,
            }
          : undefined,
      })
      .promise();
    const result = {
      chatId: params.chatId,
      count: messageQueryOutput.Count,
      messages: messageQueryOutput.Items?.map((dbMessage) => ({
        message: dbMessage.Message,
        state: dbMessage.State,
        messageId: dbMessage.SortKey,
        sender: dbMessage.Sender,
        createdAt: dbMessage.CreatedAt,
      })),
      lastEvaluated: messageQueryOutput?.LastEvaluatedKey?.SortKey,
    };
    return result;
  } catch (error) {
    handleCommonErrors(error);
    // TODO: Handle errors in a uniform way across the service
    return {
      chatId: params.chatId,
      count: 0,
      messages: [],
      lastEvaluated: undefined,
    };
  }
};
