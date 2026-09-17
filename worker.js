const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // ------------------------------------------------------------
    // /chiste
    // ------------------------------------------------------------
    if (url.pathname === "/chiste") {
      return await getRandomJoke();
    }

    // ------------------------------------------------------------
    // Respuesta para rutas desconocidas
    // ------------------------------------------------------------
    return new Response(
      "API de chistes de Twitch funcionando correctamente.",
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",
          "Cache-Control": "no-store"
        }
      }
    );
  }
};

async function getRandomJoke() {
  try {
    // ------------------------------------------------------------
    // Descargar chistes.json directamente desde GitHub
    // ------------------------------------------------------------
    const githubResponse = await fetch(JOKES_URL, {
      method: "GET",
      headers: {
        "User-Agent": "Twitch-Jokes-Worker"
      },
      cf: {
        cacheTtl: 0,
        cacheEverything: false
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

    // ------------------------------------------------------------
    // Convertir respuesta a JSON
    // ------------------------------------------------------------
    const data = await githubResponse.json();

    // ------------------------------------------------------------
    // Validar estructura
    // ------------------------------------------------------------
    if (
      typeof data !== "object" ||
      data === null ||
      Array.isArray(data) ||
      !Array.isArray(data.chistes)
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
    // Filtrar valores inválidos
    // ------------------------------------------------------------
    const jokes = data.chistes.filter(
      joke => typeof joke === "string" && joke.trim().length > 0
    );

    if (jokes.length === 0) {
      return new Response(
        "No hay chistes disponibles.",
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
    // Elegir chiste aleatorio
    // ------------------------------------------------------------
    const randomIndex =
      Math.floor(Math.random() * jokes.length);

    const joke = jokes[randomIndex];

    // ------------------------------------------------------------
    // Devolver chiste
    // ------------------------------------------------------------
    return new Response(
      `😂 ${joke}`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",

          // Evitar completamente que se almacene
          // la respuesta aleatoria.
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Pragma": "no-cache",
          "Expires": "0",

          "Access-Control-Allow-Origin": "*"
        }
      }
    );

  } catch (error) {
    return new Response(
      `Error interno: ${error.message}`,
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
