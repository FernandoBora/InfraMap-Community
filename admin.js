import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = "https://apsmtlzybsrmuhwlwabm.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts";
const supabase = createClient(supabaseUrl, supabaseKey);

const reportsList = document.getElementById('reports-list');
const usersList = document.getElementById('users-list');
const logoutBtn = document.getElementById('logout-btn');

const ADMIN_EMAIL = "inframap80@gmail.com";

// ✅ Checar se é admin
async function checkAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || session.user.email !== ADMIN_EMAIL) {
    alert("Acesso negado! Somente administradores podem acessar esta página.");
    window.location.href = "index.html";
    return false;
  }
  return true;
}

// 📋 Carregar denúncias
async function loadReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    reportsList.innerHTML = "<p>Erro ao carregar denúncias.</p>";
    return;
  }

  if (!data || data.length === 0) {
    reportsList.innerHTML = "<p>Nenhuma denúncia encontrada.</p>";
    return;
  }

  reportsList.innerHTML = "";
  data.forEach(report => {
    const div = document.createElement('div');
    div.className = "report-item";
    
    div.innerHTML = `
      <strong>${report.description || "(sem descrição)"}</strong>
      <p><b>ID:</b> ${report.id}</p>
      <p><b>Usuário ID:</b> ${report.user_id || "desconhecido"}</p>
      <p><b>Data:</b> ${new Date(report.created_at).toLocaleString()}</p>
      ${report.photo_url ? `<img src="${report.photo_url}" alt="Foto da denúncia" style="max-width:200px; display:block; margin-top:0.5rem; border-radius:4px;">` : ''}
      <button class="delete-btn" data-id="${report.id}" data-type="report">Apagar</button>
    `;
    reportsList.appendChild(div);
  });
}

// 👤 Carregar usuários
async function loadUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    usersList.innerHTML = "<p>Erro ao carregar usuários.</p>";
    return;
  }

  if (!data || data.length === 0) {
    usersList.innerHTML = "<p>Nenhum usuário encontrado.</p>";
    return;
  }

  usersList.innerHTML = "";
  data.forEach(user => {
    const div = document.createElement('div');
    div.className = "user-item";
    div.innerHTML = `
      <strong>${user.name || "(sem nome)"}</strong>
      <p><b>E-mail:</b> ${user.email}</p>
      <p><b>Criado em:</b> ${new Date(user.created_at).toLocaleString()}</p>
      <button class="delete-btn" data-id="${user.id}" data-type="user">Apagar Usuário</button>
    `;
    usersList.appendChild(div);
  });
}

// 🧹 Apagar denúncia ou usuário
async function deleteItem(id, type) {
  const table = type === 'report' ? 'reports' : 'profiles';
  if (!confirm(`Tem certeza que deseja apagar este ${type === 'report' ? 'relato' : 'usuário'}?`)) return;

  let photoPath = null;
  if (type === 'report') {
    const { data: reportData, error: fetchError } = await supabase
      .from('reports')
      .select('photo_url')
      .eq('id', id)
      .single();

    if (!fetchError && reportData?.photo_url) {
      const parts = reportData.photo_url.split('/reports-images/');
      if (parts.length > 1) {
        photoPath = parts[1];
      } else {
        console.warn("Caminho inesperado:", reportData.photo_url);
      }
    }
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(error);
    return alert("Erro ao apagar!");
  }

  if (photoPath) {
    const { error: storageError } = await supabase.storage
      .from('reports-images')
      .remove([photoPath]);

    if (storageError) {
      console.warn("Erro ao apagar imagem:", storageError);
    }
  }

  alert("Apagado com sucesso!");
  if (type === 'report') loadReports();
  else loadUsers();
}

// 🧭 Alternar abas
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// 🧑‍💻 Eventos globais
document.addEventListener('click', e => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    const type = e.target.getAttribute('data-type');
    deleteItem(id, type);
  }
});

// 🚪 Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = "index.html";
});

// 🚀 Inicialização
(async () => {
  const isAdmin = await checkAdmin();
  if (isAdmin) {
    loadReports();
    loadUsers();
  }
})();
