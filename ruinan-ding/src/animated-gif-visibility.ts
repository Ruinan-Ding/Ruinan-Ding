export function observeAnimatedGifs(document: Document, win: Window & typeof globalThis): void {
  const images = document.querySelectorAll<HTMLImageElement>('img[data-animated-src]');
  if (!('IntersectionObserver' in win)) {
    images.forEach((img) => img.setAttribute('src', img.dataset['animatedSrc']!));
    return;
  }

  const observer = new win.IntersectionObserver((entries) => {
    for (const entry of entries) {
      const image = entry.target as HTMLImageElement;
      const src = image.dataset['animatedSrc'];
      if (!image.isConnected) {
        observer.unobserve(image);
      } else if (entry.isIntersecting && src) {
        if (!image.hasAttribute('src')) image.setAttribute('src', src);
      } else {
        image.removeAttribute('src');
      }
    }
  }, { rootMargin: '200px' });

  images.forEach((img) => observer.observe(img));
}
