import { describe, expect, it } from "vitest";
import { parseRoomName } from "./rooms.js";

describe("parseRoomName", () => {
  it("extracts workspace and document ids", () => {
    const room = parseRoomName("workspace:11111111-1111-1111-1111-111111111111:document:22222222-2222-2222-2222-222222222222");

    expect(room).toEqual({
      workspaceId: "11111111-1111-1111-1111-111111111111",
      documentId: "22222222-2222-2222-2222-222222222222",
    });
  });

  it("rejects malformed room names", () => {
    expect(() => parseRoomName("org:demo:doc:123")).toThrow();
  });
});
