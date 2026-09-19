// Web Speech API - free, built into the browser, no key, no setup.
// Swap for ElevenLabs later if you want voice cloning for the sponsor prize.

export function speak(text) {
  if (!text) return
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.95
  utterance.pitch = 1.0
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
