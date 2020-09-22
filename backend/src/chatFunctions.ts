import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import { handleCommonErrors } from "./dynamoDB/handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = "Chats"; //TODO: Dynamic table name
export const markMessagesAsRead = async (params) => {};
export const addGroupMembers = async (params) => {};
export const removeGroupMembers = async (params) => {};
export const setChatMembersState = async (params) => {};
export const createPublicChat = async (params) => {};

interface GetAllChatsForUserInput {
  userId: string;
  lastEvaluated?: string;
  limit?: number;
  /** Inclusive. Date as a string value in ISO format. Default: omitted */
  after?: string;
  /** Exclusive. Date as a string value in ISO format. Default: current datetime */
  before?: string;
}

/**
 * Get all chats for a specific user.
 * @param {Object} params - The input values for the function.
 */
export const getAllChatsForUser = async (params: GetAllChatsForUserInput) => {
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
          ? {
              GSI1PK: `member_${params.userId}`,
              GSI1SK: params.lastEvaluated,
            }
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
      lastEvaluated: messageQueryOutput?.LastEvaluatedKey?.GSI1SK,
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

interface GetMessagesInChatInput {
  chatId: string;
  /** Inclusive. Date as a string value in ISO format. Default: omitted */
  after?: string;
  /** Exclusive. Date as a string value in ISO format. Default: current datetime */
  before?: string;
  limit?: number;
  /** The message id of the message where the operation stopped, inclusive of the previous result set. Use this message id to start a new operation, excluding this message in the new request. */
  lastEvaluatedMessage?: string;
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
        ExclusiveStartKey: params.lastEvaluatedMessage
          ? {
              ChatId: params.chatId,
              SortKey: params.lastEvaluatedMessage,
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
      LastEvaluatedMessage: messageQueryOutput?.LastEvaluatedKey?.SortKey,
    };
    return result;
  } catch (error) {
    handleCommonErrors(error);
    // TODO: Handle errors in a uniform way across the service
    return {
      chatId: params.chatId,
      count: 0,
      messages: [],
      LastEvaluatedMessage: undefined,
    };
  }
};

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
  } catch (error) {
    handleCommonErrors(error);
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
  } catch (error) {
    handleCommonErrors(error);
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
  } catch (error) {
    handleCommonErrors(error);
  }
};
