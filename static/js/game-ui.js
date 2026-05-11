import { initLevel, submitChoice } from './api.js';

console.log('game-ui module loaded');

const greedStartBtn = document.getElementById('greedStartBtn');
const greedAmountInput = document.getElementById('greedAmountInput');
const greedPanel = document.getElementById('greedPanel');
const greedCoinsContainer = document.getElementById('greedCoinsContainer');
const greedSubmitBtn = document.getElementById('greedSubmitBtn');
const greedMessage = document.getElementById('greedMessage');
const greedResults = document.getElementById('greedResults');

let greedState = null;
let greedLevelNumber = 1;
let greedScore = 0;
let greedBest = 0;
let greedLevelStart = null;
let greedTimerInterval = null;
const HISTORY_KEY = 'greed_score_history_v1';
let currentMeta = { coins: null };
let audioEnabled = true;
let compactMode = false;
let audioCtx = null;
function ensureAudio(){ if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }

if (greedStartBtn) greedStartBtn.addEventListener('click', startGreed);
if (greedSubmitBtn) greedSubmitBtn.addEventListener('click', submitGreed);
const greedAnimateBtn = document.getElementById('greedAnimateBtn');
if (greedAnimateBtn) greedAnimateBtn.addEventListener('click', () => animateGreedy());
const greedNextBtn = document.getElementById('greedNextBtn');
if (greedNextBtn) greedNextBtn.addEventListener('click', () => {
    greedLevelNumber += 1;
    document.getElementById('greedLevel').textContent = greedLevelNumber;
    greedAmountInput.value = 0;
    startGreed();
});

async function startGreed() {
    let amount = parseFloat(greedAmountInput.value) || 0;
    const checked = Array.from(document.querySelectorAll('.coin-options input[type=checkbox]:checked'));
    let coins = checked.map(c => parseFloat(c.value)).filter(Boolean);
    if (!coins.length) coins = [1.00, 0.50, 0.25, 0.10, 0.05, 0.01];
    coins.sort((a,b)=>b-a);
    const available = null;
    if (!amount || amount <= 0) {
        amount = (Math.random() * 19) + 1.0;
        amount = Math.round(amount * 100) / 100;
        greedAmountInput.value = amount.toFixed(2);
    }
    currentMeta = { coins };
    try {
        const data = await initLevel(amount, coins, available);
        if (data.success) {
            greedState = data.level;
            document.getElementById('greedLevel').textContent = greedLevelNumber;
            document.getElementById('greedScore').textContent = greedScore;
            document.getElementById('greedBest').textContent = greedBest;
            startLevelTimer();
            renderGreedLevel(greedState);
            greedPanel.style.display = 'block';
            greedMessage.textContent = '';
            greedResults.innerHTML = '';
            const nextBtn = document.getElementById('greedNextBtn'); if (nextBtn) nextBtn.style.display='none';
            wireHistoryButtons();
        } else {
            alert('Erro ao iniciar troco: ' + (data.error || ''));
        }
    } catch (err) {
        console.error('Erro iniciar troco', err);
        alert('Erro ao iniciar troco');
    }
}

function startLevelTimer(){
    stopLevelTimer();
    greedLevelStart = Date.now();
    const el = document.getElementById('greedTimer');
    if (!el) return;
    el.textContent = '0s';
    greedTimerInterval = setInterval(()=>{
        const sec = Math.floor((Date.now() - greedLevelStart)/1000);
        el.textContent = `${sec}s`;
    }, 250);
}

function stopLevelTimer(){ if (greedTimerInterval) { clearInterval(greedTimerInterval); greedTimerInterval = null; } }

