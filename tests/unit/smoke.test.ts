import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

// Humo del bloque 1: Vitest corre y resuelve el alias "@/".
describe("SLICE-0 scaffold", () => {
  it("resuelve el alias @/ y combina clases de Tailwind", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
