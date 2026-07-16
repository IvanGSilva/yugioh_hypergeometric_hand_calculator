const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = 3000;
const FILE_PATH = path.join(__dirname, 'assets', 'data', 'cartas.json');

function garantirDiretorio(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

async function sincronizarDadosComAPI() {
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
    console.log("Buscando dados atualizados da API externa...");
    const resposta = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    const dados = await resposta.json();

    if (!dados || !dados.data || !Array.isArray(dados.data)) {
        throw new Error("A API externa não retornou os dados no formato esperado.");
    }

    console.log(`Dados recebidos da API (${dados.data.length} cartas brutas). Otimizando...`);

    // Nota: Removido o filtro de 'monster' para aceitar Spells/Traps também!
    const cartasOtimizadas = dados.data.map(carta => {
        let valorEscala = carta.level ?? 0;
        let tipoEscala = 'LV';
        const tipoCarta = carta.frameType || "";

        if (tipoCarta.includes('xyz')) {
            tipoEscala = 'RK';
        } else if (carta.linkval !== undefined && carta.linkval !== null) {
            valorEscala = carta.linkval;
            tipoEscala = 'LK';
        }

        return {
            id: carta.id, // Guardamos o ID para bater com o arquivo .ydk
            name: carta.name,
            type: carta.type,
            desc: carta.desc || "",
            attribute: carta.attribute || "",
            race: carta.race || "",
            archetype: carta.archetype || "",
            level: valorEscala,
            levelType: tipoEscala,
            image: carta.card_images?.[0]?.image_url_small || ""
        };
    });

    garantirDiretorio(FILE_PATH);
    fs.writeFileSync(FILE_PATH, JSON.stringify(cartasOtimizadas, null, 2), 'utf-8');
    console.log(`Sucesso! Arquivo cartas.json atualizado com ${cartasOtimizadas.length} cartas.`);
    return cartasOtimizadas;
}

// Retorna o banco de dados
app.get('/api/cartas', async (req, res) => {
    try {
        if (fs.existsSync(FILE_PATH)) {
            const dadosLocais = fs.readFileSync(FILE_PATH, 'utf-8');
            return res.json(JSON.parse(dadosLocais));
        }
        const novosDados = await sincronizarDadosComAPI();
        return res.json(novosDados);
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: "Falha ao processar banco de dados local." });
    }
});

// Força sincronização
app.post('/api/cartas/sincronizar', async (req, res) => {
    try {
        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
        }
        const novasCartas = await sincronizarDadosComAPI();
        res.json({ mensagem: "Banco de dados atualizado com sucesso!", total: novasCartas.length });
    } catch (erro) {
        console.error(erro);
        res.status(500).json({ erro: erro.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});