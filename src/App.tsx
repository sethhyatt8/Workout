import { useEffect, useMemo, useState } from "react";
import "./App.css";
import SettingsModal, { type SettingsValues } from "./components/SettingsModal";
import { starterPlaylists } from "./data/playlists";
import type { PhaseDurations, WorkoutPhase } from "./types/workout";

const DEFAULT_DURATIONS: PhaseDurations = {
  ready: 10,
  work: 45,
  rest: 15,
};

const DEFAULT_TOTAL_MINUTES = 30;

const PHASE_LABELS: Record<WorkoutPhase, string> = {
  ready: "Get Ready",
  work: "Work",
  rest: "Rest",
};

function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(totalSeconds, 0);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getPhaseSnapshot(elapsedSeconds: number, durations: PhaseDurations): {
  phase: WorkoutPhase;
  remaining: number;
} {
  const cycleLength = durations.ready + durations.work + durations.rest;
  const positionInCycle = elapsedSeconds % cycleLength;

  if (positionInCycle < durations.ready) {
    return { phase: "ready", remaining: durations.ready - positionInCycle };
  }

  if (positionInCycle < durations.ready + durations.work) {
    return {
      phase: "work",
      remaining: durations.ready + durations.work - positionInCycle,
    };
  }

  return { phase: "rest", remaining: cycleLength - positionInCycle };
}

type SessionClock = {
  /** Every second while running; drives phase sequence (includes ready). */
  wallElapsedSeconds: number;
  /** Only work + rest seconds; compared to total session budget. */
  countedActiveSeconds: number;
};

function App() {
  const [phaseDurations, setPhaseDurations] =
    useState<PhaseDurations>(DEFAULT_DURATIONS);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(
    DEFAULT_TOTAL_MINUTES * 60,
  );

  const [sessionClock, setSessionClock] = useState<SessionClock>({
    wallElapsedSeconds: 0,
    countedActiveSeconds: 0,
  });
  const { wallElapsedSeconds, countedActiveSeconds } = sessionClock;
  const [isRunning, setIsRunning] = useState(false);
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
    if (wallElapsedSeconds === 0) {
      return 0;
    }

    let count = 0;
    let phase: WorkoutPhase = "ready";
    let secondsCursor = 0;

    while (secondsCursor < wallElapsedSeconds) {
      const duration = phaseDurations[phase];
      const phaseEnd = secondsCursor + duration;

      if (phase === "work" && phaseEnd <= wallElapsedSeconds) {
        count += 1;
      }

      secondsCursor = phaseEnd;
      phase = phase === "ready" ? "work" : phase === "work" ? "rest" : "ready";
    }

    return count;
  }, [wallElapsedSeconds, phaseDurations]);

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

    return Math.min((countedActiveSeconds / totalSessionSeconds) * 100, 100);
  }, [countedActiveSeconds, totalSessionSeconds]);

  const phaseSnapshot = useMemo(() => {
    if (countedActiveSeconds >= totalSessionSeconds) {
      return { phase: "rest" as WorkoutPhase, remaining: 0 };
    }
    return getPhaseSnapshot(wallElapsedSeconds, phaseDurations);
  }, [wallElapsedSeconds, countedActiveSeconds, phaseDurations, totalSessionSeconds]);

  const currentPhase = phaseSnapshot.phase;
  const phaseSecondsRemaining = phaseSnapshot.remaining;

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSessionClock((previous) => {
        if (previous.countedActiveSeconds >= totalSessionSeconds) {
          return previous;
        }

        const wall = previous.wallElapsedSeconds + 1;
        const snap = getPhaseSnapshot(wall, phaseDurations);
        const incrementCounted =
          snap.phase === "work" || snap.phase === "rest" ? 1 : 0;
        const counted = Math.min(
          previous.countedActiveSeconds + incrementCounted,
          totalSessionSeconds,
        );

        return {
          wallElapsedSeconds: wall,
          countedActiveSeconds: counted,
        };
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning, totalSessionSeconds, phaseDurations]);

  useEffect(() => {
    if (countedActiveSeconds >= totalSessionSeconds) {
      setIsRunning(false);
    }
  }, [countedActiveSeconds, totalSessionSeconds]);

  const handleReset = () => {
    setIsRunning(false);
    setSessionClock({ wallElapsedSeconds: 0, countedActiveSeconds: 0 });
  };

  const handleToggleRunning = () => {
    if (countedActiveSeconds >= totalSessionSeconds) {
      handleReset();
      setIsRunning(true);
      return;
    }

    setIsRunning((previous) => !previous);
  };

  const handleApplySettings = (values: SettingsValues) => {
    const updatedDurations: PhaseDurations = {
      ready: values.ready,
      work: values.work,
      rest: values.rest,
    };

    setPhaseDurations(updatedDurations);
    setTotalSessionSeconds(values.totalMinutes * 60);
    setIsRunning(false);
    setSessionClock({ wallElapsedSeconds: 0, countedActiveSeconds: 0 });
  };

  const settingsInitialValues: SettingsValues = {
    ready: phaseDurations.ready,
    work: phaseDurations.work,
    rest: phaseDurations.rest,
    totalMinutes: Math.floor(totalSessionSeconds / 60),
  };

  return (
    <main className={`app app-${currentPhase}`}>
      <section className="timer-card">
        <header className="top-row">
          <h1>HIIT Timer</h1>
          <span className={`phase-chip phase-${currentPhase}`}>
            {PHASE_LABELS[currentPhase]}
          </span>
        </header>

        <div className={`timer-value timer-${currentPhase}`}>
          {formatSeconds(phaseSecondsRemaining)}
        </div>

        <div className="progress-section">
          <div className="progress-meta">
            <span>
              {formatSeconds(countedActiveSeconds)} elapsed
              <span className="progress-hint"> (work + rest)</span>
            </span>
            <span>{formatSeconds(totalSessionSeconds)} total</span>
          </div>
          <div
            className="progress-track"
            aria-label="Session progress; warm-up time is excluded from elapsed and total budget"
          >
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
            {isRunning ? "Pause" : "Start"}
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
