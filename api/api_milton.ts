import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = req.method !== "GET" ? await req.json().catch(() => ({})) : {};

    let result;

    if (action === "load") {
      const { data, error } = await supabase
        .from("iniciativas")
        .select("*, lista_itens(*)")
        .order("ordem", { ascending: true });
      result = { data, error };
    } else if (action === "update-iniciativa") {
      const { id, ...fields } = body;
      const { data, error } = await supabase
        .from("iniciativas")
        .update(fields)
        .eq("id", id);
      result = { data, error };
    } else if (action === "toggle-action") {
      const { dbId, concluida } = body;
      const { data, error } = await supabase
        .from("lista_itens")
        .update({ concluida })
        .eq("id", dbId);
      result = { data, error };
    } else if (action === "insert-iniciativa") {
      const { data, error } = await supabase
        .from("iniciativas")
        .insert(body)
        .select()
        .single();
      result = { data, error };
    } else if (action === "insert-itens") {
      const { data, error } = await supabase
        .from("lista_itens")
        .insert(body.rows)
        .select();
      result = { data, error };
    } else if (action === "upsert-itens") {
      // Update existing items by id — never deletes
      const updates = body.rows || [];
      const errors = [];
      for (const row of updates) {
        const { id, ...fields } = row;
        const { error } = await supabase
          .from("lista_itens")
          .update(fields)
          .eq("id", id);
        if (error) errors.push(error);
      }
      result = { data: null, error: errors.length ? errors[0] : null };
    } else if (action === "delete-iniciativa") {
      const { data, error } = await supabase
        .from("iniciativas")
        .delete()
        .eq("id", body.id);
      result = { data, error };
    } else if (action === "load-version") {
      const { data, error } = await supabase
        .from("versoes")
        .select("versao, descricao, created_at")
        .order("id", { ascending: false })
        .limit(1)
        .single();
      result = { data, error };
    } else {
      result = { error: { message: "Acao desconhecida: " + action } };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: { message: e.message } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
