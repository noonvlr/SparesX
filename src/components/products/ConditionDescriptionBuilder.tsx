"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { SparesXAiMark } from "@/components/SparesXAiMark";
import { cn } from "@/lib/ui/cn";
import {
  emptyAttributes,
  generateConditionDescription,
  getConflictWarnings,
  getTemplateForPartType,
  type ConditionAttributes,
} from "@/lib/products/condition-desc";

type Props = {
  deviceCategory: string;
  partType: string;
  brand?: string;
  deviceModel?: string;
  partTypeLabel?: string;
  description: string;
  attributes: ConditionAttributes | null;
  onAttributesChange: (attrs: ConditionAttributes | null) => void;
  onDescriptionChange: (description: string) => void;
  className?: string;
};

const THINKING_LINES = [
  "Reading your condition selections…",
  "Drafting a natural seller description…",
  "Polishing the wording…",
] as const;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const id = window.setTimeout(() => resolve(), ms);
    const onAbort = () => {
      window.clearTimeout(id);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Condition form + editable description.
 * Description is filled only when the seller clicks Generate / Regenerate —
 * never overwritten automatically after manual edits.
 */
export default function ConditionDescriptionBuilder({
  deviceCategory,
  partType,
  brand,
  deviceModel,
  partTypeLabel,
  description,
  attributes,
  onAttributesChange,
  onDescriptionChange,
  className,
}: Props) {
  const template = useMemo(
    () => getTemplateForPartType(partType),
    [partType],
  );
  const lastGeneratedRef = useRef("");
  const prevPartTypeRef = useRef(partType);
  const attrsFingerprintRef = useRef("");
  const generateAbortRef = useRef<AbortController | null>(null);
  const [manualEdit, setManualEdit] = useState(false);
  const [attrsChangedSinceEdit, setAttrsChangedSinceEdit] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [thinkingLine, setThinkingLine] = useState(0);
  const [streamingText, setStreamingText] = useState<string | null>(null);

  // Init / reset when part type changes (preserve matching saved attributes on edit)
  useEffect(() => {
    if (!partType || !template) {
      if (attributes) onAttributesChange(null);
      prevPartTypeRef.current = partType;
      return;
    }
    const partChanged = prevPartTypeRef.current !== partType;
    prevPartTypeRef.current = partType;
    if (attributes?.templateId === template.id) return;
    if (partChanged || !attributes) {
      generateAbortRef.current?.abort();
      onAttributesChange(emptyAttributes(template.id));
      setManualEdit(false);
      setAttrsChangedSinceEdit(false);
      setGenerating(false);
      setStreamingText(null);
      lastGeneratedRef.current = "";
      attrsFingerprintRef.current = "";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- partType/template driven
  }, [partType, template?.id]);

  useEffect(() => {
    return () => {
      generateAbortRef.current?.abort();
    };
  }, []);

  const ctx = useMemo(
    () => ({ deviceCategory, brand, deviceModel, partTypeLabel }),
    [deviceCategory, brand, deviceModel, partTypeLabel],
  );

  const generated = useMemo(
    () => generateConditionDescription(attributes, ctx),
    [attributes, ctx],
  );

  const warnings = useMemo(
    () => getConflictWarnings(attributes),
    [attributes],
  );

  const attrsFingerprint = useMemo(
    () =>
      JSON.stringify({
        s: attributes?.selections || {},
        f: attributes?.fields || {},
        t: attributes?.templateId,
      }),
    [attributes],
  );

  // Track attribute changes after the seller has edited or generated text
  useEffect(() => {
    if (!attrsFingerprintRef.current) {
      attrsFingerprintRef.current = attrsFingerprint;
      return;
    }
    if (attrsFingerprint === attrsFingerprintRef.current) return;
    attrsFingerprintRef.current = attrsFingerprint;
    if (
      description.trim() &&
      (manualEdit || description === lastGeneratedRef.current)
    ) {
      setAttrsChangedSinceEdit(true);
    }
  }, [attrsFingerprint, description, manualEdit]);

  // Cycle status lines while generating
  useEffect(() => {
    if (!generating) return;
    setThinkingLine(0);
    const id = window.setInterval(() => {
      setThinkingLine((i) => (i + 1) % THINKING_LINES.length);
    }, 700);
    return () => window.clearInterval(id);
  }, [generating]);

  if (!partType || !template) return null;

  function toggleOption(
    groupId: string,
    optionId: string,
    mode: "multi" | "single",
  ) {
    if (!attributes) return;
    const current = attributes.selections[groupId] || [];
    let nextIds: string[];
    if (mode === "single") {
      nextIds = current.includes(optionId) ? [] : [optionId];
    } else {
      nextIds = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    }
    const selections = { ...attributes.selections };
    if (nextIds.length) selections[groupId] = nextIds;
    else delete selections[groupId];
    onAttributesChange({ ...attributes, selections });
  }

  function setField(fieldId: string, value: string) {
    if (!attributes) return;
    const fields = { ...attributes.fields };
    if (value.trim()) fields[fieldId] = value;
    else delete fields[fieldId];
    onAttributesChange({ ...attributes, fields });
  }

  async function regenerate() {
    if (!generated || generating || warnings.length > 0) return;

    generateAbortRef.current?.abort();
    const controller = new AbortController();
    generateAbortRef.current = controller;

    setGenerating(true);
    setStreamingText("");
    setManualEdit(false);
    setAttrsChangedSinceEdit(false);

    const finish = (text: string) => {
      lastGeneratedRef.current = text;
      setStreamingText(null);
      setGenerating(false);
      onDescriptionChange(text);
    };

    try {
      if (prefersReducedMotion()) {
        finish(generated);
        return;
      }

      // Short “thinking” beat so the animation feels intentional
      await delay(520, controller.signal);
      if (controller.signal.aborted) return;

      // Typewriter reveal — word-aware chunks for a natural writing feel
      const text = generated;
      let i = 0;
      while (i < text.length) {
        if (controller.signal.aborted) return;
        const nextSpace = text.indexOf(" ", i + 1);
        const chunkEnd =
          nextSpace === -1 ? Math.min(i + 4, text.length) : nextSpace + 1;
        i = Math.min(chunkEnd, text.length);
        setStreamingText(text.slice(0, i));
        await delay(i < 40 ? 28 : 14, controller.signal);
      }

      if (controller.signal.aborted) return;
      await delay(120, controller.signal);
      finish(text);
    } catch {
      if (controller.signal.aborted) {
        setGenerating(false);
        setStreamingText(null);
        return;
      }
      finish(generated);
    }
  }

  function clearAll() {
    if (!template) return;
    generateAbortRef.current?.abort();
    const prevGen = lastGeneratedRef.current;
    onAttributesChange(emptyAttributes(template.id));
    setManualEdit(false);
    setAttrsChangedSinceEdit(false);
    setGenerating(false);
    setStreamingText(null);
    lastGeneratedRef.current = "";
    attrsFingerprintRef.current = "";
    if (!description.trim() || description === prevGen) {
      onDescriptionChange("");
    }
  }

  const attrs = attributes || emptyAttributes(template.id);
  const hasDescription = Boolean(description.trim()) || streamingText !== null;
  const generateLabel = generating
    ? "Writing…"
    : hasDescription
      ? "Regenerate description"
      : "Generate description";
  const shownDescription =
    streamingText !== null ? streamingText : description;

  return (
    <div
      className={cn(
        "space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            Condition details — {template.label}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            Select only what you know. Unchecked items are not assumed true or
            false. Use Generate to write the listing description.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearAll}
          className="shrink-0"
          disabled={generating}
        >
          Clear selections
        </Button>
      </div>

      {warnings.length > 0 ? (
        <Alert tone="warning" title="Conflicting selections">
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs">
            Please correct the selections above before submitting. Conflicting
            combinations cannot be saved.
          </p>
        </Alert>
      ) : null}

      <div className="space-y-5">
        {template.groups.map((group) => (
          <fieldset key={group.id} className="space-y-2" disabled={generating}>
            <legend className="text-[13px] font-semibold text-[var(--ink-secondary)]">
              {group.label}
              {group.optional ? (
                <span className="ml-1 font-normal text-[var(--muted)]">
                  (optional)
                </span>
              ) : null}
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {group.options.map((opt) => {
                const checked = (attrs.selections[group.id] || []).includes(
                  opt.id,
                );
                return (
                  <label
                    key={opt.id}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-start gap-2.5 rounded-[var(--radius)] border px-3 py-2.5 text-sm transition-colors",
                      checked
                        ? "border-[var(--brand-muted)] bg-[var(--brand-soft)]"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand-muted)]",
                      generating && "pointer-events-none opacity-70",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() =>
                        toggleOption(group.id, opt.id, group.mode)
                      }
                      className="mt-0.5"
                      disabled={generating}
                    />
                    <span className="leading-snug text-[var(--ink)]">
                      {opt.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}

        {(template.fields || []).map((field) => (
          <Field
            key={field.id}
            label={field.label}
            hint={field.optional ? "Optional" : undefined}
          >
            {field.id === "remarks" ? (
              <Textarea
                value={attrs.fields[field.id] || ""}
                onChange={(e) => setField(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="min-h-[72px]"
                disabled={generating}
              />
            ) : (
              <Input
                value={attrs.fields[field.id] || ""}
                onChange={(e) => setField(field.id, e.target.value)}
                placeholder={field.placeholder}
                size="sm"
                disabled={generating}
              />
            )}
          </Field>
        ))}
      </div>

      <div className="space-y-2 border-t border-[var(--divider)] pt-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-semibold text-[var(--ink-secondary)]">
            Listing description
          </p>
          <span
            className={cn(
              "desc-gen-btn-wrap w-full sm:w-auto",
              generating && "is-busy",
              (!generated || warnings.length > 0) &&
                !generating &&
                "opacity-60",
            )}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void regenerate()}
              disabled={!generated || warnings.length > 0 || generating}
              loading={generating}
              aria-label={generateLabel}
              className="h-11 min-h-11 w-full gap-2 border-0 shadow-none sm:h-9 sm:min-h-[36px] sm:w-auto"
            >
              {!generating ? (
                <SparesXAiMark
                  decorative
                  tone="branded"
                  className="h-5 w-5 text-[var(--ink)]"
                />
              ) : null}
              <span className="sm:hidden" aria-hidden="true">
                {generating
                  ? "Writing…"
                  : hasDescription
                    ? "Regenerate"
                    : "Generate"}
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                {generateLabel}
              </span>
            </Button>
          </span>
        </div>

        {generating ? (
          <div
            className="flex items-center gap-2 text-xs text-[var(--brand)]"
            aria-live="polite"
          >
            <span className="desc-gen-orb" aria-hidden />
            <span className="desc-gen-spark" style={{ animationDelay: "0.15s" }} aria-hidden />
            <span className="desc-gen-spark" style={{ animationDelay: "0.35s" }} aria-hidden />
            <span>{THINKING_LINES[thinkingLine]}</span>
          </div>
        ) : null}

        {attrsChangedSinceEdit && hasDescription && !generating ? (
          <Alert tone="warning" title="Condition selections changed">
            Regenerating will replace your current description with a new
            auto-generated version. Your manual edits will be lost unless you
            copy them first.
          </Alert>
        ) : null}

        <div
          className={cn(
            "desc-gen-shell",
            generating && "is-generating",
          )}
        >
          <Textarea
            value={shownDescription}
            onChange={(e) => {
              if (generating) return;
              setManualEdit(true);
              onDescriptionChange(e.target.value);
            }}
            placeholder="Select condition details above, then click Generate description — or write your own…"
            className={cn(
              "min-h-[7.5rem] relative z-[2]",
              generating && "caret-transparent",
            )}
            required
            readOnly={generating}
            aria-busy={generating || undefined}
          />
          {generating && streamingText !== null && streamingText.length > 0 ? (
            <span
              className="pointer-events-none absolute bottom-3 right-3 z-[3] inline-block h-4 w-0.5 bg-[var(--brand)]"
              style={{ animation: "desc-gen-pulse 0.9s ease-in-out infinite" }}
              aria-hidden
            />
          ) : null}
        </div>
        {manualEdit &&
        generated &&
        description !== generated &&
        !attrsChangedSinceEdit &&
        !generating ? (
          <p className="text-xs text-[var(--muted)]">
            You edited the text manually. Regenerating will replace this
            description.
          </p>
        ) : null}
      </div>
    </div>
  );
}
