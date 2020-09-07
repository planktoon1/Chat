import AWS from "aws-sdk";
AWS.config.update({ region: "eu-central-1" });
const ddb = new AWS.DynamoDB.DocumentClient();

export interface ClientI {
  connectionId: string;
}

export interface ConnectParams {
  id: string;
  callbackURL: string;
  connectedAt: number;
}

export class Client {
  connectionId: string;

  constructor(params: ClientI) {
    this.connectionId = params.connectionId;
  }

  async connect(params: ConnectParams) {
    const { connectionId } = this;
    const { id, callbackURL, connectedAt } = params;
    try {
      await ddb
        .put({
          TableName: "clients",
          Item: {
            connectionId,
            id,
            ttl: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // Current time +2 hours,
            callbackURL,
            connectedAt,
          },
        })
        .promise();
      console.log(`Successfully connected client: '${this.connectionId}'`);
    } catch (err) {
      console.error(err);
    }
  }

  async disconnect() {
    const { connectionId } = this;
    try {
      await ddb
        .delete({
          TableName: "clients",
          Key: { connectionId, id: `1` },
        })
        .promise();
      console.log(`Successfully disconnected client: '${this.connectionId}'`);
    } catch (err) {
      console.error(err);
    }
  }
}
