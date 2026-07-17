export function processarConteudoYDK(conteudo, bancoCartas, deckAtual) {
    const linhas = conteudo.split('\n');
    const idsNoDeck = [];
    let naMainDeck = false;

    for (let linha of linhas) {
        linha = linha.trim();
        if (linha === '#main') { naMainDeck = true; continue; }
        if (linha.startsWith('#extra') || linha.startsWith('!side')) { naMainDeck = false; continue; }
        if (naMainDeck && /^\d+$/.test(linha)) idsNoDeck.push(parseInt(linha));
    }

    const idsUnicos = [...new Set(idsNoDeck)];
    return idsUnicos.map(id => {
        const count = idsNoDeck.filter(x => x === id).length;
        const cardInfo = bancoCartas.find(c => c.id === id);
        const cartaAntiga = deckAtual.find(item => item.card.id === id);
        return {
            card: cardInfo || { id, name: `ID ${id}`, type: 'Desconhecido', image: '' },
            count: count,
            roles: cartaAntiga ? cartaAntiga.roles : []
        };
    });
}