/** Persists resumable workflow drafts and their source files in IndexedDB. */
import Dexie, { type Table } from "dexie";
import type { ImageMetadata, Region, RegionId } from "../types/imageOperations";

export const WORKFLOW_STEPS = [
  "upload",
  "regions",
  "metadata",
  "export",
] as const;

export type WorkflowStep = (typeof WORKFLOW_STEPS)[number];

export interface WorkflowDraftImage {
  fileId: string;
  file: File;
  imageId: string;
  regions: Region[];
}

interface StoredWorkflowDraftImage {
  fileId: string;
  fileName: string;
  imageId: string;
  regions: Region[];
}

interface StoredWorkflowDraft extends Omit<WorkflowDraft, "images"> {
  images: StoredWorkflowDraftImage[];
}

interface WorkflowDraftFile {
  id: string;
  file: File;
}

export interface WorkflowDraft {
  id: string;
  version: 1;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  updatedAt: number;
  step: WorkflowStep;
  availableThrough: WorkflowStep;
  images: WorkflowDraftImage[];
  metadata: Array<Array<[RegionId, ImageMetadata]>>;
  exportedZip: Blob | null;
  isEnded: boolean;
}

export interface WorkflowDraftSummary {
  id: string;
  createdAt: number;
  lastActivityAt: number;
  expiresAt: number;
  step: WorkflowStep;
  availableThrough: WorkflowStep;
  imageCount: number;
  fileNames: string[];
}

const WORKFLOW_DRAFT_CHANGED_EVENT = "photoslicer:workflow-draft-changed";
const WORKFLOW_DRAFT_SETTINGS_CHANGED_EVENT =
  "photoslicer:workflow-draft-settings-changed";
const WORKFLOW_DRAFTS_ENABLED_KEY = "photoslicer.workflow-drafts-enabled";
export const WORKFLOW_DRAFT_TTL_MS = 60 * 60 * 1000;

export function areWorkflowDraftsEnabled(): boolean {
  return window.localStorage.getItem(WORKFLOW_DRAFTS_ENABLED_KEY) !== "false";
}

export async function setWorkflowDraftsEnabled(enabled: boolean): Promise<void> {
  window.localStorage.setItem(WORKFLOW_DRAFTS_ENABLED_KEY, String(enabled));
  window.dispatchEvent(new Event(WORKFLOW_DRAFT_SETTINGS_CHANGED_EVENT));
  if (!enabled) {
    await workflowDraftRepository.deleteAll();
  }
}

export class WorkflowDraftDatabase extends Dexie {
  drafts!: Table<StoredWorkflowDraft, WorkflowDraft["id"]>;
  files!: Table<WorkflowDraftFile, string>;

  constructor(name = "photoslicer-workflow-draft") {
    super(name);
    this.version(1).stores({
      drafts: "id, updatedAt",
    });
    this.version(2)
      .stores({
        drafts: "id, updatedAt",
        files: "id",
      })
      .upgrade(async (transaction) => {
        const legacyDrafts = (await transaction
          .table("drafts")
          .toArray()) as Array<{
          id: string;
          images: Array<{
            file: File;
            imageId: string;
            regions: Region[];
          }>;
        }>;

        for (const draft of legacyDrafts) {
          const images: StoredWorkflowDraftImage[] = [];
          for (const image of draft.images) {
            const fileId = crypto.randomUUID();
            await transaction.table("files").put({
              id: fileId,
              file: image.file,
            });
            images.push({
              fileId,
              fileName: image.file.name,
              imageId: image.imageId,
              regions: image.regions,
            });
          }
          await transaction.table("drafts").put({
            ...draft,
            images,
          });
        }
      });
    this.version(3)
      .stores({
        drafts: "id, updatedAt",
        files: "id",
      })
      .upgrade(async (transaction) => {
        const drafts = (await transaction
          .table("drafts")
          .toArray()) as Array<StoredWorkflowDraft>;
        for (const draft of drafts) {
          const createdAt = draft.createdAt ?? draft.updatedAt;
          await transaction.table("drafts").put({
            ...draft,
            createdAt,
            lastActivityAt: draft.updatedAt ?? createdAt,
            expiresAt: (draft.updatedAt ?? createdAt) + WORKFLOW_DRAFT_TTL_MS,
          });
        }
      });
    this.version(4)
      .stores({
        drafts: "id, updatedAt, expiresAt",
        files: "id",
      })
      .upgrade(async (transaction) => {
        const drafts = (await transaction
          .table("drafts")
          .toArray()) as Array<StoredWorkflowDraft>;
        for (const draft of drafts) {
          const lastActivityAt =
            draft.lastActivityAt ?? draft.updatedAt ?? draft.createdAt;
          await transaction.table("drafts").put({
            ...draft,
            lastActivityAt,
            expiresAt: lastActivityAt + WORKFLOW_DRAFT_TTL_MS,
          });
        }
      });
    this.version(5)
      .stores({
        drafts: "id, updatedAt, expiresAt",
        files: "id",
      })
      .upgrade(async (transaction) => {
        const drafts = (await transaction
          .table("drafts")
          .toArray()) as Array<StoredWorkflowDraft>;
        for (const draft of drafts) {
          const images = await Promise.all(
            draft.images.map(async (image) => {
              const storedFile = await transaction
                .table("files")
                .get(image.fileId);
              return {
                ...image,
                fileName: image.fileName ?? storedFile?.file.name ?? image.fileId,
              };
            }),
          );
          await transaction.table("drafts").put({
            ...draft,
            images,
          });
        }
      });
    this.version(6)
      .stores({
        drafts: "id, updatedAt, expiresAt",
        files: "id",
      })
      .upgrade(async (transaction) => {
        const drafts = (await transaction
          .table("drafts")
          .toArray()) as Array<StoredWorkflowDraft>;
        for (const draft of drafts) {
          await transaction.table("drafts").put({
            ...draft,
            isEnded: draft.isEnded ?? false,
          });
        }
      });
  }
}

