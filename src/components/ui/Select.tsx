import * as RadixSelect from '@radix-ui/react-select';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export function Select({ value, onValueChange, options, placeholder = 'Select…', label, disabled }: SelectProps) {
  const selected = options.find((o) => o.value === value);
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      {label && <label className="form-label">{label}</label>}
      <RadixSelect.Trigger className="select-trigger" aria-label={label}>
        <RadixSelect.Value placeholder={placeholder}>
          {selected?.label ?? placeholder}
        </RadixSelect.Value>
        <RadixSelect.Icon className="select-icon">
          <ChevronDown />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content className="select-content" position="popper" sideOffset={4}>
          <RadixSelect.Viewport className="select-viewport">
            {options.map((opt) => (
              <RadixSelect.Item key={opt.value} value={opt.value} className="select-item">
                <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                {opt.description && <span className="select-item-desc">{opt.description}</span>}
                <RadixSelect.ItemIndicator className="select-item-check">✓</RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
