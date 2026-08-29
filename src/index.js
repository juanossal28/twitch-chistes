const JOKES_URL =
  "https://raw.githubusercontent.com/juanossal28/twitch-chistes/refs/heads/main/chistes.json";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(
        "✅ API de chistes funcionando correctamente.",
        {
          headers: {
            "Content-Type": "text/plain; charset=UTF-8"
          }
        }
      );
    }

    if (url.pathname === "/chiste") {
      return getRandomJoke("normal");
    }

    if (url.pathname === "/chiste/malo") {
      return getRandomJoke("malo");
    }

    if (url.pathname === "/chiste/animales") {
      return getRandomJoke("animales");
    }

    if (url.pathname === "/chiste/gaming") {
      return getRandomJoke("gaming");
    }

    if (url.pathname === "/chiste/anime") {
      return getRandomJoke("anime");
    }

    return new Response("❌ Endpoint no encontrado.", {
      status: 404,
      headers: {
        "Content-Type": "text/plain; charset=UTF-8"
      }
    });
  }
};

async function getRandomJoke(category) {
  try {
    const response = await fetch(JOKES_URL);

    if (!response.ok) {
      throw new Error("No se pudo descargar chistes.json");
    }

    const data = await response.json();

    const jokes = data[category];

    if (!Array.isArray(jokes) || jokes.length === 0) {
      return new Response(
        "❌ No hay chistes disponibles para esta categoría.",
        {
          status: 500,
          headers: {
            "Content-Type": "text/plain; charset=UTF-8"
          }
        }
      );
    }

    const randomIndex = Math.floor(Math.random() * jokes.length);
    const joke = jokes[randomIndex];

    return new Response(`😂 ${joke}`, {
      headers: {
        "Content-Type": "text/plain; charset=UTF-8",
        "Cache-Control": "no-store"
      }
    });

  } catch (error) {
    return new Response(
      "❌ No pude obtener la lista de chistes.",
      {
        status: 500,
        headers: {
          "Content-Type": "text/plain; charset=UTF-8"
        }
      }
    );
  }
}
