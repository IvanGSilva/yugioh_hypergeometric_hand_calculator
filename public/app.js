let bancoCartas = [];
let deckAtual = []; // Guarda objetos: { card, count, roles: ['extender', 'starter'] }

// Carrega Banco Local do Backend ao iniciar
async function carregarBanco() {
    const statusLabel = document.getElementById('db-status');
    statusLabel.textContent = "Solicitando dados ao servidor backend...";
    
    try {
        console.log("Enviando requisição GET para /api/cartas...");
        const res = await fetch('http://localhost:3000/api/cartas');
        
        if (!res.ok) {
            throw new Error(`Resposta do servidor não foi amigável: ${res.status}`);
        }
        
        bancoCartas = await res.json();
        console.log("Sucesso ao carregar banco local do backend!", bancoCartas.length);
        statusLabel.textContent = `Banco carregado com ${bancoCartas.length} cartas.`;
        statusLabel.style.color = "#22c55e";

        recuperarSessaoDecks();

    } catch (err) {
        statusLabel.textContent = "Erro de conexão. Clique no botão de sincronizar para forçar.";
        statusLabel.style.color = "#ef4444";
        console.error("Erro detalhado no frontend ao carregar o banco:", err);
    }
}

// Sincroniza banco de forma forçada
document.getElementById('btn-sync').addEventListener('click', async () => {
    const statusLabel = document.getElementById('db-status');
    statusLabel.textContent = "Sincronizando banco remoto (isso pode demorar alguns segundos)...";
    statusLabel.style.color = "#ca8a04";
    
    try {
        const res = await fetch('http://localhost:3000/api/cartas/sincronizar', { method: 'POST' });
        if (!res.ok) throw new Error(`Falha na rota de sincronização: ${res.status}`);
        
        await carregarBanco();
    } catch (err) {
        statusLabel.textContent = "Erro ao forçar sincronização.";
        statusLabel.style.color = "#ef4444";
        console.error(err);
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
                roles: []
            });
        } else {
            deckAtual.push({
                card: { id, name: `ID Não Localizado (${id})`, type: 'Desconhecido', image: '' },
                count: count,
                roles: []
            });
        }
    }

    salvarSessaoDecks();
    renderizarWorkspace();
}

function salvarSessaoDecks() {
    localStorage.setItem('ygo_deck_atual_v2', JSON.stringify(deckAtual));
}

function recuperarSessaoDecks() {
    const deckSalvo = localStorage.getItem('ygo_deck_atual_v2');
    if (deckSalvo) {
        try {
            deckAtual = JSON.parse(deckSalvo);
            renderizarWorkspace();
        } catch (e) {
            console.error("Erro ao recuperar sessão:", e);
        }
    }
}

function renderizarWorkspace() {
    if (deckAtual.length === 0) return;

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
        
        const hasStarter = item.roles.includes('starter');
        const hasExtender = item.roles.includes('extender');
        const hasNonEngine = item.roles.includes('nonengine');
        const hasBrick = item.roles.includes('brick');

        let priorityHTML = '';
        if (item.roles.length > 0) {
            priorityHTML = `
                <div class="priority-container">
                    <span class="priority-title">Prioridade:</span>
                    <div class="priority-list">
                        ${item.roles.map((role, rIdx) => {
                            let label = role.charAt(0).toUpperCase() + role.slice(1);
                            if (role === 'nonengine') label = "Non-Engine";
                            return `
                                <span class="priority-badge badge-${role}">
                                    ${rIdx > 0 ? `<button class="priority-arrow" onclick="moverPrioridade(${index}, ${rIdx}, -1)">◀</button>` : ''}
                                    ${label}
                                    ${rIdx < item.roles.length - 1 ? `<button class="priority-arrow" onclick="moverPrioridade(${index}, ${rIdx}, 1)">▶</button>` : ''}
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        itemDiv.innerHTML = `
            <img src="${imageUrl}" alt="${item.card.name}">
            <div class="deck-item-info">
                <div class="deck-item-name">${item.card.name} x${item.count}</div>
                <div class="deck-item-type">${item.card.type}</div>
                <div class="classification-selectors">
                    <button class="class-btn ${hasStarter ? 'active-starter' : ''}" onclick="toggleRole(${index}, 'starter')">Starter</button>
                    <button class="class-btn ${hasExtender ? 'active-extender' : ''}" onclick="toggleRole(${index}, 'extender')">Extender</button>
                    <button class="class-btn ${hasNonEngine ? 'active-nonengine' : ''}" onclick="toggleRole(${index}, 'nonengine')">Non-Engine</button>
                    <button class="class-btn ${hasBrick ? 'active-brick' : ''}" onclick="toggleRole(${index}, 'brick')">Brick</button>
                </div>
                ${priorityHTML}
            </div>
        `;
        listContainer.appendChild(itemDiv);
    });

    document.getElementById('deck-size').textContent = totalCartas;
    atualizarContadoresRoles();
}

