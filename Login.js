const supabaseUrl = 'https://apsmtlzybsrmuhwlwabm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

const form = document.querySelector('.login-form');

async function signInUser(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    alert('Erro ao fazer login: ' + error.message);
    return;
  }

  // Redireciona para index.html após login
  window.location.href = 'index.html';
}

form.addEventListener('submit', signInUser);
