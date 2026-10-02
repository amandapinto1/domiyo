"use client";

import { Camera, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { FormAlert } from "@/components/ui/form-alert";
import { Dialog } from "@/components/ui/dialog";
import {
  clampOffset,
  CROP_CIRCLE_PX,
  cropSource,
  MAX_ZOOM,
  MIN_ZOOM,
  renderScale,
  type ImageSize,
  type Offset,
} from "./photo-crop";
import { FOCUS_RING, OUTLINE_PILL, PRIMARY_PILL } from "@/components/ui/styles";

// The server accepts only this format and size (docs/ARCHITECTURE.md: 512×512, 1 MB).
const OUTPUT_PX = 512;
const JPEG_QUALITY = 0.85;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const ZOOM_STEP = 0.1;
const KEYBOARD_STEP_PX = 8;
const UNREADABLE_IMAGE = "Não foi possível abrir essa imagem. Use uma foto JPG, PNG ou WebP.";

type Source = { url: string; size: ImageSize };
type Drag = { pointerId: number; startX: number; startY: number; origin: Offset };

/** Camera badge on the avatar: picks an image and opens "Ajustar foto" to crop it into a circle. */
export function PhotoEditor() {
  const id = useId();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<Source | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function openWithError(message: string) {
    setSource(null);
    setError(message);
    setIsOpen(true);
  }

  function handleFileChange() {
    const file = inputRef.current?.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return openWithError(UNREADABLE_IMAGE);
    if (file.size > MAX_SOURCE_BYTES) return openWithError("Essa imagem é grande demais. Use uma de até 20 MB.");

    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      setSource({ url, size: { width: image.naturalWidth, height: image.naturalHeight } });
      setZoom(MIN_ZOOM);
      setOffset({ x: 0, y: 0 });
      setError(null);
      setIsOpen(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      openWithError(UNREADABLE_IMAGE);
    };
    image.src = url;
  }

  function handleClose() {
    if (isSaving) return;
    if (source) URL.revokeObjectURL(source.url);
    setSource(null);
    setError(null);
    setIsOpen(false);
  }

  function moveTo(next: Offset) {
    if (source) setOffset(clampOffset(next, source.size, zoom));
  }

  function handleZoom(nextZoom: number) {
    if (!source) return;
    const zoomValue = Math.min(Math.max(nextZoom, MIN_ZOOM), MAX_ZOOM);
    setZoom(zoomValue);
    setOffset((current) => clampOffset(current, source.size, zoomValue));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, origin: offset };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    moveTo({ x: drag.origin.x + event.clientX - drag.startX, y: drag.origin.y + event.clientY - drag.startY });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, Offset> = {
      ArrowLeft: { x: -KEYBOARD_STEP_PX, y: 0 },
      ArrowRight: { x: KEYBOARD_STEP_PX, y: 0 },
      ArrowUp: { x: 0, y: -KEYBOARD_STEP_PX },
      ArrowDown: { x: 0, y: KEYBOARD_STEP_PX },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    moveTo({ x: offset.x + move.x, y: offset.y + move.y });
  }

  async function handleConfirm() {
    const image = imageRef.current;
    if (!source || !image) return;
    setError(null);
    setIsSaving(true);
    try {
      const crop = cropSource(source.size, zoom, offset);
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_PX;
      canvas.height = OUTPUT_PX;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      // JPEG has no transparency; transparent PNG areas become white instead of black.
      context.fillStyle = "white";
      context.fillRect(0, 0, OUTPUT_PX, OUTPUT_PX);
      context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, OUTPUT_PX, OUTPUT_PX);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
      if (!blob) throw new Error("Encoding failed");

      const response = await fetch("/api/profile/photo", {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(body?.message ?? "Não foi possível salvar a foto. Tente de novo.");
        return;
      }
      URL.revokeObjectURL(source.url);
      setSource(null);
      setIsOpen(false);
      router.refresh();
    } catch {
      setError("Não foi possível salvar a foto. Tente de novo.");
    } finally {
      setIsSaving(false);
    }
  }

  const scale = source ? renderScale(source.size, zoom) : 1;

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        aria-label="Trocar foto"
        title="Trocar foto"
        className={`absolute -right-1 bottom-0 grid size-8 cursor-pointer place-items-center rounded-full border-2 border-lavender-100 bg-white text-lavender-900 dark:border-lavender-950 ${FOCUS_RING}`}
      >
        <Camera aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
        onChange={handleFileChange}
      />

      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Ajustar foto"
        titleId={`${id}-title`}
        descriptionId={`${id}-description`}
        variant="modal"
      >
        <p id={`${id}-description`} className="mt-3 text-body-small text-text-secondary">
          Arraste a foto para posicionar e use o zoom para aproximar. O círculo mostra como ela vai aparecer.
        </p>
        {error ? (
          <div className="mt-4">
            <FormAlert message={error} />
          </div>
        ) : null}

        {source ? (
          <>
            <div
              role="group"
              aria-label="Posição da foto. Use as setas para mover."
              tabIndex={0}
              data-autofocus
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              onPointerCancel={() => {
                dragRef.current = null;
              }}
              onKeyDown={handleKeyDown}
              className={`relative mt-5 h-60 cursor-grab touch-none overflow-hidden rounded-lg bg-lavender-800 select-none active:cursor-grabbing ${FOCUS_RING}`}
            >
              {/* A local blob URL being cropped, not a page image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={source.url}
                alt=""
                draggable={false}
                className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
                style={{
                  width: source.size.width * scale,
                  height: source.size.height * scale,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 rounded-full border-2 border-white shadow-[0_0_0_999px_color-mix(in_srgb,var(--color-lavender-900)_55%,transparent)]"
                style={{ width: CROP_CIRCLE_PX, height: CROP_CIRCLE_PX }}
              />
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleZoom(zoom - ZOOM_STEP)}
                aria-label="Diminuir zoom"
                className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-text ${FOCUS_RING}`}
              >
                <Minus aria-hidden="true" className="size-5" strokeWidth={2} />
              </button>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                onChange={(event) => handleZoom(Number(event.target.value))}
                aria-label="Zoom"
                className="h-2 w-full cursor-pointer accent-lavender-900 dark:accent-lime-500"
              />
              <button
                type="button"
                onClick={() => handleZoom(zoom + ZOOM_STEP)}
                aria-label="Aumentar zoom"
                className={`grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-text ${FOCUS_RING}`}
              >
                <Plus aria-hidden="true" className="size-5" strokeWidth={2} />
              </button>
            </div>
          </>
        ) : null}

        <div className={`mt-6 grid gap-3 ${source ? "grid-cols-2" : ""}`}>
          <button type="button" onClick={handleClose} disabled={isSaving} className={OUTLINE_PILL}>
            {source ? "Cancelar" : "Fechar"}
          </button>
          {source ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving}
              aria-busy={isSaving}
              className={PRIMARY_PILL}
            >
              {isSaving ? "Salvando…" : "Confirmar"}
            </button>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}
