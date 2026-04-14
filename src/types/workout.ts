export type WorkoutPhase = "ready" | "work" | "rest";

export type PhaseDurations = {
  ready: number;
  work: number;
  rest: number;
};

export type WorkoutExercise = {
  name: string;
  demoAsset?: string;
};

export type WorkoutPlaylist = {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
};
