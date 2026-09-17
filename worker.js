const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Página principal
    if (url.pathname === "/") {
      return new Response(
        "✅ API de chistes funcionando correctamente.",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    // Chiste normal
    if (url.pathname === "/chiste") {
      return getRandomJoke("chistes");
    }

    // Chiste dark
    if (url.pathname === "/chistedark") {
      return getRandomJoke("dark");
    }

    return new Response(
      "❌ Endpoint no encontrado.",
      {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": "no-store"
        }
      }
    );
  }
};

async function getRandomJoke(category) {
  try {
    const response = await fetch(
      `${JOKES_URL}?v=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          "User-Agent": "Twitch-Jokes-Worker",
          "Cache-Control": "no-cache"
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub respondió con HTTP ${response.status}`
      );
    }

    const data = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray(data[category])
    ) {
      return new Response(
        `❌ No existe la categoría "${category}".`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const jokes = data[category].filter(
      joke =>
        typeof joke === "string" &&
        joke.trim().length > 0
    );

    if (jokes.length === 0) {
      return new Response(
        "❌ No hay chistes disponibles.",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8",
            "Cache-Control": "no-store"
          }
        }
      );
    }

    const randomIndex =
      Math.floor(Math.random() * jokes.length);

    const joke = jokes[randomIndex];

    return new Response(
      `😂 ${joke}`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Pragma": "no-cache",
          "Expires": "0",
          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    return new Response(
      `❌ No pude obtener la lista de chistes: ${error.message}`,
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