function renderGreedLevel(level) {
    greedCoinsContainer.innerHTML = '';
    const amount = level.amount;
    const coins = level.coins;
    const available = level.available || {};

    const title = document.createElement('div');
    title.innerHTML = `<strong>Valor:</strong> ${amount.toFixed(2)}`;
    greedCoinsContainer.appendChild(title);

    function coinKey(c){ return Number(c).toFixed(2); }
    function coinId(c){ return `greed_coin_${coinKey(c).replace('.', '_')}`; }

    coins.forEach(c => {
        const row = document.createElement('div');
        row.id = `greed_row_${coinKey(c).replace('.', '_')}`;
        row.className = 'greed-coin-row';
        row.style.marginTop = '6px';
        const label = document.createElement('span');
        label.className = 'sr-only';
        const availKey = coinKey(c);
        const availDisplay = (available[availKey] === undefined) ? '∞' : available[availKey];
        const availSpan = document.createElement('span');
        availSpan.className = 'sr-only greed-avail';
        availSpan.style.cursor = 'pointer';
        availSpan.style.textDecoration = 'underline';
        availSpan.textContent = availDisplay === '∞' ? '∞' : availDisplay;
        availSpan.addEventListener('click', async () => {
            if (!greedState) return;
            const key = coinKey(c);
            if (availSpan.textContent === '∞') {
                const inp = document.createElement('input');
                inp.type = 'number'; inp.min = 0; inp.value = 5; inp.style.width = '64px';
                availSpan.replaceWith(inp);
                inp.addEventListener('change', async () => {
                    const v = parseInt(inp.value) || 0;
                    greedState.available[key] = v;
                    await reinitLevelFromState(greedState);
                    availSpan.textContent = v;
                    inp.replaceWith(availSpan);
                });
            } else {
                greedState.available[key] = undefined;
                await reinitLevelFromState(greedState);
                availSpan.textContent = '∞';
            }
        });
        label.appendChild(availSpan);
        const input = document.createElement('input');
        input.type = 'number';
        input.min = 0;
        input.max = (available[availKey] === undefined) ? 999999 : available[availKey];
        input.value = 0;
        input.id = coinId(c);
        input.setAttribute('data-coin', coinKey(c));
        input.setAttribute('aria-label', `Quantidade de moedas ${coinKey(c)}`);
        input.step = 1;
        input.style.width = '80px';
        const coinVisual = document.createElement('div'); coinVisual.className = 'greed-coin-visual'; coinVisual.tabIndex = 0; coinVisual.style.position='relative';
            const svgNs = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(svgNs, 'svg'); svg.setAttribute('width','56'); svg.setAttribute('height','56'); svg.setAttribute('viewBox','0 0 56 56'); svg.setAttribute('aria-hidden','true');
            svg.innerHTML = `
                <defs>
                    <radialGradient id="g1" cx="30%" cy="25%">
                        <stop offset="0%" stop-color="#fff9d6" />
                        <stop offset="40%" stop-color="#ffd966" />
                        <stop offset="100%" stop-color="#c68600" />
                    </radialGradient>
                </defs>
                <circle cx="28" cy="28" r="26" fill="url(#g1)" stroke="rgba(200,150,50,0.4)" stroke-width="2" />
                <circle cx="28" cy="28" r="18" fill="rgba(255,255,255,0.06)" />
            `;
            const cvValue = document.createElement('div'); cvValue.className = 'coin-label'; cvValue.style.position='absolute'; cvValue.style.top='50%'; cvValue.style.left='50%'; cvValue.style.transform='translate(-50%,-40%)'; cvValue.style.pointerEvents='none'; cvValue.textContent = Number(c).toFixed(2);
            const badge = document.createElement('div'); badge.className = 'coin-badge'; badge.textContent = '0'; badge.setAttribute('aria-hidden','true');
            coinVisual.appendChild(svg); coinVisual.appendChild(cvValue); coinVisual.appendChild(badge);
            coinVisual.addEventListener('click', () => { adjustInput(input, +1); coinVisual.classList.add('pop'); setTimeout(()=>coinVisual.classList.remove('pop'),220); });
            coinVisual.addEventListener('contextmenu', (ev)=>{ ev.preventDefault(); adjustInput(input, -1); });
            coinVisual.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); coinVisual.click(); } if (ev.key === 'ArrowUp'){ ev.preventDefault(); adjustInput(input, +1);} if (ev.key === 'ArrowDown'){ ev.preventDefault(); adjustInput(input, -1);} });

        const controls = document.createElement('div'); controls.className = 'coin-controls';
        const btnMinus = document.createElement('button'); btnMinus.type = 'button'; btnMinus.className = 'coin-step'; btnMinus.setAttribute('aria-label', `Diminuir ${Number(c).toFixed(2)}`); btnMinus.textContent = '−';
        const btnPlus = document.createElement('button'); btnPlus.type = 'button'; btnPlus.className = 'coin-step'; btnPlus.setAttribute('aria-label', `Aumentar ${Number(c).toFixed(2)}`); btnPlus.textContent = '+';
        btnMinus.addEventListener('click', ()=>{ adjustInput(input, -1); });
        btnPlus.addEventListener('click', ()=>{ adjustInput(input, +1); });
        controls.appendChild(btnMinus); controls.appendChild(btnPlus);

        input.addEventListener('input', () => {
            let v = parseInt(input.value) || 0;
            if (v < 0) v = 0;
            const mx = parseInt(input.max) || 0;
            if (v > mx) v = mx;
            if (v !== (parseInt(input.value) || 0)) input.value = v;
            updateGreedStatus();
        });

        row.appendChild(coinVisual);
        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(controls);
        greedCoinsContainer.appendChild(row);
    });

    const greedyHint = document.createElement('div');
    greedyHint.style.marginTop = '8px';
    greedyHint.innerHTML = `<em>Dica: depois de enviar verá a comparação com a estratégia gulosa.</em>`;
    greedCoinsContainer.appendChild(greedyHint);

    const anim = document.getElementById('greedAnimationContent'); if (anim) anim.innerHTML = '';
}

