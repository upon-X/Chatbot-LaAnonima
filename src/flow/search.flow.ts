import { addKeyword, MemoryDB } from "@builderbot/bot";

export const searchFlow = addKeyword<MemoryDB>([
  "hi",
  "hello",
  "hola",
]).addAnswer(`🙌 Hola, bienvenido al *Chatbot* de comparador de precios. `);
