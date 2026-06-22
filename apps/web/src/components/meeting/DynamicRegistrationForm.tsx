'use client';

import { useMemo, useState } from 'react';
import {
  RegistrationFieldType,
  StandardRegistrationField,
  type RegistrationFieldOption,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

type PublicRegistrationField = RegistrationFieldOption & { id?: string };

type DynamicRegistrationFormProps = {
  fields: PublicRegistrationField[];
  loading?: boolean;
  onSubmit: (answers: Record<string, string | string[]>) => Promise<void>;
  initialEmail?: string;
  initialName?: string;
};

export function DynamicRegistrationForm({
  fields,
  loading = false,
  onSubmit,
  initialEmail = '',
  initialName = '',
}: DynamicRegistrationFormProps) {
  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.sortOrder - b.sortOrder),
    [fields],
  );

  const [values, setValues] = useState<Record<string, string | string[]>>(() => {
    const initial: Record<string, string | string[]> = {};
    for (const field of sortedFields) {
      if (field.standardField === StandardRegistrationField.EMAIL) {
        initial[field.fieldKey] = initialEmail;
      } else if (field.standardField === StandardRegistrationField.FULL_NAME) {
        initial[field.fieldKey] = initialName;
      } else {
        initial[field.fieldKey] = field.fieldType === RegistrationFieldType.CHECKBOX ? [] : '';
      }
    }
    return initial;
  });

  function setValue(fieldKey: string, value: string | string[]) {
    setValues((prev) => ({ ...prev, [fieldKey]: value }));
  }

  function renderField(field: PublicRegistrationField) {
    const value = values[field.fieldKey] ?? '';

    if (field.fieldType === RegistrationFieldType.TEXTAREA) {
      return (
        <label key={field.fieldKey} className="block">
          <span className="mb-2 block text-sm font-medium">
            {field.label}
            {field.isRequired && <span className="text-red-500"> *</span>}
          </span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={String(value)}
            required={field.isRequired}
            onChange={(e) => setValue(field.fieldKey, e.target.value)}
          />
        </label>
      );
    }

    if (field.fieldType === RegistrationFieldType.DROPDOWN) {
      return (
        <label key={field.fieldKey} className="block">
          <span className="mb-2 block text-sm font-medium">
            {field.label}
            {field.isRequired && <span className="text-red-500"> *</span>}
          </span>
          <select
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            value={String(value)}
            required={field.isRequired}
            onChange={(e) => setValue(field.fieldKey, e.target.value)}
          >
            <option value="">Select…</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field.fieldType === RegistrationFieldType.RADIO) {
      return (
        <fieldset key={field.fieldKey} className="space-y-2">
          <legend className="text-sm font-medium">
            {field.label}
            {field.isRequired && <span className="text-red-500"> *</span>}
          </legend>
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.fieldKey}
                value={option}
                checked={value === option}
                required={field.isRequired}
                onChange={() => setValue(field.fieldKey, option)}
              />
              {option}
            </label>
          ))}
        </fieldset>
      );
    }

    if (field.fieldType === RegistrationFieldType.CHECKBOX) {
      const selected = Array.isArray(value) ? value : [];
      return (
        <fieldset key={field.fieldKey} className="space-y-2">
          <legend className="text-sm font-medium">
            {field.label}
            {field.isRequired && <span className="text-red-500"> *</span>}
          </legend>
          {(field.options ?? []).map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...selected, option]
                    : selected.filter((item) => item !== option);
                  setValue(field.fieldKey, next);
                }}
              />
              {option}
            </label>
          ))}
        </fieldset>
      );
    }

    const inputType =
      field.fieldType === RegistrationFieldType.EMAIL
        ? 'email'
        : field.fieldType === RegistrationFieldType.PHONE
          ? 'tel'
          : 'text';

    return (
      <Input
        key={field.fieldKey}
        label={field.label}
        type={inputType}
        value={String(value)}
        required={field.isRequired}
        onChange={(e) => setValue(field.fieldKey, e.target.value)}
      />
    );
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(values);
      }}
    >
      <h2 className="font-semibold">Registration required</h2>
      {sortedFields.map(renderField)}
      <Button type="submit" className="w-full" loading={loading}>
        Submit registration
      </Button>
    </form>
  );
}

export function RegistrationPendingBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100',
        className,
      )}
    >
      Your registration is pending approval.
    </div>
  );
}
