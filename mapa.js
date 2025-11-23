import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// --- Supabase ---
const SUPABASE_URL = "https://apsmtlzybsrmuhwlwabm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts";
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Configuração do mapa ---
const araucariaBounds = [
  [-25.75, -49.55], // sudoeste
  [-25.45, -49.30]  // nordeste
];

const map = L.map('map', {
  preferCanvas: true,
  maxBounds: araucariaBounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false
}).setView([-25.592737, -49.407578], 15);

L.tileLayer('https://tile.jawg.io/jawg-sunny/{z}/{x}/{y}{r}.png?access-token=rqQzchFCV7Q0NtoN7ibuW3LY3noGAycQF493QoTRUnm0SDDq3fuLfDHpBNYFIbkh', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
  minZoom: 14
}).addTo(map);

// --- Variáveis ---
let reports = [];
let markers = [];
let currentCategory = '';

// --- Ícones e cores ---
const categoryIcons = {
  'buraco': '🕳️',
  'iluminacao': '💡',
  'lixo': '🗑️',
  'seguranca': '🚨',
  'entulho': '🏗️',
  'transporte': '🚌',
  'agua_esgoto': '🚰',
  'calcada': '🚶',
  'arvore': '🌳',
  'outros': '❓'
};

const categoryColors = {
  'buraco': '#ef4444',
  'iluminacao': '#f59e0b',
  'lixo': '#10b981',
  'seguranca': '#8b5cf6',
  'entulho': '#6b7280',
  'transporte': '#3b82f6',
  'agua_esgoto': '#06b6d4',
  'calcada': '#f97316',
  'arvore': '#22c55e',
  'outros': '#64748b'
};

// --- Funções auxiliares ---
function getCategoryLabel(category) {
  const labels = {
    'buraco': 'Buraco na via',
    'iluminacao': 'Iluminação pública',
    'lixo': 'Lixo irregular',
    'seguranca': 'Segurança pública',
    'entulho': 'Entulho',
    'transporte': 'Transporte público',
    'agua_esgoto': 'Água e esgoto',
    'calcada': 'Calçada danificada',
    'arvore': 'Árvore/Poda',
    'outros': 'Outros'
  };
  return labels[category] || 'Outros';
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const ADMIN_EMAIL = "inframap80@gmail.com";
async function isAdmin() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.email === ADMIN_EMAIL;
}



// --- Marcadores ---
async function addMarker(report) {
  const markerHtml = `
    <div style="
      width: 32px; 
      height: 32px; 
      background-color: ${categoryColors[report.category] || '#64748b'}; 
      border: 3px solid #ffffff; 
      border-radius: 50%; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">${categoryIcons[report.category] || '❓'}</div>
  `;

  const marker = L.marker([report.coordinates[1], report.coordinates[0]], {
    icon: L.divIcon({
      html: markerHtml,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    })
  }).addTo(map);

  const admin = await isAdmin();

  const popupContent = `
    <div style="font-family: 'Inter', sans-serif; max-width: 280px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <span style="font-size: 18px;">${categoryIcons[report.category] || '❓'}</span>
        <h3 style="margin: 0; font-size: 14px; font-weight: 600;">${report.title}</h3>
      </div>
      <div style="margin-bottom: 6px;">
        <span style="font-size: 11px; color: #666;">Categoria:</span>
        <span style="font-size: 11px; font-weight: 500; margin-left: 4px;">${getCategoryLabel(report.category)}</span>
      </div>
      ${admin ? `
      <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.4; opacity: 0.8;">${report.description}</p>
      <div style="margin-bottom: 6px;">
        <span style="font-size: 11px; color: #666;">Data:</span>
        <span style="font-size: 11px; margin-left: 4px;">${formatDateTime(report.created_at)}</span>
      </div>
      ` : ''}
    </div>
  `;

  marker.bindPopup(popupContent);
  markers.push(marker);
}


function updateMapMarkers() {
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];

  const filteredReports = currentCategory
    ? reports.filter(r => r.category === currentCategory)
    : reports;

  filteredReports.forEach(report => addMarker(report));
}

function loadRecentReports() {
  const reportsList = document.getElementById('reportsList');
  const filteredReports = currentCategory
    ? reports.filter(r => r.category === currentCategory)
    : reports;

  if (filteredReports.length === 0) {
    reportsList.innerHTML = '<p style="color: #888; text-align: center; padding: 1rem;">Nenhum relatório encontrado</p>';
    return;
  }

  reportsList.innerHTML = filteredReports.map(r => `
    <div class="report-item">
      <div class="report-title">${r.title}</div>
      <div class="report-description">${r.description}</div>
      <div class="report-meta">
        <span>${getCategoryLabel(r.category)}</span>
        <span>${formatDateTime(r.created_at)}</span>
      </div>
    </div>
  `).join('');
}

function filterByCategory(category) {
  currentCategory = category;
  updateMapMarkers();
  loadRecentReports();
  document.getElementById('categoryFilter').value = category;
}

// Filtro pelo select
const categorySelect = document.getElementById('categoryFilter');
categorySelect.addEventListener('change', (e) => {
  filterByCategory(e.target.value);
});

// Filtro pelos botões
document.querySelectorAll('.category-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const category = btn.dataset.category;
    filterByCategory(category);
  });
});


// --- Formulário ---
// --- Formulário ---
const form = document.getElementById("report-form");

