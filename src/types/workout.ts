export type WorkoutPhase = "work" | "rest";

export type PhaseDurations = {
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
