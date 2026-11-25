import { getTemplateById } from "./resolveTemplate";
import type {
  ConditionAttributes,
  ConditionTemplate,
  GenerateContext,
} from "./types";

function selectedIds(attrs: ConditionAttributes, groupId: string): string[] {
  return attrs.selections?.[groupId] || [];
}

function has(attrs: ConditionAttributes, groupId: string, id: string): boolean {
  return selectedIds(attrs, groupId).includes(id);
}

function anyOf(
  attrs: ConditionAttributes,
  groupId: string,
  ids: string[],
): string[] {
  return ids.filter((id) => has(attrs, groupId, id));
}

function joinHuman(parts: string[]): string {
  const clean = parts.filter(Boolean);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")}, and ${clean[clean.length - 1]}`;
}

function sentence(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return "";
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/\.+$/, "") + ".";
}

/** Deterministic pick so same inputs → same copy, different sets → variety. */
function pick<T>(options: T[], seed: string): T {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return options[Math.abs(h) % options.length];
}

function seedKey(attrs: ConditionAttributes, ctx: GenerateContext): string {
  return JSON.stringify({
    t: attrs.templateId,
    s: attrs.selections,
    f: attrs.fields,
    b: ctx.brand,
    m: ctx.deviceModel,
    p: ctx.partTypeLabel,
    n: ctx.productTitle,
  });
}

function productName(
  template: ConditionTemplate,
  attrs: ConditionAttributes,
  ctx: GenerateContext,
): string {
  if (ctx.productTitle?.trim()) return ctx.productTitle.trim();

  const brandModel = [ctx.brand?.trim(), ctx.deviceModel?.trim()]
    .filter(Boolean)
    .join(" ");

  const condIds = [
    ...selectedIds(attrs, "board_condition"),
    ...selectedIds(attrs, "display_condition"),
    ...selectedIds(attrs, "condition"),
  ];

  const adjMap: Record<string, string> = {
    untouched: "untouched",
    fresh: "new, unused",
    used: "used",
    refurbished: "refurbished",
    repaired: "repaired",
    water_damaged: "water-damaged",
    dead: "non-working",
    original: "original",
    aftermarket: "compatible / aftermarket",
    refurbished_display: "refurbished",
    new_display: "new, unused",
    used_display: "used",
    new_board: "new",
    used_board: "used",
    new_cam: "new",
    used_cam: "used",
    new_bat: "new",
    used_bat: "used",
    new_spk: "new",
    used_spk: "used",
    new_ep: "new",
    used_ep: "used",
    new_flex: "new",
    used_flex: "used",
    new_btn: "new",
    used_btn: "used",
    new_fp: "new",
    used_fp: "used",
    new_sb: "new",
    used_sb: "used",
    new_part: "new",
    used_part: "used",
  };

  const adjs = condIds.map((id) => adjMap[id]).filter(Boolean);
  // Prefer a single lead adjective for natural opening
  const lead =
    adjs.find((a) => a === "used") ||
    adjs.find((a) => a.startsWith("new")) ||
    adjs[0] ||
    "";

  const typeBits: string[] = [];
  if (has(attrs, "camera_type", "rear")) typeBits.push("rear");
  if (has(attrs, "camera_type", "front")) typeBits.push("front");
  if (has(attrs, "camera_type", "depth")) typeBits.push("depth");
  if (has(attrs, "button_type", "power")) typeBits.push("power");
  if (has(attrs, "button_type", "volume")) typeBits.push("volume");

  const noun = typeBits.length
    ? `${joinHuman(typeBits)} ${template.componentNoun}`
    : (ctx.partTypeLabel?.trim().toLowerCase() || template.componentNoun);

  if (brandModel && lead) return `${lead} ${brandModel} ${noun}`;
  if (brandModel) return `${brandModel} ${noun}`;
  if (lead) return `${lead} ${noun}`;
  return noun;
}

function articleFor(name: string): "a" | "an" {
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() || "";
  // Consonant sound despite vowel letter (e.g. "used", "untouched")
  if (/^(used|untouched|university|one|euro)/.test(first)) return "a";
  // Silent-h vowel sound
  if (/^(hour|honest|heir)/.test(first)) return "an";
  return /^[aeiou]/.test(first) ? "an" : "a";
}