// Função para abrir o formulário
function openForm() {
  form.style.display = 'flex'; // ou 'block' se preferir
}

// Função para fechar o formulário
function closeForm() {
  form.style.display = 'none';
  form.reset();
}

// Botões de fechar
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', closeForm);
});

// Clicar no mapa → abre formulário
map.on("click", async e => {
  // Verifica se o usuário está logado
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Você precisa estar logado para enviar uma denúncia!");
    return;
  }

  // Se estiver logado, abre o formulário
  openForm();

  // Preenche coordenadas
  form.querySelector("[name=coordinates]").value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;

  // Preenche data/hora atual
  const now = new Date();
  const offset = -3 * 60;
  const localDate = new Date(now.getTime() + offset * 60 * 1000);
  form.querySelector("[name=date]").value = localDate.toISOString().slice(0, 16);
});



// Botão “Relatar na Minha Localização”
document.getElementById('reportNowBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return alert("Geolocalização não suportada");

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;

    if (
      latitude < araucariaBounds[0][0] || latitude > araucariaBounds[1][0] ||
      longitude < araucariaBounds[0][1] || longitude > araucariaBounds[1][1]
    ) return alert("Fora dos limites de Araucária");

    form.querySelector("[name=coordinates]").value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    document.getElementById('coordinatesDisplay').textContent = `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    const now = new Date();
    const offset = -3 * 60;
    const localDate = new Date(now.getTime() + offset * 60 * 1000);
    form.querySelector("[name=date]").value = localDate.toISOString().slice(0, 16);

    openForm();
    map.setView([latitude, longitude], 15);
  }, error => {
    console.error(error);
    alert("Não foi possível obter sua localização");
  });
});

// --- Envio do formulário para Supabase ---
form.addEventListener('submit', async e => {
  e.preventDefault();

  // Verifica se o usuário está logado
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    alert("Você precisa estar logado para enviar uma denúncia!");
    window.location.href = "Login.html";
    return;
  }

  const userId = session.user.id;

  // Pega os valores do formulário
  const coordinatesStr = form.querySelector("[name=coordinates]").value;
  if (!coordinatesStr) return alert("Selecione uma coordenada no mapa");
  const [lat, lng] = coordinatesStr.split(',').map(c => parseFloat(c.trim()));

  const title = form.querySelector("[name=title]").value.trim();
  const category = form.querySelector("[name=category]").value;
  const description = form.querySelector("[name=description]").value.trim();
  const created_at = form.querySelector("[name=date]").value;

  if (!title || !category || !description) return alert("Preencha todos os campos obrigatórios");

  // 🔹 Upload da imagem (se houver)
  let photo_url = null;
  const fileInput = form.querySelector("[name=photo]");
  const file = fileInput.files[0];

  if (file) {
    const fileName = `${userId}-${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("reports-images") // certifique-se de criar esse bucket no Supabase
      .upload(fileName, file);

    if (uploadError) {
  console.error("Erro no upload:", uploadError);
  alert("Erro ao enviar a imagem: " + uploadError.message);
  return; // interrompe para não salvar sem imagem
}
 else {
      const { data: publicUrlData } = supabase
        .storage
        .from("reports-images")
        .getPublicUrl(fileName);
      photo_url = publicUrlData.publicUrl;
    }
  }

  // Dados a serem salvos
  const report = {
    title,
    category,
    description,
    user_id: userId,
    coordinates: [lng, lat],
    created_at: new Date(created_at).toISOString(),
    updated_at: new Date().toISOString(),
    status: 'pendente',
    photo_url // 🔹 salva URL no banco
  };

  // Inserir no Supabase
  const { data, error } = await supabase
    .from('reports')
    .insert([report])
    .select();

  if (error) {
    console.error(error);
    return alert("Erro ao enviar relatório!");
  }

  // Atualiza a lista local e o mapa
  reports.unshift({ ...report, id: data[0].id });
  updateMapMarkers();
  loadRecentReports();

  // Fecha o formulário e limpa
  closeForm();

  alert("Relatório enviado com sucesso!");
});

async function loadInitialReports() {
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) return console.error("Erro ao carregar reports:", error);
  reports = data.map(r => ({
    ...r,
    coordinates: r.coordinates // garante array [lng, lat]
  }));
  updateMapMarkers();
  loadRecentReports();
}

document.addEventListener('DOMContentLoaded', loadInitialReports);

// --- Geolocalização ---
document.getElementById('reportNowBtn').addEventListener('click', () => {
  if (!navigator.geolocation) return alert("Geolocalização não suportada");

  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;

    if (
      latitude < araucariaBounds[0][0] || latitude > araucariaBounds[1][0] ||
      longitude < araucariaBounds[0][1] || longitude > araucariaBounds[1][1]
    ) return alert("Fora dos limites de Araucária");

    form.querySelector("[name=coordinates]").value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    document.getElementById('coordinatesDisplay').textContent = `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

    const now = new Date();
    const offset = -3 * 60;
    const localDate = new Date(now.getTime() + offset * 60 * 1000);
    form.querySelector("[name=date]").value = localDate.toISOString().slice(0, 16);

    form.style.visibility = 'visible';
    map.setView([latitude, longitude], 15);
  }, error => {
    console.error(error);
    alert("Não foi possível obter sua localização");
  });
});