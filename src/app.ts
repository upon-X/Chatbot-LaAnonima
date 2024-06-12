import { createBot } from "@builderbot/bot";
// Hacemos modularización de las instancias y flujos
import { flow } from "./flow";
import { provider } from "./provider";
import { database } from "./database";

const PORT = process.env.PORT ?? 3008;

const main = async () => {
  const { httpServer } = await createBot({
    flow,
    provider,
    database,
  });
  httpServer(+PORT);
};

main();
