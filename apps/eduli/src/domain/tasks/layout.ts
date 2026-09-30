export function taskContentWidth(viewportWidth: number) {
  const safeViewport = Number.isFinite(viewportWidth)
    ? Math.max(240, viewportWidth)
    : 320;

  // Screen horizontal padding: 24px per side.
  // Task card horizontal padding: 22px per side.
  return Math.max(144, Math.min(320, safeViewport - 92));
}

export function fitGridCellSize(
  columns: number,
  availableWidth: number,
  preferredSize: number
) {
  if (!Number.isFinite(columns) || columns <= 0) return preferredSize;

  return Math.max(
    28,
    Math.min(
      preferredSize,
      Math.floor(availableWidth / columns)
    )
  );
}
