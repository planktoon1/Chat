import AWS from "aws-sdk";
import { addMembersToGroupChat } from "./dataAccess/chat/addMembersToGroupChat";

AWS.config.update({ region: "eu-central-1" });

const app = async () => {
  addMembersToGroupChat({
    chatId: "GC_921a0f1f-9e0e-4768-a836-fdbf79534b41",
    memberIds: ["testboi1"],
    adminIds: [],
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
