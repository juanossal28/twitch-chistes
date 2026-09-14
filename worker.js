const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

const CACHE_SECONDS = 60;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Endpoint principal:
    // /chiste
    if (url.pathname === "/chiste") {
      return await getRandomJoke();
    }

    // Endpoint:
    // /chiste/buenos
    if (url.pathname === "/chiste/buenos") {
      return await getRandomJoke("normal");
    }

    // Endpoint:
    // /chiste/malos
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

async function getRandomJoke(category = "normal") {
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

  if (!Array.isArray(jokes) || jokes.length === 0) {
    return new Response(
      "La lista de chistes está vacía.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      }
    );
  }

  const joke =
    jokes[Math.floor(Math.random() * jokes.length)];

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
