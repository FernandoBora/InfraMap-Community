const supabaseUrl = 'https://apsmtlzybsrmuhwlwabm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const authLinks = document.getElementById('auth-links');
const userDropdown = document.getElementById('user-dropdown');
const userGreeting = document.getElementById('user-greeting');
const userButton = document.getElementById('user-button');
const dropdownContent = document.getElementById('dropdown-content');
const logoutBtn = document.getElementById('logout-btn');

async function checkUser() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (session) {
    authLinks.style.display = 'none';
    userDropdown.style.display = 'inline-block';

    // Pega o nome e role do usuário
    const userId = session.user.id;
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('name, role') // pega nome e role
      .eq('id', userId)
      .maybeSingle();

    userGreeting.textContent = !error && profile ? profile.name : session.user.email;

    // Adiciona opção "Painel" se for admin
    if (profile?.role === 'admin') {
      if (!document.getElementById('admin-panel-link')) {
        const panelLink = document.createElement('a');
        panelLink.href = 'admin.html';
        panelLink.textContent = 'Painel';
        panelLink.id = 'admin-panel-link';
        // Insere antes do link "Sair"
        dropdownContent.insertBefore(panelLink, logoutBtn);
      }
    } else {
      // Remove o painel se não for admin
      const existing = document.getElementById('admin-panel-link');
      if (existing) existing.remove();
    }

  } else {
    authLinks.style.display = 'flex';
    userDropdown.style.display = 'none';
  }
}

// Toggle dropdown ao clicar
userButton?.addEventListener('click', () => {
  dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
});

// Fecha dropdown ao clicar fora
window.addEventListener('click', (e) => {
  if (!userDropdown.contains(e.target)) {
    dropdownContent.style.display = 'none';
  }
});

// Logout
logoutBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  await supabaseClient.auth.signOut();
  checkUser();
});

// Verifica sessão ao carregar
checkUser();

// Atualiza menu se sessão mudar em outra aba
supabaseClient.auth.onAuthStateChange(() => {
  checkUser();
});
