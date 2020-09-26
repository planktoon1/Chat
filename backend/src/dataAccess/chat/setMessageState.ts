import AWS from "aws-sdk";
import { config } from "../../config/config";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = config.environmentConfig.aws.chatTableName;

export interface SetMessageStateInput {
  chatId: string;
  messageId: string;
  state: string;
}
export const setMessageState = async (params: SetMessageStateInput) => {
  try {
    await ddb
      .update({
        TableName: tableName,
        Key: {
          ChatId: params.chatId,
          SortKey: params.messageId,
        },
        UpdateExpression: "SET #f0100 = :f0100",
        ExpressionAttributeValues: {
          ":f0100": params.state,
        },
        ExpressionAttributeNames: {
          "#f0100": "State",
        },
      })
      .promise();
    console.info(
      `Successfully updated state of message "${params.messageId}" to: "${params.state}"`
    );
  } catch (error) {
    handleCommonErrors(error);
  }
};
