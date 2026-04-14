import { useEffect, useMemo, useState } from "react";
import "./App.css";
import SettingsModal, { type SettingsValues } from "./components/SettingsModal";
import { starterPlaylists } from "./data/playlists";
import type { PhaseDurations, WorkoutPhase } from "./types/workout";

const DEFAULT_DURATIONS: PhaseDurations = {
  work: 45,
  rest: 15,
};

const DEFAULT_TOTAL_MINUTES = 30;

/** Shown once after Start when the session has not begun (elapsed === 0). Not repeated each round. */
const PRE_START_COUNTDOWN_SECONDS = 5;

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  work: "Work",
  rest: "Rest",
};

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(totalSeconds, 0);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPhaseSnapshot(
  elapsedSeconds: number,
  durations: PhaseDurations,
): { phase: WorkoutPhase; remaining: number } {
  const cycleLength = durations.work + durations.rest;
  const positionInCycle = elapsedSeconds % cycleLength;

  if (positionInCycle < durations.work) {
    return { phase: "work", remaining: durations.work - positionInCycle };
  }

  return { phase: "rest", remaining: cycleLength - positionInCycle };
}

function App() {
  const [phaseDurations, setPhaseDurations] =
    useState<PhaseDurations>(DEFAULT_DURATIONS);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(
    DEFAULT_TOTAL_MINUTES * 60,
  );

  const [elapsedSessionSeconds, setElapsedSessionSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  /** 5…1 while counting down to first work interval; null when not in pre-start. */
  const [preStartSecondsRemaining, setPreStartSecondsRemaining] = useState<
    number | null
  >(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(
    starterPlaylists[0]?.id ?? "",
  );

  const selectedPlaylist = useMemo(
    () =>
      starterPlaylists.find((playlist) => playlist.id === selectedPlaylistId) ??
      starterPlaylists[0],
    [selectedPlaylistId],
  );

  const workIntervalsCompleted = useMemo(() => {
    if (elapsedSessionSeconds === 0) {
      return 0;
    }

    let count = 0;
    let phase: WorkoutPhase = "work";
    let secondsCursor = 0;

    while (secondsCursor < elapsedSessionSeconds) {
      const duration = phaseDurations[phase];
      const phaseEnd = secondsCursor + duration;

      if (phase === "work" && phaseEnd <= elapsedSessionSeconds) {
        count += 1;
      }

      secondsCursor = phaseEnd;
      phase = phase === "work" ? "rest" : "work";
    }

    return count;
  }, [elapsedSessionSeconds, phaseDurations]);

  const currentExercise = selectedPlaylist?.exercises.length
    ? selectedPlaylist.exercises[
        workIntervalsCompleted % selectedPlaylist.exercises.length
      ]
    : undefined;

  const nextExercise = selectedPlaylist?.exercises.length
    ? selectedPlaylist.exercises[
        (workIntervalsCompleted + 1) % selectedPlaylist.exercises.length
      ]
    : undefined;

  const progressPercentage = useMemo(() => {
    if (totalSessionSeconds <= 0) {
      return 0;
    }

    return Math.min((elapsedSessionSeconds / totalSessionSeconds) * 100, 100);
  }, [elapsedSessionSeconds, totalSessionSeconds]);

  const phaseSnapshot = useMemo(() => {
    if (elapsedSessionSeconds >= totalSessionSeconds) {
      return { phase: "rest" as WorkoutPhase, remaining: 0 };
    }
    return getPhaseSnapshot(elapsedSessionSeconds, phaseDurations);
  }, [elapsedSessionSeconds, phaseDurations, totalSessionSeconds]);

  const currentPhase = phaseSnapshot.phase;
  const phaseSecondsRemaining = phaseSnapshot.remaining;

  const isPreStart = preStartSecondsRemaining !== null;

  useEffect(() => {
    if (!isPreStart) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setPreStartSecondsRemaining((previous) => {
        if (previous === null) {
          return null;
        }
        if (previous === 1) {
          setIsRunning(true);
          return null;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPreStart]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSessionSeconds((previousElapsed) => {
        if (previousElapsed >= totalSessionSeconds) {
          setIsRunning(false);
          return totalSessionSeconds;
        }

        return previousElapsed + 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, totalSessionSeconds]);

  useEffect(() => {
    if (elapsedSessionSeconds >= totalSessionSeconds) {
      setIsRunning(false);
    }
  }, [elapsedSessionSeconds, totalSessionSeconds]);

  const handleReset = () => {
    setIsRunning(false);
    setPreStartSecondsRemaining(null);
    setElapsedSessionSeconds(0);
  };

  const handleToggleRunning = () => {
    if (preStartSecondsRemaining !== null) {
      setPreStartSecondsRemaining(null);
      return;
    }

    if (elapsedSessionSeconds >= totalSessionSeconds) {
      handleReset();
      setPreStartSecondsRemaining(PRE_START_COUNTDOWN_SECONDS);
      return;
    }

    if (!isRunning && elapsedSessionSeconds === 0) {
      setPreStartSecondsRemaining(PRE_START_COUNTDOWN_SECONDS);
      return;
    }

    setIsRunning((previous) => !previous);
  };

  const handleApplySettings = (values: SettingsValues) => {
    const updatedDurations: PhaseDurations = {
      work: values.work,
      rest: values.rest,
    };

    setPhaseDurations(updatedDurations);
    setTotalSessionSeconds(values.totalMinutes * 60);
    setIsRunning(false);
    setPreStartSecondsRemaining(null);
    setElapsedSessionSeconds(0);
  };

  const settingsInitialValues: SettingsValues = {
    work: phaseDurations.work,
    rest: phaseDurations.rest,
    totalMinutes: Math.floor(totalSessionSeconds / 60),
  };

  const shellPhaseClass = isPreStart ? "prep" : currentPhase;
  const phaseChipLabel = isPreStart
    ? "Starting"
    : PHASE_LABELS[currentPhase];

  return (
    <main className={`app app-${shellPhaseClass}`}>
      <section className="timer-card">
        <header className="top-row">
          <h1>HIIT Timer</h1>
          <span className={`phase-chip phase-${shellPhaseClass}`}>
            {phaseChipLabel}
          </span>
        </header>

        <div
          className={`timer-value timer-${isPreStart ? "prep" : currentPhase}`}
        >
          {isPreStart && preStartSecondsRemaining !== null
            ? formatSeconds(preStartSecondsRemaining)
            : formatSeconds(phaseSecondsRemaining)}
        </div>

        <div className="progress-section">
          <div className="progress-meta">
            <span>{formatSeconds(elapsedSessionSeconds)} elapsed</span>
            <span>{formatSeconds(totalSessionSeconds)} total</span>
          </div>
          <div className="progress-track" aria-label="Session progress">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="exercise-section">
          <p className="exercise-title">Playlist</p>
          <select
            value={selectedPlaylistId}
            onChange={(event) => setSelectedPlaylistId(event.target.value)}
          >
            {starterPlaylists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))}
          </select>

          <p>
            <strong>Current:</strong>{" "}
            <span className="current-exercise-name">
              {currentExercise?.name ?? "No exercise"}
            </span>
          </p>
          <p>
            <strong>Next:</strong> {nextExercise?.name ?? "No exercise"}
          </p>
        </div>

        <div className="controls">
          <button
            className="primary-btn"
            onClick={handleToggleRunning}
          >
            {isPreStart
              ? "Cancel"
              : isRunning
                ? "Pause"
                : "Start"}
          </button>
          <button className="secondary-btn" onClick={handleReset}>
            Reset
          </button>
          <button className="secondary-btn" onClick={() => setIsSettingsOpen(true)}>
            Settings
          </button>
        </div>
      </section>

      <SettingsModal
        isOpen={isSettingsOpen}
        initialValues={settingsInitialValues}
        onClose={() => setIsSettingsOpen(false)}
        onApply={handleApplySettings}
      />
    </main>
  );
}

export default App;
