import { Scene } from '@babylonjs/core';

/**
 * Using `Shift+Ctrl+Alt+I` to hide/show the Inspector
 * @param scene
 */
export const setupDebugLayer = (scene: Scene) => {
  if (process.env.NODE_ENV !== 'production') {
    window.addEventListener('keydown', (ev) => {
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.code === 'KeyI') {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show();
        }
      }
    });
  }
};

export const noop = () => {};

let isMobile: boolean;
export const isMobileBrowser = () => {
  if (isMobile === undefined) {
    isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        window.navigator.userAgent
      );
  }
  return isMobile;
};
