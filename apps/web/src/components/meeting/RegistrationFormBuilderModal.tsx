'use client';

import { useEffect, useState } from 'react';
import {
  createDefaultRegistrationFormConfig,
  OPTIONAL_STANDARD_FIELDS,
  RegistrationFieldType,
  StandardRegistrationField,
  type RegistrationFieldOption,
  type RegistrationFormConfig,
} from '@boldmeet/shared';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';

type RegistrationFormBuilderModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (config: RegistrationFormConfig) => void | Promise<void>;
  initialConfig?: RegistrationFormConfig;
  saving?: boolean;
};

function nextCustomKey(fields: RegistrationFieldOption[]) {
  return `custom_${fields.filter((f) => f.isCustom).length + 1}`;
}

export function RegistrationFormBuilderModal({
  open,
  onClose,
  onSave,
  initialConfig,
  saving = false,
}: RegistrationFormBuilderModalProps) {
  const [config, setConfig] = useState<RegistrationFormConfig>(
    initialConfig ?? createDefaultRegistrationFormConfig(),
  );

  useEffect(() => {
    if (open) {
      setConfig(initialConfig ?? createDefaultRegistrationFormConfig());
    }
  }, [open, initialConfig]);

  if (!open) return null;

  const enabledOptionalKeys = new Set(
    config.fields
      .filter((f) => f.standardField && f.standardField !== StandardRegistrationField.FULL_NAME && f.standardField !== StandardRegistrationField.EMAIL)
      .map((f) => f.fieldKey),
  );

  function toggleOptionalField(fieldKey: string, enabled: boolean) {
    setConfig((prev) => {
      if (enabled) {
        const meta = OPTIONAL_STANDARD_FIELDS.find((f) => f.fieldKey === fieldKey);
        if (!meta) return prev;
        return {
          ...prev,
          fields: [
            ...prev.fields,
            {
              fieldKey: meta.fieldKey,
              label: meta.label,
              fieldType: meta.fieldType,
              standardField: meta.standardField,
              isRequired: false,
              isEnabled: true,
              sortOrder: prev.fields.length,
            },
          ],
        };
      }
      return {
        ...prev,
        fields: prev.fields.filter((f) => f.fieldKey !== fieldKey),
      };
    });
  }

  function updateField(fieldKey: string, patch: Partial<RegistrationFieldOption>) {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.map((field) =>
        field.fieldKey === fieldKey ? { ...field, ...patch } : field,
      ),
    }));
  }

  function addCustomQuestion(type: RegistrationFieldType) {
    setConfig((prev) => {
      const fieldKey = nextCustomKey(prev.fields);
      return {
        ...prev,
        fields: [
          ...prev.fields,
          {
            fieldKey,
            label: 'Custom question',
            fieldType: type,
            isRequired: false,
            isEnabled: true,
            isCustom: true,
            sortOrder: prev.fields.length,
            options:
              type === RegistrationFieldType.DROPDOWN ||
              type === RegistrationFieldType.RADIO ||
              type === RegistrationFieldType.CHECKBOX
                ? ['Option 1', 'Option 2']
                : [],
          },
        ],
      };
    });
  }

  function removeCustomField(fieldKey: string) {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.fieldKey !== fieldKey),
    }));
  }

  async function handleSave() {
    const normalized: RegistrationFormConfig = {
      settings: config.settings,
      fields: config.fields.map((field, index) => ({
        ...field,
        sortOrder: index,
        isLocked:
          field.standardField === StandardRegistrationField.FULL_NAME ||
          field.standardField === StandardRegistrationField.EMAIL,
      })),
    };
    await onSave(normalized);
  }

  const customFields = config.fields.filter((f) => f.isCustom);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-xl font-bold">Configure Registration Form</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build the attendee registration form before they can join.
          </p>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          <section>
            <h3 className="mb-3 font-semibold">Default required fields</h3>
            <div className="space-y-2 rounded-xl border border-border p-4">
              {config.fields
                .filter(
                  (f) =>
                    f.standardField === StandardRegistrationField.FULL_NAME ||
                    f.standardField === StandardRegistrationField.EMAIL,
                )
                .map((field) => (
                  <div key={field.fieldKey} className="flex items-center justify-between text-sm">
                    <span>{field.label}</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Required
                    </span>
                  </div>
                ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-semibold">Optional standard fields</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {OPTIONAL_STANDARD_FIELDS.map((field) => {
                const enabled = enabledOptionalKeys.has(field.fieldKey);
                const current = config.fields.find((f) => f.fieldKey === field.fieldKey);
                return (
                  <div key={field.fieldKey} className="rounded-xl border border-border p-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => toggleOptionalField(field.fieldKey, e.target.checked)}
                      />
                      {field.label}
                    </label>
                    {enabled && current && (
                      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={current.isRequired}
                          onChange={(e) =>
                            updateField(field.fieldKey, { isRequired: e.target.checked })
                          }
                        />
                        Required
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">Custom questions</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  RegistrationFieldType.TEXT,
                  RegistrationFieldType.TEXTAREA,
                  RegistrationFieldType.DROPDOWN,
                  RegistrationFieldType.RADIO,
                  RegistrationFieldType.CHECKBOX,
                ].map((type) => (
                  <Button key={type} size="sm" variant="secondary" onClick={() => addCustomQuestion(type)}>
                    + {type.toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {customFields.map((field) => (
                  <div key={field.fieldKey} className="rounded-xl border border-border p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Question"
                        value={field.label}
                        onChange={(e) => updateField(field.fieldKey, { label: e.target.value })}
                      />
                      <div className="flex items-end gap-4 pb-1">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={field.isRequired}
                            onChange={(e) =>
                              updateField(field.fieldKey, { isRequired: e.target.checked })
                            }
                          />
                          Required
                        </label>
                        {field.isCustom && (
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:underline"
                            onClick={() => removeCustomField(field.fieldKey)}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                    {(field.fieldType === RegistrationFieldType.DROPDOWN ||
                      field.fieldType === RegistrationFieldType.RADIO ||
                      field.fieldType === RegistrationFieldType.CHECKBOX) && (
                      <Input
                        className="mt-3"
                        label="Options (comma separated)"
                        value={(field.options ?? []).join(', ')}
                        onChange={(e) =>
                          updateField(field.fieldKey, {
                            options: e.target.value
                              .split(',')
                              .map((v) => v.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    )}
                  </div>
                ))}
            </div>
          </section>

          <section>
            <h3 className="mb-3 font-semibold">Form settings</h3>
            <div className="space-y-4 rounded-xl border border-border p-4">
              <Toggle
                label="Require registration approval"
                checked={config.settings.requireApproval}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      requireApproval: !prev.settings.requireApproval,
                      autoApprove: prev.settings.requireApproval ? prev.settings.autoApprove : false,
                    },
                  }))
                }
              />
              <Toggle
                label="Auto approve registrations"
                checked={config.settings.autoApprove}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, autoApprove: !prev.settings.autoApprove },
                  }))
                }
              />
              <Toggle
                label="Send confirmation email"
                checked={config.settings.sendConfirmationEmail}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      sendConfirmationEmail: !prev.settings.sendConfirmationEmail,
                    },
                  }))
                }
              />
              <Toggle
                label="Limit registrations"
                checked={config.settings.limitRegistrations}
                onChange={() =>
                  setConfig((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      limitRegistrations: !prev.settings.limitRegistrations,
                    },
                  }))
                }
              />
              {config.settings.limitRegistrations && (
                <Input
                  label="Maximum registrations"
                  type="number"
                  min={1}
                  value={config.settings.maxRegistrations ?? 100}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        maxRegistrations: Number(e.target.value) || 100,
                      },
                    }))
                  }
                />
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={() => void handleSave()}>
            Save form
          </Button>
        </div>
      </div>
    </div>
  );
}
