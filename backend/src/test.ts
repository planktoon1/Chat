import AWS from "aws-sdk";
import { setMessageState } from "./chatFunctions";

AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  setMessageState({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    messageId:
      "message_2020-09-07T15:03:39.389Z_0766125e-2c36-4538-81e6-f026bf50e60e",
    state: "read",
  });

  // addMembersToGroupChat({
  //   chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
  //   adminIds: [],
  //   memberIds: ["newMember1", "newMember2"],
  // });

  // let res: any = { lastEvaluated: undefined };
  // do {
  //   res = await getChatsForUser({
  //     userId: "larsman1",
  //     limit: 3,
  //     lastEvaluated: res.lastEvaluated,
  //   });
  //   console.log(res);
  // } while (res.lastEvaluated);
};
app();
