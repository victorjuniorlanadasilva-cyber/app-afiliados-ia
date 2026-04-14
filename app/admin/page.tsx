"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Product = {
  id?: string;
  name: string;
  price: string;
  image: string;
  link: string;
  category: string;
  description: string;
};

const ADMIN_EMAIL = "victorjuniorlanadasilva@gmail.com";

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [extracting, setExtracting] = useState(false);

  const [form, setForm] = useState<Product>({
    name: "",
    price: "",
    image: "",
    link: "",
    category: "",
    description: "",
  });

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar produtos:", error);
      return;
    }

    setProducts(data || []);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) {
        console.error("Erro ao buscar usuário:", error);
      }

      setUser(data.user ?? null);
      setAuthLoading(false);
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
    if (user?.email === ADMIN_EMAIL) {
      loadProducts();
    }
  }, [user]);

  const handleExtract = async () => {
    if (!sourceUrl.trim()) {
      alert("Cole um link primeiro.");
      return;
    }

    try {
      setExtracting(true);

      const res = await fetch("/api/extract-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: sourceUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Não consegui extrair esse link.");
        return;
      }

      setForm({
        name: data.name || "",
        price: "",
        image: data.image || "",
        link: data.link || sourceUrl,
        category: data.category || "",
        description: data.description || "",
      });
    } catch (error) {
      console.error(error);
      alert("Erro ao tentar preencher automaticamente.");
    } finally {
      setExtracting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.link) {
      alert("Preencha pelo menos nome, preço e link.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("products").insert([form]);

    setLoading(false);

    if (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto.");
      return;
    }

    alert("Produto salvo com sucesso!");

    setForm({
      name: "",
      price: "",
      image: "",
      link: "",
      category: "",
      description: "",
    });

    setSourceUrl("");
    loadProducts();
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-black text-yellow-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-yellow-500/20 border-t-yellow-500 animate-spin mx-auto" />
          <p>Carregando painel...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8 shadow-2xl text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
            DarianIA Admin
          </h1>
          <p className="mt-3 text-zinc-300">
            Entre com sua conta para acessar o painel.
          </p>

          <button
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: `${window.location.origin}/admin` },
              })
            }
            className="mt-6 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-6 py-4 font-bold text-black transition hover:scale-[1.01]"
          >
            Entrar com Google
          </button>
        </div>
      </main>
    );
  }

  if (user.email !== ADMIN_EMAIL) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-zinc-950 p-8 text-center">
          <h1 className="text-3xl font-bold text-red-500">Acesso negado</h1>
          <p className="mt-3 text-zinc-300">
            Sua conta não tem permissão para entrar no admin.
          </p>
          <p className="mt-3 text-sm text-zinc-500">{user.email}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-zinc-950 via-black to-zinc-900 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-300 via-yellow-500 to-amber-600 bg-clip-text text-transparent">
                DarianIA Admin
              </h1>
              <p className="mt-2 text-zinc-400">
                Painel premium para cadastrar e gerenciar produtos.
              </p>
            </div>

            <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/5 px-4 py-3 text-sm text-zinc-300">
              Logado como: <span className="text-yellow-300">{user.email}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-zinc-950 to-zinc-900 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-semibold text-yellow-200">
              Adicionar produto
            </h2>

            <div className="space-y-4">
              <div className="rounded-2xl border border-yellow-500/10 bg-black/30 p-4">
                <label className="mb-2 block text-sm text-zinc-400">
                  Link para preenchimento automático
                </label>

                <div className="flex flex-col gap-3 md:flex-row">
                  <input
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="Cole o link do produto aqui"
                    className="flex-1 rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
                  />

                  <button
                    onClick={handleExtract}
                    disabled={extracting}
                    className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-5 py-3 font-bold text-black disabled:opacity-60"
                  >
                    {extracting
                      ? "Preenchendo..."
                      : "Preencher automaticamente"}
                  </button>
                </div>
              </div>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nome do produto"
                className="w-full rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
              />

              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Preço"
                className="w-full rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
              />

              <input
                name="image"
                value={form.image}
                onChange={handleChange}
                placeholder="URL da imagem"
                className="w-full rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
              />

              <input
                name="link"
                value={form.link}
                onChange={handleChange}
                placeholder="Link de afiliado"
                className="w-full rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
              />

              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Categoria"
                className="w-full rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
              />

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Descrição"
                className="min-h-[140px] w-full rounded-2xl border border-yellow-500/15 bg-zinc-950 px-4 py-3 outline-none placeholder:text-zinc-500"
              />

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-6 py-4 font-bold text-black disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Salvar produto"}
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-zinc-950 to-zinc-900 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-semibold text-yellow-200">
              Produtos cadastrados
            </h2>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-1">
              {products.length === 0 && (
                <p className="text-zinc-500">Nenhum produto cadastrado ainda.</p>
              )}

              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-3xl border border-yellow-500/15 bg-black/40 p-4 shadow-lg"
                >
                  <div className="flex flex-col gap-4 md:flex-row">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-24 w-full rounded-2xl object-cover md:w-40"
                      />
                    )}

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-100">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xl font-bold text-yellow-400">
                        {product.price}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {product.category}
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        {product.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-4 py-2 font-semibold text-black"
                        >
                          Abrir link
                        </a>

                        <button
                          onClick={async () => {
                            const confirmDelete = confirm(
                              "Quer apagar esse produto?"
                            );
                            if (!confirmDelete) return;

                            const { error } = await supabase
                              .from("products")
                              .delete()
                              .eq("id", product.id);

                            if (error) {
                              console.error(error);
                              alert("Erro ao apagar produto.");
                              return;
                            }

                            loadProducts();
                          }}
                          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 font-semibold text-red-300"
                        >
                          Apagar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}