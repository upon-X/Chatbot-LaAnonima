import { addKeyword, MemoryDB } from "@builderbot/bot";
import { chromium, Browser } from "playwright";

export const searchFlow = addKeyword<MemoryDB>(["busqueda"])
  .addAnswer(`¿Qué desea buscar?`)
  .addAction(
    { capture: true },
    async (ctx, { state, flowDynamic }): Promise<void> => {
      const originalText: string = ctx.body; // Texto original capturado
      await flowDynamic(`Buscando...`);
      // Reemplazar los espacios con %20 en el texto original
      const modifiedOriginalText: string = originalText.replace(/ /g, "%20");

      // Reemplazar los espacios con %20 en el texto modificado
      const modifiedText: string = originalText
        .toLowerCase()
        .replace(/ /g, "%20");

      // Reemplazar la palabra en la URL con el texto modificado, manteniendo la capitalización original
      const url: string = `https://diaonline.supermercadosdia.com.ar/${modifiedText}?_q=${modifiedOriginalText}&map=ft`;

      await state.update({ name: ctx.body, url: url });

      let browser: Browser | undefined;

      try {
        browser = await chromium.launch();
        const page = await browser.newPage();

        await page.goto(url);

        // Esperar un máximo de 5 segundos antes de continuar si el elemento "Not Found" no está presente
        await Promise.race([
          page.waitForSelector(".vtex-search-result-3-x-notFound--layout", {
            timeout: 4000,
          }),
          page.waitForTimeout(0), // Espera mínima de 0 segundos
        ]);

        // Verificar si se encuentra la página "Not Found"
        const notFound = await page.$(
          ".vtex-search-result-3-x-notFound--layout"
        );

        if (notFound) {
          await flowDynamic("😭 No encontramos lo que buscabas.");
        } else {
          // Esperar a que se carguen los productos, establecer un tiempo de espera adecuado según la velocidad de carga de la página
          await page.waitForSelector(
            ".vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName.t-body"
          );
          await page.waitForSelector(
            ".vtex-product-price-1-x-currencyContainer"
          );
          await page.waitForSelector(
            ".vtex-product-summary-2-x-imageNormal.vtex-product-summary-2-x-image"
          );

          // Buscar los elementos que representan los productos
          const productBrandElements = await page.$$(
            ".vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName.t-body"
          );
          const productElements = await page.$$(
            ".vtex-product-summary-2-x-container"
          ); // Contenedor del producto
          const productImageElements = await page.$$(
            ".vtex-product-summary-2-x-imageNormal.vtex-product-summary-2-x-image"
          );

          // Limitar el número de productos a los primeros tres
          const productCount = Math.min(3, productBrandElements.length);

          // Recolectar la información de cada producto (solo los primeros tres)

          for (let i = 0; i < productCount; i++) {
            const productName: string = await productBrandElements[
              i
            ].textContent();
            const productPrice: string = await productElements[i].$eval(
              ".vtex-product-price-1-x-currencyContainer",
              (element) => element.textContent
            );
            const productImageUrl: string | null = await productImageElements[
              i
            ].getAttribute("src");
            if (productImageUrl) {
              await flowDynamic([
                {
                  body: `*${productName.trim()}*\nPrecio: ${productPrice.trim()}`,
                  media: productImageUrl,
                },
              ]);
            }
          }
        }
      } catch (error) {
        console.error("Ocurrió un error:", error);
        await flowDynamic(error);
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }
  );
