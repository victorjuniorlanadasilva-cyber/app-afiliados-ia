"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  name: string;
  price: string;
  image: string;
  link: string;
};

type Message = {
  role: "user" | "bot";
  content: string;
  product?: Product | null;
};

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "0px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          role: "bot",
          content:
            "Olá! Eu sou o DarianIA ✨\n\nSua IA para encontrar produtos e economizar.\n\nMe diga o que você procura e eu vou tentar achar uma opção com ótimo custo-benefício para você.",
        },
      ]);
    }
  }, [user, messages.length]);

  const sendMessage = async (customText?: string) => {
    const currentInput = (customText ?? input).trim();

    if (!currentInput || sending) return;

    const userMessage: Message = {
      role: "user",
      content: currentInput,
    };

    const newMessages: Message[] = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);

        setMessages([
          ...newMessages,
          {
            role: "bot",
            content:
              data.reply ||
              "Tive um probleminha aqui, mas ainda posso tentar te ajudar.",
            product: data.product ?? null,
          },
        ]);

        return;
      }

      setMessages([
        ...newMessages,
        {
          role: "bot",
          content: data.reply,
          product: data.product ?? null,
        },
      ]);
    } catch (error) {
      console.error("Erro no envio:", error);

      setMessages([
        ...newMessages,
        {
          role: "bot",
          content:
            "Tive um probleminha aqui, mas ainda posso tentar te ajudar.",
          product: null,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMessages([]);
  };

  const quickOptions = [
    "Quero um celular bom e barato",
    "Quero um notebook para estudar",
    "Preciso de carregador turbo",
    "Quero um fone bluetooth",
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-yellow-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin mx-auto" />
          <p className="text-yellow-200">Carregando DarianIA...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl text-center gold-glow">
          <div className="flex flex-col items-center mb-6">
            <img
              src="https://i.postimg.cc/gJnBKrYr/logo-png.png"
              alt="DarianIA"
              className="w-20 h-20 object-contain mb-4"
            />

            <h1 className="text-4xl font-bold gold-text">DarianIA</h1>

            <p className="mt-2 text-zinc-400 text-sm">
              Sua IA para encontrar produtos e economizar
            </p>
          </div>

          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: window.location.origin },
              })
            }
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-6 py-4 text-base font-bold text-black transition hover:scale-[1.02]"
          >
            Entrar com Google
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen bg-black text-white">
      <div className="mx-auto flex h-full max-w-6xl flex-col p-3 md:p-5">
        <div className="mb-3 rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-zinc-950 via-black to-zinc-900 px-5 py-4 shadow-xl gold-glow">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="DarianIA"
                className="w-10 h-10 object-contain"
              />

              <div>
                <h1 className="text-2xl font-bold gold-text">DarianIA</h1>
                <p className="text-xs text-zinc-400">
                  Sua IA para encontrar produtos e economizar
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-zinc-500 truncate max-w-[120px] md:max-w-xs">
                {user?.email}
              </p>

              <button
                onClick={logout}
                className="mt-1 text-xs px-3 py-1 rounded-lg border border-yellow-500/20 text-yellow-300 hover:bg-yellow-500/10"
              >
                Sair
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 shadow-2xl">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              {messages.length === 0 && (
                <p className="text-center text-zinc-500">
                  Diga o que você está procurando.
                </p>
              )}

              {messages.length === 1 && messages[0]?.role === "bot" && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {quickOptions.map((item) => (
                    <button
                      key={item}
                      onClick={() => sendMessage(item)}
                      className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-200 transition hover:bg-yellow-500/20"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-5">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`w-full max-w-3xl ${
                        msg.role === "user" ? "items-end" : "items-start"
                      } flex flex-col`}
                    >
                      <div
                        className={`rounded-3xl border px-4 py-3 whitespace-pre-wrap shadow-lg ${
                          msg.role === "user"
                            ? "border-yellow-500/20 bg-gradient-to-r from-yellow-400 to-amber-600 text-black"
                            : "border-yellow-500/15 bg-zinc-900 text-zinc-100"
                        }`}
                      >
                        {msg.content}
                      </div>

                      {msg.product && (
                        <div className="mt-3 w-full rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-zinc-950 to-zinc-900 p-4 shadow-xl">
                          <div className="flex flex-col gap-4 md:flex-row">
                            {msg.product.image && (
                              <img
                                src={msg.product.image}
                                alt={msg.product.name}
                                className="h-24 w-full rounded-2xl object-cover md:w-44"
                              />
                            )}

                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-yellow-200">
                                {msg.product.name}
                              </h3>

                              {msg.product.price && (
                                <p className="mt-2 text-2xl font-bold text-yellow-400">
                                  {msg.product.price}
                                </p>
                              )}

                              <p className="mt-2 text-sm text-zinc-400">
                                Opção encontrada pela DarianIA com foco em
                                custo-benefício e boa oportunidade de compra.
                              </p>

                              <a
                                href={msg.product.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-block rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-5 py-3 font-bold text-black transition hover:scale-[1.01]"
                              >
                                Ver oferta
                              </a>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="rounded-3xl border border-yellow-500/15 bg-zinc-900 px-4 py-3 text-zinc-300">
                      DarianIA está pensando...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-yellow-500/10 bg-black/40 p-4">
              <div className="flex gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      !isComposing &&
                      !sending
                    ) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Digite o produto que você procura..."
                  className="max-h-40 min-h-[56px] flex-1 resize-none rounded-2xl border border-yellow-500/20 bg-zinc-950 px-4 py-4 text-white outline-none placeholder:text-zinc-500"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={sending || !input.trim()}
                  className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-6 py-4 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}