window.toggleRole = function(index, role) {
    const roles = deckAtual[index].roles || [];
    const roleIdx = roles.indexOf(role);

    if (roleIdx > -1) {
        roles.splice(roleIdx, 1);
    } else {
        roles.push(role);
    }

    deckAtual[index].roles = roles;
    salvarSessaoDecks();
    renderizarWorkspace();
};

window.moverPrioridade = function(cardIndex, roleIndex, direcao) {
    const roles = deckAtual[cardIndex].roles;
    const targetIndex = roleIndex + direcao;

    if (targetIndex >= 0 && targetIndex < roles.length) {
        const temp = roles[roleIndex];
        roles[roleIndex] = roles[targetIndex];
        roles[targetIndex] = temp;
    }

    salvarSessaoDecks();
    renderizarWorkspace();
};

function atualizarContadoresRoles() {
    let starters = 0, extenders = 0, nonengines = 0, bricks = 0;
    
    deckAtual.forEach(item => {
        if (item.roles.includes('starter')) starters += item.count;
        if (item.roles.includes('extender')) extenders += item.count;
        if (item.roles.includes('nonengine')) nonengines += item.count;
        if (item.roles.includes('brick')) bricks += item.count;
    });

    document.getElementById('total-starters').textContent = starters;
    document.getElementById('total-extenders').textContent = extenders;
    document.getElementById('total-nonengine').textContent = nonengines;
    document.getElementById('total-bricks').textContent = bricks;
}

function obterFeedbackVisual(probabilidade) {
    if (probabilidade >= 85) return { text: "Excelente! Seu deck é extremamente consistente.", color: "#22c55e" };
    if (probabilidade >= 70) return { text: "Bom! Mão bem consistente na maioria dos duelos.", color: "#a3e635" };
    if (probabilidade >= 50) return { text: "Regular. Pode sofrer com 'bricadas' ou falta de follow-up ocasionalmente.", color: "#eab308" };
    if (probabilidade >= 30) return { text: "Inconsistente. Recomendo ajustar as taxas do deck.", color: "#f97316" };
    return { text: "Muito Inconsistente! Raramente você abrirá com esta combinação ideal.", color: "#ef4444" };
}

