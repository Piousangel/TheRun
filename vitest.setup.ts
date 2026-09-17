import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// 일부 스펙(예: src/middleware.test.ts)은 environment: 'node'로 돌아 window/Element가 없다.
// jsdom 스펙에만 적용되는 스텁이므로 존재 여부를 먼저 확인한다.
if (typeof window !== 'undefined') {
  // vaul(Drawer)이 열릴 때 standalone(PWA) 모드 판별에 window.matchMedia를 쓴다.
  // jsdom엔 구현이 없어 "window.matchMedia is not a function"으로 실패하므로 최소 스텁을 둔다.
  if (!window.matchMedia) {
    window.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
  }
}

if (typeof Element !== 'undefined') {
  // vaul은 드래그 제스처에 Pointer Capture API를 쓴다. jsdom은 이를 구현하지 않아
  // userEvent.click(포인터 이벤트 포함)만으로도 "setPointerCapture is not a function"
  // unhandled exception이 발생한다. 실제 드래그 동작은 검증 대상이 아니므로 최소 스텁만 둔다.
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
}
