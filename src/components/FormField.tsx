import type { ReactNode } from "react";
import { useI18n } from "../lib/i18n";

type FieldProps = {
  label: string;
  children: ReactNode;
  required?: boolean;
};

export function Field({ label, children, required }: FieldProps) {
  return (
    <label className="form-field">
      <span className="form-label">
        {label}
        {required && <span className="form-required"> *</span>}
      </span>
      {children}
    </label>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
};

export function InputField({ label, required, ...rest }: InputProps) {
  return (
    <Field label={label} required={required}>
      <input className="form-input" {...rest} />
    </Field>
  );
}

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  required?: boolean;
};

export function TextareaField({ label, required, ...rest }: TextareaProps) {
  return (
    <Field label={label} required={required}>
      <textarea className="form-input form-textarea" rows={3} {...rest} />
    </Field>
  );
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  children: ReactNode;
};

export function SelectField({ label, required, children, ...rest }: SelectProps) {
  return (
    <Field label={label} required={required}>
      <select className="form-input form-select" {...rest}>
        {children}
      </select>
    </Field>
  );
}

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function CheckboxField({ label, ...rest }: CheckboxProps) {
  return (
    <label className="form-checkbox-row">
      <input type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}

type FormActionsProps = {
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
  onDanger?: () => void;
  dangerLabel?: string;
};

export function FormActions({
  onCancel,
  submitLabel,
  loading,
  disabled,
  danger,
  onDanger,
  dangerLabel,
}: FormActionsProps) {
  const { t } = useI18n();
  return (
    <div className="form-actions">
      {danger && onDanger && (
        <button
          type="button"
          className="btn-danger"
          onClick={onDanger}
          disabled={loading}
        >
          {dangerLabel ?? t("delete")}
        </button>
      )}
      <div className="form-actions-right">
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={loading}>
          {t("cancel")}
        </button>
        <button type="submit" className="btn-primary" disabled={loading || disabled}>
          {loading ? t("saving") : (submitLabel ?? t("save"))}
        </button>
      </div>
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="form-grid">{children}</div>;
}

export function FormSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="form-section">
      {title && <p className="form-section-title">{title}</p>}
      {children}
    </div>
  );
}