function adjustInput(input, delta){ if (!input) return; let v = parseInt(input.value) || 0; const mx = parseInt(input.max) || 999999; v += delta; if (v < 0) v = 0; if (v > mx) v = mx; input.value = v; input.dispatchEvent(new Event('input')); if (audioEnabled) playClickSound(); }

function playClickSound(){ if (!audioEnabled) return; try{ ensureAudio(); const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type='sine'; o.frequency.value=700; g.gain.value=0.02; o.connect(g); g.connect(audioCtx.destination); o.start(); setTimeout(()=>{ o.stop(); }, 80); }catch(e){} }
function playSuccessSound(){ if (!audioEnabled) return; try{ ensureAudio(); const o=audioCtx.createOscillator(); const g=audioCtx.createGain(); o.type='triangle'; o.frequency.value=880; g.gain.value=0.03; o.connect(g); g.connect(audioCtx.destination); o.start(); setTimeout(()=>{ o.frequency.value=1320; },120); setTimeout(()=>{ o.stop(); }, 300); }catch(e){} }

function playConfetti(){ if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; try{ const area = document.getElementById('greedAnimation'); if (!area) return; const frag = document.createDocumentFragment(); for (let i=0;i<18;i++){ const p = document.createElement('div'); p.className='confetti'; p.style.left = (10 + Math.random()*80)+'%'; p.style.background = `hsl(${Math.random()*60+30},80%,50%)`; frag.appendChild(p); } area.appendChild(frag); setTimeout(()=>{ const nodes = area.querySelectorAll('.confetti'); nodes.forEach(n=>n.remove()); }, 1800); }catch(e){} }

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function animateGreedy(speedMs=300){
    if (!greedState) return;
    const submitBtnEl = document.getElementById('greedSubmitBtn'); if (submitBtnEl) submitBtnEl.disabled = true;
    const animContainer = document.getElementById('greedAnimationContent'); if (!animContainer) return; animContainer.innerHTML = '';
    const coins = greedState.coins.map(c=>Number(c));
    const avail = {}; coins.forEach(c=>{ const k=Number(c).toFixed(2); const v = (greedState.available && greedState.available[k]!==undefined)? greedState.available[k] : Infinity; avail[k]=v; });
    const used = {}; coins.forEach(c=> used[Number(c).toFixed(2)] = 0);
    let remaining = Number(greedState.amount);
    const statusLine = document.createElement('div'); statusLine.style.marginBottom='8px'; animContainer.appendChild(statusLine);
    const picksList = document.createElement('div'); animContainer.appendChild(picksList);
    while (remaining > 0.0001){
        let picked = null;
        for (let c of coins){ if (c <= remaining + 1e-9 && avail[Number(c).toFixed(2)]>0){ picked=c; break; } }
        if (picked===null) break;
        const key = Number(picked).toFixed(2);
        used[key] += 1;
        if (avail[key] !== Infinity) avail[key] -= 1;
        remaining = Math.round((remaining - picked)*100)/100;
        const row = document.getElementById(`greed_row_${key.replace('.', '_')}`);
        if (row) row.classList.add('highlight');
        const step = document.createElement('div'); step.textContent = `Pegou ${key} — restante: ${remaining.toFixed(2)}`; picksList.appendChild(step);
        statusLine.textContent = `Moedas usadas: ${Object.values(used).reduce((a,b)=>a+b,0)} — restante: ${remaining.toFixed(2)}`;
        await sleep(speedMs);
        if (row) row.classList.remove('highlight');
    }
    if (remaining > 0.0001){ const err = document.createElement('div'); err.style.color='#b03'; err.textContent = 'Gulosa não conseguiu formar o valor com a disponibilidade atual.'; animContainer.appendChild(err); }
    const final = document.createElement('div'); final.style.marginTop='8px'; final.innerHTML = `<strong>Gulosa final:</strong> ${Object.entries(used).map(([k,v])=>`${k}x${v}`).join(', ')}`;
    animContainer.appendChild(final);
    if (submitBtnEl) submitBtnEl.disabled = false;
}

