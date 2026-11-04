import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ArchiveSessionDatabase,
  ArchiveSessionRepository,
  type NewArchiveSession,
} from "./archiveSessionRepository";

const databases: ArchiveSessionDatabase[] = [];

function createRepository() {
  const database = new ArchiveSessionDatabase(`photoslicer-test-${crypto.randomUUID()}`);
  databases.push(database);
  return {
    database,
    repository: new ArchiveSessionRepository(database),
  };
}

function createSession(): NewArchiveSession {
  const file = new File(["scan"], "scan.png", { type: "image/png" });
  return {
    createdAt: 123,
    filename: "photoslicer-export.zip",
    zipData: new Uint8Array([122, 105, 112, 32, 100, 97, 116, 97]).buffer,
    zipSize: 8,
    cropCount: 1,
    images: [
      {
        fileName: file.name,
        fileData: new Uint8Array([115, 99, 97, 110]).buffer,
        fileType: file.type,
        regions: [
          {
            id: "region-1",
            upperLeft: { x: 1, y: 2 },
            upperRight: { x: 11, y: 2 },
            lowerRight: { x: 11, y: 12 },
            lowerLeft: { x: 1, y: 12 },
          },
        ],
        metadata: [
          [
            "region-1",
            { title: "Test crop", description: "", rotation: 0 },
          ],
        ],
      },
    ],
  };
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()));
  vi.restoreAllMocks();
});

describe("ArchiveSessionRepository", () => {
  it("persists versioned session data and returns lightweight summaries", async () => {
    const { repository } = createRepository();
    const saved = await repository.save(createSession());

    expect(saved).toMatchObject({
      schemaVersion: 1,
      filename: "photoslicer-export.zip",
      zipSize: 8,
      cropCount: 1,
      imageCount: 1,
    });

    const loaded = await repository.get(saved.id);
    expect(loaded?.zipData.byteLength).toBe(8);
    expect(loaded?.images[0].fileName).toBe("scan.png");
    expect(loaded?.images[0].fileType).toBe("image/png");
    expect(loaded?.images[0].fileData.byteLength).toBe(4);
    expect(loaded?.images[0].regions[0].upperLeft).toEqual({ x: 1, y: 2 });
    expect(loaded?.images[0].metadata[0][1].title).toBe("Test crop");
    expect((await repository.list())[0]).not.toHaveProperty("zipData");
  });

  it("removes only the requested saved session", async () => {
    const { repository } = createRepository();
    const first = await repository.save(createSession());
    const second = await repository.save(createSession());

    await repository.delete(first.id);

    expect(await repository.get(first.id)).toBeUndefined();
    expect((await repository.list()).map(({ id }) => id)).toEqual([second.id]);
  });

  it("surfaces quota failures and leaves no partial record", async () => {
    const { database, repository } = createRepository();
    vi.spyOn(database.sessions, "add").mockRejectedValue(
      new DOMException("Storage quota exceeded", "QuotaExceededError"),
    );

    await expect(repository.save(createSession())).rejects.toMatchObject({
      name: "QuotaExceededError",
    });
    expect(await database.sessions.count()).toBe(0);
  });

  it("rejects records from unsupported schema versions", async () => {
    const { database, repository } = createRepository();
    const saved = await repository.save(createSession());
    await database.sessions.update(saved.id, { schemaVersion: 99 });

    await expect(repository.get(saved.id)).rejects.toThrow(
      "Unsupported archive session schema version: 99",
    );
    await expect(repository.list()).rejects.toThrow(
      "Unsupported archive session schema version: 99",
    );
  });
});
