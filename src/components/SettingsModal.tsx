import { useEffect, useState } from "react";

type SettingsValues = {
  ready: number;
  work: number;
  rest: number;
  totalMinutes: number;
};

type SettingsModalProps = {
  isOpen: boolean;
  initialValues: SettingsValues;
  onClose: () => void;
  onApply: (values: SettingsValues) => void;
};

function parsePositiveInt(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function SettingsModal({
  isOpen,
  initialValues,
  onClose,
  onApply,
}: SettingsModalProps) {
  const [formValues, setFormValues] = useState({
    ready: String(initialValues.ready),
    work: String(initialValues.work),
    rest: String(initialValues.rest),
    totalMinutes: String(initialValues.totalMinutes),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormValues({
      ready: String(initialValues.ready),
      work: String(initialValues.work),
      rest: String(initialValues.rest),
      totalMinutes: String(initialValues.totalMinutes),
    });
    setError(null);
  }, [initialValues]);

  if (!isOpen) {
    return null;
  }

  const handleApply = () => {
    const ready = parsePositiveInt(formValues.ready);
    const work = parsePositiveInt(formValues.work);
    const rest = parsePositiveInt(formValues.rest);
    const totalMinutes = parsePositiveInt(formValues.totalMinutes);

    if (!ready || !work || !rest || !totalMinutes) {
      setError("All fields must be positive whole numbers.");
      return;
    }

    onApply({ ready, work, rest, totalMinutes });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Workout Settings</h2>
        <p>
          Adjust interval lengths and total workout time. Total minutes apply to
          work and rest only; ready/warm-up time does not count toward the
          session budget.
        </p>

        <div className="modal-grid">
          <label htmlFor="ready-seconds">Ready (sec)</label>
          <input
            id="ready-seconds"
            type="number"
            min={1}
            value={formValues.ready}
            onChange={(event) =>
              setFormValues((previous) => ({
                ...previous,
                ready: event.target.value,
              }))
            }
          />

          <label htmlFor="work-seconds">Work (sec)</label>
          <input
            id="work-seconds"
            type="number"
            min={1}
            value={formValues.work}
            onChange={(event) =>
              setFormValues((previous) => ({
                ...previous,
                work: event.target.value,
              }))
            }
          />

          <label htmlFor="rest-seconds">Rest (sec)</label>
          <input
            id="rest-seconds"
            type="number"
            min={1}
            value={formValues.rest}
            onChange={(event) =>
              setFormValues((previous) => ({
                ...previous,
                rest: event.target.value,
              }))
            }
          />

          <label htmlFor="total-minutes">Total (min)</label>
          <input
            id="total-minutes"
            type="number"
            min={1}
            value={formValues.totalMinutes}
            onChange={(event) =>
              setFormValues((previous) => ({
                ...previous,
                totalMinutes: event.target.value,
              }))
            }
          />
        </div>

        {error ? <p className="modal-error">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="secondary-btn">
            Cancel
          </button>
          <button type="button" onClick={handleApply} className="primary-btn">
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export type { SettingsValues };
export default SettingsModal;
