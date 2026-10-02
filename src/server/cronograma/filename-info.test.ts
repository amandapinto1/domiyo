import { afterEach, describe, expect, it, vi } from "vitest";
import { getCronogramaInfoWithFilenameFallback } from "./filename-info";

afterEach(() => vi.restoreAllMocks());

describe("getCronogramaInfoWithFilenameFallback", () => {
  it("keeps agenda metadata available when the encrypted filename cannot be decrypted", async () => {
    const importedAt = new Date("2026-10-02T12:00:00.000Z");
    const onFilenameError = vi.fn();

    await expect(getCronogramaInfoWithFilenameFallback(
      async () => { throw new Error("decryption failed"); },
      async () => importedAt,
      onFilenameError,
    )).resolves.toEqual({ fileName: "cronograma.pdf", importedAt });
    expect(onFilenameError).toHaveBeenCalledOnce();
  });

  it("does not invent a current cronograma when the record is unavailable", async () => {
    const onFilenameError = vi.fn();

    await expect(getCronogramaInfoWithFilenameFallback(
      async () => { throw new Error("decryption failed"); },
      async () => null,
      onFilenameError,
    )).resolves.toBeNull();
    expect(onFilenameError).not.toHaveBeenCalled();
  });
});