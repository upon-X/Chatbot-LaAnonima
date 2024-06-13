import { addKeyword, MemoryDB } from "@builderbot/bot";

export const welcomeFlow = addKeyword<MemoryDB>([
  "hello",
  "hi",
  "hola",
]).addAnswer(`🙌 Hola, bienvenido al *Chatbot* del Supermercado Dia.`);
// .addAction({ capture: true }, async (ctx, { flowDynamic }): Promise<void> => {
//   const message: string = ctx.body;
//   if (ctx.body.includes("Si" || "Me encantaria")){
//     gotoFlo
//   }
// });
