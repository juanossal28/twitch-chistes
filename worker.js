const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

const CACHE_SECONDS = 60;

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // /chiste
    // Elige aleatoriamente una categoría y después un chiste.
    if (url.pathname === "/chiste") {
      return await getRandomJoke();
    }

    // /chiste/buenos
    // Solo chistes de la categoría "normal".
    if (url.pathname === "/chiste/buenos") {
      return await getRandomJoke("normal");
    }

    // /chiste/malos
    // Solo chistes de la categoría "malo".
    if (url.pathname === "/chiste/malos") {
      return await getRandomJoke("malo");
    }

    // Respuesta para cualquier otra ruta.
    return new Response(
      "API de chistes de Twitch funcionando correctamente.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"
        }
      }
    );
  }
};

async function getRandomJoke(category = null) {
  try {
    const cache = caches.default;

    // ------------------------------------------------------------
    // CACHEAMOS SOLAMENTE EL JSON DE GITHUB.
    // NO CACHEAMOS EL RESULTADO ALEATORIO.
    // ------------------------------------------------------------
    const cacheKey = new Request(
      "https://twitch-chistes-cache.local/chistes.json",
      {
        method: "GET"
      }
    );

    let response = await cache.match(cacheKey);

    if (!response) {
      const githubResponse = await fetch(JOKES_URL, {
        method: "GET",
        headers: {
          "User-Agent": "Twitch-Jokes-Worker"
        }
      });

      if (!githubResponse.ok) {
        return new Response(
          "No pude obtener la lista de chistes.",
          {
            status: 500,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
              "Cache-Control": "no-store"
            }
          }
        );
      }

      const jsonText = await githubResponse.text();

      response = new Response(jsonText, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": `public, max-age=${CACHE_SECONDS}`
        }
      });

      // Guardamos solamente chistes.json en caché.
      await cache.put(cacheKey, response.clone());
    }

    // ------------------------------------------------------------
    // LEER Y VALIDAR JSON
    // ------------------------------------------------------------
    const jokes = await response.json();

    if (
      typeof jokes !== "object" ||
      jokes === null ||
      Array.isArray(jokes)
    ) {
      return new Response(
        "El formato de chistes.json no es válido.",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    // ------------------------------------------------------------
    // SELECCIONAR CATEGORÍA
    // ------------------------------------------------------------
    let selectedCategory;

    if (category !== null) {
      // Endpoint específico:
      // /chiste/buenos -> normal
      // /chiste/malos  -> malo

      if (
        !Array.isArray(jokes[category]) ||
        jokes[category].length === 0
      ) {
        return new Response(
          `No hay chistes disponibles para la categoría "${category}".`,
          {
            status: 404,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
              "Cache-Control": "no-store"
            }
          }
        );
      }

      selectedCategory = category;

    } else {
      // ----------------------------------------------------------
      // /chiste
      //
      // Obtener todas las categorías que tengan chistes.
      // ----------------------------------------------------------
      const categories = Object.keys(jokes).filter(
        categoryName =>
          Array.isArray(jokes[categoryName]) &&
          jokes[categoryName].length > 0
      );

      if (categories.length === 0) {
        return new Response(
          "No hay categorías con chistes disponibles.",
          {
            status: 500,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
              "Cache-Control": "no-store"
            }
          }
        );
      }

      // Elegir categoría al azar.
      selectedCategory =
        categories[
          Math.floor(Math.random() * categories.length)
        ];
    }

    // ------------------------------------------------------------
    // ELEGIR CHISTE
    // ------------------------------------------------------------
    const categoryJokes = jokes[selectedCategory];

    const joke =
      categoryJokes[
        Math.floor(Math.random() * categoryJokes.length)
      ];

    // ------------------------------------------------------------
    // RESPUESTA FINAL
    //
    // IMPORTANTÍSIMO:
    // Esta respuesta NO debe quedar cacheada.
    // ------------------------------------------------------------
    return new Response(
      `😂 ${joke}`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",

          // Evitar caché del resultado aleatorio.
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Pragma": "no-cache",
          "Expires": "0",

          // Por si algún cliente solicita CORS.
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    return new Response(
      `Error interno del servidor: ${error.message}`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": "no-store"
        }
      }
    );
  }
}
