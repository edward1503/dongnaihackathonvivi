// Chạy một biểu thức JS trong tab video-call của Chrome trên điện thoại: node cdp-eval.mjs '<biểu thức>'
const tabs = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
const tab = tabs.find(t => t.type === 'page' && t.url.includes('video-call.html'));
if (!tab) { console.log('KHÔNG thấy tab'); process.exit(1); }
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
ws.onmessage = (m) => { const j = JSON.parse(m.data); if (j.id === 1) { console.log(JSON.stringify(j.result?.result?.value ?? j.result?.exceptionDetails?.exception?.description ?? j)); ws.close(); } };
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: process.argv[2], returnByValue: true, awaitPromise: true } }));
