import AWS from "aws-sdk";
import { Key } from "aws-sdk/clients/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { handleCommonErrors } from "./dynamoDB/handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = "Chats"; //TODO: Dynamic table name
export const markMessagesAsRead = async (params) => {};
export const setChatMembersState = async (params) => {};

interface removeMembersFromGroupInput {
  chatId: string;
  memberIds: string[];
}
/**
 * Add members to a group chat.
 * @param {Object} params - The input values for the function.
 */
export const removeMembersFromGroup = async (
  params: removeMembersFromGroupInput
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

interface AddMembersToGroupChatInput {
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

interface BaseGetInput {
  limit?: number;
  /** Inclusive. Date as a string value in ISO format. Default: omitted */
  after?: string;
  /** Exclusive. Date as a string value in ISO format. Default: current datetime */
  before?: string;
  lastEvaluated?: any;
}

interface GetChatsForUserInput extends BaseGetInput {
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

interface GetMessagesInChatInput extends BaseGetInput {
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

interface CreatePublicChatInput {
  chatName: string;
  members: string[];
  maxMembers: number;
}
export const createPublicChat = async (params: CreatePublicChatInput) => {
  const uuid = uuidv4();
  const chatId = `PC_${uuid}`;
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
