export async function initLevel(amount, coins, available=null) {
    const body = { amount, coins, available };
    const resp = await fetch('/api/greed/init', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)
    });
    return resp.json();
}

export async function submitChoice(choice) {
    const resp = await fetch('/api/greed/submit', {
        method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ choice })
    });
    return resp.json();
}
