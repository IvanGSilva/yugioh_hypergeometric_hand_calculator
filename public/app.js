let bancoCartas = [];
let deckAtual = []; // Guarda objetos: { card, count, role: 'starter'|'extender'|'brick'|'none' }

// Carrega Banco Local do Backend ao iniciar
async function carregarBanco() {
    const statusLabel = document.getElementById('db-status');
    statusLabel.textContent = "Solicitando dados ao servidor backend...";
    
    try {
        console.log("Enviando requisição GET para /api/cartas...");
        const res = await fetch('http://localhost:3000/api/cartas'); // Forçando o endereço completo para evitar erros de rota relativa
        
        if (!res.ok) {
            throw new Error(`Resposta do servidor não foi amigável: ${res.status}`);
        }
        
        bancoCartas = await res.json();
        console.log("Sucesso ao carregar banco local do backend!", bancoCartas.length);
        statusLabel.textContent = `Banco carregado com ${bancoCartas.length} cartas.`;
        statusLabel.style.color = "#22c55e"; // Verde para sucesso
    } catch (err) {
        statusLabel.textContent = "Erro de conexão. Clique no botão de sincronizar para forçar.";
        statusLabel.style.color = "#ef4444"; // Vermelho para erro
        console.error("Erro detalhado no frontend ao carregar o banco:", err);
    }
}

// Sincroniza banco de forma forçada
document.getElementById('btn-sync').addEventListener('click', async () => {
    const statusLabel = document.getElementById('db-status');
    statusLabel.textContent = "Sincronizando banco remoto (isso pode demorar alguns segundos)...";
    statusLabel.style.color = "#ca8a04"; // Amarelo
    
    try {
        console.log("Enviando POST para /api/cartas/sincronizar...");
        const res = await fetch('http://localhost:3000/api/cartas/sincronizar', { method: 'POST' });
        
        if (!res.ok) {
            throw new Error(`Falha na rota de sincronização: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Sincronização manual completada!", data);
        
        // Recarrega o banco após sincronizar
        await carregarBanco();
    } catch (err) {
        statusLabel.textContent = "Erro ao forçar sincronização.";
        statusLabel.style.color = "#ef4444";
        console.error("Erro ao sincronizar manualmente no frontend:", err);
    }
});

// Importação do arquivo .ydk
document.getElementById('ydk-file').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        processarYDK(evt.target.result);
    };
    reader.readAsText(file);
});

function processarYDK(conteudo) {
    const linhas = conteudo.split('\n');
    const idsNoDeck = [];
    let naMainDeck = false;

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i].trim();
        if (linha === '#main') {
            naMainDeck = true;
            continue;
        }
        if (linha.startsWith('#extra') || linha.startsWith('!side')) {
            naMainDeck = false;
            continue;
        }
        if (naMainDeck && /^\d+$/.test(linha)) {
            idsNoDeck.push(parseInt(linha));
        }
    }

    const contagemIds = {};
    idsNoDeck.forEach(id => contagemIds[id] = (contagemIds[id] || 0) + 1);

    deckAtual = [];
    for (const [idStr, count] of Object.entries(contagemIds)) {
        const id = parseInt(idStr);
        const cardInfo = bancoCartas.find(c => c.id === id);
        
        if (cardInfo) {
            deckAtual.push({
                card: cardInfo,
                count: count,
                role: 'none'
            });
        } else {
            deckAtual.push({
                card: { id, name: `ID Não Localizado (${id})`, type: 'Desconhecido', image: '' },
                count: count,
                role: 'none'
            });
        }
    }

    renderizarWorkspace();
}

function renderizarWorkspace() {
    const workspace = document.getElementById('deck-workspace');
    workspace.classList.remove('hidden');

    const listContainer = document.getElementById('deck-list');
    listContainer.innerHTML = '';

    let totalCartas = 0;

    deckAtual.forEach((item, index) => {
        totalCartas += item.count;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'deck-item';
        
        const imageUrl = item.card.image || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg';

        itemDiv.innerHTML = `
            <img src="${imageUrl}" alt="${item.card.name}">
            <div class="deck-item-info">
                <div class="deck-item-name">${item.card.name} x${item.count}</div>
                <div class="deck-item-type">${item.card.type}</div>
                <div class="classification-selectors">
                    <button class="class-btn ${item.role === 'starter' ? 'active-starter' : ''}" onclick="setRole(${index}, 'starter')">Starter</button>
                    <button class="class-btn ${item.role === 'extender' ? 'active-extender' : ''}" onclick="setRole(${index}, 'extender')">Extender</button>
                    <button class="class-btn ${item.role === 'brick' ? 'active-brick' : ''}" onclick="setRole(${index}, 'brick')">Brick</button>
                </div>
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });

    document.getElementById('deck-size').textContent = totalCartas;
    atualizarContadoresRoles();
}

window.setRole = function(index, role) {
    if (deckAtual[index].role === role) {
        deckAtual[index].role = 'none';
    } else {
        deckAtual[index].role = role;
    }
    renderizarWorkspace();
};

function atualizarContadoresRoles() {
    let starters = 0, extenders = 0, bricks = 0;
    deckAtual.forEach(item => {
        if (item.role === 'starter') starters += item.count;
        if (item.role === 'extender') extenders += item.count;
        if (item.role === 'brick') bricks += item.count;
    });

    document.getElementById('total-starters').textContent = starters;
    document.getElementById('total-extenders').textContent = extenders;
    document.getElementById('total-bricks').textContent = bricks;
}

// CÁLCULO DE PROBABILIDADE (Monte Carlo)
document.getElementById('btn-calculate').addEventListener('click', () => {
    const handSize = parseInt(document.getElementById('hand-size').value);
    const minStarters = parseInt(document.getElementById('cond-starters').value) || 0;
    const minExtenders = parseInt(document.getElementById('cond-extenders').value) || 0;
    const maxBricks = parseInt(document.getElementById('cond-bricks').value) ?? 99;

    const linearDeck = [];
    deckAtual.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            linearDeck.push(item.role);
        }
    });

    if (linearDeck.length < handSize) {
        alert("O deck possui menos cartas do que o tamanho da mão solicitado.");
        return;
    }

    const RUNS = 100000;
    let sucessos = 0;

    for (let s = 0; s < RUNS; s++) {
        const sample = [...linearDeck];
        let numStarters = 0;
        let numExtenders = 0;
        let numBricks = 0;

        for (let i = 0; i < handSize; i++) {
            const randIndex = i + Math.floor(Math.random() * (sample.length - i));
            const temp = sample[i];
            sample[i] = sample[randIndex];
            sample[randIndex] = temp;

            const cardRole = sample[i];
            if (cardRole === 'starter') numStarters++;
            else if (cardRole === 'extender') numExtenders++;
            else if (cardRole === 'brick') numBricks++;
        }

        if (numStarters >= minStarters && numExtenders >= minExtenders && numBricks <= maxBricks) {
            sucessos++;
        }
    }

    const probabilidade = (sucessos / RUNS) * 100;

    const resultBox = document.getElementById('result-box');
    resultBox.classList.remove('hidden');
    document.getElementById('calc-percentage').textContent = `${probabilidade.toFixed(2)}%`;
    document.getElementById('calc-details').textContent = 
        `Após simular 100.000 mãos possíveis de ${handSize} cartas do seu deck de ${linearDeck.length} cartas.`;
});

// Inicialização imediata
carregarBanco();