// ALGORITMO DE VALIDAÇÃO DE MÃO (Focado apenas em metas maiores que 0)
export function testarMaoValida(maoRoles, reqStarters, reqExtenders, reqNonEngine, maxBricks) {
    const maoCopiada = maoRoles.map(roles => {
        if (!Array.isArray(roles)) return [];
        return roles.map(r => {
            let s = String(r).toLowerCase().trim();
            if (s === 'non-engine' || s === 'non_engine') return 'nonengine';
            return s;
        });
    });

    // Se maxBricks for maior que 0, valida rigorosamente o limite de bricks
    if (maxBricks > 0) {
        let bricksDetectados = 0;
        maoCopiada.forEach(roles => {
            if (roles.includes('brick')) {
                bricksDetectados++;
            }
        });
        if (bricksDetectados > maxBricks) {
            return false;
        }
    }

    const cartasValidas = maoCopiada.map(roles => {
        if (maxBricks > 0) {
            return roles.filter(r => r !== 'brick' && r !== '');
        }
        return roles.filter(r => r !== '');
    });

    function resolver(index, sFaltando, eFaltando, nFaltando) {
        const s = reqStarters > 0 ? Math.max(0, sFaltando) : 0;
        const e = reqExtenders > 0 ? Math.max(0, eFaltando) : 0;
        const n = reqNonEngine > 0 ? Math.max(0, nFaltando) : 0;

        if (s === 0 && e === 0 && n === 0) {
            return true;
        }

        if (index >= cartasValidas.length) {
            return false;
        }

        const rolesDaCarta = cartasValidas[index];

        if (rolesDaCarta.length === 0) {
            return resolver(index + 1, s, e, n);
        }

        if (reqStarters > 0 && s > 0 && rolesDaCarta.includes('starter')) {
            if (resolver(index + 1, s - 1, e, n)) {
                return true;
            }
        }

        if (reqExtenders > 0 && e > 0 && rolesDaCarta.includes('extender')) {
            if (resolver(index + 1, s, e - 1, n)) {
                return true;
            }
        }

        if (reqNonEngine > 0 && n > 0 && rolesDaCarta.includes('nonengine')) {
            if (resolver(index + 1, s, e, n - 1)) {
                return true;
            }
        }

        return resolver(index + 1, s, e, n);
    }

    return resolver(0, reqStarters, reqExtenders, reqNonEngine);
}

export function classificarTipoMao(maoRoles, reqStarters, reqExtenders, reqNonEngine, maxBricks) {
    const mao = maoRoles.map(roles => {
        if (!Array.isArray(roles)) return [];
        return roles.map(r => {
            let s = String(r).toLowerCase().trim();
            if (s === 'non-engine' || s === 'non_engine') return 'nonengine';
            return s;
        });
    });

    const ehValida = testarMaoValida(mao, reqStarters, reqExtenders, reqNonEngine, maxBricks);

    let qtdStarters = 0;
    let qtdExtenders = 0;
    let qtdNonEngine = 0;
    let qtdBricks = 0;

    mao.forEach(roles => {
        if (roles.includes('starter')) qtdStarters++;
        if (roles.includes('extender')) qtdExtenders++;
        if (roles.includes('nonengine')) qtdNonEngine++;
        if (roles.includes('brick')) qtdBricks++;
    });

    // --- MÃO NÃO CUMPRIU OS REQUISITOS COMBO ---
    if (!ehValida) {
        const apenasNonEngineEBricks = (qtdNonEngine > 0 || qtdBricks > 0) && qtdStarters === 0 && qtdExtenders === 0;
        const apenasNonEngine = qtdNonEngine > 0 && qtdStarters === 0 && qtdExtenders === 0 && qtdBricks === 0;

        if (apenasNonEngine) {
            return { label: t('label_only_nonengine'), cor: "#c084fc" };
        }
        if (apenasNonEngineEBricks) {
            return { label: t('label_only_nonengine_bricks'), cor: "#f43f5e" };
        }
        return { label: t('label_invalid_hand'), cor: "#ef4444" };
    }

    // --- MÃO VÁLIDA (CUMPRIU OS REQUISITOS COMBO) ---

    if (qtdBricks > 0) {
        return { label: t('label_combo_brick'), cor: "#fb923c" };
    }

    let cartasRestantes = [...mao];
    
    for (let i = 0; i < reqStarters; i++) {
        const idx = cartasRestantes.findIndex(r => r.includes('starter'));
        if (idx !== -1) cartasRestantes.splice(idx, 1);
    }
    for (let i = 0; i < reqExtenders; i++) {
        const idx = cartasRestantes.findIndex(r => r.includes('extender'));
        if (idx !== -1) cartasRestantes.splice(idx, 1);
    }
    for (let i = 0; i < reqNonEngine; i++) {
        const idx = cartasRestantes.findIndex(r => r.includes('nonengine'));
        if (idx !== -1) cartasRestantes.splice(idx, 1);
    }

    const todasSobrasSaoNonEngine = cartasRestantes.length > 0 && cartasRestantes.every(roles => roles.includes('nonengine'));
    if (todasSobrasSaoNonEngine) {
        return { label: t('label_perfect_combo_nonengine'), cor: "#38bdf8" };
    }

    const exatamenteAsCondicoes = (qtdStarters === reqStarters) && (qtdExtenders === reqExtenders) && (qtdNonEngine === reqNonEngine);
    if (exatamenteAsCondicoes) {
        return { label: t('label_exact_hand'), cor: "#10b981" };
    }

    return { label: t('label_valid_combo_excess'), cor: "#22c55e" };
}