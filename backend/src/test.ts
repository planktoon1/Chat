import AWS from "aws-sdk";
import { getMessagesInChat } from "./chatFunctions";
AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  const res1 = await getMessagesInChat({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    after: "2020-09-asd07T16:39:23.553Z",
  });
  console.log(res1);
};
app();
