import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from("usage_stats")
    .select("*")
    .limit(5);
    
  if (error) {
    console.log("❌ Erro:", error.message);
  } else {
    console.log("✅ Dados:", data.length, "registros");
    console.log("🎯 Dashboard funcionando!");
  }
}

test();
