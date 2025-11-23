import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://apsmtlzybsrmuhwlwabm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elementos
const userNameEl = document.getElementById("user-name");
const userEmailEl = document.getElementById("user-email");
const userCreatedEl = document.getElementById("user-created");
const changePasswordForm = document.getElementById("change-password-form");
const deleteAccountBtn = document.getElementById("delete-account-btn");

// Carrega dados do usuário logado
async function loadUser() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Você precisa estar logado!");
    window.location.href = "Login.html";
    return;
  }

  const user = session.user;
  userNameEl.textContent = user.user_metadata?.full_name || "Usuário";
  userEmailEl.textContent = user.email;
  userCreatedEl.textContent = new Date(user.created_at).toLocaleDateString("pt-BR");
}

loadUser();

// Alterar senha
changePasswordForm.addEventListener("submit", async e => {
  e.preventDefault();
  const currentPassword = document.getElementById("current-password").value;
  const newPassword = document.getElementById("new-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (newPassword !== confirmPassword) return alert("Senhas não coincidem");

  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return alert("Erro ao alterar a senha: " + error.message);

  alert("Senha alterada com sucesso!");
  changePasswordForm.reset();
});

// Deletar conta
deleteAccountBtn.addEventListener("click", async () => {
  if (!confirm("Tem certeza que deseja deletar sua conta? Esta ação não pode ser desfeita.")) return;

  const { data, error } = await supabase.auth.deleteUser();
  if (error) return alert("Erro ao deletar conta: " + error.message);

  alert("Conta deletada com sucesso!");
  window.location.href = "index.html";
});
