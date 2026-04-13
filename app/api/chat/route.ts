import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  link: string;
  category: string;
  description: string;
};

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalize(text: string) {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function scoreProduct(product: Product, userMessage: string) {
  const text = normalize(userMessage);
  const name = normalize(product.name || "");
  const category = normalize(product.category || "");
  const description = normalize(product.description || "");

  let score = 0;

  if (name && text.includes(name)) score += 10;
  if (category && text.includes(category)) score += 6;
  if (description && text.includes(description)) score += 4;

  const nameWords = name.split(" ").filter((w) => w.length > 2);
  for (const word of nameWords) {
    if (text.includes(word)) score += 3;
  }

  const descriptionWords = description.split(" ").filter((w) => w.length > 4);
  for (const word of descriptionWords.slice(0, 8)) {
    if (text.includes(word)) score += 1;
  }

  if (
    text.includes("computador") ||
    text.includes("pc") ||
    text.includes("faculdade") ||
    text.includes("estudar") ||
    text.includes("estudo") ||
    text.includes("projeto") ||
    text.includes("trabalho")
  ) {
    if (name.includes("notebook") || category.includes("notebook")) score += 8;
  }

  if (
    text.includes("celular") ||
    text.includes("smartphone") ||
    text.includes("iphone") ||
    text.includes("android") ||
    text.includes("telefone")
  ) {
    if (name.includes("celular") || category.includes("celular")) score += 8;
  }

  if (
    text.includes("carregador") ||
    text.includes("cabo") ||
    text.includes("usb") ||
    text.includes("tipo c") ||
    text.includes("bateria")
  ) {
    if (name.includes("carregador") || category.includes("carregador")) score += 8;
  }

  if (
    text.includes("fone") ||
    text.includes("bluetooth") ||
    text.includes("headphone") ||
    text.includes("audio") ||
    text.includes("musica")
  ) {
    if (name.includes("fone") || category.includes("fone")) score += 8;
  }

  return score;
}

function getTopProducts(products: Product[], userMessage: string) {
  const scored = products
    .map((product) => ({
      product,
      score: scoreProduct(product, userMessage),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map((item) => item.product);
}

function fallbackReply(userMessage: string, topProducts: Product[]) {
  const text = normalize(userMessage);

  if (topProducts.length > 0) {
    const first = topProducts[0];

    if (
      text.includes("computador") ||
      text.includes("faculdade") ||
      text.includes("estudar") ||
      text.includes("projeto")
    ) {
      return `Pra esse tipo de necessidade, uma opção que pode fazer bastante sentido pra você é o ${first.name}. Além de ser uma escolha interessante para estudos e uso no dia a dia, eu sempre procuro priorizar alternativas com ótimo custo-benefício e boas oportunidades de compra.`;
    }

    if (
      text.includes("carregador") ||
      text.includes("cabo") ||
      text.includes("tipo c")
    ) {
      return `Achei uma opção que pode te atender muito bem: ${first.name}. É o tipo de produto útil no dia a dia, e eu sempre tento te mostrar alternativas com preço competitivo e boa oportunidade de compra.`;
    }

    if (
      text.includes("celular") ||
      text.includes("smartphone") ||
      text.includes("telefone")
    ) {
      return `Encontrei uma opção interessante pra você: ${first.name}. Pode ser uma boa alternativa para quem busca praticidade, custo-benefício e uma oferta bem atrativa dentro das opções disponíveis.`;
    }

    return `Encontrei uma opção que pode combinar com o que você procura: ${first.name}. Estou priorizando alternativas com ótimo custo-benefício e ofertas interessantes dentro da base, então vale a pena dar uma olhada 👇`;
  }

  if (
    text.includes("oi") ||
    text.includes("ola") ||
    text.includes("bom dia") ||
    text.includes("boa tarde") ||
    text.includes("boa noite")
  ) {
    return "Oi! Que bom te ver por aqui 😊 Me conta o que você está procurando que eu tento te mostrar uma opção com ótimo custo-benefício e uma oportunidade bem interessante.";
  }

  return "Me fala um pouco melhor o que você está procurando que eu tento te indicar uma opção com ótimo custo-benefício e uma oferta interessante 😊";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const lastMessage = messages[messages.length - 1]?.content || "";

    const { data: products, error } = await supabase.from("products").select("*");

    if (error) {
      return Response.json({
        reply:
          "Estou com dificuldade para acessar os produtos agora, mas posso continuar te ajudando normalmente 😊",
        product: null,
      });
    }

    const topProducts = getTopProducts(products || [], lastMessage);
    const mainProduct = topProducts[0] || null;

    const conversationText = messages
      .map((msg: { role: "user" | "bot"; content: string }) => {
        const role = msg.role === "bot" ? "assistente" : "usuario";
        return `${role}: ${msg.content}`;
      })
      .join("\n");

    const productContext =
      topProducts.length > 0
        ? `
Produtos mais compatíveis encontrados:
${topProducts
  .map(
    (p, i) => `
${i + 1}. Nome: ${p.name}
Preço: ${p.price}
Categoria: ${p.category}
Descrição: ${p.description}
`
  )
  .join("\n")}
`
        : "Nenhum produto compatível encontrado até agora.";

    const prompt = `
Você é uma assistente virtual especialista em vendas, simpática, humana, natural e persuasiva.
Fale sempre em português do Brasil.

Seu estilo:
- consultiva
- confiante
- amigável
- profissional
- clara
- persuasiva sem exagero
- nunca pareça robótica

Seu objetivo:
- entender a necessidade do usuário
- recomendar o produto mais compatível quando fizer sentido
- ajudar o usuário a sentir confiança na escolha
- aumentar a chance de clique e compra

Diretrizes comerciais:
- sempre que fizer sentido, destaque custo-benefício, preço competitivo, praticidade e utilidade real
- procure transmitir ao usuário que você está priorizando as melhores oportunidades disponíveis na base
- quando houver produto compatível, você pode dizer que está mostrando uma opção com ótimo preço ou uma oferta muito interessante
- você pode reforçar que a compra será feita em plataforma parceira confiável
- você pode transmitir segurança sobre a compra, mas sem inventar garantias absolutas
- evite prometer "menor preço do mercado", "sempre o menor preço" ou "entrega garantida" como certeza absoluta
- prefira frases como:
  - "estou te mostrando uma opção com ótimo custo-benefício"
  - "essa é uma oferta muito interessante dentro das opções disponíveis"
  - "busco sempre priorizar preços competitivos e boas oportunidades"
  - "a compra é feita em plataforma parceira confiável"
  - "essa opção pode fazer bastante sentido pra você"

Regras:
- converse normalmente
- não force venda em toda resposta
- se houver produto compatível, recomende com naturalidade
- destaque benefício, praticidade, custo-benefício ou utilidade real
- explique em 1 ou 2 frases por que aquele produto combina com o que o usuário quer
- você pode usar linguagem comercial leve, como:
  - "essa opção pode fazer bastante sentido pra você"
  - "é uma escolha interessante"
  - "vale a pena dar uma olhada"
  - "é o tipo de produto que costuma atender bem essa necessidade"
- não invente produto, preço ou características
- não diga que encontrou algo se não houver produto compatível
- se houver mais de uma opção, priorize a melhor
- se o usuário estiver em dúvida, ajude a decidir
- quando houver oportunidade, destaque que você procura apresentar a opção com melhor custo-benefício disponível na base no momento

${productContext}

Conversa:
${conversationText}

Responda agora à última mensagem do usuário de forma humana, natural, vendedora e persuasiva.
`.trim();

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const reply = result.text || fallbackReply(lastMessage, topProducts);

      return Response.json({
        reply,
        product: mainProduct,
      });
    } catch (geminiError: any) {
      console.error("Erro Gemini:", geminiError);

      return Response.json({
        reply: fallbackReply(lastMessage, topProducts),
        product: mainProduct,
      });
    }
  } catch (error: any) {
    console.error("Erro geral na API /api/chat:", error);

    return Response.json({
      reply:
        "Tive um probleminha aqui, mas ainda posso tentar te ajudar 😊 Me diz melhor o que você procura que eu tento te mostrar uma boa oportunidade.",
      product: null,
    });
  }
}