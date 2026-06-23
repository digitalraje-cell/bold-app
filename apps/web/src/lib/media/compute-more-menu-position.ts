export type MoreMenuPosition = {
  left: number;
  bottom: number;
  maxHeight: number;
  width: number;
};

type Rect = Pick<DOMRect, 'top' | 'right' | 'bottom' | 'left'>;
type Viewport = { width: number; height: number };

/**
 * Positions the More options menu above the anchor, clamped inside the viewport.
 * Used by ControlsBar portal rendering and verification scripts.
 */
export function computeMoreMenuPosition(
  anchorRect: Rect,
  viewport: Viewport,
  options?: { menuWidth?: number; padding?: number; safeAreaTop?: number },
): MoreMenuPosition {
  const padding = options?.padding ?? 8;
  const safeAreaTop = options?.safeAreaTop ?? 0;
  const maxMenuWidth = Math.max(160, viewport.width - padding * 2);
  const menuWidth = Math.min(options?.menuWidth ?? 192, maxMenuWidth);

  let left = anchorRect.right - menuWidth;
  left = Math.max(padding, Math.min(left, viewport.width - menuWidth - padding));

  const bottom = viewport.height - anchorRect.top + padding;
  const maxHeight = Math.max(120, anchorRect.top - padding * 2 - safeAreaTop);

  return { left, bottom, maxHeight, width: menuWidth };
}
