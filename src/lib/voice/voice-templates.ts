export type TemplateType =
  | "tee-par45"
  | "tee-par3"
  | "approach"
  | "chip"
  | "putt"
  | "penalty-drop";

export interface VoiceTemplate {
  type: TemplateType;
  title: string;
  promptParts: PromptPart[];
}

export interface PromptPart {
  text: string;
  isSlot: boolean;
  example?: string;
}

// ── Template definitions ───────────────────────────────────────

const TEE_PAR45: VoiceTemplate = {
  type: "tee-par45",
  title: "Tee Shot",
  promptParts: [
    { text: "Hole ", isSlot: false },
    { text: "number", isSlot: true, example: "one" },
    { text: " is a ", isSlot: false },
    { text: "hole shape", isSlot: true, example: "dogleg left" },
    { text: " hole. I hit ", isSlot: false },
    { text: "club", isSlot: true, example: "driver" },
    { text: " and it went into the ", isSlot: false },
    { text: "result", isSlot: true, example: "left rough" },
    { text: ", about ", isSlot: false },
    { text: "miss distance", isSlot: true, example: "20" },
    { text: " yards ", isSlot: false },
    { text: "miss direction", isSlot: true, example: "left" },
    { text: " of my target. I ended up ", isSlot: false },
    { text: "distance remaining", isSlot: true, example: "150" },
    { text: " yards away.", isSlot: false },
  ],
};

const TEE_PAR3: VoiceTemplate = {
  type: "tee-par3",
  title: "Tee Shot (Par 3)",
  promptParts: [
    { text: "I hit ", isSlot: false },
    { text: "club", isSlot: true, example: "7 iron" },
    { text: " and it went ", isSlot: false },
    { text: "result", isSlot: true, example: "on the green" },
    { text: ", about ", isSlot: false },
    { text: "miss distance", isSlot: true, example: "10" },
    { text: " feet ", isSlot: false },
    { text: "miss direction", isSlot: true, example: "left" },
    { text: " and ", isSlot: false },
    { text: "miss distance Y", isSlot: true, example: "5" },
    { text: " feet ", isSlot: false },
    { text: "long or short", isSlot: true, example: "long" },
    { text: " of the pin.", isSlot: false },
  ],
};

const APPROACH: VoiceTemplate = {
  type: "approach",
  title: "Approach Shot",
  promptParts: [
    { text: "From ", isSlot: false },
    { text: "distance", isSlot: true, example: "150" },
    { text: " yards I hit ", isSlot: false },
    { text: "club", isSlot: true, example: "8 iron" },
    { text: " and it went ", isSlot: false },
    { text: "result", isSlot: true, example: "on the green" },
    { text: ", about ", isSlot: false },
    { text: "miss distance", isSlot: true, example: "10" },
    { text: " feet ", isSlot: false },
    { text: "miss direction", isSlot: true, example: "left" },
    { text: " and ", isSlot: false },
    { text: "miss distance Y", isSlot: true, example: "5" },
    { text: " feet ", isSlot: false },
    { text: "long or short", isSlot: true, example: "long" },
    { text: ".", isSlot: false },
  ],
};

const CHIP: VoiceTemplate = {
  type: "chip",
  title: "Short Game",
  promptParts: [
    { text: "From ", isSlot: false },
    { text: "distance", isSlot: true, example: "30" },
    { text: " yards in the ", isSlot: false },
    { text: "lie", isSlot: true, example: "rough" },
    { text: " I hit ", isSlot: false },
    { text: "club", isSlot: true, example: "SW" },
    { text: " onto the ", isSlot: false },
    { text: "result", isSlot: true, example: "green" },
    { text: ", ", isSlot: false },
    { text: "distance remaining", isSlot: true, example: "8" },
    { text: " feet from the hole.", isSlot: false },
  ],
};

const PUTT: VoiceTemplate = {
  type: "putt",
  title: "Putt",
  promptParts: [
    { text: "From ", isSlot: false },
    { text: "distance", isSlot: true, example: "10" },
    { text: " feet, ", isSlot: false },
    { text: "break", isSlot: true, example: "left to right" },
    { text: " break, ", isSlot: false },
    { text: "slope", isSlot: true, example: "uphill" },
    { text: ". I ", isSlot: false },
    { text: "made or missed", isSlot: true, example: "missed" },
    { text: " it ", isSlot: false },
    { text: "miss direction", isSlot: true, example: "right" },
    { text: ", ", isSlot: false },
    { text: "speed", isSlot: true, example: "short" },
    { text: ".", isSlot: false },
  ],
};

const PENALTY_DROP: VoiceTemplate = {
  type: "penalty-drop",
  title: "Penalty Drop",
  promptParts: [
    { text: "I took a drop. I'm now ", isSlot: false },
    { text: "distance remaining", isSlot: true, example: "140" },
    { text: " yards away in the ", isSlot: false },
    { text: "lie", isSlot: true, example: "rough" },
    { text: ".", isSlot: false },
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
