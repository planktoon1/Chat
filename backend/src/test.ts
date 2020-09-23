import AWS from "aws-sdk";
import { getAllChatsForUser, getMessagesInChat } from "./chatFunctions";
AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  let res = { LastEvaluated: undefined };

  const res1 = await getMessagesInChat({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    lastEvaluated: res.LastEvaluated,
  });
  console.log(res1);

  do {
    res = await getMessagesInChat({
      chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
      before: "2020-09-07T16:39:23.237Z",
      limit: 2,
      lastEvaluated: res.LastEvaluated,
    });
    console.log(res);
  } while (res.LastEvaluated);
};
app();
