import { addKeyword, MemoryDB } from "@builderbot/bot";

export const welcomeFlow = addKeyword<MemoryDB>([
  "hello",
  "hi",
  "hola",
]).addAnswer(`🙌 Hola, bienvenido al *Chatbot* de comparador de precios. `);
