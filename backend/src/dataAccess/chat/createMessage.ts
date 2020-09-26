import AWS from "aws-sdk";
import { createId } from "../../utility/createId";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
import { config } from "../../config/config";
const tableName = config.environmentConfig.aws.chatTableName;

export interface CreateMessageInput {
  chatId: string;
  sender: string;
  message: string;
}
export const createMessage = async (params: CreateMessageInput) => {
  const now = new Date().toISOString();
  const sortKey = `message_${now}_${createId()}`; // added to the sortkey to avoid the unlikely event that two messages are sent in the exact same milisecond and therfore overwrites eachother
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