// CÁLCULO DE PROBABILIDADE COM AS REGRAS DE PRIORIDADE E REGRA NON-ENGINE = BRICK + 10 MÃOS VISUAIS
document.getElementById('btn-calculate').addEventListener('click', () => {
    const handSize = parseInt(document.getElementById('hand-size').value);
    const reqStarters = parseInt(document.getElementById('cond-starters').value) || 0;
    const reqExtenders = parseInt(document.getElementById('cond-extenders').value) || 0;
    const reqNonEngine = parseInt(document.getElementById('cond-nonengine').value) || 0;
    const maxBricks = parseInt(document.getElementById('cond-bricks').value) ?? 99;

    // Criar representação plana do deck para a simulação matemática
    const linearDeck = [];
    deckAtual.forEach(item => {
        for (let i = 0; i < item.count; i++) {
            linearDeck.push({
                card: item.card,
                roles: [...item.roles]
            });
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
        const maoDesejada = [];

        for (let i = 0; i < handSize; i++) {
            const randIndex = i + Math.floor(Math.random() * (sample.length - i));
            const temp = sample[i];
            sample[i] = sample[randIndex];
            sample[randIndex] = temp;
            
            maoDesejada.push(sample[i].roles); 
        }

        let startersSatisfeitos = 0;
        let extendersSatisfeitos = 0;
        let nonengineSatisfeitos = 0;
        let bricksDetectados = 0;

        // Regra: Toda non-engine e todo brick tradicional contam como Bricks
        maoDesejada.forEach(roles => {
            if (roles.includes('brick') || roles.includes('nonengine')) {
                bricksDetectados++;
            }
        });

        // Resolve os papéis ativos baseados na preferência
        let cartasDisponiveis = maoDesejada.map(roles => ({
            rolesSemBrick: roles.filter(r => r !== 'brick'), 
            usadaComo: null
        }));

        cartasDisponiveis.forEach(carta => {
            if (carta.rolesSemBrick.length === 0) return;
            carta.usadaComo = carta.rolesSemBrick[0];
            
            if (carta.usadaComo === 'starter') startersSatisfeitos++;
            else if (carta.usadaComo === 'extender') extendersSatisfeitos++;
            else if (carta.usadaComo === 'nonengine') nonengineSatisfeitos++;
        });

        if (startersSatisfeitos >= reqStarters && 
            extendersSatisfeitos >= reqExtenders && 
            nonengineSatisfeitos >= reqNonEngine && 
            bricksDetectados <= maxBricks) {
            sucessos++;
        }
    }

    const probabilidade = (sucessos / RUNS) * 100;

    // --- GERAÇÃO DAS 10 MÃOS VISUAIS DE EXEMPLO ---
    const handsContainer = document.getElementById('hands-container');
    handsContainer.innerHTML = '';

    for (let h = 0; h < 10; h++) {
        // Gera um sorteio fresco
        const pool = [...linearDeck];
        const maoExemplo = [];
        for (let i = 0; i < handSize; i++) {
            const randIndex = i + Math.floor(Math.random() * (pool.length - i));
            const temp = pool[i];
            pool[i] = pool[randIndex];
            pool[randIndex] = temp;
            maoExemplo.push(pool[i]);
        }

        // Avalia se esta mão de exemplo foi um sucesso para rotular a mão inteira
        let handStarters = 0, handExtenders = 0, handNonEngine = 0, handBricks = 0;
        
        maoExemplo.forEach(item => {
            const r = item.roles;
            if (r.includes('brick') || r.includes('nonengine')) handBricks++;
            
            const rolesUteis = r.filter(x => x !== 'brick');
            if (rolesUteis.length > 0) {
                const principal = rolesUteis[0];
                if (principal === 'starter') handStarters++;
                else if (principal === 'extender') handExtenders++;
                else if (principal === 'nonengine') handNonEngine++;
            }
        });

        const ehMaoSucesso = (handStarters >= reqStarters && handExtenders >= reqExtenders && handNonEngine >= reqNonEngine && handBricks <= maxBricks);
        
        // Renderiza a linha da mão
        const handRow = document.createElement('div');
        handRow.className = 'simulated-hand-row';
        if (ehMaoSucesso) {
            handRow.style.borderLeft = "4px solid #22c55e";
        } else {
            handRow.style.borderLeft = "4px solid #ef4444";
        }

        const statusMao = ehMaoSucesso 
            ? `<span style="color: #22c55e; font-weight: bold;">[MÃO VÁLIDA]</span>` 
            : `<span style="color: #ef4444; font-weight: bold;">[MÃO INVÁLIDA]</span>`;

        let cardsHTML = '';
        maoExemplo.forEach(item => {
            const imgUrl = item.card.image || 'https://images.ygoprodeck.com/images/cards/placeholder.jpg';
            
            // Determina a cor da borda da carta com base no seu papel prioritário
            let borderClass = 'border-none';
            if (item.roles.length > 0) {
                const prioritario = item.roles[0];
                if (prioritario === 'starter') borderClass = 'border-starter';
                else if (prioritario === 'extender') borderClass = 'border-extender';
                else if (prioritario === 'nonengine') borderClass = 'border-nonengine';
                else if (prioritario === 'brick') borderClass = 'border-brick';
            }

            cardsHTML += `
                <div class="hand-card-item">
                    <img src="${imgUrl}" class="${borderClass}" title="${item.card.name}">
                    <div class="hand-card-name">${item.card.name}</div>
                </div>
            `;
        });

        handRow.innerHTML = `
            <div class="hand-title">Mão de Exemplo #${h + 1} - ${statusMao}</div>
            <div class="hand-cards">
                ${cardsHTML}
            </div>
        `;
        handsContainer.appendChild(handRow);
    }

    // Exibe feedbacks e rola para a tela de resultados
    const feedback = obterFeedbackVisual(probabilidade);
    const resultBox = document.getElementById('result-box');
    const percentageText = document.getElementById('calc-percentage');
    
    resultBox.classList.remove('hidden');
    percentageText.textContent = `${probabilidade.toFixed(2)}%`;
    percentageText.style.color = feedback.color;
    
    document.getElementById('calc-details').innerHTML = `
        <strong>${feedback.text}</strong><br>
        <span style="font-size: 0.9rem; color: #8d8d99; display: block; margin-top: 8px;">
            Simulação estatística realizada sobre 100.000 mãos possíveis de ${handSize} cartas tiradas do seu deck de ${linearDeck.length} cartas.
        </span>
    `;
    
    resultBox.scrollIntoView({ behavior: 'smooth' });
});

// Inicialização
carregarBanco();