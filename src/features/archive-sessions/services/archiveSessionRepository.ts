import Dexie, { type Table } from "dexie";
import type { ImageMetadata, Region, RegionId } from "../../../types/imageOperations";

export const ARCHIVE_SESSION_SCHEMA_VERSION = 1;

export interface ArchiveSessionImage {
  fileName: string;
  fileData: ArrayBuffer;
  fileType: string;
  regions: Region[];
  metadata: Array<[RegionId, ImageMetadata]>;
}

export interface SavedArchiveSession {
  id: string;
  schemaVersion: number;
  createdAt: number;
  filename: string;
  zipData: ArrayBuffer;
  zipSize: number;
  cropCount: number;
  images: ArchiveSessionImage[];
}

export type ArchiveSessionSummary = Omit<
  SavedArchiveSession,
  "zipData" | "images"
> & { imageCount: number };

export type NewArchiveSession = Omit<
  SavedArchiveSession,
  "id" | "schemaVersion"
>;

export class ArchiveSessionDatabase extends Dexie {
  sessions!: Table<SavedArchiveSession, string>;

  constructor(name = "photoslicer-saved-archives") {
    super(name);
    this.version(1).stores({
      sessions: "id, createdAt",
    });
  }
}

export class ArchiveSessionRepository {
  private readonly database: ArchiveSessionDatabase;

  constructor(database: ArchiveSessionDatabase) {
    this.database = database;
  }

  async save(session: NewArchiveSession): Promise<ArchiveSessionSummary> {
    const saved: SavedArchiveSession = {
      ...session,
      id: crypto.randomUUID(),
      schemaVersion: ARCHIVE_SESSION_SCHEMA_VERSION,
    };

    await this.database.transaction("rw", this.database.sessions, async () => {
      await this.database.sessions.add(saved);
    });

    return this.toSummary(saved);
  }

  async list(): Promise<ArchiveSessionSummary[]> {
    const sessions = await this.database.sessions.orderBy("createdAt").reverse().toArray();
    return sessions.map((session) => {
      this.assertSupportedVersion(session);
      return this.toSummary(session);
    });
  }

  async get(id: string): Promise<SavedArchiveSession | undefined> {
    const session = await this.database.sessions.get(id);
    if (session) this.assertSupportedVersion(session);
    return session;
  }

  async delete(id: string): Promise<void> {
    await this.database.transaction("rw", this.database.sessions, async () => {
      await this.database.sessions.delete(id);
    });
  }

  private assertSupportedVersion(session: SavedArchiveSession): void {
    if (session.schemaVersion !== ARCHIVE_SESSION_SCHEMA_VERSION) {
      throw new Error(
        `Unsupported archive session schema version: ${session.schemaVersion}`,
      );
    }
  }

  private toSummary(session: SavedArchiveSession): ArchiveSessionSummary {
    return {
      id: session.id,
      schemaVersion: session.schemaVersion,
      createdAt: session.createdAt,
      filename: session.filename,
      zipSize: session.zipSize,
      cropCount: session.cropCount,
      imageCount: session.images.length,
    };
  }
}

const archiveSessionDatabase = new ArchiveSessionDatabase();

export const archiveSessionRepository = new ArchiveSessionRepository(
  archiveSessionDatabase,
);
