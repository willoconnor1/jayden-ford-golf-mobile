export type TemplateType =
  | "tee-par45"
  | "tee-par3"
  | "approach"
  | "chip"
  | "putt"
  | "penalty-drop";

export interface ChecklistItem {
  /** Short label shown in the checklist */
  label: string;
  /** Example of what to say */
  example: string;
  /** Whether this item is optional (dimmed in UI) */
  optional?: boolean;
}

export interface VoiceTemplate {
  type: TemplateType;
  title: string;
  checklistItems: ChecklistItem[];
}

// ── Template definitions ───────────────────────────────────────

const TEE_PAR45: VoiceTemplate = {
  type: "tee-par45",
  title: "Tee Shot",
  checklistItems: [
    { label: "Shape", example: "dogleg left", optional: true },
    { label: "Club", example: "driver" },
    { label: "Result", example: "left rough" },
    { label: "Miss", example: "20 yards left", optional: true },
    { label: "Distance left", example: "150 away" },
  ],
};

const TEE_PAR3: VoiceTemplate = {
  type: "tee-par3",
  title: "Tee Shot (Par 3)",
  checklistItems: [
    { label: "Club", example: "7 iron" },
    { label: "Result", example: "on the green" },
    { label: "Miss", example: "10 feet left, 5 feet long", optional: true },
  ],
};

const APPROACH: VoiceTemplate = {
  type: "approach",
  title: "Approach Shot",
  checklistItems: [
    { label: "Club", example: "8 iron" },
    { label: "Result", example: "green" },
    { label: "Miss", example: "10 feet left, 5 feet long", optional: true },
    { label: "Distance left", example: "8 feet away", optional: true },
  ],
};

const CHIP: VoiceTemplate = {
  type: "chip",
  title: "Short Game",
  checklistItems: [
    { label: "Lie", example: "rough", optional: true },
    { label: "Club", example: "sand wedge" },
    { label: "Result", example: "on the green" },
    { label: "Distance left", example: "6 feet" },
  ],
};

const PUTT: VoiceTemplate = {
  type: "putt",
  title: "Putt",
  checklistItems: [
    { label: "Break", example: "left to right", optional: true },
    { label: "Slope", example: "uphill", optional: true },
    { label: "Result", example: "made it  /  missed right" },
    { label: "Speed", example: "short", optional: true },
  ],
};

const PENALTY_DROP: VoiceTemplate = {
  type: "penalty-drop",
  title: "Penalty Drop",
  checklistItems: [
    { label: "Distance left", example: "140 away" },
    { label: "Lie", example: "rough" },
  ],
};

const ALL_TEMPLATES: Record<TemplateType, VoiceTemplate> = {
  "tee-par45": TEE_PAR45,
  "tee-par3": TEE_PAR3,
  "approach": APPROACH,
  "chip": CHIP,
  "putt": PUTT,
  "penalty-drop": PENALTY_DROP,
};

// ── Template selection ─────────────────────────────────────────

export interface ShotContext {
  phase: "shot" | "putt";
  shotIndex: number;
  par: number;
  distanceRemaining?: number;
  previousResultWasPenalty?: boolean;
}

export function selectTemplate(ctx: ShotContext): VoiceTemplate {
  if (ctx.phase === "putt") return ALL_TEMPLATES["putt"];

  if (ctx.previousResultWasPenalty) return ALL_TEMPLATES["penalty-drop"];

  if (ctx.shotIndex === 0) {
    return ctx.par >= 4 ? ALL_TEMPLATES["tee-par45"] : ALL_TEMPLATES["tee-par3"];
  }

  if (ctx.distanceRemaining !== undefined && ctx.distanceRemaining <= 50) {
    return ALL_TEMPLATES["chip"];
  }

  return ALL_TEMPLATES["approach"];
}

export function getTemplate(type: TemplateType): VoiceTemplate {
  return ALL_TEMPLATES[type];
}
