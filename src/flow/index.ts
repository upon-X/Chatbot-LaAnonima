import { createFlow } from "@builderbot/bot";
import { welcomeFlow } from "./welcome.flow";
import { searchFlow } from "./search.flow";

export const flow = createFlow([welcomeFlow, searchFlow]);