export class WorkflowDraftRepository {
  private readonly database: WorkflowDraftDatabase;

  constructor(database: WorkflowDraftDatabase) {
    this.database = database;
  }

  async get(id: string): Promise<WorkflowDraft | undefined> {
    const storedDraft = await this.database.drafts.get(id);
    if (!storedDraft) return undefined;

    if (storedDraft.isEnded) {
      await this.delete(id);
      return undefined;
    }

    if (storedDraft.expiresAt <= Date.now()) {
      await this.expire(id, storedDraft.expiresAt);
      return undefined;
    }

    return this.hydrate(storedDraft);
  }

  async getAvailableThrough(id: string): Promise<WorkflowStep | undefined> {
    const storedDraft = await this.database.drafts.get(id);
    if (!storedDraft) return undefined;
    if (storedDraft.expiresAt <= Date.now()) {
      await this.expire(id, storedDraft.expiresAt);
      return undefined;
    }
    return storedDraft.availableThrough;
  }

  async list(): Promise<WorkflowDraftSummary[]> {
    const now = Date.now();
    const drafts = await this.database.drafts.toArray();
    const removableDrafts = drafts.filter(
      (draft) => draft.isEnded || draft.expiresAt <= now,
    );
    if (removableDrafts.length > 0) {
      await this.database.transaction(
        "rw",
        this.database.drafts,
        this.database.files,
        async () => {
          await this.database.drafts.bulkDelete(
            removableDrafts.map((draft) => draft.id),
          );
          await this.database.files.bulkDelete(
            removableDrafts.flatMap((draft) =>
              draft.images.map((image) => image.fileId),
            ),
          );
        },
      );
      this.notifyChanged();
    }

    const activeDrafts = drafts
      .filter((draft) => !draft.isEnded && draft.expiresAt > now)
      .sort((left, right) => right.lastActivityAt - left.lastActivityAt);
    return activeDrafts.map((draft) => ({
      id: draft.id,
      createdAt: draft.createdAt,
      lastActivityAt: draft.lastActivityAt,
      expiresAt: draft.expiresAt,
      step: draft.step,
      availableThrough: draft.availableThrough,
      imageCount: draft.images.length,
      fileNames: draft.images.map((image) => image.fileName),
    }));
  }

  async save(
    draft: WorkflowDraft,
    touchActivity = true,
  ): Promise<Pick<WorkflowDraft, "lastActivityAt" | "expiresAt">> {
    if (!areWorkflowDraftsEnabled()) {
      throw new Error("Workflow draft persistence is disabled");
    }
    if (!touchActivity && draft.expiresAt <= Date.now()) {
      await this.expire(draft.id, draft.expiresAt);
      throw new Error("Workflow draft has expired");
    }

    let savedDraft!: StoredWorkflowDraft;
    await this.database.transaction(
      "rw",
      this.database.drafts,
      this.database.files,
      async () => {
        if (!areWorkflowDraftsEnabled()) {
          throw new Error("Workflow draft persistence is disabled");
        }
        const previousDraft = await this.database.drafts.get(draft.id);
        const now = Date.now();
        const lastActivityAt = touchActivity
          ? now
          : previousDraft?.lastActivityAt ?? draft.lastActivityAt;
        const expiresAt = touchActivity
          ? now + WORKFLOW_DRAFT_TTL_MS
          : previousDraft?.expiresAt ?? draft.expiresAt;
        if (expiresAt <= now) {
          throw new Error("Workflow draft has expired");
        }

        const existingFileIds = new Set(
          await this.database.files.toCollection().primaryKeys(),
        );
        const newFiles = draft.images
          .filter((image) => !existingFileIds.has(image.fileId))
          .map((image) => ({
            id: image.fileId,
            file: image.file,
          }));
        if (newFiles.length > 0) {
          await this.database.files.bulkPut(newFiles);
        }

        const imageFileIds = new Set(draft.images.map((image) => image.fileId));
        const removedFileIds =
          previousDraft?.images
            .map((image) => image.fileId)
            .filter((fileId) => !imageFileIds.has(fileId)) ?? [];

        savedDraft = {
          ...draft,
          lastActivityAt,
          expiresAt,
          updatedAt: now,
          images: draft.images.map((image) => ({
            fileId: image.fileId,
            fileName: image.file.name,
            imageId: image.imageId,
            regions: image.regions,
          })),
        };
        await this.database.drafts.put(savedDraft);
        if (removedFileIds.length > 0) {
          await this.database.files.bulkDelete(removedFileIds);
        }
      },
    );
    this.notifyChanged();
    return {
      lastActivityAt: savedDraft.lastActivityAt,
      expiresAt: savedDraft.expiresAt,
    };
  }

