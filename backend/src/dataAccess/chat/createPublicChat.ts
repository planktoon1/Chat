import AWS from "aws-sdk";
import { createId } from "../../utility/createId";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
import { config } from "../../config/config";
const tableName = config.environmentConfig.aws.chatTableName;

interface CreatePublicChatInput {
  chatName: string;
  members: string[];
  maxMembers: number;
}
export const createPublicChat = async (params: CreatePublicChatInput) => {
  const chatId = `PC_${createId()}`;
  const now = new Date().toISOString();

  const memberPutRequests = params.members.map((memberId) => ({
    PutRequest: {
      Item: {
        CreatedAt: now,
        ChatId: chatId,
        SortKey: `member_${memberId}`,
        GSI1PK: `member_${memberId}`,
        GSI1SK: now,
      },
    },
  }));

  try {
    await ddb
      .batchWrite({
        RequestItems: {
          [tableName]: [
            {
              PutRequest: {
                Item: {
                  ChatId: chatId,
                  ChatName: params.chatName,
                  MaxMembers: params.maxMembers,
                  CreatedAt: now,
                  SortKey: "metaData",
                  GSI1PK: `publicChats`, // ## Access pattern: "List all public chats" supported
                  GSI1SK: chatId,
                },
              },
            },
            ...memberPutRequests,
          ],
        },
      })
      .promise();
    console.log(`Successfully created public chat '${params.chatName}'`);
    return chatId;
  } catch (error) {
    handleCommonErrors(error);
  }
};
