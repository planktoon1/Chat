import { APIGatewayEvent } from "aws-lambda";
import { Client } from "./dynamoDB/Client";

exports.handleConnection = async (event: APIGatewayEvent) => {
  console.log(event.requestContext);

  switch (event.requestContext.routeKey) {
    case `$connect`:
      await connect(event);
      break;
    case `$disconnect`:
      await disconnect(event);
      break;
    case `$default`:
      break;

    default:
      break;
  }

  return { statusCode: 200 };
};

const connect = async (event: APIGatewayEvent) => {
  if (!event.requestContext.connectionId) {
    console.error(`missing connectionId`);

    return { statusCode: 500 };
  }

  const connectionId = event.requestContext.connectionId as string;
  const connectedAt = event.requestContext.connectedAt as number;

  const domain = event.requestContext.domainName;
  const stage = event.requestContext.stage;
  const callbackURL = `https://${domain}/${stage}`;

  await new Client({
    connectionId,
  }).connect({ id: `1`, callbackURL, connectedAt });
};

const disconnect = async (event: APIGatewayEvent) => {
  if (!event.requestContext.connectionId) {
    console.error(`missing connectionId`);

    return { statusCode: 500, body: "missing connectionId" };
  }

  const connectionId = event.requestContext.connectionId as string;

  await new Client({
    connectionId,
  }).disconnect();
};
