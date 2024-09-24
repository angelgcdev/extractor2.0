const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

//URL y selectores
const URL =
  "http://sij.usfx.bo/elibro/principal.usfx?cu=null&ca=INV&idLibro=null";
const diplomado = "#j_idt16\\:j_idt107\\:0\\:_t110";
const diplomadosSelector = '[id^="j_idt16:j_idt107:"][id$=":_t110"]';
let categoriaBuscar = "Diplomado en Análisis Financiero";
const librosSelector = "[id^='j_idt16:j_idt49:'][id$=':_t55']";

//Función principal
const extractor = async () => {
  //Lanzar el navegador
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    //Navegar a la pagina principal
    await page.goto(URL, { waitUntil: "networkidle" });

    //Esperar y extraer todos los titulos de los diplomados
    await page.waitForSelector(diplomadosSelector, { timeout: 10000 });
    const titulosDiplomados = await page.$$eval(
      diplomadosSelector,
      (elements) =>
        elements
          .map((el) => el.textContent.trim().toLowerCase())
          .filter((text) => text.includes("diplomado"))
    );

    //Iterar sobre los diplomados para hacer click en la categoria buscada
    for (let i = 0; i < titulosDiplomados.length; i++) {
      const selectorCategoria = `#j_idt16\\:j_idt107\\:${i}\\:_t110`;

      //Esperar por el selector de la categoria y obtener su texto
      await page.waitForSelector(selectorCategoria, { timeout: 10000 });
      const tituloCategoria = await page.$eval(selectorCategoria, (element) =>
        element.textContent.trim().toLowerCase()
      );

      categoriaBuscar = categoriaBuscar.trim().toLowerCase();

      console.log("titulo categoria buscar: ", categoriaBuscar);
      console.log("titulo categoria : ", tituloCategoria);

      if (tituloCategoria === categoriaBuscar) {
        const flag = i;
        //hace click en la categoria indicada
        await page.waitForSelector(`#j_idt16\\:j_idt107\\:${i}\\:_t110`, {
          timeout: 10000,
        });
        await page.click(`#j_idt16\\:j_idt107\\:${i}\\:_t110`);

        // Espera opcional para ver el resultado
        await page.waitForTimeout(5000);

        //Esperar por el selector de libros y extraer su texto
        await page.waitForSelector(librosSelector, { timeout: 10000 });
        const titulosLibros = await page.$$eval(librosSelector, (elements) =>
          elements.map((el) => el.textContent.trim().toLowerCase())
        );
        console.group("Titulos de los libros");
        console.table(titulosLibros);
        console.groupEnd("Titulos de los libros");

        //extraer los libros----------------------
        for (let i = 0; i < titulosLibros.length; i++) {
          //volver a entrar a la categoria
          if (i > 0) {
            //hace click en la categoria indicada
            await page.waitForSelector(
              `#j_idt16\\:j_idt107\\:${flag}\\:_t110`,
              {
                timeout: 10000,
              }
            );
            await page.click(`#j_idt16\\:j_idt107\\:${flag}\\:_t110`);

            // Espera opcional para ver el resultado
            await page.waitForTimeout(5000);
          }

          const selectorLibro = `#j_idt16\\:j_idt49\\:${i}\\:_t55`;

          await page.waitForSelector(selectorLibro, {
            timeout: 10000,
          });
          await page.click(selectorLibro);

          // Espera opcional para ver el resultado
          await page.waitForTimeout(5000);

          //----------------------------------------
          // Obtener el total de páginas

          await page.waitForSelector("#j_idt130\\:_t142");
          const textoTotalPaginas = await page.textContent("#j_idt130\\:_t142");
          const match = textoTotalPaginas.match(/\d+/);
          const totalPaginas = match ? parseInt(match[0], 10) : 0;
          console.log(`Total de páginas: ${totalPaginas}`);

          // Ruta al escritorio en Windows
          const escritorio = path.join(process.env.USERPROFILE, "Desktop");
          const directorioDestino = path.join(escritorio, titulosLibros[i]);

          // Crear el directorio si no existe
          if (!fs.existsSync(directorioDestino)) {
            fs.mkdirSync(directorioDestino);
          }

          // Función para capturar y guardar la imagen
          const capturarImagen = async () => {
            try {
              await page.waitForSelector(".documentPageView img");
              const imagen = await page.$(".documentPageView img");
              return await imagen.screenshot();
            } catch (error) {
              console.error("Error al capturar la imagen:", error);
              throw error;
            }
          };

          // Iterar sobre el número total de páginas
          for (let i = 1; i <= totalPaginas; i++) {
            try {
              const imagenBuffer = await capturarImagen();
              const rutaArchivo = path.join(directorioDestino, `${i}.png`);
              fs.writeFileSync(rutaArchivo, imagenBuffer);
              console.log(`Imagen ${i} guardada como ${rutaArchivo}`);
            } catch (error) {
              console.error(`Error al guardar la imagen ${i}:`, error);
              throw error;
            }

            // Navegar a la siguiente página si es necesario
            if (i < totalPaginas) {
              try {
                await page.waitForSelector("#j_idt130\\:_t144");
                await page.click("#j_idt130\\:_t144");
                await page.waitForTimeout(2500); // Ajusta el tiempo de espera según sea necesario
              } catch (error) {
                console.error("Error al navegar a la siguiente página:", error);
                throw error;
              }
            }
          }

          //----------------------------------------

          //Hace click en 'Cerrar' para volver a la pagina principal
          await page.waitForSelector("#j_idt167\\:_t168", { timeout: 10000 });
          await page.click("#j_idt167\\:_t168");
        }

        //Hace click en 'X' para volver a la pagina principal
        await page.waitForSelector("#j_idt16\\:_t24", { timeout: 10000 });
        await page.click("#j_idt16\\:_t24");
      }
    }
  } catch (error) {}

  //Cerrar el navegador
  await browser.close();
};

extractor();