function opening(name: string, seed: string): string {
  const art = articleFor(name);
  return pick(
    [
      `I have ${art} ${name} available for sale`,
      `I have this ${name} available`,
      `Sharing ${art} ${name} that I have for sale`,
      `I am selling ${art} ${name}`,
    ],
    seed + ":open",
  );
}

function closing(seed: string, rich: boolean): string {
  if (!rich) {
    return pick(
      [
        "Please check the product images and confirm compatibility with your device model before purchasing. Contact me if you need any additional details",
        "Please confirm the model fit from the listing details before buying. Feel free to contact me if you need more information",
      ],
      seed + ":close-min",
    );
  }
  return pick(
    [
      "Feel free to contact me if you need any additional details before purchasing",
      "Contact me if you need more information about this part",
      "Please review the condition above carefully before purchasing. You can message me for any questions",
      "I have mentioned the condition clearly. Feel free to contact me if you need anything else",
    ],
    seed + ":close",
  );
}

function motherboardBody(attrs: ConditionAttributes, seed: string): string[] {
  const out: string[] = [];

  const removed = anyOf(attrs, "component_status", [
    "emmc_removed",
    "ufs_removed",
    "cpu_removed",
    "ram_removed",
  ]);
  const removedLabels: Record<string, string> = {
    emmc_removed: "eMMC",
    ufs_removed: "UFS",
    cpu_removed: "CPU",
    ram_removed: "RAM",
  };
  const removedNames = removed.map((id) => removedLabels[id]);

  const shieldOpened = has(attrs, "component_status", "shield_opened");
  const shieldRemoved = has(attrs, "component_status", "shield_removed");
  const icReplaced = has(attrs, "component_status", "ic_replaced");
  const jumper = has(attrs, "component_status", "jumper_work");
  const prevRepair = has(attrs, "component_status", "previous_repair");

  const workBits: string[] = [];
  if (shieldOpened) workBits.push("the shield has been opened");
  if (shieldRemoved) workBits.push("the shield has been removed");
  if (removedNames.length === 1) {
    workBits.push(`the ${removedNames[0]} has been removed`);
  } else if (removedNames.length > 1) {
    workBits.push(`the ${joinHuman(removedNames)} have been removed`);
  }
  if (icReplaced) workBits.push("an IC has been replaced");
  if (jumper) workBits.push("jumper work has been done");

  if (prevRepair || workBits.length) {
    const detail = joinHuman(workBits);
    if (prevRepair && detail) {
      out.push(
        sentence(
          pick(
            [
              `The board has undergone previous repair work. Please note that ${detail}`,
              `This motherboard has been previously worked on — ${detail}`,
              `I want to mention the repair history clearly: ${detail}`,
            ],
            seed + ":work",
          ),
        ),
      );
    } else if (detail) {
      out.push(
        sentence(
          pick(
            [
              `Please note that ${detail}`,
              `On this board, ${detail}`,
              `Just so you know, ${detail}`,
            ],
            seed + ":work2",
          ),
        ),
      );
    } else if (prevRepair) {
      out.push(sentence("The board has been previously worked on"));
    }
  }

  // Functional — careful wording, never invent testing
  if (has(attrs, "functional", "fully_working")) {
    out.push(
      sentence(
        pick(
          [
            "I have checked the board and it is working properly",
            "The board is working when I checked",
            "I checked this motherboard and it is working",
          ],
          seed + ":func-ok",
        ),
      ),
    );
  } else if (has(attrs, "functional", "partially_working")) {
    out.push(
      sentence(
        pick(
          [
            "The board is only partially working",
            "Please note that this motherboard is partially working",
          ],
          seed + ":func-part",
        ),
      ),
    );
  } else if (has(attrs, "functional", "not_tested")) {
    const hadWork =
      prevRepair ||
      jumper ||
      icReplaced ||
      removed.length > 0 ||
      shieldOpened ||
      shieldRemoved;
    out.push(
      sentence(
        pick(
          hadWork
            ? [
                "The motherboard has not been tested after these changes, so its working condition is not confirmed",
                "I have not tested this board after the work mentioned above, so please do not assume it is working",
                "Working condition is not confirmed because the board has not been tested",
              ]
            : [
                "I have not tested this board, so working condition is not confirmed",
                "This motherboard has not been tested",
                "Working condition is not confirmed because the board has not been tested",
              ],
          seed + ":func-nt",
        ),
      ),
    );
  } else if (has(attrs, "functional", "not_working")) {
    out.push(
      sentence(
        pick(
          [
            "This board is not working and is being sold as a dead / parts board",
            "Please note that the motherboard is not working",
          ],
          seed + ":func-dead",
        ),
      ),
    );
  }

  // Locks — after functional so "working, but FRP locked" reads naturally
  const locks = anyOf(attrs, "lock_status", [
    "frp_locked",
    "cloud_locked",
    "account_locked",
    "network_locked",
  ]);
  const lockLabels: Record<string, string> = {
    frp_locked: "FRP locked",
    cloud_locked: "cloud locked",
    account_locked: "account locked",
    network_locked: "network locked",
  };
  if (has(attrs, "lock_status", "no_software_lock") && locks.length === 0) {
    out.push(
      sentence(
        pick(
          [
            "There is no known software lock on this board",
            "As far as I know, the board is free of software locks",
          ],
          seed + ":nolock",
        ),
      ),
    );
  } else if (locks.length) {
    const lockText = joinHuman(locks.map((id) => lockLabels[id]));
    out.push(
      sentence(
        pick(
          [
            `Please note that it is ${lockText}`,
            `The board is ${lockText}, so please confirm this suits your requirement before purchasing`,
            `One important point — this board is ${lockText}. Make sure this condition is suitable for your requirement`,
          ],
          seed + ":lock",
        ),
      ),
    );
  }

  return out;
}

