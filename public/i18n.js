const translations = {
    'pt-BR': {
        title: 'Yu-Gi-Oh! Calculadora de Probabilidade',
        sync: 'Sincronizar Banco Local',
        syncing: 'Sincronizando banco remoto...',
        sync_error: 'Erro ao forçar sincronização.',
        loading_db: 'Carregando banco de dados...',
        requesting_db: 'Solicitando dados ao servidor backend...',
        db_loaded: 'Banco carregado com {count} cartas.',
        db_error: 'Erro de conexão. Clique no botão de sincronizar para forçar.',
        import: 'Importar Deck (.ydk)',
        settings: 'Configurações da Mão Inicial',
        h_size: 'Tamanho da Mão Inicial:',
        h_5: '5 cartas (1º Turno)',
        h_6: '6 cartas (2º Turno)',
        success: 'Condições de Sucesso',
        instr: 'Defina as quantidades mínimas necessárias para a mão ser considerada válida:',
        min_starters: 'Mínimo Starters',
        min_extenders: 'Mínimo Extenders',
        min_nonengine: 'Mínimo Non-Engine',
        max_bricks: 'Máximo Bricks',
        btn_calc: 'Calcular Probabilidade',
        result: 'Resultado',
        sim_hands: 'Amostra de Mãos Simuladas',
        instr_hands: 'Abaixo estão 10 exemplos de mãos iniciais geradas aleatoriamente:',
        deck_size_label: 'Cartas no Deck',
        analysis_title: 'Análise de Densidade do Deck',
        priority_title: 'Prioridade:',
        starter: 'Starter',
        extender: 'Extender',
        nonengine: 'Non-Engine',
        brick: 'Brick',
        err_small_deck: 'O deck possui menos cartas do que o tamanho da mão solicitado.',

        label_only_nonengine: "Apenas Non-Engine",
        label_only_nonengine_bricks: "Apenas Non-Engine e Bricks",
        label_invalid_hand: "Mão Ruim (Sem Combo)",
        label_combo_brick: "Combo + Brick(s)",
        label_perfect_combo_nonengine: "Combo + Non-Engines",
        label_exact_hand: "Mão Exata (Mínimo das Categorias Selecionadas)",
        label_valid_combo_excess: "Combo Válido (Com Excesso)",

        sim_desc: 'Simulação estatística realizada sobre {RUNS} mãos de {size} cartas do seu deck de {linearDeck.length} cartas.',
        hand_label: 'Mão de Exemplo'
    },
    'en-US': {
        title: 'Yu-Gi-Oh! Probability Calculator',
        sync: 'Sync Local Database',
        syncing: 'Syncing remote database...',
        sync_error: 'Error forcing synchronization.',
        loading_db: 'Loading database...',
        requesting_db: 'Requesting data from backend...',
        db_loaded: 'Database loaded with {count} cards.',
        db_error: 'Connection error. Click sync to force.',
        import: 'Import Deck (.ydk)',
        settings: 'Initial Hand Settings',
        h_size: 'Initial Hand Size:',
        h_5: '5 cards (1st Turn)',
        h_6: '6 cards (2nd Turn)',
        success: 'Success Conditions',
        instr: 'Define the minimum quantities required for a valid hand:',
        min_starters: 'Minimum Starters',
        min_extenders: 'Minimum Extenders',
        min_nonengine: 'Minimum Non-Engine',
        max_bricks: 'Maximum Bricks',
        btn_calc: 'Calculate Probability',
        result: 'Result',
        sim_hands: 'Simulated Hand Samples',
        instr_hands: 'Below are 10 examples of starting hands generated randomly:',
        deck_size_label: 'Cards in Deck',
        analysis_title: 'Deck Density Analysis',
        priority_title: 'Priority:',
        starter: 'Starter',
        extender: 'Extender',
        nonengine: 'Non-Engine',
        brick: 'Brick',
        err_small_deck: 'The deck has fewer cards than the requested hand size.',
        feedback_excellent: 'Excellent! Your deck is extremely consistent.',
        feedback_good: 'Good! Hand is consistent in most duels.',
        feedback_regular: 'Regular. You may struggle with bricks or lack of follow-up.',
        feedback_bad: 'Inconsistent. I recommend adjusting your deck ratios.',
        feedback_very_bad: 'Very Inconsistent! You will rarely open your ideal hand.',
        
        label_only_nonengine: "Non-Engine Only",
        label_only_nonengine_bricks: "Only Non-Engine and Bricks",
        label_invalid_hand: "Bad Hand (Without Combo)",
        label_combo_brick: "Combo + Brick(s)",
        label_perfect_combo_nonengine: "Combo + Non-Engines",
        label_exact_hand: "Exact Hand (Minimum Categories Selected)",
        label_valid_combo_excess: "Valid Combo (With Excess)",
        
        sim_desc: 'Statistical simulation performed over {RUNS} hands of {size} cards of your {linearDeck.length} cards deck.',
        hand_label: 'Sample Hand'
    }
};

const lang = navigator.language.startsWith('pt') ? 'pt-BR' : 'en-US';
// const lang = 'en-US';

function t(key, vars = {}) {
    let text = translations[lang][key] || key;
    for (const [k, v] of Object.entries(vars)) {
        text = text.replace(`{${k}}`, v);
    }
    return text;
}

function initI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
}