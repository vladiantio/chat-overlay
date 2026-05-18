export const playNotificationSound = () => {
  // Use window.AudioContext or fallback for Safari
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return; // Browser doesn't support Web Audio API

  const audioCtx = new AudioContextClass();

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "sine";

  // Create a pleasant "pop" or "bubble" sound
  // Start at a higher frequency and quickly drop
  oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    300,
    audioCtx.currentTime + 0.1,
  );

  // Volume envelope: quick attack, quick decay
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.3);

  setTimeout(() => audioCtx.close(), 600);
};
