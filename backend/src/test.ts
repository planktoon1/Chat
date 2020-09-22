import AWS from "aws-sdk";
import { getAllChatsForUser, getMessagesInChat } from "./chatFunctions";
AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  const res1 = await getAllChatsForUser({ userId: "bobman12", limit: 1 });
  console.log(res1);
  const res2 = await getAllChatsForUser({
    userId: "bobman12",
    limit: 1,
    lastEvaluated: res1.lastEvaluated,
  });
  console.log(res2);
};
app();