function displayBody(attrs: ConditionAttributes, seed: string): string[] {
  const out: string[] = [];

  const funcs: string[] = [];
  if (has(attrs, "functional", "touch_working")) funcs.push("touch");
  if (has(attrs, "functional", "display_working")) funcs.push("display");
  if (funcs.length === 2) {
    out.push(
      sentence(
        pick(
          [
            "Both the display and touch are working when I checked",
            "I checked the display and touch, and both are working",
            "Display and touch were fine when I checked",
          ],
          seed + ":df",
        ),
      ),
    );
  } else if (funcs.length === 1) {
    out.push(
      sentence(
        pick(
          [
            `The ${funcs[0]} is working when I checked`,
            `I checked the ${funcs[0]} and it is working`,
          ],
          seed + `:df-${funcs[0]}`,
        ),
      ),
    );
  }

  const issues: string[] = [];
  if (has(attrs, "functional", "lines_present")) issues.push("lines on the panel");
  if (has(attrs, "functional", "dead_pixels")) issues.push("dead pixels");
  if (has(attrs, "functional", "bleeding")) issues.push("display bleeding");
  if (has(attrs, "functional", "touch_partial"))
    issues.push("touch only partially working");
  if (issues.length) {
    out.push(sentence(`Please note there ${issues.length === 1 ? "is" : "are"} ${joinHuman(issues)}`));
  }
  if (has(attrs, "functional", "not_tested_func")) {
    out.push(sentence("I have not fully tested this display"));
  }

  const phys: string[] = [];
  if (has(attrs, "physical", "no_scratches"))
    phys.push("the glass is clean with no scratches");
  if (has(attrs, "physical", "minor_scratches"))
    phys.push("there are minor scratches on the glass");
  if (has(attrs, "physical", "heavy_scratches"))
    phys.push("there are heavy scratches on the glass");
  if (has(attrs, "physical", "cracked_glass"))
    phys.push("the glass is cracked");
  if (has(attrs, "physical", "frame_included"))
    phys.push("the frame is included");
  if (has(attrs, "physical", "without_frame"))
    phys.push("this is the display-only unit and does not include the frame");
  if (phys.length) {
    out.push(sentence(joinHuman(phys)));
  }

  return out;
}

