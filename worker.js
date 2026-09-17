const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

const CACHE_SECONDS = 60;

export default {
  async fetch(request, env, ctx) {
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
  const cache = caches.default;

  const cacheKey = new Request(JOKES_URL, {
    method: "GET"
  });

  let response = await cache.match(cacheKey);

  if (!response) {
    response = await fetch(JOKES_URL, {
      headers: {
        "User-Agent": "Twitch-Jokes-Worker"
      }
    });

    if (!response.ok) {
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

    response = new Response(await response.text(), response);

    response.headers.set(
      "Cache-Control",
      `public, max-age=${CACHE_SECONDS}`
    );

    await cache.put(cacheKey, response.clone());
  }

  const jokes = await response.json();

  // Verificamos que el JSON sea un objeto válido.
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

  // ============================================================
  // Si se especificó una categoría:
  // /chiste/buenos -> "normal"
  // /chiste/malos  -> "malo"
  // ============================================================
  if (category) {
    if (!Array.isArray(jokes[category]) || jokes[category].length === 0) {
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
  }

  // ============================================================
  // Si NO se especificó categoría:
  // /chiste
  //
  // Obtenemos todas las categorías disponibles y elegimos una
  // al azar.
  // ============================================================
  else {
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

  // Obtener los chistes de la categoría elegida.
  const categoryJokes = jokes[selectedCategory];

  // Elegir un chiste al azar.
  const joke =
    categoryJokes[
      Math.floor(Math.random() * categoryJokes.length)
    ];

  return new Response(
    `😂 ${joke}`,
    {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    }
  );
}
