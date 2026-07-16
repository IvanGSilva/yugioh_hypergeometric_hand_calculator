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
// Definimos a pasta onde as imagens físicas das cartas ficarão salvas no seu PC
const CACHE_IMG_DIR = path.join(__dirname, 'assets', 'cache-imagens');

function garantirDiretorio(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Garante que a pasta de cache de imagens exista logo na inicialização
if (!fs.existsSync(CACHE_IMG_DIR)) {
    fs.mkdirSync(CACHE_IMG_DIR, { recursive: true });
}

async function sincronizarDadosComAPI() {
    console.log("Iniciando requisição para a API do YGOPRODeck...")
    
    try {
        const resposta = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        
        if (!resposta.ok) {
            throw new Error(`Erro na API externa: Código HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (!dados || !dados.data || !Array.isArray(dados.data)) {
            throw new Error("A API externa não retornou os dados no formato esperado.");
        }

        console.log(`Dados recebidos! (${dados.data.length} cartas brutas encontradas). Otimizando banco...`);

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
                id: carta.id,
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
        console.log(`Sucesso! O arquivo cartas.json foi criado com ${cartasOtimizadas.length} cartas.`);
        return cartasOtimizadas;
        
    } catch (erro) {
        console.error("Erro interno ao buscar e salvar dados da API:", erro.message);
        throw erro;
    }
}

// --- NOVA ROTA: PROXY CACHE DE IMAGENS ---
app.get('/api/imagem-carta', async (req, res) => {
    const { id } = req.query;
    if (!id || !/^\d+$/.test(id)) {
        return res.status(400).json({ erro: "ID numérico de carta inválido ou ausente." });
    }

    const localImagePath = path.join(CACHE_IMG_DIR, `${id}.jpg`);

    // 1. Se a imagem já existe no seu HD, serve ela instantaneamente (0 requisições externas!)
    if (fs.existsSync(localImagePath)) {
        return res.sendFile(localImagePath);
    }

    // 2. Se não existir no cache local, busca da API do YGOPRODeck, salva localmente e serve
    try {
        console.log(`[Cache Miss] Baixando imagem da carta ${id} pela primeira vez...`);
        const remoteUrl = `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`;
        
        const response = await fetch(remoteUrl);
        if (!response.ok) {
            throw new Error(`Servidor de imagens retornou status ${response.status}`);
        }

        // Transforma a resposta do fetch em um buffer e grava no arquivo físico
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(localImagePath, buffer);

        console.log(`[Cache Save] Imagem da carta ${id} salva localmente.`);
        return res.sendFile(localImagePath);

    } catch (erro) {
        console.error(`Falha ao recuperar a imagem para a carta ${id}:`, erro.message);
        // Em caso de falha, redireciona o navegador para um placeholder público
        return res.redirect('https://images.ygoprodeck.com/images/cards/placeholder.jpg');
    }
});

// Retorna o banco de dados
app.get('/api/cartas', async (req, res) => {
    try {
        if (fs.existsSync(FILE_PATH)) {
            console.log("Servindo cartas diretamente do arquivo cartas.json local.");
            const dadosLocais = fs.readFileSync(FILE_PATH, 'utf-8');
            return res.json(JSON.parse(dadosLocais));
        }
        
        console.log("Arquivo cartas.json não encontrado localmente. Iniciando sincronização automática...");
        const novosDados = await sincronizarDadosComAPI();
        return res.json(novosDados);
    } catch (erro) {
        console.error("Erro na rota GET /api/cartas:", erro);
        res.status(500).json({ erro: "Falha ao processar banco de dados local.", detalhes: erro.message });
    }
});

// Força sincronização
app.post('/api/cartas/sincronizar', async (req, res) => {
    try {
        console.log("Reinicialização manual do banco solicitada.");
        if (fs.existsSync(FILE_PATH)) {
            fs.unlinkSync(FILE_PATH);
            console.log("Arquivo cartas.json antigo removido.");
        }
        const novasCartas = await sincronizarDadosComAPI();
        res.json({ mensagem: "Banco de dados atualizado com sucesso!", total: novasCartas.length });
    } catch (erro) {
        console.error("Erro na rota POST /api/cartas/sincronizar:", erro);
        res.status(500).json({ erro: "Erro ao sincronizar manualmente.", detalhes: erro.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando com sucesso em: http://localhost:${PORT}`);
});