import AWS from "aws-sdk";
import { createId } from "../../utility/createId";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = "Chats"; //TODO: Dynamic table name

export interface CreateGroupChatInput {
  chatName: string;
  admins: string[];
  members: string[];
}
export const createGroupChat = async (params: CreateGroupChatInput) => {
  const chatId = `GC_${createId()}`;
  const now = new Date().toISOString();

  const adminPutRequests = params.admins.map((adminId) => ({
    PutRequest: {
      Item: {
        CreatedAt: now,
        ChatId: chatId,
        State: `admin`,
        SortKey: `member_${adminId}`,
        GSI1PK: `member_${adminId}`,
        GSI1SK: now,
      },
    },
  }));
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
                  CreatedAt: now,
                  ChatId: chatId,
                  SortKey: "metaData",
                  ChatName: params.chatName,
                  // GSI1PK: `groupChats`, // ## Can be added if the access pattern "List all group chats" should be supported
                  // GSI1SK: chatId,
                },
              },
            },
            ...adminPutRequests,
            ...memberPutRequests,
          ],
        },
      })
      .promise();
    console.log(`Successfully created group chat '${params.chatName}'`);
    return chatId;
  } catch (error) {
    handleCommonErrors(error);
  }
};
