const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/chiste") {
      return await getRandomJoke();
    }

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
    // ============================================================
    // Descargar SIEMPRE la versión actual del JSON.
    // ============================================================

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
      return errorResponse(
        `GitHub respondió con HTTP ${response.status}.`
      );
    }

    const data = await response.json();

    // ============================================================
    // El archivo debe tener:
    //
    // {
    //   "chistes": [...]
    // }
    // ============================================================

    if (
      !data ||
      typeof data !== "object" ||
      !Array.isArray(data.chistes)
    ) {
      return errorResponse(
        "chistes.json no tiene el formato esperado: { \"chistes\": [...] }"
      );
    }

    // ============================================================
    // Filtrar entradas inválidas
    // ============================================================

    const jokes = data.chistes.filter(
      joke =>
        typeof joke === "string" &&
        joke.trim().length > 0
    );

    if (jokes.length === 0) {
      return errorResponse(
        "No hay chistes disponibles en chistes.json."
      );
    }

    // ============================================================
    // Elegir chiste aleatorio
    // ============================================================

    const randomIndex =
      Math.floor(Math.random() * jokes.length);

    const joke = jokes[randomIndex];

    // ============================================================
    // Respuesta
    // ============================================================

    return new Response(
      `😂 ${joke}`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8",

          // Nunca almacenar el resultado aleatorio.
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
    return errorResponse(
      `Error interno: ${error.message}`
    );
  }
}

function errorResponse(message) {
  return new Response(
    `❌ ${message}`,
    {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store"
      }
    }
  );
}