function updateGreedStatus() {
    if (!greedState) return;
    const amount = greedState.amount;
    let sum = 0; let coinsUsed = 0; let invalid = false;
    greedState.coins.forEach(c => {
        const id = `greed_coin_${Number(c).toFixed(2).replace('.', '_')}`;
        const input = document.getElementById(id);
        if (!input) return;
        let v = parseInt(input.value);
        if (isNaN(v)) v = 0;
        const max = greedState.available ? (greedState.available[Number(c).toFixed(2)] || 0) : 0;
        if (v < 0 || v > max) invalid = true;
        sum += v * parseFloat(c);
        coinsUsed += v;
        const badge = document.querySelector(`#greed_row_${Number(c).toFixed(2).replace('.', '_')} .coin-badge`);
        if (badge) badge.textContent = v;
    });
    const sumEl = document.getElementById('greedSumDisplay');
    const coinsEl = document.getElementById('greedCoinsCount');
    const validEl = document.getElementById('greedValidity');
    const submitBtn = document.getElementById('greedSubmitBtn');
    const diff = Math.abs(sum - amount);
    if (sumEl) sumEl.textContent = `Soma: ${sum.toFixed(2)} / ${amount.toFixed(2)}`;
    if (coinsEl) coinsEl.textContent = `Moedas: ${coinsUsed}`;
    if (diff > 0.005) { if (validEl) { validEl.textContent = 'Soma incorreta'; validEl.style.color = '#b03'; } if (submitBtn) submitBtn.disabled = true; return false; }
    if (invalid) { if (validEl) { validEl.textContent = 'Quantidade inválida'; validEl.style.color = '#b03'; } if (submitBtn) submitBtn.disabled = true; return false; }
    if (validEl) { validEl.textContent = 'Válido'; validEl.style.color = '#0a0'; }
    if (submitBtn) submitBtn.disabled = false;
    return true;
}

async function submitGreed() {
    if (!greedState) return;
    if (!updateGreedStatus()) { greedMessage.textContent = 'Corrija os valores antes de enviar.'; return; }
    const choice = {};
    greedState.coins.forEach(c => {
        const key = Number(c).toFixed(2);
        const id = `greed_coin_${key.replace('.', '_')}`;
        const input = document.getElementById(id);
        if (input) choice[key] = parseInt(input.value) || 0;
    });
    try {
        const data = await submitChoice(choice);
        if (data.success) {
            const r = data.result;
            if (!r.valid) { greedMessage.textContent = r.message || 'Escolha inválida'; greedResults.innerHTML = ''; return; }
            const timeSec = Math.floor((Date.now() - (greedLevelStart||Date.now()))/1000);
            stopLevelTimer();
            let points = 0;
            if (r.player_total <= r.greedy_total) points = 120 - timeSec;
            else points = 60 - timeSec;
            if (points < 0) points = 0;
            greedScore += points;
            if (greedScore > greedBest) greedBest = greedScore;
            document.getElementById('greedScore').textContent = greedScore;
            document.getElementById('greedBest').textContent = greedBest;
            greedMessage.textContent = `Válido — moedas usadas: ${r.player_total} — +${points} pontos (tempo ${timeSec}s)`;
            let html = '';
            html += `<div><strong>Sua solução:</strong> ${Object.entries(r.player_used).map(([k,v])=>`${k}x${v}`).join(', ')}</div>`;
            html += `<div><strong>Gulosa:</strong> ${Object.entries(r.greedy_used).map(([k,v])=>`${k}x${v}`).join(', ')} — total: ${r.greedy_total === null ? 'impossível' : r.greedy_total}</div>`;
            html += `<div><strong>Igual à gulosa?</strong> ${r.is_greedy ? 'Sim' : 'Não'}</div>`;
            greedResults.innerHTML = html;
            const nextBtn = document.getElementById('greedNextBtn'); if (nextBtn) nextBtn.style.display='inline-block';
            const submitBtnEl = document.getElementById('greedSubmitBtn'); if (submitBtnEl) submitBtnEl.disabled = true;
            saveHistoryEntry({ ts: Date.now(), level: greedLevelNumber, score: points, totalScore: greedScore, time: timeSec, is_greedy: !!r.is_greedy, meta: currentMeta });
            renderHistory();
            if (r.is_greedy){ playConfetti(); playSuccessSound(); } else { if (audioEnabled) playClickSound(); }
        } else { alert('Erro ao submeter: ' + (data.error || '')); }
    } catch (err) { console.error('Erro ao submeter troco', err); alert('Erro ao submeter troco'); }
}

