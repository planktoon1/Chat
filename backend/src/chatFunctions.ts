import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();

export const markMessagesAsRead = async (params) => {};
export const addGroupMembers = async (params) => {};
export const removeGroupMembers = async (params) => {};
export const setChatMembersState = async (params) => {};
export const createPublicChat = async (params) => {};
export const getMessagesInChat = async (params) => {};
export const getAllChatsForUser = async (params) => {};

interface CreateGroupChatInput {
  chatName: string;
  admins: string[];
  members: string[];
}
export const createGroupChat = async (params: CreateGroupChatInput) => {
  const tableName = "Chats"; //TODO: Dynamic table name
  const uuid = uuidv4();
  const chatId = `GC_${uuid}`;
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
  } catch (err) {
    console.error(err);
  }
};

interface CreateDirectChatInput {
  member1: string;
  member2: string;
}
export const createDirectChat = async (params: CreateDirectChatInput) => {
  const tableName = "Chats"; //TODO: Dynamic table name
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
  } catch (err) {
    console.error(err);
  }
};

interface CreateMessageInput {
  chatId: string;
  sender: string;
  message: string;
}
export const createMessage = async (params: CreateMessageInput) => {
  const tableName = "Chats"; //TODO: Dynamic table name
  const now = new Date().toISOString();
  const uuid = uuidv4(); // added to the sortkey to avoid the unlikely event that two messages are sent in the exact same milisecond and therfore overwrites eachother
  const sortKey = `message_${now}_${uuid}`;
  try {
    await ddb
      .put({
        TableName: tableName,
        Item: {
          CreatedAt: now,
          ChatId: params.chatId,
          SortKey: sortKey,
          Message: params.message,
          Sender: params.sender,
          State: "sent",
        },
      })
      .promise();
    console.log(
      `Successfully created message '${sortKey}' in chat '${params.chatId}' sender: '${params.sender}'`
    );
  } catch (err) {
    console.error(err);
  }
};
