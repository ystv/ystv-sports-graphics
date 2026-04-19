import { ActionMeta } from "./common/types";

declare global {
  namespace PrismaJson {
    // Define a type for a user's profile information.
    type LatestResult = {
      eventType: string;
      name: string;
      winner: "home" | "away";
      points: number;
    };

    type DBActionMeta = ActionMeta;
  }
}
