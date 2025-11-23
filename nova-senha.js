import { supabase } from './menuAuth.js'; // mesmo client

const form = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const newPassword = newPasswordInput.value.trim();
  if (!newPassword) return alert("Digite uma nova senha.");

  // O Supabase cria automaticamente uma sessão temporária ao acessar o link do e-mail
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    alert("Sessão inválida. Tente reenviar o e-mail de recuperação.");
    return;
  }

  // Atualiza a senha
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    console.error(error);
    alert("Erro ao atualizar a senha: " + error.message);
  } else {
    alert("Senha atualizada com sucesso! Você já pode fazer login.");
    window.location.href = "login.html";
  }
});
