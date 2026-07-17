export async function buscarBanco() {
    const res = await fetch('http://localhost:3000/api/cartas');
    if (!res.ok) throw new Error(`Erro: ${res.status}`);
    return await res.json();
}

export async function sincronizarBanco() {
    const res = await fetch('http://localhost:3000/api/cartas/sincronizar', { method: 'POST' });
    if (!res.ok) throw new Error('Erro na sincronização');
}