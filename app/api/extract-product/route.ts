import * as cheerio from "cheerio";

function detectCategory(text: string) {
  const t = text.toLowerCase();

  if (t.includes("notebook") || t.includes("laptop")) return "notebook";
  if (t.includes("fone") || t.includes("bluetooth") || t.includes("headphone"))
    return "fone";
  if (t.includes("celular") || t.includes("smartphone") || t.includes("iphone"))
    return "celular";
  if (t.includes("carregador") || t.includes("usb") || t.includes("tipo c"))
    return "carregador";
  if (t.includes("cadeira")) return "cadeira";
  if (t.includes("perfume")) return "perfume";
  if (t.includes("monitor")) return "monitor";
  if (t.includes("teclado")) return "teclado";
  if (t.includes("mouse")) return "mouse";

  return "";
}

function isGenericDescription(text: string) {
  const t = text.toLowerCase().trim();

  return (
    !t ||
    t.includes("visite a página e encontre todos os produtos") ||
    t.includes("achamos os melhores preços da internet") ||
    t.includes("perfil social") ||
    t.includes("para você em segundos")
  );
}

function buildDescriptionFromName(name: string, category: string) {
  if (!name) return "";

  if (category === "carregador") {
    return "Carregador com boa praticidade para uso no dia a dia.";
  }

  if (category === "celular") {
    return "Produto interessante para quem procura um celular com bom custo-benefício.";
  }

  if (category === "notebook") {
    return "Produto interessante para estudos, trabalho e uso diário.";
  }

  if (category === "fone") {
    return "Produto interessante para quem busca praticidade e boa experiência de áudio.";
  }

  return `Produto relacionado a: ${name}.`;
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
    redirect: "follow",
  });

  const html = await response.text();

  return {
    html,
    finalUrl: response.url,
  };
}

function parseProductPage(html: string) {
  const $ = cheerio.load(html);

  const name =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("title").text() ||
    "";

  const image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    "";

  const rawDescription =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const category = detectCategory(`${name} ${rawDescription}`);

  const description = isGenericDescription(rawDescription)
    ? buildDescriptionFromName(name, category)
    : rawDescription;

  return {
    name: name.trim(),
    price: "", // sempre manual
    image: image.trim(),
    category: category.trim(),
    description: description.trim(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const originalUrl = body.url;

    if (!originalUrl) {
      return Response.json({ error: "URL não enviada." }, { status: 400 });
    }

    const fetched = await fetchHtml(originalUrl);
    const product = parseProductPage(fetched.html);

    return Response.json({
      name: product.name,
      price: "", // sempre manual
      image: product.image,
      link: originalUrl, // SEMPRE usa o link que você colou
      category: product.category,
      description: product.description,
    });
  } catch (error: any) {
    console.error("Erro ao extrair produto:", error);

    return Response.json(
      {
        error: "Não foi possível extrair os dados do link.",
        details: error?.message ?? "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}