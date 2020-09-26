import AWS from "aws-sdk";
import { config } from "../../config/config";
import { handleCommonErrors } from "../handleCommonErrors";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();
const tableName = config.environmentConfig.aws.chatTableName;

interface SetChatMembersStateInput {
  chatId: string;
  memberId: string;
  /** Member state such as: "banned" or "admin" */
  state: string;
}
export const setChatMembersState = async (params: SetChatMembersStateInput) => {
  try {
    await ddb
      .update({
        TableName: tableName,
        Key: {
          ChatId: params.chatId,
          SortKey: `member_${params.memberId}`,
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
      `Successfully updated state of member "${params.memberId}" to: "${params.state}"`
    );
  } catch (error) {
    handleCommonErrors(error);
  }
};
