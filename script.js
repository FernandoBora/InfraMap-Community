import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  const SUPABASE_URL = "https://apsmtlzybsrmuhwlwabm.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwc210bHp5YnNybXVod2x3YWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNDczODYsImV4cCI6MjA3MjkyMzM4Nn0.NIfJmYoV9yB-xVkcgYaNwFI9KcUa4Pj-XvssKqdY2Ts";
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);





const araucariaBounds = [
  [-25.75, -49.55], // sudoeste
  [-25.45, -49.30]  // nordeste
];

// inicializa o mapa
const map = L.map('map', {
  preferCanvas: true,
  maxBounds: araucariaBounds,
  maxBoundsViscosity: 1.0,
  zoomControl: false
}).setView([-25.592737, -49.407578], 15);

// tiles
L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  maxZoom: 19,
  minZoom: 14
}).addTo(map);

// Array em memória para armazenar relatórios (temporário, até integrar com Supabase)
let reports = [];
let markers = []; // Array para gerenciar marcadores no mapa
let currentCategory = ''; // Variável para rastrear a categoria atual

// Defina os ícones e cores das categorias (copiado de 1script.js para consistência)
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

// Função para adicionar um marcador no mapa
function addMarker(report) {
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

    const popupContent = `
        <div style="font-family: 'Inter', sans-serif; max-width: 280px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="font-size: 18px;">${categoryIcons[report.category] || '❓'}</span>
                <h3 style="margin: 0; font-size: 14px; font-weight: 600;">${report.title}</h3>
            </div>
            <p style="margin: 0 0 8px 0; font-size: 12px; line-height: 1.4; opacity: 0.8;">${report.description}</p>
            <div style="margin-bottom: 6px;">
                <span style="font-size: 11px; color: #666;">Categoria:</span>
                <span style="font-size: 11px; font-weight: 500; margin-left: 4px;">${getCategoryLabel(report.category)}</span>
            </div>
            <div style="margin-bottom: 6px;">
                <span style="font-size: 11px; color: #666;">Data:</span>
                <span style="font-size: 11px; margin-left: 4px;">${formatDateTime(report.createdAt)}</span>
            </div>
        </div>
    `;

    marker.bindPopup(popupContent);
    markers.push(marker);
}

// Função auxiliar para rótulos de categoria
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

// Função auxiliar para formatar data/hora
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

// Função para atualizar os marcadores no mapa com base na categoria selecionada
function updateMapMarkers() {
    // Limpar marcadores existentes
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    // Filtrar relatórios com base na categoria atual
    const filteredReports = currentCategory
        ? reports.filter(report => report.category === currentCategory)
        : reports;

    // Adicionar marcadores para os relatórios filtrados
    filteredReports.forEach(report => addMarker(report));
}

// Função para atualizar a lista de relatórios recentes na sidebar
function loadRecentReports() {
    const reportsList = document.getElementById('reportsList');
    const filteredReports = currentCategory
        ? reports.filter(report => report.category === currentCategory)
        : reports;

    if (filteredReports.length === 0) {
        reportsList.innerHTML = '<p class="text-small" style="color: var(--text-muted); text-align: center; padding: 1rem;">Nenhum relatório encontrado</p>';
        return;
    }

    reportsList.innerHTML = filteredReports.map(report => `
        <div class="report-item">
            <div class="report-title">${report.title}</div>
            <div class="report-description">${report.description}</div>
            <div class="report-meta">
                <span>${getCategoryLabel(report.category)}</span>
                <span>${formatDateTime(report.createdAt)}</span>
            </div>
        </div>
    `).join('');
}

// Função para filtrar por categoria
function filterByCategory(category) {
    currentCategory = category;
    updateMapMarkers();
    loadRecentReports();
    document.getElementById('categoryFilter').value = category;
}

// pega referência do form
const form = document.getElementById("report-form");

// quando clicar no mapa → mostra o form e preenche coordenadas e data
map.on("click", function(e) {
    form.style.visibility = "visible";
    form.querySelector("[name=coordinates]").value = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;

    // preenche a data e hora automaticamente
    const now = new Date();
    const offset = -3 * 60; // -3 horas em minutos
    const localDate = new Date(now.getTime() + offset * 60 * 1000);
    const formattedDate = localDate.toISOString().slice(0, 16); // Formato: YYYY-MM-DDThh:mm
    form.querySelector("[name=date]").value = formattedDate;
});

// fecha o form ao clicar no botão close-modal
document.querySelector('.close-modal').addEventListener('click', () => {
    form.style.visibility = "hidden";
});

// fecha o form ao clicar fora dele
document.addEventListener('click', (e) => {
    if (!form.contains(e.target) && e.target !== map.getContainer()) {
        form.style.visibility = "hidden";
    }
});

// Configurar eventos para os filtros
document.getElementById('categoryFilter').addEventListener('change', (e) => {
    filterByCategory(e.target.value);
});

