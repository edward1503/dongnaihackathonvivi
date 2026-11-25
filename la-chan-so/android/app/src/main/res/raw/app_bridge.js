(() => {
  const android = window.LCSAndroid
  const pending = new Map()
  const prefix = Math.random().toString(36).slice(2)
  let sequence = 0
  function request(method, ...args) {
    return new Promise((resolve, reject) => {
      const id = prefix + '-' + ++sequence
      pending.set(id, resolve)
      try { android[method](id, ...args) }
      catch (error) { pending.delete(id); reject(error) }
    })
  }
  window.__lcsResolve = (id, value) => {
    pending.get(id)?.(value)
    pending.delete(id)
  }
  const bridge = {
    listen: () => request('startListen'),
    analyzeRecording: phone => request('startAnalyzeRecording', phone),
    recentCalls: () => request('startRecentCalls'),
  }
  for (const name of ['speak', 'stopSpeaking', 'call', 'blockNumber', 'endCall', 'dismissStop',
    'layers', 'enableLayer', 'setVoiceAsk', 'openStory', 'weekStats', 'saveRelative', 'openAdvanced']) {
    bridge[name] = (...args) => android[name](...args)
  }
  window.LCSNative = bridge
})()
