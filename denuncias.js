import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Supabase ---
const SUPABASE_URL = "https://apsmtlzybsrmuhwlwabm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Seleciona lista de reports ---
const reportsList = document.getElementById('reportsList');

// --- Carrega denúncias do usuário ---
async function loadUserReports() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert("Você precisa estar logado para ver suas denúncias!");
        window.location.href = "Login.html";
        return;
    }

    const userId = session.user.id;

    const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        reportsList.innerHTML = '<p>Erro ao carregar suas denúncias.</p>';
        return;
    }

    if (!data || data.length === 0) {
        reportsList.innerHTML = '<p>Você ainda não fez nenhuma denúncia.</p>';
        return;
    }

    reportsList.innerHTML = data.map(r => `
        <div class="report-item">
            <h3>${r.title}</h3>
            <p>${r.description}</p>
            <div class="report-meta">
                <span>Categoria: ${r.category}</span>
                <span>Data: ${new Date(r.created_at).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                <span>Status: ${r.status}</span>
            </div>
        </div>
    `).join('');
}

// --- Logout ---
document.getElementById('logout-btn').addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = "Login.html";
});

document.addEventListener('DOMContentLoaded', loadUserReports);