document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const category = e.currentTarget.dataset.category;
        filterByCategory(category);
    });
});

// Adiciona o evento de submissão do formulário
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const coordinatesStr = form.querySelector("[name=coordinates]").value;
    if (!coordinatesStr) {
        alert('Erro: coordenadas não encontradas');
        return;
    }
    const [lat, lng] = coordinatesStr.split(',').map(coord => parseFloat(coord.trim()));

    const title = form.querySelector("[name=title]").value.trim();
    const category = form.querySelector("[name=category]").value;
    const description = form.querySelector("[name=description]").value.trim();
    const createdAt = form.querySelector("[name=date]").value;

    if (!title || !category || !description) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }

    // Pegar usuário logado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert('Você precisa estar logado para enviar uma denúncia.');
        return;
    }

    const user_id = session.user.id;

    const report = {
        user_id,
        title,
        category,
        description,
        coordinates: { lat, lng },
        created_at: new Date(createdAt).toISOString(),
        status: 'pendente'
    };

    // Inserir no Supabase
    const { data, error } = await supabase.from('reports').insert([report]);

    if (error) {
        console.error('Erro ao enviar relatório:', error);
        alert('Ocorreu um erro ao enviar o relatório.');
        return;
    }

    // Atualizar lista local e UI
    reports.unshift({ ...report, id: data[0].id });
    updateMapMarkers();
    loadRecentReports();
    form.style.visibility = "hidden";
    form.reset();
    alert('Relatório enviado com sucesso!');
});


// Carregar relatórios iniciais (exemplo, substituir por Supabase no futuro)
function loadInitialReports() {
    const defaultReports = [
        {
            id: '1',
            title: 'Buraco grande na Rua Principal',
            description: 'Buraco de aproximadamente 1 metro de diâmetro causando danos aos veículos e risco aos pedestres',
            category: 'buraco',
            coordinates: [-49.2577, -25.4284],
            reporterName: 'Maria Silva',
            reporterContact: 'maria@email.com',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'pendente'
        },
        {
            id: '2',
            title: 'Poste queimado na Rua das Flores',
            description: 'Poste de luz queimado há mais de uma semana, deixando a rua escura e insegura',
            category: 'iluminacao',
            coordinates: [-49.2597, -25.4304],
            reporterName: 'João Santos',
            reporterContact: 'joao@email.com',
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
            status: 'pendente'
        },
        {
            id: '3',
            title: 'Lixo acumulado na esquina',
            description: 'Muito lixo jogado na esquina da Rua Central, atraindo animais e gerando mau cheiro',
            category: 'lixo',
            coordinates: [-49.2557, -25.4264],
            reporterName: 'Ana Costa',
            reporterContact: '41999887766',
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updatedAt: new Date(Date.now() - 259200000).toISOString(),
            status: 'pendente'
        },
        {
            id: '4',
            title: 'Calçada danificada',
            description: 'Calçada com diversas rachaduras e buracos dificultando o trânsito de pedestres',
            category: 'calcada',
            coordinates: [-49.2567, -25.4274],
            reporterName: 'Pedro Oliveira',
            reporterContact: 'pedro@email.com',
            createdAt: new Date(Date.now() - 345600000).toISOString(),
            updatedAt: new Date(Date.now() - 345600000).toISOString(),
            status: 'pendente'
        }
    ];
    reports = defaultReports;
    updateMapMarkers();
    loadRecentReports();
}


// Inicializar relatórios quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    loadInitialReports();
});

// Evento para o botão "Relatar na Minha Localização"
document.getElementById('reportNowBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Verificar se as coordenadas estão dentro dos limites de Araucária
                if (
                    latitude >= araucariaBounds[0][0] &&
                    latitude <= araucariaBounds[1][0] &&
                    longitude >= araucariaBounds[0][1] &&
                    longitude <= araucariaBounds[1][1]
                ) {
                    // Preencher o campo de coordenadas
                    form.querySelector("[name=coordinates]").value = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    // Atualizar o display de coordenadas
                    document.getElementById('coordinatesDisplay').textContent = `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                    // Preencher a data e hora
                    const now = new Date();
                    const offset = -3 * 60; // -3 horas em minutos
                    const localDate = new Date(now.getTime() + offset * 60 * 1000);
                    const formattedDate = localDate.toISOString().slice(0, 16);
                    form.querySelector("[name=date]").value = formattedDate;
                    // Mostrar o formulário
                    form.style.visibility = 'visible';
                    // Centralizar o mapa na localização do usuário
                    map.setView([latitude, longitude], 15);
                } else {
                    alert('Sua localização está fora dos limites de Araucária. Clique no mapa para selecionar uma localização válida.');
                }
            },
            (error) => {
                console.error('Erro ao obter localização:', error);
                alert('Não foi possível obter sua localização. Clique no mapa para selecionar uma localização.');
            }
        );
    } else {
        alert('Geolocalização não é suportada pelo seu navegador. Clique no mapa para selecionar uma localização.');
    }
});