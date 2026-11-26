export async function celebrate(): Promise<void> {
  try {
    const confetti = (await import("canvas-confetti")).default;
    const colors = ["#E8503A", "#6B7A3A", "#E0A412", "#FFF8EC", "#2B2118"];

    confetti({
      particleCount: 70,
      spread: 75,
      startVelocity: 32,
      gravity: 0.9,
      scalar: 0.9,
      origin: { x: 0.5, y: 0.65 },
      colors,
      disableForReducedMotion: true,
    });
  } catch {
    // Confetti is purely decorative.
  }
}