async function reinitLevelFromState(state) {
    const avail = {};
    for (const k in state.available) { if (state.available[k] === undefined || state.available[k] === null) continue; avail[Number(k).toFixed(2)] = state.available[k]; }
    try {
        const data = await initLevel(state.amount, state.coins, avail);
        if (data.success) {
            greedState = data.level;
            renderGreedLevel(greedState);
            startLevelTimer();
        }
    } catch (e) { console.error('reinit failed', e); }
}

function loadHistory(){ try{ const raw = localStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) : []; }catch(e){return[]} }
function saveHistory(h){ try{ localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }catch(e){} }
function saveHistoryEntry(entry){ const h = loadHistory(); h.unshift(entry); if (h.length>50) h.pop(); saveHistory(h);} 
function renderHistory(){ const container = document.getElementById('greedHistoryContent'); if (!container) return; const h = loadHistory(); if (h.length === 0){ container.innerHTML = '<div>Nenhum registro ainda.</div>'; return; } container.innerHTML = h.map(it=>{ const date = new Date(it.ts); const meta = it.meta && it.meta.coins ? ` — Moedas: ${it.meta.coins.join(', ')}` : ''; return `<div style="padding:6px;border-bottom:1px solid #eee">`+`<div><strong>${date.toLocaleString()}</strong>${meta}</div>`+`<div style="font-size:0.95em">Nível ${it.level} — +${it.score} pts — tempo ${it.time}s — total ${it.totalScore}</div>`+`</div>`; }).join(''); }

function wireHistoryButtons(){ const openBtn = document.getElementById('greedHistoryBtn'); const modal = document.getElementById('greedHistoryModal'); const closeBtn = document.getElementById('greedCloseHistoryBtn'); const clearBtn = document.getElementById('greedClearHistoryBtn'); if (openBtn && modal){ openBtn.onclick = ()=>{ renderHistory(); modal.style.display='flex'; } } if (closeBtn && modal){ closeBtn.onclick = ()=>{ modal.style.display='none'; } } if (clearBtn){ clearBtn.onclick = ()=>{ if (confirm('Limpar todo o histórico?')){ localStorage.removeItem(HISTORY_KEY); renderHistory(); } } } }

function showMachineOverlay(){ }
function hideMachineOverlay(){ }

document.addEventListener('DOMContentLoaded', ()=>{ wireHistoryButtons(); renderHistory(); });
document.addEventListener('DOMContentLoaded', ()=>{
    const soundBtn = document.getElementById('soundToggleBtn');
    const compactBtn = document.getElementById('compactToggleBtn');
    document.documentElement.setAttribute('data-theme', 'dark');
    if (soundBtn) { soundBtn.setAttribute('aria-pressed', audioEnabled); soundBtn.textContent = audioEnabled ? 'Som' : 'Sem som'; }
    if (compactBtn) { compactBtn.setAttribute('aria-pressed', compactMode); document.querySelectorAll('.greed-coin-row input, .coin-controls').forEach(el=> el.style.display = compactMode ? 'none' : 'inline-block'); }
    soundBtn && soundBtn.addEventListener('click', ()=>{ audioEnabled = !audioEnabled; soundBtn.setAttribute('aria-pressed', audioEnabled); soundBtn.textContent = audioEnabled? 'Som' : 'Sem som'; });
    compactBtn && compactBtn.addEventListener('click', ()=>{ compactMode = !compactMode; compactBtn.setAttribute('aria-pressed', compactMode); document.querySelectorAll('.greed-coin-row input, .coin-controls').forEach(el=> el.style.display = compactMode ? 'none' : 'inline-block'); });
});
