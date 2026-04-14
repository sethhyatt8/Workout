import type { WorkoutPlaylist } from "../types/workout";

export const starterPlaylists: WorkoutPlaylist[] = [
  {
    id: "full-body-basic",
    name: "Full Body Basic",
    exercises: [
      { name: "Jump Squats" },
      { name: "Push-Ups" },
      { name: "Mountain Climbers" },
      { name: "Alternating Lunges" },
      { name: "Plank Shoulder Taps" },
      { name: "High Knees" },
    ],
  },
  {
    id: "core-cardio-burn",
    name: "Core + Cardio Burn",
    exercises: [
      { name: "Bicycle Crunches" },
      { name: "Burpees" },
      { name: "Russian Twists" },
      { name: "Skater Hops" },
      { name: "Leg Raises" },
      { name: "Jumping Jacks" },
    ],
  },
  {
    id: "low-impact-strength",
    name: "Low Impact Strength",
    exercises: [
      { name: "Air Squats" },
      { name: "Incline Push-Ups" },
      { name: "Glute Bridges" },
      { name: "Dead Bug" },
      { name: "Reverse Lunges" },
      { name: "Bird Dog" },
    ],
  },
];
