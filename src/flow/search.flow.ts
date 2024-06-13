import { addKeyword, MemoryDB } from "@builderbot/bot";
import { chromium, Browser } from "playwright";

export const searchFlow = addKeyword<MemoryDB>([
  "busqueda",
  "buscar",
  "búsqueda",
])
  .addAnswer(`¿Qué desea buscar?`)
  .addAction({ capture: true }, async (ctx, { flowDynamic }): Promise<void> => {
    // Enviamos mensaje de que estamos procesando la busqueda
    await flowDynamic(`Buscando...`);
    const requestText: string = ctx.body;
    const url: string = `https://diaonline.supermercadosdia.com.ar/${requestText}?_q=${requestText}&map=ft`;

    // await state.update({ name: ctx.body, url: url });

    let browser: Browser | undefined;

    try {
      browser = await chromium.launch();
      const page = await browser.newPage();

      await page.goto(url);

      // Verificamos que no nos haya arrojado un NotFound
      await Promise.race([
        page.waitForSelector(".vtex-search-result-3-x-notFound--layout", {
          timeout: 3000,
        }),
      ]);
      const notFound = await page.$(".vtex-search-result-3-x-notFound--layout");

      // Si lo hay, enviamos mensaje de que no se encontro el producto
      if (notFound) {
        await flowDynamic(
          "😭 No encontramos lo que buscabas. Recuerda, tenemos solo produtos del supermercado Dia"
        );
      } else {
        // Wait for these product´s classNames to load
        // Name
        await page.waitForSelector(
          ".vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName.t-body"
        );
        // Price
        await page.waitForSelector(".vtex-product-price-1-x-currencyContainer");
        // Image
        await page.waitForSelector(
          ".vtex-product-summary-2-x-imageNormal.vtex-product-summary-2-x-image"
        );
        // Brand Name
        await page.waitForSelector("vtex-product-summary-2-x-productBrandName");

        // Search by classNames the elements of the product
        const productNameElement = await page.$$(
          ".vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName.t-body"
        );
        const productPriceElement = await page.$$(
          ".vtex-product-summary-2-x-currencyContainer"
        ); // Contenedor del producto
        const productImageElement = await page.$$(
          ".vtex-product-summary-2-x-imageNormal.vtex-product-summary-2-x-image"
        );
        const productBrandElement = await page.$$(
          "vtex-product-summary-2-x-productBrandName"
        );

        // Limitar el número de productos a los primeros tres
        const productCount = Math.min(3, productNameElement.length);

        // Recolectar la información de cada producto (solo los primeros tres)

        for (let i = 0; i < productCount; i++) {
          const productName: string = await productNameElement[i].textContent();
          const productPrice: string = await productPriceElement[i].$eval(
            ".vtex-product-price-1-x-currencyContainer",
            (element) => element.textContent
          );
          const productBrand: string = await productBrandElement[
            i
          ].textContent();
          const productImageUrl: string | null = await productImageElement[
            i
          ].getAttribute("src");
          if (productImageUrl) {
            await flowDynamic([
              {
                body: `*${productName.trim()}*\n${productBrand.trim()}\nPrecio: ${productPrice.trim()}`,
                media: productImageUrl,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("Ocurrió un error:", error);
      await flowDynamic(
        "Ocurrio un error en tu busqueda, recuerda que tenemos solo productos del supermercado Dia"
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });
