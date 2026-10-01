export function isCompactPhone(width: number) {
  return Number.isFinite(width) && width <= 360;
}

export function screenHorizontalPadding(width: number) {
  return isCompactPhone(width) ? 16 : 24;
}

export function responsiveHeadingSize(
  width: number,
  regularSize: number,
  compactSize: number
) {
  return isCompactPhone(width) ? compactSize : regularSize;
}
