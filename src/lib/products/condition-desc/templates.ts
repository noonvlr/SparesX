import type { ConditionTemplate } from "./types";

const BOARD_NO: ConditionTemplate["fields"] = [
  {
    id: "boardNumber",
    label: "Board / part number",
    placeholder: "e.g. board marking or OEM part no.",
    optional: true,
  },
  {
    id: "remarks",
    label: "Additional remarks",
    placeholder: "Anything buyers should know…",
    optional: true,
  },
];

const REMARKS_ONLY: ConditionTemplate["fields"] = [
  {
    id: "remarks",
    label: "Additional remarks",
    placeholder: "Anything buyers should know…",
    optional: true,
  },
];

export const TEMPLATES: Record<string, ConditionTemplate> = {
  motherboard: {
    id: "motherboard",
    label: "Motherboard",
    componentNoun: "motherboard",
    fields: BOARD_NO,
    conflicts: [
      ["untouched", "repaired"],
      ["untouched", "water_damaged"],
      ["untouched", "dead"],
      ["fresh", "repaired"],
      ["fresh", "water_damaged"],
      ["fresh", "dead"],
      ["fresh", "used"],
      ["fully_working", "not_working"],
      ["fully_working", "dead"],
      ["partially_working", "fully_working"],
      ["partially_working", "not_working"],
      ["no_software_lock", "frp_locked"],
      ["no_software_lock", "cloud_locked"],
      ["no_software_lock", "account_locked"],
      ["no_software_lock", "network_locked"],
    ],
    groups: [
      {
        id: "board_condition",
        label: "Board condition",
        mode: "multi",
        options: [
          { id: "untouched", label: "Untouched motherboard" },
          { id: "fresh", label: "Fresh / unused condition" },
          { id: "used", label: "Used motherboard" },
          { id: "refurbished", label: "Refurbished motherboard" },
          { id: "repaired", label: "Repaired motherboard" },
          { id: "water_damaged", label: "Water-damaged motherboard" },
          { id: "dead", label: "Dead / not working" },
        ],
      },
      {
        id: "component_status",
        label: "Component and repair status",
        mode: "multi",
        optional: true,
        options: [
          { id: "emmc_removed", label: "eMMC removed" },
          { id: "ufs_removed", label: "UFS removed" },
          { id: "cpu_removed", label: "CPU removed" },
          { id: "ram_removed", label: "RAM removed" },
          { id: "shield_opened", label: "Shield opened" },
          { id: "shield_removed", label: "Shield removed" },
          { id: "ic_replaced", label: "IC replaced" },
          { id: "jumper_work", label: "Jumper work done" },
          { id: "previous_repair", label: "Previous repair work detected" },
        ],
      },
      {
        id: "lock_status",
        label: "Device lock status",
        mode: "multi",
        optional: true,
        options: [
          { id: "frp_locked", label: "FRP locked" },
          { id: "cloud_locked", label: "Cloud locked" },
          { id: "account_locked", label: "Account locked" },
          { id: "network_locked", label: "Network locked" },
          { id: "no_software_lock", label: "No known software lock" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "single",
        optional: true,
        options: [
          { id: "fully_working", label: "Fully working" },
          { id: "partially_working", label: "Partially working" },
          { id: "not_tested", label: "Not tested" },
          { id: "not_working", label: "Not working" },
        ],
      },
    ],
  },

  display: {
    id: "display",
    label: "Display",
    componentNoun: "display",
    fields: REMARKS_ONLY,
    conflicts: [
      ["original", "aftermarket"],
      ["new_display", "used_display"],
      ["new_display", "heavy_scratches"],
      ["new_display", "cracked_glass"],
      ["no_scratches", "minor_scratches"],
      ["no_scratches", "heavy_scratches"],
      ["no_scratches", "cracked_glass"],
      ["minor_scratches", "heavy_scratches"],
      ["frame_included", "without_frame"],
      ["touch_working", "touch_partial"],
      ["touch_working", "not_tested_func"],
      ["display_working", "not_tested_func"],
    ],
    groups: [
      {
        id: "display_condition",
        label: "Display condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original display" },
          { id: "aftermarket", label: "Compatible / aftermarket display" },
          { id: "refurbished_display", label: "Refurbished display" },
          { id: "new_display", label: "New display" },
          { id: "used_display", label: "Used display" },
        ],
      },
      {
        id: "functional",
        label: "Functional condition",
        mode: "multi",
        optional: true,
        options: [
          { id: "touch_working", label: "Touch working" },
          { id: "display_working", label: "Display working" },
          { id: "lines_present", label: "Lines present" },
          { id: "dead_pixels", label: "Dead pixels" },
          { id: "bleeding", label: "Display bleeding" },
          { id: "touch_partial", label: "Touch partially working" },
          { id: "not_tested_func", label: "Not tested" },
        ],
      },
      {
        id: "physical",
        label: "Physical condition",
        mode: "multi",
        optional: true,
        options: [
          { id: "no_scratches", label: "No scratches" },
          { id: "minor_scratches", label: "Minor scratches" },
          { id: "heavy_scratches", label: "Heavy scratches" },
          { id: "cracked_glass", label: "Cracked glass" },
          { id: "frame_included", label: "Frame included" },
          { id: "without_frame", label: "Without frame" },
        ],
      },
    ],
  },

  chargingBoard: {
    id: "chargingBoard",
    label: "Charging board / port",
    componentNoun: "charging board",
    fields: BOARD_NO,
    conflicts: [
      ["original", "aftermarket"],
      ["new_board", "used_board"],
      ["charging_ok", "faulty"],
      ["not_tested", "faulty"],
    ],
    groups: [
      {
        id: "board_condition",
        label: "Board condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_board", label: "New" },
          { id: "used_board", label: "Used" },
          { id: "refurbished", label: "Refurbished" },
          { id: "repaired", label: "Repaired" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "charging_ok", label: "Charging working" },
          { id: "mic_ok", label: "Microphone working" },
          { id: "usb_data_ok", label: "USB data working" },
          { id: "antenna_ok", label: "Network / antenna section working" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty" },
        ],
      },
    ],
  },

  camera: {
    id: "camera",
    label: "Camera",
    componentNoun: "camera module",
    fields: REMARKS_ONLY,
    conflicts: [
      ["original", "aftermarket"],
      ["new_cam", "used_cam"],
      ["working", "faulty"],
      ["working", "not_tested"],
    ],
    groups: [
      {
        id: "camera_type",
        label: "Camera type",
        mode: "multi",
        optional: true,
        options: [
          { id: "rear", label: "Rear camera" },
          { id: "front", label: "Front / selfie camera" },
          { id: "depth", label: "Depth / secondary camera" },
        ],
      },
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_cam", label: "New" },
          { id: "used_cam", label: "Used" },
          { id: "refurbished", label: "Refurbished" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "working", label: "Focus / image working" },
          { id: "autofocus_issue", label: "Autofocus issue" },
          { id: "spots", label: "Dust / spots on sensor" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty" },
        ],
      },
    ],
  },

  battery: {
    id: "battery",
    label: "Battery",
    componentNoun: "battery",
    fields: [
      {
        id: "healthPercent",
        label: "Reported health % (optional)",
        placeholder: "e.g. 87",
        optional: true,
      },
      ...REMARKS_ONLY,
    ],
    conflicts: [
      ["original", "aftermarket"],
      ["new_bat", "used_bat"],
      ["swelling", "new_bat"],
    ],
    groups: [
      {
        id: "condition",
        label: "Battery condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_bat", label: "New" },
          { id: "used_bat", label: "Used" },
          { id: "refurbished", label: "Refurbished" },
          { id: "swelling", label: "Swelling present" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "holds_charge", label: "Holds charge" },
          { id: "charges_ok", label: "Charges normally" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty / does not charge" },
        ],
      },
    ],
  },

  speaker: {
    id: "speaker",
    label: "Speaker",
    componentNoun: "speaker",
    fields: REMARKS_ONLY,
    conflicts: [
      ["original", "aftermarket"],
      ["working", "faulty"],
      ["working", "not_tested"],
    ],
    groups: [
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_spk", label: "New" },
          { id: "used_spk", label: "Used" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "working", label: "Sound working" },
          { id: "distorted", label: "Distorted / low volume" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty" },
        ],
      },
    ],
  },

  earpiece: {
    id: "earpiece",
    label: "Earpiece",
    componentNoun: "earpiece",
    fields: REMARKS_ONLY,
    conflicts: [
      ["working", "faulty"],
      ["working", "not_tested"],
    ],
    groups: [
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_ep", label: "New" },
          { id: "used_ep", label: "Used" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "working", label: "Audio working" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty" },
        ],
      },
    ],
  },

  flexCable: {
    id: "flexCable",
    label: "Flex cable",
    componentNoun: "flex cable",
    fields: REMARKS_ONLY,
    conflicts: [
      ["original", "aftermarket"],
      ["intact", "torn"],
    ],
    groups: [
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_flex", label: "New" },
          { id: "used_flex", label: "Used" },
          { id: "intact", label: "Intact / no tears" },
          { id: "torn", label: "Torn or damaged" },
        ],
      },
    ],
  },

  buttons: {
    id: "buttons",
    label: "Buttons",
    componentNoun: "button assembly",
    fields: REMARKS_ONLY,
    groups: [
      {
        id: "button_type",
        label: "Button type",
        mode: "multi",
        options: [
          { id: "power", label: "Power button" },
          { id: "volume", label: "Volume button" },
          { id: "mute", label: "Mute / silent switch" },
          { id: "home", label: "Home button" },
        ],
      },
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        optional: true,
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_btn", label: "New" },
          { id: "used_btn", label: "Used" },
          { id: "working", label: "Click / response working" },
          { id: "not_tested", label: "Not tested" },
        ],
      },
    ],
  },

  fingerprint: {
    id: "fingerprint",
    label: "Fingerprint sensor",
    componentNoun: "fingerprint sensor",
    fields: REMARKS_ONLY,
    conflicts: [
      ["working", "faulty"],
      ["working", "not_tested"],
    ],
    groups: [
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_fp", label: "New" },
          { id: "used_fp", label: "Used" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "working", label: "Sensor working" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty" },
        ],
      },
    ],
  },

  subBoard: {
    id: "subBoard",
    label: "Sub-board",
    componentNoun: "sub-board",
    fields: BOARD_NO,
    conflicts: [
      ["original", "aftermarket"],
      ["working", "faulty"],
    ],
    groups: [
      {
        id: "condition",
        label: "Board condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_sb", label: "New" },
          { id: "used_sb", label: "Used" },
          { id: "refurbished", label: "Refurbished" },
          { id: "repaired", label: "Repaired" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "working", label: "Working" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty" },
        ],
      },
    ],
  },

  generic: {
    id: "generic",
    label: "Component",
    componentNoun: "part",
    fields: REMARKS_ONLY,
    conflicts: [
      ["original", "aftermarket"],
      ["new_part", "used_part"],
      ["working", "faulty"],
    ],
    groups: [
      {
        id: "condition",
        label: "Condition",
        mode: "multi",
        options: [
          { id: "original", label: "Original" },
          { id: "aftermarket", label: "Compatible / aftermarket" },
          { id: "new_part", label: "New" },
          { id: "used_part", label: "Used" },
          { id: "refurbished", label: "Refurbished" },
        ],
      },
      {
        id: "functional",
        label: "Functional status",
        mode: "multi",
        optional: true,
        options: [
          { id: "working", label: "Working" },
          { id: "partial", label: "Partially working" },
          { id: "not_tested", label: "Not tested" },
          { id: "faulty", label: "Faulty / not working" },
        ],
      },
    ],
  },
};
