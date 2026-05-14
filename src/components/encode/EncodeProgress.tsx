import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '../../store/session';
import { formatBytes } from '../../lib/utils';

const STEPS = ['Compress', 'Encrypt', 'Embed', 'Verify', 'Complete'];

export function EncodeProgress() {
  const { jobStatus, jobStep, jobProgress, encodeResult, jobError } = useSessionStore();

  if (jobStatus === 'idle') return null;

  const currentStepIdx = STEPS.findIndex((s) => jobStep.includes(s));

  return (
    <AnimatePresence>
      <motion.div
        className="encode-progress card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >

        <div className="step-indicators">
          {STEPS.map((step, i) => {
            const done = jobStatus === 'done' || i < currentStepIdx;
            const active = i === currentStepIdx && jobStatus === 'running';
            return (
              <div key={step} className={`step-item ${done ? 'step-done' : ''} ${active ? 'step-active' : ''}`}>
                <div className="step-dot">
                  {done ? '✓' : active ? <span className="step-pulse" /> : null}
                </div>
                <span className="step-label">{step}</span>
                {i < STEPS.length - 1 && <div className={`step-line ${done ? 'step-line-done' : ''}`} />}
              </div>
            );
          })}
        </div>


        <div className="encode-progress-bar-bg">
          <motion.div
            className="encode-progress-bar-fill"
            animate={{ width: `${jobProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>


        {jobStatus === 'done' && encodeResult && (
          <motion.div
            className="encode-result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="encode-result-row">
              <span style={{ color: 'var(--accent-success)' }}>✓ Encoded successfully</span>
              <span className="mono" style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {formatBytes(encodeResult.payload_bytes)} / {formatBytes(encodeResult.capacity_bytes)} used
                ({encodeResult.capacity_used_pct.toFixed(1)}%)
              </span>
            </div>
            <p className="encode-output-path mono">{encodeResult.output_path}</p>
          </motion.div>
        )}


        {jobStatus === 'error' && jobError && (
          <motion.div className="encode-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span style={{ color: 'var(--accent-danger)' }}>✕ {jobError}</span>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