function genericBody(
  attrs: ConditionAttributes,
  template: ConditionTemplate,
  seed: string,
): string[] {
  const out: string[] = [];
  const noun = template.componentNoun;

  if (has(attrs, "functional", "fully_working") || has(attrs, "functional", "working")) {
    out.push(
      sentence(
        pick(
          [
            `I have checked this ${noun} and it is working properly`,
            `I checked this ${noun} and it is working`,
          ],
          seed + ":gok",
        ),
      ),
    );
  } else if (has(attrs, "functional", "partially_working") || has(attrs, "functional", "partial")) {
    out.push(sentence(`Please note that this ${noun} is only partially working`));
  } else if (has(attrs, "functional", "not_tested")) {
    out.push(sentence(`I have not tested this ${noun}, so working condition is not confirmed`));
  } else if (has(attrs, "functional", "faulty") || has(attrs, "functional", "not_working")) {
    out.push(sentence(`Please note that this ${noun} is faulty / not working`));
  }

  // Charging board specifics
  const chargeBits: string[] = [];
  if (has(attrs, "functional", "charging_ok")) chargeBits.push("charging");
  if (has(attrs, "functional", "mic_ok")) chargeBits.push("microphone");
  if (has(attrs, "functional", "usb_data_ok")) chargeBits.push("USB data");
  if (has(attrs, "functional", "antenna_ok")) chargeBits.push("antenna / network section");
  if (chargeBits.length) {
    out.push(
      sentence(
        pick(
          [
            `I have checked ${joinHuman(chargeBits)} and ${chargeBits.length === 1 ? "it is" : "they are"} working`,
            `${joinHuman(chargeBits)} ${chargeBits.length === 1 ? "is" : "are"} working when I checked`,
          ],
          seed + ":charge",
        ),
      ),
    );
  }

  if (has(attrs, "functional", "holds_charge")) {
    out.push(sentence("The battery holds charge when I checked"));
  }
  if (has(attrs, "functional", "charges_ok")) {
    out.push(sentence("It charges normally when I checked"));
  }
  if (has(attrs, "condition", "swelling")) {
    out.push(sentence("Please note that there is battery swelling"));
  }
  if (has(attrs, "functional", "distorted")) {
    out.push(sentence("Sound is low or distorted"));
  }
  if (has(attrs, "condition", "torn")) {
    out.push(sentence("The flex is torn or damaged"));
  }
  if (has(attrs, "condition", "intact")) {
    out.push(sentence("The cable looks intact"));
  }

  return out;
}

/**
 * First-person, seller-written listing description.
 * Deterministic rule engine — no external AI.
 */
export function generateConditionDescription(
  attrs: ConditionAttributes | null | undefined,
  ctx: GenerateContext = {},
): string {
  if (!attrs?.templateId) return "";
  const template = getTemplateById(attrs.templateId);
  if (!template) return "";

  const hasAnySelection = Object.values(attrs.selections || {}).some(
    (ids) => ids.length > 0,
  );
  const hasFields = Object.values(attrs.fields || {}).some((v) =>
    String(v || "").trim(),
  );
  if (!hasAnySelection && !hasFields) return "";

  const seed = seedKey(attrs, ctx);
  const name = productName(template, attrs, ctx);
  const parts: string[] = [];

  parts.push(sentence(opening(name, seed)));

  let body: string[] = [];
  switch (template.id) {
    case "motherboard":
      body = motherboardBody(attrs, seed);
      break;
    case "display":
      body = displayBody(attrs, seed);
      break;
    default:
      body = genericBody(attrs, template, seed);
      break;
  }
  parts.push(...body);

  const boardNo = attrs.fields?.boardNumber?.trim();
  if (boardNo) {
    parts.push(sentence(`Board / part number is ${boardNo}`));
  }
  const health = attrs.fields?.healthPercent?.trim();
  if (health) {
    parts.push(sentence(`Battery health is around ${health}%`));
  }
  const remarks = attrs.fields?.remarks?.trim();
  if (remarks) {
    parts.push(sentence(remarks));
  }

  const rich = body.length > 0 || Boolean(boardNo || health || remarks);
  parts.push(sentence(closing(seed, rich)));

  // Deduplicate accidental repeats
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const p of parts) {
    const key = p.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(p);
  }

  return unique.join(" ");
}

export function emptyAttributes(templateId: string): ConditionAttributes {
  return {
    version: 1,
    templateId,
    selections: {},
    fields: {},
  };
}
