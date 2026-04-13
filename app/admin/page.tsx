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

export default function AdminPage() {
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
    loadProducts();
  }, []);

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

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-pink-500">Painel Cérebro 🧠</h1>
          <p className="text-gray-400 mt-2">
            Cadastre produtos que a IA poderá indicar no chat.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* FORM */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 space-y-4">
            <h2 className="text-xl font-semibold">Adicionar produto</h2>

            <div className="space-y-3">
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="Cole o link do produto aqui"
                className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none"
              />

              <button
                onClick={handleExtract}
                disabled={extracting}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-white font-semibold"
              >
                {extracting ? "Preenchendo..." : "Preencher automaticamente"}
              </button>
            </div>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nome do produto"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none"
            />

            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Preço"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none"
            />

            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder="URL da imagem"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none"
            />

            <input
              name="link"
              value={form.link}
              onChange={handleChange}
              placeholder="Link de afiliado"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none"
            />

            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Categoria"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none"
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Descrição"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none min-h-[120px]"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-pink-500 hover:bg-pink-600 px-5 py-3 rounded-xl text-white font-semibold"
            >
              {loading ? "Salvando..." : "Salvar produto"}
            </button>
          </div>

          {/* LISTA */}
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4">
              Produtos cadastrados
            </h2>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {products.length === 0 && (
                <p className="text-gray-500">
                  Nenhum produto cadastrado ainda.
                </p>
              )}

              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-black border border-zinc-800 rounded-xl p-4 space-y-2"
                >
                  <h3 className="font-semibold text-white">
                    {product.name}
                  </h3>
                  <p className="text-pink-400 font-bold">
                    {product.price}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {product.category}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {product.description}
                  </p>

                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-xl"
                    />
                  )}

                  <div className="flex gap-2 mt-2">
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-xl"
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
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-white"
                    >
                      Apagar
                    </button>
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