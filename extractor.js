const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { table } = require("console");

//URL y selectores
const URL =
  "http://sij.usfx.bo/elibro/principal.usfx?cu=null&ca=INV&idLibro=null";
const diplomado = "#j_idt16\\:j_idt107\\:0\\:_t110";
const diplomadosSelector = '[id^="j_idt16:j_idt107:"][id$=":_t110"]';
/**#############################################################*/
let categoriaBuscar =
  "DIPLOMADO EN POLITICAS DE GESTION JUDICIAL, ADMINISTRATIVA Y PROYECTOS";
const selectorPagina = "#j_idt16\\:j_idt68\\:0\\:_t70";

/**#############################################################*/
const librosSelector = "[id^='j_idt16:j_idt49:'][id$=':_t55']";
const selectorPaginaLibros = '[id^="j_idt16:j_idt68:"][id$=":_t70"]';

//Funcion para limpiar los nombres de archivo
const limpiarNombreArchivo = (nombre) => {
  //Reemplazar caracteres no permitidos en nombres de archivos por guiones bajos
  return nombre
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "") // Elimina caracteres especiales
    .replace(/\.$/, "") // Elimina punto al final
    .replace(/\s+/g, " ") // Reemplaza múltiples espacios por uno
    .trim(); // Elimina espacios al inicio y al final
};

//Funcion para añadir sufijo numerico si el directorio ya existe
const generarNombreUnico = (directorioDestino) => {
  let contador = 1;
  let nuevoDirectorio = directorioDestino;

  //Mientras el directorio ya exista, añade un sufijo numerico
  while (fs.existsSync(nuevoDirectorio)) {
    nuevoDirectorio = `${directorioDestino}_${contador}`;
    contador++;
  }

  return nuevoDirectorio;
};

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

    console.table(titulosDiplomados);
    console.table(titulosDiplomados.length);

    //Esperar y extraer todos los titulos del total de libros
    await page.waitForSelector(diplomadosSelector, { timeout: 10000 });
    const titulosTotalLibros = await page.$$eval(
      diplomadosSelector,
      (elements) => elements.map((el) => el.textContent.trim().toLowerCase())
    );

    console.table(titulosTotalLibros);
    console.table(titulosTotalLibros.length);

    //Iterar sobre los diplomados para hacer click en la categoria buscada
    for (let i = 0; i < titulosTotalLibros.length; i++) {
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
        await page.waitForSelector(`#j_idt16\\:j_idt107\\:${i}\\:_t108`, {
          timeout: 10000,
        });
        await page.click(`#j_idt16\\:j_idt107\\:${i}\\:_t108`);

        // Espera opcional para ver el resultado
        await page.waitForTimeout(5000);

        //************************************ */
        try {
          //Esperar por el selector de paginas y extraer su texto(numeros)
          await page.waitForSelector(selectorPaginaLibros, { timeout: 10000 });
          const paginasLibros = await page.$$eval(
            selectorPaginaLibros,
            (elements) =>
              elements.map((el) => el.textContent.trim().toLowerCase())
          );
          console.group("Paginas libros");
          console.table(paginasLibros);
          console.groupEnd("Paginas libros");
        } catch (error) {
          console.log(error);
        }
        //************************************ */

        /***** ###### Explorar # paginas cambiar el digito  ###### ****** */
        try {
          await page.waitForSelector(selectorPagina, {
            timeout: 10000,
          });
          await page.click(selectorPagina);

          // Espera opcional para ver el resultado
          await page.waitForTimeout(5000);
        } catch (error) {
          console.log(error);
        }
        /***** ###### ###################### ###### ****** */

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
          try {
            if (i !== 0) {
              console.log("Librooooo");
              //hace click en la categoria indicada
              await page.waitForSelector(
                `#j_idt16\\:j_idt107\\:${flag}\\:_t108`,
                {
                  timeout: 10000,
                }
              );
              await page.click(`#j_idt16\\:j_idt107\\:${flag}\\:_t108`);

              // Espera opcional para ver el resultado
              await page.waitForTimeout(5000);
            }
          } catch (error) {
            console.log(error);
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

          //****** Ruta al escritorio en Windows
          const nombreCarpetaLimpio = limpiarNombreArchivo(categoriaBuscar);
          const escritorio = path.join(
            process.env.USERPROFILE,
            "Desktop",
            nombreCarpetaLimpio
          );
          const tituloLimpio = limpiarNombreArchivo(titulosLibros[i]);
          let directorioDestino = path.join(escritorio, tituloLimpio);

          // Crear el directorio si no existe
          if (fs.existsSync(directorioDestino)) {
            directorioDestino = generarNombreUnico(directorioDestino);
          }

          //Crear el directorio
          fs.mkdirSync(directorioDestino, { recursive: true }); //Crear directorios de forma recursiva por si hay varias carpetas anidadas

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
                await page.waitForTimeout(3000); // Ajusta el tiempo de espera según sea necesario
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
