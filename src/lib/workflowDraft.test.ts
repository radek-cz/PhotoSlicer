import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  WorkflowDraftDatabase,
  WorkflowDraftRepository,
  WORKFLOW_DRAFT_TTL_MS,
  setWorkflowDraftsEnabled,
  workflowDraftRepository,
  type WorkflowDraft,
} from "./workflowDraft";

const databases: WorkflowDraftDatabase[] = [];

function createRepository() {
  const database = new WorkflowDraftDatabase(
    `photoslicer-workflow-test-${crypto.randomUUID()}`,
  );
  databases.push(database);
  return {
    database,
    repository: new WorkflowDraftRepository(database),
  };
}

function createDraft(id: string, createdAt = Date.now()): WorkflowDraft {
  const file = new File(["photo"], `${id}.png`, { type: "image/png" });
  return {
    id,
    version: 1,
    createdAt,
    lastActivityAt: createdAt,
    expiresAt: createdAt + WORKFLOW_DRAFT_TTL_MS,
    updatedAt: createdAt,
    step: "regions",
    availableThrough: "regions",
    images: [
      {
        fileId: `${id}-file`,
        file,
        imageId: `${id}-image`,
        regions: [],
      },
    ],
    metadata: [],
    exportedZip: null,
    isEnded: false,
  };
}

afterEach(async () => {
  await Promise.all(databases.splice(0).map((database) => database.delete()));
  window.localStorage.removeItem("photoslicer.workflow-drafts-enabled");
  vi.restoreAllMocks();
});

describe("WorkflowDraftRepository", () => {
  it("stores and lists independent drafts with their source filenames", async () => {
    const { repository } = createRepository();
    const now = Date.now();
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    await repository.save(createDraft("first", now));
    clock.mockReturnValue(now + 1);
    await repository.save(createDraft("second", now + 1));
    clock.mockReturnValue(now + 2);

    await expect(repository.list()).resolves.toMatchObject([
      { id: "second", fileNames: ["second.png"] },
      { id: "first", fileNames: ["first.png"] },
    ]);
    const restored = await repository.get("first");
    expect(restored?.images[0].file).toBeDefined();
  });

  it("does not extend expiry for periodic autosaves and removes expired files", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const { database, repository } = createRepository();
    const draft = createDraft("idle", now);
    await repository.save(draft);

    vi.spyOn(Date, "now").mockReturnValue(now + 30_000);
    const autosaved = await repository.save(draft, false);
    expect(autosaved.expiresAt).toBe(draft.expiresAt);

    vi.spyOn(Date, "now").mockReturnValue(
      now + WORKFLOW_DRAFT_TTL_MS + 1,
    );
    await expect(repository.list()).resolves.toEqual([]);
    expect(await database.drafts.count()).toBe(0);
    expect(await database.files.count()).toBe(0);
  });

  it("renews the inactivity window after a user action", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const { repository } = createRepository();
    const draft = createDraft("active", now);
    await repository.save(draft);

    vi.spyOn(Date, "now").mockReturnValue(now + 10_000);
    const renewed = await repository.save(draft, true);

    expect(renewed.lastActivityAt).toBe(now + 10_000);
    expect(renewed.expiresAt).toBe(
      now + 10_000 + WORKFLOW_DRAFT_TTL_MS,
    );
  });

  it("renews inactivity from interactions without rewriting draft data", async () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    const { database, repository } = createRepository();
    await repository.save(createDraft("active", now));

    vi.spyOn(Date, "now").mockReturnValue(now + 10_000);
    await expect(repository.touch("active")).resolves.toBe(
      now + 10_000 + WORKFLOW_DRAFT_TTL_MS,
    );
    expect(await database.drafts.get("active")).toMatchObject({
      lastActivityAt: now + 10_000,
      expiresAt: now + 10_000 + WORKFLOW_DRAFT_TTL_MS,
    });
  });

  it("deletes only the selected draft and its source files", async () => {
    const { database, repository } = createRepository();
    await repository.save(createDraft("first"));
    await repository.save(createDraft("second"));

    await expect(repository.delete("first")).resolves.toBe(true);

    await expect(repository.list()).resolves.toMatchObject([
      { id: "second" },
    ]);
    expect(await database.files.count()).toBe(1);
    await expect(repository.delete("first")).resolves.toBe(false);
  });

  it("deletes ended drafts and their source files", async () => {
    const { database, repository } = createRepository();
    const draft = createDraft("ended");
    await repository.save({ ...draft, isEnded: true });

    await repository.deleteEnded();

    await expect(repository.get("ended")).resolves.toBeUndefined();
    await expect(repository.list()).resolves.toEqual([]);
    expect(await database.drafts.count()).toBe(0);
    expect(await database.files.count()).toBe(0);
  });

  it("does not restore an ended draft", async () => {
    const { database, repository } = createRepository();
    await repository.save({ ...createDraft("ended"), isEnded: true });

    await expect(repository.get("ended")).resolves.toBeUndefined();
    expect(await database.drafts.count()).toBe(0);
    expect(await database.files.count()).toBe(0);
  });

  it("does not save drafts while draft persistence is disabled", async () => {
    const { database, repository } = createRepository();
    window.localStorage.setItem("photoslicer.workflow-drafts-enabled", "false");

    await expect(repository.save(createDraft("disabled"))).rejects.toThrow(
      "Workflow draft persistence is disabled",
    );
    expect(await database.drafts.count()).toBe(0);
    window.localStorage.removeItem("photoslicer.workflow-drafts-enabled");
  });

  it("removes existing drafts when draft persistence is disabled", async () => {
    await workflowDraftRepository.deleteAll();
    try {
      await workflowDraftRepository.save(createDraft("existing"));

      await setWorkflowDraftsEnabled(false);

      await expect(workflowDraftRepository.list()).resolves.toEqual([]);
      await expect(
        workflowDraftRepository.save(createDraft("new")),
      ).rejects.toThrow("Workflow draft persistence is disabled");
    } finally {
      window.localStorage.setItem("photoslicer.workflow-drafts-enabled", "true");
      await workflowDraftRepository.deleteAll();
    }
  });
});
