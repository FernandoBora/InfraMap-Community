import { supabase } from './menuAuth.js';

const forgotForm = document.querySelector('.forgot-password-card form');
const emailInput = forgotForm.querySelector('input[type="email"]');

forgotForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  if (!email) return alert("Por favor, insira seu e-mail");

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'nova-senha.html'

  });

  if (error) {
    console.error(error);
    alert("Erro ao enviar e-mail de redefinição: " + error.message);
  } else {
    alert("E-mail enviado! Verifique sua caixa de entrada para redefinir a senha.");
    forgotForm.reset();
  }
});
