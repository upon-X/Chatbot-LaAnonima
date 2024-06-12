import { addKeyword, MemoryDB, EVENTS } from "@builderbot/bot";
console.log(EVENTS.WELCOME);
export const welcomeFlow = addKeyword<MemoryDB>(EVENTS.WELCOME).addAnswer(
  `🙌 Hola, bienvenido al *Chatbot* de comparador de precios. `
);
