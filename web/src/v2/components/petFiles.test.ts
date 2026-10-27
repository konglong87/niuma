import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PET_ASSETS } from "./petAssets";

const GLB_MAGIC = 0x46546c67;
const JSON_CHUNK = 0x4e4f534a;

describe("shipped companion assets", () => {
  for (const [id, asset] of Object.entries(PET_ASSETS)) {
    it(`${id} has a valid local GLB container and transparent PNG poster`, () => {
      const glb = readFileSync(resolve("public", asset.url.slice(1)));
      expect(glb.readUInt32LE(0)).toBe(GLB_MAGIC);
      expect(glb.readUInt32LE(4)).toBe(2);
      expect(glb.readUInt32LE(8)).toBe(glb.length);
      expect(glb.readUInt32LE(16)).toBe(JSON_CHUNK);
      const doc = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
      expect(doc.meshes.length).toBeGreaterThan(0);
      expect(doc.buffers.every((buffer: { uri?: string }) => !buffer.uri)).toBe(true);
      if (id === "niuma") {
        expect(glb.length).toBeLessThan(512 * 1024);
        for (const joint of ["HeadRig", "TailRig", "LeftArmRig", "RightArmRig"]) {
          const node = doc.nodes.find((item: { name: string }) => item.name === joint);
          expect(node).toBeDefined();
          expect(node.children.length).toBeGreaterThan(0);
          expect(node.translation.some((axis: number) => axis !== 0)).toBe(true);
        }
      }
      const poster = readFileSync(resolve("public", asset.poster.slice(1)));
      expect(poster.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(poster.readUInt32BE(16)).toBe(336);
      expect(poster.readUInt32BE(20)).toBe(396);
      expect(poster[25]).toBe(6); // RGBA
    });
  }
});
