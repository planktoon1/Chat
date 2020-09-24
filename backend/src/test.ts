import AWS from "aws-sdk";
import { getChatsForUser, getMessagesInChat } from "./chatFunctions";
AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  let res: any = { lastEvaluated: undefined };

  do {
    res = await getChatsForUser({
      userId: "larsman1",
      limit: 3,
      lastEvaluated: res.lastEvaluated,
    });
    console.log(res);
  } while (res.lastEvaluated);
};
app();
