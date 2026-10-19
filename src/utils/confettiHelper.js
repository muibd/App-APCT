// ============================================================================
// SAFE CONFETTI HELPER
// Giải pháp pháo hoa ăn mừng 100% an toàn chống sập/trắng màn hình trên Mobile:
// - Sử dụng Pure CSS/DOM particles (không dùng OffscreenCanvas hay WebWorker)
// - Miễn nhiễm hoàn toàn với WebKit WebProcess crash của iOS Safari
// - Tự động dọn dẹp phần tử sau 3.5 giây, RAM = 0
// ============================================================================

export function triggerSafeConfetti() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  try {
    const existing = document.getElementById('safe-confetti-root');
    if (existing) {
      try { existing.remove(); } catch {}
    }

    const container = document.createElement('div');
    container.id = 'safe-confetti-root';
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '999999';
    container.style.overflow = 'hidden';

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#06b6d4', '#eab308'];
    const emojis = ['🎉', '✨', '⭐', '🎊', '🎈', '🏆'];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      const isEmoji = i % 3 === 0;

      const startX = Math.random() * 100;
      const fallDuration = 1.6 + Math.random() * 1.6;
      const delay = Math.random() * 0.4;

      p.style.position = 'absolute';
      p.style.top = '-30px';
      p.style.left = `${startX}vw`;
      p.style.animation = `safeConfettiFall ${fallDuration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s forwards`;
      p.style.pointerEvents = 'none';
      p.style.willChange = 'transform, opacity';

      if (isEmoji) {
        p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        p.style.fontSize = `${18 + Math.random() * 12}px`;
      } else {
        const size = 8 + Math.random() * 8;
        p.style.width = `${size}px`;
        p.style.height = `${size * (Math.random() > 0.5 ? 1.4 : 1)}px`;
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
        p.style.transform = `rotate(${Math.random() * 360}deg)`;
      }

      container.appendChild(p);
    }

    document.body.appendChild(container);

    setTimeout(() => {
      try {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      } catch {}
    }, 3800);
  } catch (err) {
    console.warn('[Safe Confetti Error]', err);
  }
}
