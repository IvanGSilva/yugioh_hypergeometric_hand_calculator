export function renderizarWorkspace(deckAtual, moverPrioridade, toggleRole) {
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
        
        const imageUrl = item.card && item.card.id 
            ? `http://localhost:3000/api/imagem-carta?id=${item.card.id}` 
            : 'https://images.ygoprodeck.com/images/cards/placeholder.jpg';
        
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
            <img src="${imageUrl}" alt="${item.card.name}" loading="lazy">
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
    atualizarContadoresRoles(deckAtual);
    // atualizarPainelEstatisticas(deckAtual);
}

function atualizarContadoresRoles(deckAtual) {
    let starters = 0, extenders = 0, nonengines = 0, bricks = 0;
    
    deckAtual.forEach(item => {
        if (item.roles.includes('starter')) starters += item.count;
        if (item.roles.includes('extender')) extenders += item.count;
        if (item.roles.includes('nonengine')) nonengines += item.count;
        if (item.roles.includes('brick')) bricks += item.count;
    });

    // Verificação de segurança para cada elemento
    const elStarters = document.getElementById('total-starters');
    const elExtenders = document.getElementById('total-extenders');
    const elNonEngine = document.getElementById('total-nonengine');
    const elBricks = document.getElementById('total-bricks');

    if (elStarters) elStarters.textContent = starters;
    if (elExtenders) elExtenders.textContent = extenders;
    if (elNonEngine) elNonEngine.textContent = nonengines;
    if (elBricks) elBricks.textContent = bricks;
}

export function atualizarPainelEstatisticas(deckAtual) {
    const panel = document.getElementById('stats-panel');
    const content = document.getElementById('stats-content');
    
    if (!deckAtual || deckAtual.length === 0) {
        panel.classList.add('hidden');
        return;
    }
    
    panel.classList.remove('hidden');

    const totalCartas = deckAtual.reduce((sum, item) => sum + item.count, 0);
    const categorias = [
        { id: 'starter', label: 'Starters', color: '#22c55e' },
        { id: 'extender', label: 'Extenders', color: '#3b82f6' },
        { id: 'nonengine', label: 'Non-Engine', color: '#a855f7' },
        { id: 'brick', label: 'Bricks', color: '#ef4444' }
    ];

    // Gerar HTML das categorias
    let html = `<div class="stats-grid-cat">`;
    categorias.forEach(cat => {
        let count = deckAtual.filter(i => i.roles.includes(cat.id)).reduce((sum, i) => sum + i.count, 0);
        let pct = ((count / totalCartas) * 100).toFixed(1);
        html += `
            <div class="stat-box" style="border-bottom: 2px solid ${cat.color}">
                <div class="stat-label">${cat.label}</div>
                <div class="stat-value">${pct}%</div>
            </div>`;
    });
    html += `</div><hr style="margin: 1.5rem 0; border-color: var(--border);">`;

    // Gerar HTML das imagens das cartas
    html += `<div class="stats-cards-grid">`;
    deckAtual.forEach(item => {
        const imgUrl = `http://localhost:3000/api/imagem-carta?id=${item.card.id}`;
        const pct = ((item.count / totalCartas) * 100).toFixed(1);
        html += `
            <div class="stat-card-item" title="${item.card.name} (${pct}%)">
                <img src="${imgUrl}" loading="lazy">
                <span class="stat-card-pct">${pct}%</span>
            </div>`;
    });
    html += `</div>`;

    content.innerHTML = html;
}

export function obterFeedbackVisual(probabilidade) {
    if (probabilidade >= 85) return { text: t("feedback_excellent"), color: "#22c55e" };
    if (probabilidade >= 70) return { text: t("feedback_good"), color: "#a3e635" };
    if (probabilidade >= 50) return { text: t("feedback_regular"), color: "#eab308" };
    if (probabilidade >= 30) return { text: t("feedback_bad"), color: "#f97316" };
    return { text: t("feedback_very_bad"), color: "#ef4444" };
}

// Retorna a classe de estilo de borda baseada nas marcações que a carta possui
export function obterClasseBorda(roles) {
    if (!roles || roles.length === 0) return 'border-none';
    if (roles.length === 1) return `border-${roles[0]}`;
    if (roles.length === 2) {
        return `border-${roles[0]}-${roles[1]}`;
    }
    return 'border-multi';
}

// Reseta a interface completamente
export function resetarInterface() {
    document.getElementById('result-box')?.classList.add('hidden');
    document.getElementById('stats-panel')?.classList.add('hidden');
    const hands = document.getElementById('hands-container');
    if (hands) hands.innerHTML = '';
}