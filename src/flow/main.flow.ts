import { addKeyword, MemoryDB } from "@builderbot/bot";
import { chromium, Browser } from "playwright";

// Intializamos interface para los productos
interface Product {
  name: string;
  brand: string;
  price: string;
  pricePerUnit: number;
  imageUrl: string | null;
}

export const mainFlow = addKeyword<MemoryDB>(["hello", "hi", "hola"])
  .addAnswer(`Hola, bienvenido al *Chatbot* del Supermercado Dia.`)
  .addAnswer(" ¿Qué producto deseas buscar?")
  .addAction({ capture: true }, async (ctx, { flowDynamic }): Promise<void> => {
    // Enviamos mensaje de que estamos procesando la busqueda
    await flowDynamic(`Buscando...`);
    // Utilizamos el body para buscar el producto por medio de la url provista por la pagina
    const requestText: string = ctx.body;
    const url: string = `https://diaonline.supermercadosdia.com.ar/${requestText}?_q=${requestText}&map=ft`;

    let browser: Browser | undefined;

    try {
      browser = await chromium.launch();
      const page = await browser.newPage();

      await page.goto(url);

      // Verificamos que no nos haya arrojado un NotFound
      await Promise.race([
        page.waitForSelector(".vtex-search-result-3-x-notFound--layout", {
          timeout: 5000,
        }),
        page.waitForTimeout(0),
      ]);
      const notFound = await page.$(".vtex-search-result-3-x-notFound--layout");

      // Si lo hay, enviamos mensaje de que no se encontro el producto
      if (notFound) {
        await flowDynamic(
          "😭 No encontramos lo que buscabas. Recuerda, tenemos solo produtos del supermercado Dia"
        );
      } else {
        // Esperamos a la aparicion de cada elemento
        // Nombre
        await page.waitForSelector(
          ".vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName.t-body"
        );
        // Precio
        await page.waitForSelector(".vtex-product-price-1-x-currencyContainer");
        // Imagen
        await page.waitForSelector(
          ".vtex-product-summary-2-x-imageNormal.vtex-product-summary-2-x-image"
        );
        // Marca
        await page.waitForSelector(
          ".vtex-product-summary-2-x-productBrandName"
        );
        // Precio por unidad
        await page.waitForSelector("[data-specification-name='PrecioPorUnd']");

        // Obtenemos cada elemento
        const productNameElements = await page.$$(
          ".vtex-product-summary-2-x-productBrand.vtex-product-summary-2-x-brandName.t-body"
        );
        const productPriceElements = await page.$$(
          ".vtex-product-summary-2-x-container"
        );
        const productImageElements = await page.$$(
          ".vtex-product-summary-2-x-imageNormal.vtex-product-summary-2-x-image"
        );
        const productBrandElements = await page.$$(
          ".vtex-product-summary-2-x-productBrandName"
        );
        const productPricePerUnitElements = await page.$$(
          "[data-specification-name='PrecioPorUnd']"
        );

        // Limitar el número de productos a los primeros tres
        const productCount = Math.min(3, productNameElements.length);

        const products: Product[] = [];
        // Recolectar la información de cada producto (solo los primeros tres)
        for (let i = 0; i < productCount; i++) {
          const productName: string = await productNameElements[
            i
          ].textContent();
          const productPrice: string = await productPriceElements[i].$eval(
            ".vtex-product-price-1-x-currencyContainer",
            (element) => element.textContent
          );
          const productBrand: string = await productBrandElements[
            i
          ].textContent();
          const productImageUrl: string | null = await productImageElements[
            i
          ].getAttribute("src");
          const productPricePerUnit: number = parseFloat(
            await productPricePerUnitElements[i].textContent()
          );

          const product: Product = {
            name: productName.trim(),
            brand: productBrand.trim(),
            price: productPrice.trim(),
            pricePerUnit: productPricePerUnit,
            imageUrl: productImageUrl,
          };

          products.push(product);

          if (productImageUrl) {
            // Enviamos mensajes con la correcta info de cada producto
            await flowDynamic([
              {
                body: `*${productName.trim()}*\n${productBrand.trim()}\nPrecio: ${productPrice.trim()}`,
                media: productImageUrl,
              },
            ]);
          }
        }

        // Encuentra y guarda el producto con el menor precio por unidad
        const lowestPriceProduct = products.reduce((lowest, product) =>
          product.pricePerUnit < lowest.pricePerUnit ? product : lowest
        );
        // Formateamos el precio por unidad
        const formattedPricePerUnit =
          lowestPriceProduct.pricePerUnit.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
          });
        // Enviamos mensaje recomendando el producto mejor costo/beneficio (peso|cantidad|capacidad/precio)
        await flowDynamic(
          `Te recomiendo el producto con el menor precio por unidad: *${lowestPriceProduct.name}* de ${lowestPriceProduct.brand}, a un precio de ${formattedPricePerUnit} por unidad.`
        );
      }
    } catch (error) {
      console.error("Ocurrió un error:", error);
      await flowDynamic(
        "Ocurrió un error en tu búsqueda, se lo hare saber a un operador humano."
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  });
