import * as RadixSlider from '@radix-ui/react-slider';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (v: number) => string;
  disabled?: boolean;
}

export function Slider({ label, value, onChange, min, max, step = 1, formatValue, disabled }: SliderProps) {
  return (
    <div className="slider-wrapper">
      {label && (
        <div className="slider-header">
          <label className="form-label">{label}</label>
          <span className="slider-value mono">{formatValue ? formatValue(value) : value}</span>
        </div>
      )}
      <RadixSlider.Root
        className="slider-root"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      >
        <RadixSlider.Track className="slider-track">
          <RadixSlider.Range className="slider-range" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="slider-thumb" aria-label={label} />
      </RadixSlider.Root>
      <div className="slider-ticks">
        <span className="mono">{min}</span>
        <span className="mono">{max}</span>
      </div>
    </div>
  );
}
