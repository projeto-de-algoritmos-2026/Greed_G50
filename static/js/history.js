(() => {
    const HISTORY_KEY = 'greed_score_history_v1';
    function load(){ try{ const r = localStorage.getItem(HISTORY_KEY); return r? JSON.parse(r): []; }catch(e){return[];} }
    function render(){ const container = document.getElementById('historyList'); const h = load(); if(!container) return; if(h.length===0){ container.innerHTML='<div>Nenhum registro ainda.</div>'; return; } container.innerHTML = h.map(it=>{ const date = new Date(it.ts); const meta = it.meta && it.meta.coins ? ` — Moedas: ${it.meta.coins.join(', ')}` : ''; const greedyBadge = it.is_greedy ? ' — Gulosa' : ''; return `<div style="padding:8px;border-bottom:1px solid #eee;"><div><strong>${date.toLocaleString()}</strong>${meta}${greedyBadge}</div><div style="font-size:0.95em">Nível ${it.level} — +${it.score} pts — tempo ${it.time}s — total ${it.totalScore}</div></div>`; }).join(''); }
    document.getElementById('historyBackBtn').addEventListener('click', ()=>{ window.history.back(); });
    document.getElementById('historyClearBtn').addEventListener('click', ()=>{ if(confirm('Limpar todo o histórico?')){ localStorage.removeItem(HISTORY_KEY); render(); } });
    render();
})();
