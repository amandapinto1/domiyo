export type ImageSize = { width: number; height: number };
export type Offset = { x: number; y: number };

/** Diameter, in CSS pixels, of the circle that shows what the photo will look like. */
export const CROP_CIRCLE_PX = 208;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

/** Rendered pixels per image pixel: at zoom 1 the image's short side exactly covers the circle. */
export function renderScale(image: ImageSize, zoom: number, circle = CROP_CIRCLE_PX): number {
  return (circle / Math.min(image.width, image.height)) * zoom;
}

/** Limits the drag so the image always covers the whole circle. */
export function clampOffset(offset: Offset, image: ImageSize, zoom: number, circle = CROP_CIRCLE_PX): Offset {
  const scale = renderScale(image, zoom, circle);
  const maxX = (image.width * scale - circle) / 2;
  const maxY = (image.height * scale - circle) / 2;
  const clamp = (value: number, max: number) => Math.min(Math.max(value, -max), max);
  return { x: clamp(offset.x, maxX), y: clamp(offset.y, maxY) };
}

/** The square of the source image, in image pixels, that sits under the circle. */
export function cropSource(image: ImageSize, zoom: number, offset: Offset, circle = CROP_CIRCLE_PX) {
  const scale = renderScale(image, zoom, circle);
  const size = circle / scale;
  return {
    x: image.width / 2 - offset.x / scale - size / 2,
    y: image.height / 2 - offset.y / scale - size / 2,
    size,
  };
}
