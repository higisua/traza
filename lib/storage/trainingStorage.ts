import { createId, readJson, storageKey, writeJson } from "./localStorage";

export type WorkoutSessionStatus = "completed" | "partial" | "cancelled" | "in_progress";

export type WorkoutSet = {
  id: string;
  setNumber: number;
  load: number | null;
  repetitions: number | null;
  durationSeconds: number | null;
  /** RIR for this set when tracked; optional for older sessions. */
  rir?: number | null;
  createdAt: string;
};

export type WorkoutSessionExercise = {
  id: string;
  exerciseId: string;
  plannedOrder: number;
  performedOrder: number;
  status: "completed" | "partial" | "skipped" | "pending";
  lastSetRir: number | null;
  notes: string | null;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  templateId: string | null;
  templateVersionId: string | null;
  sessionDate: string;
  startTime: string | null;
  endTime: string | null;
  durationMinutes: number | null;
  status: WorkoutSessionStatus;
  exercises: WorkoutSessionExercise[];
  createdAt: string;
  updatedAt: string;
};

export type WorkoutTemplate = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  estimatedDurationMinutes: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

const SESSIONS_KEY = storageKey("workout_sessions");
const TEMPLATES_KEY = storageKey("workout_templates");

function readSessions(): WorkoutSession[] {
  return readJson<WorkoutSession[]>(SESSIONS_KEY, []);
}

function writeSessions(sessions: WorkoutSession[]): void {
  writeJson(SESSIONS_KEY, sessions);
}

function readTemplates(): WorkoutTemplate[] {
  return readJson<WorkoutTemplate[]>(TEMPLATES_KEY, []);
}

function writeTemplates(templates: WorkoutTemplate[]): void {
  writeJson(TEMPLATES_KEY, templates);
}

export const trainingStorage = {
  getSessions(): WorkoutSession[] {
    return readSessions().sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));
  },

  getSessionById(id: string): WorkoutSession | null {
    return readSessions().find((session) => session.id === id) ?? null;
  },

  getActiveSession(): WorkoutSession | null {
    return readSessions().find((session) => session.status === "in_progress") ?? null;
  },

  saveSession(session: WorkoutSession): WorkoutSession {
    const sessions = readSessions();
    const index = sessions.findIndex((item) => item.id === session.id);
    const next = { ...session, updatedAt: new Date().toISOString() };

    if (index >= 0) {
      sessions[index] = next;
    } else {
      sessions.push(next);
    }

    writeSessions(sessions);
    return next;
  },

  createSession(input: Omit<WorkoutSession, "id" | "createdAt" | "updatedAt">): WorkoutSession {
    const now = new Date().toISOString();
    const created: WorkoutSession = {
      ...input,
      id: createId(),
      createdAt: now,
      updatedAt: now,
    };
    writeSessions([...readSessions(), created]);
    return created;
  },

  removeSession(id: string): void {
    writeSessions(readSessions().filter((session) => session.id !== id));
  },

  getTemplates(): WorkoutTemplate[] {
    return readTemplates().filter((template) => !template.isArchived);
  },

  saveTemplates(templates: WorkoutTemplate[]): void {
    writeTemplates(templates);
  },

  clearSessions(): void {
    writeSessions([]);
  },
};
