import AWS from "aws-sdk";
import { createGroupChat, createMessage } from "./chatFunctions";
AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  await createMessage({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    sender: "planken",
    message: "Hi my friends!",
  });
  await createMessage({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    sender: "planken",
    message: "It is time for some chattin!",
  });
  await createMessage({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    sender: "bobman1",
    message: "okaaaaay...",
  });
  await createMessage({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    sender: "larsman1",
    message: "Ready.. Set.. Chat!",
  });
};
app();
