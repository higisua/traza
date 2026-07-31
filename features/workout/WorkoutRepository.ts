import {
  trainingStorage,
  type WorkoutSession,
} from "@/lib/storage/trainingStorage";

export const WorkoutRepository = {
  getActiveSession(): WorkoutSession | null {
    return trainingStorage.getActiveSession();
  },

  getSessionById(id: string): WorkoutSession | null {
    return trainingStorage.getSessionById(id);
  },

  getSessions(): WorkoutSession[] {
    return trainingStorage.getSessions();
  },

  saveSession(session: WorkoutSession): WorkoutSession {
    return trainingStorage.saveSession(session);
  },

  createSession(
    input: Omit<WorkoutSession, "id" | "createdAt" | "updatedAt">,
  ): WorkoutSession {
    return trainingStorage.createSession(input);
  },
};
