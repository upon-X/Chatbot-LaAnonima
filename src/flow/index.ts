import { createFlow } from "@builderbot/bot";
import { mainFlow } from "./main.flow";

export const flow = createFlow([mainFlow]);
