import AWS from "aws-sdk";
import { config } from "../../config/config";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = config.environmentConfig.aws.chatTableName;

export interface CreateDirectChatInput {
  member1: string;
  member2: string;
}
export const createDirectChat = async (params: CreateDirectChatInput) => {
  const chatId = `DC_${[params.member1, params.member2].sort().join("#")}`;
  const member1SortKey = `member_${params.member1}`;
  const member2SortKey = `member_${params.member2}`;
  const now = new Date().toISOString();

  try {
    await ddb
      .batchWrite({
        RequestItems: {
          [tableName]: [
            {
              PutRequest: {
                Item: {
                  CreatedAt: now,
                  ChatId: chatId,
                  SortKey: "metaData",
                  ChatName: "Direct Chat",
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  CreatedAt: now,
                  ChatId: chatId,
                  SortKey: member1SortKey,
                  GSI1PK: member1SortKey,
                  GSI1SK: now,
                },
              },
            },
            {
              PutRequest: {
                Item: {
                  CreatedAt: now,
                  ChatId: chatId,
                  SortKey: member2SortKey,
                  GSI1PK: member2SortKey,
                  GSI1SK: now,
                },
              },
            },
          ],
        },
      })
      .promise();
    console.log(
      `Successfully created direct chat between: '${params.member1}' and '${params.member2}'`
    );
  } catch (error) {
    handleCommonErrors(error);
  }
};
