const supabaseUrl = 'https://apsmtlzybsrmuhwlwabm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const form = document.querySelector('.login-form');

async function signUpUser(event) {
  event.preventDefault();

  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm').value;

  if (password !== confirmPassword) {
    alert('As senhas não coincidem!');
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) { alert('Erro ao cadastrar: ' + error.message); return; }

  await supabaseClient
    .from('profiles')
    .upsert([{ id: data.user.id, name, email }]);

  alert('Cadastro realizado com sucesso! Redirecionando para o login...');
  window.location.href = 'confirm.html';
}

form.addEventListener('submit', signUpUser);