  async expire(id: string, expiresAt: number): Promise<boolean> {
    if (expiresAt > Date.now()) return false;

    let expired = false;
    await this.database.transaction(
      "rw",
      this.database.drafts,
      this.database.files,
      async () => {
        const currentDraft = await this.database.drafts.get(id);
        if (
          !currentDraft ||
          currentDraft.expiresAt !== expiresAt ||
          currentDraft.expiresAt > Date.now()
        ) {
          return;
        }

        await this.database.drafts.delete(id);
        await this.database.files.bulkDelete(
          currentDraft.images.map((image) => image.fileId),
        );
        expired = true;
      },
    );
    if (expired) this.notifyChanged();
    return expired;
  }

  async touch(id: string): Promise<number | undefined> {
    let expiresAt: number | undefined;
    await this.database.transaction("rw", this.database.drafts, async () => {
      const currentDraft = await this.database.drafts.get(id);
      if (!currentDraft || currentDraft.expiresAt <= Date.now()) return;

      const lastActivityAt = Date.now();
      expiresAt = lastActivityAt + WORKFLOW_DRAFT_TTL_MS;
      await this.database.drafts.put({
        ...currentDraft,
        lastActivityAt,
        expiresAt,
        updatedAt: lastActivityAt,
      });
    });
    if (expiresAt !== undefined) this.notifyChanged();
    return expiresAt;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.database.transaction(
      "rw",
      this.database.drafts,
      this.database.files,
      async () => {
        const draft = await this.database.drafts.get(id);
        if (!draft) return;
        await this.database.drafts.delete(id);
        await this.database.files.bulkDelete(
          draft.images.map((image) => image.fileId),
        );
        deleted = true;
      },
    );
    if (deleted) this.notifyChanged();
    return deleted;
  }

  async deleteAll(): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.drafts,
      this.database.files,
      async () => {
        await this.database.drafts.clear();
        await this.database.files.clear();
      },
    );
    this.notifyChanged();
  }

  async deleteEnded(): Promise<void> {
    const endedDrafts = await this.database.drafts
      .filter((draft) => draft.isEnded)
      .toArray();
    if (endedDrafts.length === 0) return;

    await this.database.transaction(
      "rw",
      this.database.drafts,
      this.database.files,
      async () => {
        await this.database.drafts.bulkDelete(
          endedDrafts.map((draft) => draft.id),
        );
        await this.database.files.bulkDelete(
          endedDrafts.flatMap((draft) =>
            draft.images.map((image) => image.fileId),
          ),
        );
      },
    );
    this.notifyChanged();
  }

  private async hydrate(
    storedDraft: StoredWorkflowDraft,
  ): Promise<WorkflowDraft> {
    const images = await Promise.all(
      storedDraft.images.map(async (image) => {
        const file = await this.database.files.get(image.fileId);
        if (!file) {
          throw new Error(
            `Workflow draft source image is missing: ${image.fileId}`,
          );
        }
        return {
          fileId: image.fileId,
          imageId: image.imageId,
          regions: image.regions,
          file: file.file,
        };
      }),
    );

    return {
      ...storedDraft,
      images,
    };
  }

  private notifyChanged(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(WORKFLOW_DRAFT_CHANGED_EVENT));
    }
  }
}

export const workflowDraftRepository = new WorkflowDraftRepository(
  new WorkflowDraftDatabase(),
);

export function isWorkflowStep(value: string | null): value is WorkflowStep {
  return WORKFLOW_STEPS.some((step) => step === value);
}

export function workflowStepIndex(step: WorkflowStep): number {
  return WORKFLOW_STEPS.indexOf(step);
}

export function onWorkflowDraftChanged(listener: () => void): () => void {
  window.addEventListener(WORKFLOW_DRAFT_CHANGED_EVENT, listener);
  return () =>
    window.removeEventListener(WORKFLOW_DRAFT_CHANGED_EVENT, listener);
}

export function onWorkflowDraftSettingsChanged(
  listener: () => void,
): () => void {
  window.addEventListener(WORKFLOW_DRAFT_SETTINGS_CHANGED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(WORKFLOW_DRAFT_SETTINGS_CHANGED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
