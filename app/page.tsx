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
            "Oi! Posso te ajudar a encontrar uma opção com ótimo custo-benefício 😊\n\nMe diga o que você está procurando ou escolha uma opção abaixo 👇",
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
              "Tive um probleminha aqui, mas ainda posso tentar te ajudar 😊",
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
            "Tive um probleminha aqui, mas ainda posso tentar te ajudar 😊",
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p>Carregando...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <button
          onClick={() =>
            supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin },
            })
          }
          className="bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded-xl text-white font-semibold"
        >
          Entrar com Google
        </button>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen bg-black text-white">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <div>
          <h1 className="font-bold text-lg">Chat IA 💡</h1>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>

        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Sair
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center">
            Diga o que você está procurando 👇
          </p>
        )}

        {messages.length === 1 && messages[0]?.role === "bot" && (
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Quero um celular",
              "Quero um notebook",
              "Preciso de carregador",
              "Quero fone bluetooth",
            ].map((item) => (
              <button
                key={item}
                onClick={() => sendMessage(item)}
                className="bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-xl text-sm text-white"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.role === "user" ? "ml-auto max-w-[75%]" : "max-w-[75%]"
            }
          >
            <div
              className={`p-3 rounded-2xl whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-white"
              }`}
            >
              {msg.content}
            </div>

            {msg.product && (
              <div className="mt-3 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                {msg.product.image && (
                  <img
                    src={msg.product.image}
                    alt={msg.product.name}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-white text-lg">
                    {msg.product.name}
                  </h3>

                  {msg.product.price && (
                    <p className="text-pink-400 font-bold text-xl">
                      {msg.product.price}
                    </p>
                  )}

                  <a
                    href={msg.product.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-xl font-medium"
                  >
                    🔥 Ver melhor preço
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="max-w-[75%]">
            <div className="p-3 rounded-2xl bg-gray-800 text-gray-300">
              Digitando...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-800 flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isComposing) {
              e.preventDefault();
              sendMessage();
            }
          }}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          rows={1}
          placeholder="Ex: quero algo para faculdade ou um celular barato"
          className="flex-1 resize-none overflow-hidden bg-gray-900 p-3 rounded-xl outline-none border border-gray-800 min-h-[52px] max-h-40"
        />

        <button
          onClick={() => sendMessage()}
          disabled={sending}
          className="bg-pink-500 hover:bg-pink-600 disabled:opacity-60 px-5 h-[52px] rounded-xl text-white font-semibold"
        >
          {sending ? "..." : "Enviar"}
        </button>
      </div>
    </main>
  );
}