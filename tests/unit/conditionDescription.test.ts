import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  emptyAttributes,
  generateConditionDescription,
  getTemplateForPartType,
  resolveTemplateId,
  validateConditionAttributes,
} from "@/lib/products/condition-desc";

describe("condition description templates", () => {
  it("maps part type slugs to templates", () => {
    assert.equal(resolveTemplateId("motherboard"), "motherboard");
    assert.equal(resolveTemplateId("screen"), "display");
    assert.equal(resolveTemplateId("display"), "display");
    assert.equal(resolveTemplateId("charging-port"), "chargingBoard");
    assert.equal(resolveTemplateId("battery"), "battery");
    assert.equal(resolveTemplateId("unknown-widget"), "generic");
  });

  it("returns motherboard template for motherboard part type", () => {
    const t = getTemplateForPartType("motherboard");
    assert.ok(t);
    assert.equal(t!.id, "motherboard");
    assert.ok(t!.groups.some((g) => g.id === "component_status"));
  });

  it("hides motherboard groups from display template", () => {
    const t = getTemplateForPartType("screen");
    assert.ok(t);
    assert.equal(t!.id, "display");
    assert.ok(!t!.groups.some((g) => g.id === "component_status"));
    assert.ok(t!.groups.some((g) => g.id === "display_condition"));
  });
});

describe("generateConditionDescription", () => {
  it("writes first-person seller copy for a used motherboard", () => {
    const attrs = emptyAttributes("motherboard");
    attrs.selections = {
      board_condition: ["used"],
      component_status: ["shield_opened"],
      functional: ["fully_working"],
    };
    const text = generateConditionDescription(attrs, {
      brand: "Redmi",
      deviceModel: "Note 10",
    });
    assert.match(text, /^I (have|am selling|Sharing)/i);
    assert.match(text, /used Redmi Note 10 motherboard/i);
    assert.match(text, /shield has been opened/i);
    assert.match(text, /working/i);
    assert.doesNotMatch(text, /Board work:/i);
    assert.doesNotMatch(text, /seller-reported/i);
    assert.doesNotMatch(text, /eMMC/i);
  });

  it("combines removed components into one natural sentence", () => {
    const attrs = emptyAttributes("motherboard");
    attrs.selections = {
      board_condition: ["used"],
      component_status: ["shield_opened", "emmc_removed", "cpu_removed"],
      functional: ["not_tested"],
    };
    const text = generateConditionDescription(attrs, {
      brand: "Samsung",
    });
    assert.match(text, /I have/i);
    assert.match(text, /eMMC/i);
    assert.match(text, /CPU/i);
    assert.match(text, /shield has been opened/i);
    assert.match(text, /not (been )?tested|not confirmed/i);
    // Should not be three disconnected robotic sentences only
    assert.doesNotMatch(text, /The shield has been opened\. The eMMC has been removed\. The CPU has been removed\./);
  });

  it("mentions FRP lock clearly without inventing warranty", () => {
    const attrs = emptyAttributes("motherboard");
    attrs.selections = {
      board_condition: ["used"],
      lock_status: ["frp_locked"],
      functional: ["fully_working"],
    };
    const text = generateConditionDescription(attrs, {
      brand: "Vivo",
      deviceModel: "Y21",
    });
    assert.match(text, /FRP locked/i);
    assert.match(text, /working/i);
    assert.doesNotMatch(text, /warranty/i);
    assert.doesNotMatch(text, /authentic/i);
  });

  it("returns empty string when nothing selected", () => {
    const attrs = emptyAttributes("display");
    assert.equal(generateConditionDescription(attrs), "");
  });

  it("writes natural copy for a new display without frame", () => {
    const attrs = emptyAttributes("display");
    attrs.selections = {
      display_condition: ["new_display"],
      functional: ["touch_working", "display_working"],
      physical: ["without_frame"],
    };
    const text = generateConditionDescription(attrs, {
      brand: "Apple",
      deviceModel: "iPhone 12",
    });
    assert.match(text, /^I (have|am selling|Sharing)/i);
    assert.match(text, /new, unused/i);
    assert.match(text, /display and touch|when I checked|I checked/i);
    assert.match(text, /does not include the frame|display-only/i);
    assert.doesNotMatch(text, /reported to be|on my check/i);
    assert.doesNotMatch(text, /motherboard|shield|eMMC/i);
  });

  it("keeps minimal listings short without inventing facts", () => {
    const attrs = emptyAttributes("chargingBoard");
    attrs.selections = {
      board_condition: ["used_board"],
    };
    const text = generateConditionDescription(attrs, {});
    assert.match(text, /^I (have|am selling|Sharing)/i);
    assert.match(text, /\ba used charging board\b/i);
    assert.match(text, /contact me|compatibility/i);
    assert.doesNotMatch(text, /working properly|tested|microphone|USB/i);
    const words = text.split(/\s+/).length;
    assert.ok(words < 60, `expected short description, got ${words} words`);
  });

  it("phrases no-lock status naturally", () => {
    const attrs = emptyAttributes("motherboard");
    attrs.selections = {
      board_condition: ["fresh"],
      lock_status: ["no_software_lock"],
      functional: ["fully_working"],
    };
    const text = generateConditionDescription(attrs, {});
    assert.match(text, /free of software locks|no known software lock/i);
    assert.doesNotMatch(text, /no known software lock is reported/i);
  });

  it("is deterministic for the same inputs", () => {
    const attrs = emptyAttributes("motherboard");
    attrs.selections = {
      board_condition: ["used"],
      functional: ["fully_working"],
    };
    const ctx = { brand: "Xiaomi", deviceModel: "11 Lite" };
    const a = generateConditionDescription(attrs, ctx);
    const b = generateConditionDescription(attrs, ctx);
    assert.equal(a, b);
  });
});

describe("validateConditionAttributes", () => {
  it("accepts valid attributes", () => {
    const result = validateConditionAttributes(
      {
        version: 1,
        templateId: "motherboard",
        selections: { board_condition: ["used"], functional: ["not_tested"] },
        fields: { remarks: "Tested on donor frame" },
      },
      { strictConflicts: true },
    );
    assert.equal(result.ok, true);
    assert.ok(result.value);
    assert.equal(result.value!.fields.remarks, "Tested on donor frame");
  });

  it("rejects conflicting selections in strict mode with readable labels", () => {
    const result = validateConditionAttributes(
      {
        version: 1,
        templateId: "motherboard",
        selections: {
          board_condition: ["fresh", "repaired"],
        },
        fields: {},
      },
      { strictConflicts: true },
    );
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /Conflicting/i.test(e)));
    assert.ok(result.errors.some((e) => /Fresh|Repaired/i.test(e)));
  });

  it("strips unknown option ids", () => {
    const result = validateConditionAttributes({
      version: 1,
      templateId: "battery",
      selections: { condition: ["original", "not_a_real_option"] },
      fields: { hacked: "nope", remarks: "ok" },
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.value!.selections.condition, ["original"]);
    assert.equal(result.value!.fields.remarks, "ok");
    assert.equal(result.value!.fields.hacked, undefined);
  });

  it("allows null / empty payload for legacy listings", () => {
    const result = validateConditionAttributes(null);
    assert.equal(result.ok, true);
    assert.equal(result.value, null);
  });
});
