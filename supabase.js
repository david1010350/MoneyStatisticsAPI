// ========================================
// Supabase 設定
// ========================================

const SUPABASE_URL = "https://hztxqrfuqgdktxaushfo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_GT64xGBTDavCDwxEolZrlA_63WIx7_W";

// 建立 Supabase Client
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        db: {
            schema: "licenses"
        }
    }
);