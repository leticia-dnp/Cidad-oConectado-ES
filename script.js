const map = L.map('map').setView([-22.1207, -54.7934], 13); // Coordenadas de Itaporã-MS

// Adiciona camada de mapa (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Array para armazenar ocorrências
let reports = [];

// Lógica de seleção de Perfil de Usuário
document.querySelectorAll('.role-btn').forEach(button => {
  button.addEventListener('click', function() {
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    document.getElementById('userRole').value = this.dataset.role;
  });
});

function updateInfrastructureInfo() {
  const counts = { rua: 0, iluminacao: 0, saneamento: 0, transporte: 0 };
  reports.forEach(r => {
    if (counts[r.type] !== undefined) counts[r.type]++;
  });

  const infoContainer = document.getElementById('infrastructure-info');
  const labels = {
    rua: 'Vias Públicas',
    iluminacao: 'Iluminação',
    saneamento: 'Saneamento',
    transporte: 'Transporte'
  };

  const statusList = Object.keys(labels).map(key => {
    const count = counts[key];
    const status = count === 0 ? 'Operacional' : (count < 3 ? 'Atenção' : 'Crítico');
    const color = count === 0 
      ? 'linear-gradient(135deg, #28a745, #5cd65c)' 
      : (count < 3 
        ? 'linear-gradient(135deg, #ffc107, #ffdb58)' 
        : 'linear-gradient(135deg, #dc3545, #ff6b6b)');
    
    return `
      <li class="status-item">
        <span class="status-label">${labels[key]}</span>
        <span class="status-badge" style="background: ${color};">${status} (${count})</span>
      </li>
    `;
  }).join('');

  infoContainer.innerHTML = `<ul class="status-list">${statusList}</ul>`;
}

function updateNewsSection(locationName) {
  const newsContainer = document.getElementById('news-info');
  const searchQuery = encodeURIComponent(`notícias infraestrutura prefeitura ${locationName}`);
  const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;

  newsContainer.innerHTML = `
    <p class="news-text">Consulte as últimas atualizações oficiais de <strong>${locationName}</strong>:</p>
    <a href="${googleSearchUrl}" target="_blank" class="news-link">
      🔍 Ver notícias no Google
    </a>
  `;
}

updateInfrastructureInfo();
updateNewsSection("Itaporã, MS");

// Variável para armazenar o marcador temporário de busca
let searchMarker = null;

// Função para adicionar marcador no mapa
function addMarker(report) {
  L.marker([report.lat, report.lng])
    .addTo(map)
    .bindPopup(`<b>${report.type}</b><br>${report.description}`);
}

// Captura de envio do formulário
document.getElementById('reportForm').addEventListener('submit', function(e) {
  e.preventDefault();

  // Captura de dados
  const type = document.getElementById('type').value;
  const description = document.getElementById('description').value;

  // Captura de localização do usuário
  navigator.geolocation.getCurrentPosition(position => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const report = { type, description, lat, lng };
    reports.push(report);

    addMarker(report);
    updateInfrastructureInfo();

    alert("Ocorrência registrada com sucesso!");
    document.getElementById('reportForm').reset();
  }, () => {
    alert("Não foi possível obter sua localização.");
  });
});

// Lógica para buscar endereço e atualizar o mapa
document.getElementById('searchAddress').addEventListener('click', function() {
  const address = document.getElementById('address').value;
  if (!address) return alert("Por favor, digite um endereço.");

  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`)
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        const { lat, lon } = data[0];
        
        if (searchMarker) map.removeLayer(searchMarker);
        
        searchMarker = L.marker([lat, lon]).addTo(map)
          .bindPopup("Localização encontrada!").openPopup();
          
        map.setView([lat, lon], 16);

        // Extrai o nome da cidade/local para atualizar as notícias
        const locationName = data[0].display_name.split(',')[0];
        updateNewsSection(locationName);
        
      } else {
        alert("Endereço não encontrado.");
      }
    })
    .catch(() => alert("Erro ao buscar o endereço. Tente novamente."));
});