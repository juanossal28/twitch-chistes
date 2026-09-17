const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

const CACHE_SECONDS = 60;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/chiste") {
      return await getRandomJoke();
    }

    if (url.pathname === "/chiste/buenos") {
      return await getRandomJoke("normal");
    }

    if (url.pathname === "/chiste/malos") {
      return await getRandomJoke("malo");
    }

    return new Response(
      "API de chistes de Twitch funcionando correctamente.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      }
    );
  }
};

async function getRandomJoke(category = null) {
  try {
    const cache = caches.default;

    // Usamos una URL propia como clave de caché.
    const cacheKey = new Request(
      "https://twitch-chistes-cache.local/chistes.json",
      {
        method: "GET"
      }
    );

    let response = await cache.match(cacheKey);

    if (!response) {
      const githubResponse = await fetch(JOKES_URL, {
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
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      const text = await githubResponse.text();

      response = new Response(text, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Cache-Control": `public, max-age=${CACHE_SECONDS}`
        }
      });

      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

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
            "Content-Type": "text/plain; charset=UTF-8"
          }
        }
      );
    }

    let selectedCategory;

    if (category) {
      if (
        !Array.isArray(jokes[category]) ||
        jokes[category].length === 0
      ) {
        return new Response(
          `No hay chistes disponibles para la categoría "${category}".`,
          {
            status: 404,
            headers: {
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      selectedCategory = category;
    } else {
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
              "Content-Type": "text/plain; charset=UTF-8"
            }
          }
        );
      }

      selectedCategory =
        categories[Math.floor(Math.random() * categories.length)];
    }

    const categoryJokes = jokes[selectedCategory];

    const joke =
      categoryJokes[
        Math.floor(Math.random() * categoryJokes.length)
      ];

    return new Response(`😂 ${joke}`, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(
      `Error interno: ${error.message}`,
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      }
    );
  }
}
