import {
  Round, HoleData, CourseInfo, FairwayHit, Goal,
  ShotData, Club, ShotLie, ShotResult, ShotIntent, ShotDirection,
  HoleShape, PuttMissDirection, PuttSpeed, PuttBreak, PuttSlope,
} from "./types";

// ── Deterministic pseudo-random ────────────────────────────────

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Box-Muller transform for normal distribution */
function gaussianRandom(rand: () => number): number {
  const u1 = Math.max(rand(), 0.0001);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function pickRandom<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ── Club Data Tables ───────────────────────────────────────────

const CLUB_DISTANCES: Record<Club, { min: number; max: number; typical: number }> = {
  "driver":    { min: 250, max: 310, typical: 280 },
  "3-wood":    { min: 220, max: 260, typical: 240 },
  "5-wood":    { min: 200, max: 240, typical: 215 },
  "7-wood":    { min: 185, max: 215, typical: 200 },
  "2-hybrid":  { min: 210, max: 240, typical: 225 },
  "3-hybrid":  { min: 200, max: 230, typical: 210 },
  "4-hybrid":  { min: 190, max: 220, typical: 200 },
  "5-hybrid":  { min: 180, max: 210, typical: 190 },
  "2-iron":    { min: 210, max: 240, typical: 220 },
  "3-iron":    { min: 200, max: 225, typical: 210 },
  "4-iron":    { min: 190, max: 215, typical: 200 },
  "5-iron":    { min: 175, max: 200, typical: 185 },
  "6-iron":    { min: 165, max: 190, typical: 175 },
  "7-iron":    { min: 155, max: 178, typical: 165 },
  "8-iron":    { min: 140, max: 165, typical: 150 },
  "9-iron":    { min: 125, max: 150, typical: 135 },
  "pw":        { min: 110, max: 135, typical: 120 },
  "gw":        { min: 90,  max: 115, typical: 100 },
  "sw":        { min: 70,  max: 95,  typical: 80  },
  "lw":        { min: 40,  max: 75,  typical: 60  },
};

/** Dispersion spread in feet for each club (1 standard deviation) */
const CLUB_DISPERSION: Record<Club, { xSpread: number; ySpread: number }> = {
  "driver":    { xSpread: 42, ySpread: 27 },
  "3-wood":    { xSpread: 33, ySpread: 21 },
  "5-wood":    { xSpread: 27, ySpread: 18 },
  "7-wood":    { xSpread: 24, ySpread: 15 },
  "2-hybrid":  { xSpread: 27, ySpread: 18 },
  "3-hybrid":  { xSpread: 24, ySpread: 15 },
  "4-hybrid":  { xSpread: 21, ySpread: 14 },
  "5-hybrid":  { xSpread: 20, ySpread: 13 },
  "2-iron":    { xSpread: 24, ySpread: 16 },
  "3-iron":    { xSpread: 22, ySpread: 15 },
  "4-iron":    { xSpread: 20, ySpread: 13 },
  "5-iron":    { xSpread: 18, ySpread: 12 },
  "6-iron":    { xSpread: 16, ySpread: 11 },
  "7-iron":    { xSpread: 14, ySpread: 10 },
  "8-iron":    { xSpread: 12, ySpread: 9 },
  "9-iron":    { xSpread: 10, ySpread: 8 },
  "pw":        { xSpread: 9,  ySpread: 7 },
  "gw":        { xSpread: 8,  ySpread: 6 },
  "sw":        { xSpread: 8,  ySpread: 6 },
  "lw":        { xSpread: 10, ySpread: 8 },
};

// Ordered from longest to shortest for club selection
const CLUB_ORDER: Club[] = [
  "driver", "3-wood", "5-wood", "7-wood",
  "2-iron", "3-hybrid", "4-iron", "5-iron",
  "6-iron", "7-iron", "8-iron", "9-iron",
  "pw", "gw", "sw", "lw",
];

// ── Shot Generation ────────────────────────────────────────────

function selectClub(
  distance: number,
  lie: ShotLie,
  par: number,
  shotIndex: number,
  rand: () => number,
): Club {
  // Tee shot on par 4/5
  if (shotIndex === 0 && par >= 4) {
    if (distance < 380 && rand() < 0.25) return "3-wood";
    return "driver";
  }

  // From sand near green
  if (lie === "sand" && distance < 50) return rand() < 0.6 ? "sw" : "lw";

  // Recovery shots
  if (lie === "abnormal" || lie === "penalty-area") {
    if (distance < 80) return "sw";
    if (distance < 140) return "9-iron";
    return "7-iron";
  }

  // From rough near green
  if (lie === "rough" && distance < 40) return rand() < 0.5 ? "sw" : "lw";

  // Standard club selection: find best match
  let bestClub: Club = "pw";
  let bestDiff = Infinity;
  for (const club of CLUB_ORDER) {
    if (club === "driver" && shotIndex > 0) continue; // only driver off tee
    const cd = CLUB_DISTANCES[club];
    const diff = Math.abs(cd.typical - distance);
    if (diff < bestDiff && distance >= cd.min * 0.8 && distance <= cd.max * 1.2) {
      bestDiff = diff;
      bestClub = club;
    }
  }
  return bestClub;
}

function resultToShotLie(result: ShotResult): ShotLie {
  switch (result) {
    case "fairway": return "fairway";
    case "rough": return "rough";
    case "sand": return "sand";
    case "green": return "fairway"; // won't be used after green
    case "holed": return "fairway";
    case "tree-trouble": return "rough";
    case "penalty-area": return "penalty-area";
    case "out-of-bounds": return "tee";
    case "abnormal": return "abnormal";
    default: return "fairway";
  }
}

function generateShotsForHole(
  hole: HoleData,
  rand: () => number,
): ShotData[] {
  const { par, distance, score, fairwayHit, greenInRegulation, putts,
    penaltyStrokes, sandSaveAttempt } = hole;

  // shots.length = score - putts - penaltyStrokes
  // (penalty adds to score but isn't a separate shot object)
  const numShots = Math.max(1, score - putts - penaltyStrokes);

  // Identify which shot index is the "missed green" shot for non-GIR holes.
  // The LAST shot always reaches the green. The second-to-last misses if !GIR.
  const missGreenIdx = (!greenInRegulation && numShots >= 2) ? numShots - 2 : -1;

  const shots: ShotData[] = [];
  let remaining = distance;
  let currentLie: ShotLie = "tee";
  let penaltyUsed = false;

  for (let i = 0; i < numShots; i++) {
    const isFirst = i === 0;
    const isLast = i === numShots - 1;
    const isMissGreenShot = i === missGreenIdx;

    // Determine intent
    // Leave intent undefined for chip shots near the green (non-GIR last shot)
    // so SG categorizes them as "aroundTheGreen" via distance fallback
    let intent: ShotIntent | undefined = "green";
    if (par === 5 && i === 1 && remaining > 240 && !isLast) {
      intent = "lay-up";
    }
    if (currentLie === "penalty-area" || currentLie === "abnormal") {
      intent = "recovery";
    }
    if (isLast && !greenInRegulation && numShots >= 2) {
      intent = undefined; // chip/pitch — let SG use distance-based categorization
    }

    // Select club
    const targetDist = intent === "lay-up"
      ? Math.min(remaining - 100, CLUB_DISTANCES["3-wood"].typical)
      : remaining;
    const club = selectClub(targetDist, currentLie, par, i, rand);
    const clubData = CLUB_DISTANCES[club];

    // Actual target distance
    const actualTarget = intent === "lay-up"
      ? Math.min(clubData.typical, remaining - 80 - rand() * 40)
      : Math.min(clubData.typical, remaining);

    // Generate miss (in feet)
    const disp = CLUB_DISPERSION[club];
    let missX = Math.round(gaussianRandom(rand) * disp.xSpread);
    let missY = Math.round(gaussianRandom(rand) * disp.ySpread);

    // For driver, force missY to 0 (left/right only pattern)
    if (club === "driver") missY = 0;

    // Determine result — must be consistent with hole data
    let result: ShotResult;
    let penaltyDrop = false;

    if (isFirst && par >= 4 && penaltyStrokes > 0 && !penaltyUsed && rand() < 0.7) {
      // Penalty shot (OB or water)
      result = rand() < 0.5 ? "out-of-bounds" : "penalty-area";
      penaltyDrop = true;
      penaltyUsed = true;
      remaining = Math.max(remaining - 20, remaining * 0.9);
    } else if (isFirst && par >= 4) {
      // Tee shot result must match fairwayHit
      if (fairwayHit === "yes") {
        result = "fairway";
      } else {
        result = rand() < 0.65 ? "rough" : (rand() < 0.5 ? "sand" : "tree-trouble");
      }
      const advance = clubData.typical + (rand() - 0.5) * 30;
      remaining = Math.max(10, remaining - advance);
    } else if (isLast) {
      // LAST shot always reaches the green (or holes out if 0 putts)
      result = putts === 0 ? "holed" : "green";
      remaining = 0;
    } else if (isMissGreenShot) {
      // This shot MISSES the green (sets up the chip for non-GIR holes)
      if (sandSaveAttempt) {
        result = "sand";
      } else {
        result = rand() < 0.7 ? "rough" : "sand";
      }
      // Leave the ball 5-30 yards from the green
      remaining = Math.max(5, Math.floor(rand() * 25 + 5));
    } else {
      // Intermediate shot — advance toward hole
      const advance = Math.min(actualTarget, remaining - 30) + (rand() - 0.5) * 20;
      remaining = Math.max(30, remaining - advance);
      result = rand() < 0.6 ? "fairway" : "rough";
    }

    // Direction based on miss
    let direction: ShotDirection[] | undefined;
    if (missX < -10) direction = ["left"];
    else if (missX > 10) direction = ["right"];
    else if (missY < -10) direction = ["short"];
    else if (missY > 10) direction = ["long"];

    shots.push({
      club,
      targetDistance: Math.round(Math.max(1, actualTarget)),
      lie: currentLie,
      missX,
      missY,
      result,
      intent,
      distanceRemaining: Math.max(0, Math.round(remaining)),
      direction,
      penaltyDrop: penaltyDrop || undefined,
    });

    currentLie = resultToShotLie(result);
  }

  // Handle any unused penalty (attach to tee shot if needed)
  if (penaltyStrokes > 0 && !penaltyUsed && shots.length > 0) {
    shots[0].penaltyDrop = true;
    shots[0].result = "penalty-area";
  }

  return shots;
}

function generatePuttMisses(
  hole: HoleData,
  rand: () => number,
): HoleData["puttMisses"] {
  if (hole.putts === 0) return undefined;

  const misses: NonNullable<HoleData["puttMisses"]> = [];

  for (let i = 0; i < hole.putts; i++) {
    const isLast = i === hole.putts - 1;
    const breaks: PuttBreak[] = ["straight", "right-to-left", "left-to-right", "multiple"];
    const slopes: PuttSlope[] = ["uphill", "downhill", "flat", "multiple"];

    if (isLast) {
      // Holed putt
      misses.push({
        missX: 0,
        missY: 0,
        missDirection: "good-line" as PuttMissDirection,
        speed: "good-speed" as PuttSpeed,
        puttBreak: pickRandom(rand, breaks),
        puttSlope: pickRandom(rand, slopes),
      });
    } else {
      // Missed putt
      const nextDist = hole.puttDistances[i + 1] ?? 3;
      const missX = Math.round((rand() - 0.5) * nextDist * 1.5);
      const missY = Math.round((rand() - 0.5) * nextDist * 1.0);

      const missDirection: PuttMissDirection =
        missX < -0.5 ? "left" : missX > 0.5 ? "right" : "good-line";
      const speed: PuttSpeed =
        missY < -0.5 ? "short" : missY > 0.5 ? "too-firm" : "good-speed";

      misses.push({
        missX,
        missY,
        missDirection,
        speed,
        puttBreak: pickRandom(rand, breaks),
        puttSlope: pickRandom(rand, slopes),
      });
    }
  }

  return misses;
}

// ── Hole Data Generation ───────────────────────────────────────

function generateHoleData(
  course: CourseInfo,
  scores: number[],
  seed: number,
): HoleData[] {
  const rand = seededRandom(seed);
  const holeShapes: HoleShape[] = ["straight", "dogleg-left", "dogleg-right"];

  return scores.map((score, i) => {
    const par = course.holePars[i];
    const distance = course.holeDistances[i];
    const diff = score - par;

    // Fairway hit
    let fairwayHit: FairwayHit;
    if (par === 3) {
      fairwayHit = "na";
    } else {
      fairwayHit = rand() < (diff <= 0 ? 0.72 : 0.50) ? "yes" : "no";
    }

    // GIR
    let greenInRegulation: boolean;
    if (diff <= -1) {
      greenInRegulation = rand() < 0.82;
    } else if (diff === 0) {
      greenInRegulation = rand() < 0.62;
    } else {
      greenInRegulation = rand() < 0.22;
    }

    // Putts & putt distances
    let putts: number;
    let firstPuttDist: number;

    if (greenInRegulation) {
      if (diff <= -1) {
        putts = 1;
        firstPuttDist = Math.floor(rand() * 12) + 5;
      } else if (diff === 0) {
        putts = 2;
        firstPuttDist = Math.floor(rand() * 25) + 12;
      } else if (diff === 1) {
        putts = rand() < 0.6 ? 3 : 2;
        firstPuttDist = Math.floor(rand() * 20) + 28;
      } else {
        putts = 3;
        firstPuttDist = Math.floor(rand() * 15) + 35;
      }
    } else {
      if (diff <= -1) {
        putts = rand() < 0.25 ? 0 : 1;
        firstPuttDist = putts === 0 ? 0 : Math.floor(rand() * 4) + 1;
      } else if (diff === 0) {
        putts = 1;
        firstPuttDist = Math.floor(rand() * 6) + 2;
      } else if (diff === 1) {
        putts = 2;
        firstPuttDist = Math.floor(rand() * 15) + 8;
      } else {
        putts = 2;
        firstPuttDist = Math.floor(rand() * 12) + 10;
      }
    }

    // Build putt distances array
    const puttDistances: number[] = [];
    if (putts > 0) {
      puttDistances.push(firstPuttDist);
      let rem = firstPuttDist;
      for (let j = 1; j < putts; j++) {
        rem = Math.max(1, Math.floor(rem * (rand() * 0.3 + 0.2)));
        puttDistances.push(rem);
      }
    }

    // Up & down
    const upAndDownAttempt = !greenInRegulation;
    const upAndDownConverted = upAndDownAttempt && diff <= 0;

    // Sand save
    let sandSaveAttempt = false;
    let sandSaveConverted = false;
    if (upAndDownAttempt && rand() < 0.18) {
      sandSaveAttempt = true;
      sandSaveConverted = upAndDownConverted;
    }

    // Penalty strokes
    let penaltyStrokes = 0;
    if (diff >= 2 && rand() < 0.5) {
      penaltyStrokes = 1;
    }

    // Hole shape
    const holeShape = par === 3
      ? "straight" as HoleShape
      : pickRandom(rand, holeShapes);

    // Build base hole data first
    const holeData: HoleData = {
      holeNumber: i + 1,
      par,
      distance,
      score,
      fairwayHit,
      greenInRegulation,
      putts,
      puttDistances,
      penaltyStrokes,
      upAndDownAttempt,
      upAndDownConverted,
      sandSaveAttempt,
      sandSaveConverted,
      holeShape,
    };

    // Generate detailed shots
    holeData.shots = generateShotsForHole(holeData, rand);

    // Generate putt misses
    holeData.puttMisses = generatePuttMisses(holeData, rand);

    return holeData;
  });
}

// ── Course Definitions ─────────────────────────────────────────

const STANDARD_PARS = [4, 5, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5];

const courses: Record<string, CourseInfo> = {
  // ── Original 10 Courses ──────────────────────────────────────
  royalWellington: {
    name: "Royal Wellington Golf Club",
    tees: "Championship",
    rating: 73.5,
    slope: 135,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [425, 545, 415, 185, 440, 395, 195, 430, 555, 420, 445, 175, 535, 425, 435, 400, 200, 560],
  },
  paraparaumu: {
    name: "Paraparaumu Beach Golf Club",
    tees: "Championship",
    rating: 72.0,
    slope: 130,
    totalPar: 71,
    holePars: [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 4, 3, 4],
    holeDistances: [400, 385, 430, 165, 510, 375, 180, 445, 540, 415, 390, 155, 525, 410, 435, 395, 190, 420],
  },
  gulfHarbour: {
    name: "Gulf Harbour Country Club",
    tees: "Championship",
    rating: 73.0,
    slope: 132,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [430, 540, 420, 190, 445, 400, 185, 435, 550, 425, 440, 180, 530, 415, 430, 405, 195, 555],
  },
  royalMelbourne: {
    name: "Royal Melbourne Golf Club (West)",
    tees: "Championship",
    rating: 74.5,
    slope: 140,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [435, 555, 425, 195, 450, 410, 200, 440, 565, 430, 455, 185, 545, 430, 445, 410, 205, 570],
  },
  theAustralian: {
    name: "The Australian Golf Club",
    tees: "Championship",
    rating: 73.0,
    slope: 137,
    totalPar: 71,
    holePars: [4, 4, 4, 3, 5, 4, 3, 4, 4, 4, 4, 3, 5, 5, 4, 4, 3, 4],
    holeDistances: [410, 395, 440, 175, 520, 385, 195, 430, 415, 420, 400, 165, 535, 530, 425, 410, 185, 435],
  },
  clearwater: {
    name: "Clearwater Golf Club",
    tees: "Championship",
    rating: 72.5,
    slope: 128,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [415, 535, 405, 180, 435, 390, 190, 425, 545, 410, 435, 170, 525, 420, 430, 395, 195, 550],
  },
  kingstonHeath: {
    name: "Kingston Heath Golf Club",
    tees: "Championship",
    rating: 74.0,
    slope: 138,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [440, 550, 430, 195, 455, 405, 200, 445, 560, 435, 450, 185, 540, 425, 440, 415, 210, 565],
  },
  millbrook: {
    name: "Millbrook Resort",
    tees: "Championship",
    rating: 73.0,
    slope: 131,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [420, 530, 400, 175, 430, 385, 185, 420, 540, 405, 430, 170, 520, 415, 425, 390, 190, 545],
  },
  royalQueensland: {
    name: "Royal Queensland Golf Club",
    tees: "Championship",
    rating: 73.5,
    slope: 136,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [430, 545, 420, 190, 445, 400, 195, 435, 555, 425, 445, 180, 535, 420, 435, 405, 200, 560],
  },
  theHills: {
    name: "The Hills Golf Club",
    tees: "Championship",
    rating: 73.0,
    slope: 133,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [425, 540, 410, 185, 440, 395, 190, 430, 550, 415, 440, 175, 530, 420, 430, 400, 195, 555],
  },

  // ── 20 New Courses ───────────────────────────────────────────
  capeKidnappers: {
    name: "Cape Kidnappers Golf Course",
    tees: "Championship",
    rating: 74.0,
    slope: 139,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [445, 560, 435, 200, 460, 415, 210, 450, 575, 440, 460, 190, 550, 435, 450, 420, 215, 580],
  },
  kauriCliffs: {
    name: "Kauri Cliffs",
    tees: "Championship",
    rating: 73.5,
    slope: 136,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [430, 545, 420, 185, 445, 400, 195, 435, 560, 425, 450, 180, 540, 430, 440, 405, 200, 565],
  },
  taraIti: {
    name: "Tara Iti Golf Club",
    tees: "Championship",
    rating: 72.5,
    slope: 130,
    totalPar: 71,
    holePars: [4, 4, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 4, 4, 4, 4, 3, 5],
    holeDistances: [410, 390, 425, 170, 515, 380, 175, 440, 535, 405, 395, 160, 430, 415, 420, 390, 185, 545],
  },
  wairakei: {
    name: "Wairakei International Golf Course",
    tees: "Championship",
    rating: 72.0,
    slope: 128,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [410, 530, 400, 175, 430, 385, 180, 420, 540, 405, 425, 165, 520, 410, 425, 390, 185, 545],
  },
  titirangi: {
    name: "Titirangi Golf Club",
    tees: "Championship",
    rating: 72.5,
    slope: 131,
    totalPar: 70,
    holePars: [4, 4, 4, 3, 4, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5],
    holeDistances: [405, 385, 420, 165, 415, 390, 175, 435, 410, 400, 395, 155, 525, 405, 430, 395, 180, 540],
  },
  newSouthWales: {
    name: "New South Wales Golf Club",
    tees: "Championship",
    rating: 73.5,
    slope: 137,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [435, 550, 425, 190, 450, 405, 200, 440, 560, 430, 450, 180, 540, 425, 440, 410, 205, 570],
  },
  barnbougleDunes: {
    name: "Barnbougle Dunes",
    tees: "Championship",
    rating: 72.0,
    slope: 129,
    totalPar: 71,
    holePars: [4, 4, 4, 3, 5, 4, 3, 4, 4, 4, 4, 3, 5, 4, 4, 4, 3, 5],
    holeDistances: [395, 380, 415, 160, 505, 370, 170, 430, 400, 410, 385, 150, 520, 400, 425, 385, 175, 535],
  },
  barnbougleLostFarm: {
    name: "Barnbougle Lost Farm",
    tees: "Championship",
    rating: 73.0,
    slope: 132,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [420, 535, 410, 180, 440, 395, 190, 430, 545, 415, 435, 170, 525, 415, 430, 400, 195, 550],
  },
  ellerston: {
    name: "Ellerston Golf Course",
    tees: "Championship",
    rating: 73.5,
    slope: 135,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [430, 545, 420, 185, 445, 400, 195, 435, 555, 425, 445, 175, 535, 425, 435, 405, 200, 560],
  },
  springCreek: {
    name: "Spring Creek Ranch",
    tees: "Championship",
    rating: 72.0,
    slope: 127,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [405, 525, 395, 170, 425, 380, 175, 415, 535, 400, 420, 160, 515, 405, 420, 385, 180, 540],
  },
  nationalGC: {
    name: "The National Golf Club (Cape Schanck)",
    tees: "Championship",
    rating: 74.0,
    slope: 140,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [440, 555, 430, 195, 455, 410, 205, 445, 570, 435, 455, 185, 545, 430, 445, 415, 210, 575],
  },
  terreyHills: {
    name: "Terrey Hills Golf Club",
    tees: "Championship",
    rating: 72.5,
    slope: 130,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [415, 530, 405, 175, 435, 390, 185, 425, 545, 410, 430, 170, 520, 415, 425, 395, 190, 550],
  },
  peninsulaKingswood: {
    name: "Peninsula Kingswood Country Club",
    tees: "Championship",
    rating: 73.0,
    slope: 133,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [425, 540, 415, 185, 440, 395, 190, 430, 550, 420, 440, 175, 530, 420, 435, 400, 195, 555],
  },
  victoriaGC: {
    name: "Victoria Golf Club",
    tees: "Championship",
    rating: 73.5,
    slope: 136,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [430, 545, 420, 190, 445, 400, 200, 435, 555, 425, 445, 180, 535, 425, 440, 405, 200, 560],
  },
  metropolitanGC: {
    name: "Metropolitan Golf Club",
    tees: "Championship",
    rating: 73.5,
    slope: 137,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [435, 550, 425, 190, 450, 405, 200, 440, 560, 430, 450, 185, 540, 425, 440, 410, 205, 565],
  },
  kooyonga: {
    name: "Kooyonga Golf Club",
    tees: "Championship",
    rating: 72.5,
    slope: 131,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [415, 530, 405, 175, 435, 390, 185, 425, 545, 410, 430, 170, 525, 415, 430, 395, 190, 550],
  },
  newPlymouth: {
    name: "New Plymouth Golf Club",
    tees: "Championship",
    rating: 71.5,
    slope: 126,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [400, 520, 390, 170, 425, 380, 175, 415, 530, 395, 420, 160, 510, 400, 415, 385, 180, 535],
  },
  muriwai: {
    name: "Muriwai Golf Links",
    tees: "Championship",
    rating: 72.0,
    slope: 128,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [410, 530, 400, 175, 430, 385, 180, 420, 540, 405, 425, 165, 520, 410, 425, 390, 185, 545],
  },
  whitfordPark: {
    name: "Whitford Park Golf Club",
    tees: "Championship",
    rating: 71.0,
    slope: 124,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [395, 515, 385, 165, 420, 375, 170, 410, 525, 390, 415, 155, 505, 395, 410, 380, 175, 530],
  },
  wainui: {
    name: "Wainui Golf Club",
    tees: "Championship",
    rating: 71.5,
    slope: 125,
    totalPar: 72,
    holePars: STANDARD_PARS,
    holeDistances: [400, 520, 390, 170, 425, 380, 175, 415, 535, 395, 420, 160, 510, 400, 420, 385, 180, 540],
  },
};

// ── Round Scores (hole-by-hole) ────────────────────────────────

// Round 1: Royal Wellington – 70 (-2)
// Birdies: H2(5→4), H5(4→3), H11(4→3), H18(5→4)
// Bogeys: H8(4→5), H14(4→5)
const scores1 = [4, 4, 4, 3, 3, 4, 3, 5, 5, 4, 3, 3, 5, 5, 4, 4, 3, 4];

// Round 2: Paraparaumu – 69 (-2)
// Birdies: H2(4→3), H5(5→4), H7(3→2)
// Bogey: H14(4→5)
const scores2 = [4, 3, 4, 3, 4, 4, 2, 4, 5, 4, 4, 3, 5, 5, 4, 4, 3, 4];

// Round 3: Gulf Harbour – 73 (+1)
// Birdies: H16(4→3)
// Bogeys: H3(4→5), H15(4→5)
const scores3 = [4, 5, 5, 3, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 5, 3, 3, 5];

// Round 4: Royal Melbourne – 72 (E)
// Birdies: H2(5→4), H11(4→3)
// Bogeys: H6(4→5), H14(4→5)
const scores4 = [4, 4, 4, 3, 4, 5, 3, 4, 5, 4, 3, 3, 5, 5, 4, 4, 3, 5];

// Round 5: The Australian – 68 (-3)
// Birdies: H1(4→3), H4(3→2), H9(4→3), H13(5→4)
// Bogey: H18(4→5)
const scores5 = [3, 4, 4, 2, 5, 4, 3, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 5];

// Round 6: Clearwater – 71 (-1)
// Birdies: H3(4→3), H9(5→4), H16(4→3)
// Double bogey: H13(5→7) — penalty stroke round
const scores6 = [4, 5, 3, 3, 4, 4, 3, 4, 4, 4, 4, 3, 7, 4, 4, 3, 3, 5];

// Round 7: Kingston Heath – 74 (+2)
// Birdie: H14(4→3)
// Bogeys: H1(4→5), H5(4→5), H17(3→4)
const scores7 = [5, 5, 4, 3, 5, 4, 3, 4, 5, 4, 4, 3, 5, 3, 4, 4, 4, 5];

// Round 8: Millbrook – 69 (-3)
// Birdies: H2(5→4), H3(4→3), H7(3→2)
const scores8 = [4, 4, 3, 3, 4, 4, 2, 4, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5];

// Round 9: Royal Queensland – 71 (-1)
// Birdies: H5(4→3), H11(4→3)
// Bogey: H14(4→5)
const scores9 = [4, 5, 4, 3, 3, 4, 3, 4, 5, 4, 3, 3, 5, 5, 4, 4, 3, 5];

// Round 10: The Hills – 70 (-2)
// Birdies: H4(3→2), H11(4→3), H16(4→3)
// Bogey: H14(4→5)
const scores10 = [4, 5, 4, 2, 4, 4, 3, 4, 5, 4, 3, 3, 5, 5, 4, 3, 3, 5];

// ── New Rounds 11-30 ───────────────────────────────────────────

// Round 11: Cape Kidnappers – 72 (E)
// Birdies: H5(4→3), H12(3→2)
// Bogeys: H1(4→5), H18(5→6)
const scores11 = [5, 5, 4, 3, 3, 4, 3, 4, 5, 4, 4, 2, 5, 4, 4, 4, 3, 6];

// Round 12: Kauri Cliffs – 70 (-2)
// Birdies: H3(4→3), H9(5→4), H15(4→3)
// Bogey: H7(3→4)
const scores12 = [4, 5, 3, 3, 4, 4, 4, 4, 4, 4, 4, 3, 5, 4, 3, 4, 3, 5];

// Round 13: Tara Iti – 68 (-3)
// Birdies: H2(4→3), H5(5→4), H10(4→3), H16(4→3)
// Bogey: H13(4→5)
const scores13 = [4, 3, 4, 3, 4, 4, 3, 4, 5, 3, 4, 3, 5, 4, 4, 3, 3, 5];

// Round 14: Wairakei – 74 (+2)
// Birdie: H9(5→4)
// Bogeys: H3(4→5), H8(4→5), H16(4→5)
const scores14 = [4, 5, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 5, 3, 5];

// Round 15: Titirangi – 67 (-3)
// Birdies: H1(4→3), H6(4→3), H13(5→4), H18(5→4)
// Bogey: H9(4→5)
const scores15 = [3, 4, 4, 3, 4, 3, 3, 4, 5, 4, 4, 3, 4, 4, 4, 4, 3, 4];

// Round 16: New South Wales – 71 (-1)
// Birdies: H4(3→2), H11(4→3)
// Bogey: H6(4→5)
const scores16 = [4, 5, 4, 2, 4, 5, 3, 4, 5, 4, 3, 3, 5, 4, 4, 4, 3, 5];

// Round 17: Barnbougle Dunes – 69 (-2)
// Birdies: H1(4→3), H7(3→2), H13(5→4)
// Bogey: H18(5→6)
const scores17 = [3, 4, 4, 3, 5, 4, 2, 4, 4, 4, 4, 3, 4, 4, 4, 4, 3, 6];

// Round 18: Barnbougle Lost Farm – 73 (+1)
// Birdie: H4(3→2)
// Bogeys: H15(4→5), H17(3→4)
const scores18 = [4, 5, 4, 2, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 5, 4, 4, 5];

// Round 19: Ellerston – 70 (-2)
// Birdies: H2(5→4), H8(4→3), H11(4→3)
// Bogey: H14(4→5)
const scores19 = [4, 4, 4, 3, 4, 4, 3, 3, 5, 4, 3, 3, 5, 5, 4, 4, 3, 5];

// Round 20: Spring Creek – 76 (+4)
// Double bogeys: H6(4→6), H13(5→7)
// Bogeys: H3(4→5), H10(4→5)
// Birdie: H17(3→2)
const scores20 = [4, 5, 5, 3, 4, 6, 3, 4, 5, 5, 4, 3, 7, 4, 4, 4, 2, 5];

// Round 21: The National GC – 72 (E)
// Birdies: H7(3→2), H16(4→3)
// Bogeys: H2(5→6), H10(4→5)
const scores21 = [4, 6, 4, 3, 4, 4, 2, 4, 5, 5, 4, 3, 5, 4, 4, 3, 3, 5];

// Round 22: Terrey Hills – 68 (-4)
// Birdies: H1(4→3), H5(4→3), H9(5→4), H11(4→3), H14(4→3), H18(5→4)
// Bogeys: H6(4→5), H12(3→4)
const scores22 = [3, 5, 4, 3, 3, 5, 3, 4, 4, 4, 3, 4, 5, 3, 4, 4, 3, 4];

// Round 23: Peninsula Kingswood – 71 (-1)
// Birdies: H3(4→3), H13(5→4)
// Bogey: H8(4→5)
const scores23 = [4, 5, 3, 3, 4, 4, 3, 5, 5, 4, 4, 3, 4, 4, 4, 4, 3, 5];

// Round 24: Victoria GC – 73 (+1)
// Birdie: H11(4→3)
// Bogeys: H5(4→5), H9(5→6)
const scores24 = [4, 5, 4, 3, 5, 4, 3, 4, 6, 4, 3, 3, 5, 4, 4, 4, 3, 5];

// Round 25: Metropolitan GC – 66 (-6)
// Birdies: H1(4→3), H3(4→3), H5(4→3), H7(3→2), H9(5→4), H11(4→3), H13(5→4), H18(5→4)
// Bogeys: H6(4→5), H14(4→5)
const scores25 = [3, 5, 3, 3, 3, 5, 2, 4, 4, 4, 3, 3, 4, 5, 4, 4, 3, 4];

// Round 26: Kooyonga – 70 (-2)
// Birdies: H4(3→2), H9(5→4), H15(4→3)
// Bogey: H18(5→6)
const scores26 = [4, 5, 4, 2, 4, 4, 3, 4, 4, 4, 4, 3, 5, 4, 3, 4, 3, 6];

// Round 27: New Plymouth – 72 (E)
// Birdies: H2(5→4), H12(3→2)
// Bogeys: H6(4→5), H16(4→5)
const scores27 = [4, 4, 4, 3, 4, 5, 3, 4, 5, 4, 4, 2, 5, 4, 4, 5, 3, 5];

// Round 28: Muriwai – 76 (+4)
// Double bogey: H9(5→7)
// Bogeys: H1(4→5), H5(4→5), H14(4→5), H18(5→6)
// Birdie: H12(3→2)
const scores28 = [5, 5, 4, 3, 5, 4, 3, 4, 7, 4, 4, 2, 5, 5, 4, 4, 3, 6];

// Round 29: Whitford Park – 71 (-1)
// Birdies: H3(4→3), H7(3→2), H16(4→3)
// Bogeys: H9(5→6), H13(5→6)
const scores29 = [4, 5, 3, 3, 4, 4, 2, 4, 6, 4, 4, 3, 6, 4, 4, 3, 3, 5];

// Round 30: Wainui – 69 (-3)
// Birdies: H1(4→3), H5(4→3), H10(4→3), H18(5→4)
// Bogey: H14(4→5)
const scores30 = [3, 5, 4, 3, 3, 4, 3, 4, 5, 3, 4, 3, 5, 5, 4, 4, 3, 4];

// ── Build Rounds ───────────────────────────────────────────────

interface RoundDef {
  courseKey: keyof typeof courses;
  date: string;
  scores: number[];
  notes: string;
  seed: number;
}

const roundDefs: RoundDef[] = [
  // ── Original 10 ──────────────────────────────────────────────
  {
    courseKey: "royalWellington",
    date: "2025-12-05",
    scores: scores1,
    notes: "Solid day at home. Great iron play on the back nine. Two sloppy bogeys but recovered well.",
    seed: 1001,
  },
  {
    courseKey: "paraparaumu",
    date: "2025-12-14",
    scores: scores2,
    notes: "Links golf at its best. Wind was up but managed it well. Ace attempt on 7!",
    seed: 1002,
  },
  {
    courseKey: "gulfHarbour",
    date: "2026-01-03",
    scores: scores3,
    notes: "Tough conditions — swirling winds off the harbour. Approach game let me down today.",
    seed: 1003,
  },
  {
    courseKey: "royalMelbourne",
    date: "2026-01-18",
    scores: scores4,
    notes: "First round on the West course. Sand belt golf is no joke — fast greens. Happy with even par here.",
    seed: 1004,
  },
  {
    courseKey: "theAustralian",
    date: "2026-01-25",
    scores: scores5,
    notes: "Best ball-striking round in weeks. Everything clicked. Putter was hot — nearly holed the approach on 4.",
    seed: 1005,
  },
  {
    courseKey: "clearwater",
    date: "2026-02-08",
    scores: scores6,
    notes: "Pro-Am round. Disaster on 13 — OB left, penalty drop, couldn't save it. Rest of the round was solid.",
    seed: 1006,
  },
  {
    courseKey: "kingstonHeath",
    date: "2026-02-15",
    scores: scores7,
    notes: "Melbourne sandbelt test. Drove it poorly on the front nine. Need to work on driver consistency.",
    seed: 1007,
  },
  {
    courseKey: "millbrook",
    date: "2026-02-28",
    scores: scores8,
    notes: "Beautiful Queenstown backdrop. Struck it pure today, especially the irons. Love this place.",
    seed: 1008,
  },
  {
    courseKey: "royalQueensland",
    date: "2026-03-08",
    scores: scores9,
    notes: "Tour qualifier. Kept it in play, just couldn't convert enough birdie putts.",
    seed: 1009,
  },
  {
    courseKey: "theHills",
    date: "2026-03-15",
    scores: scores10,
    notes: "Great way to wrap up the Queenstown swing. Dialled-in wedge play, nearly eagled 13.",
    seed: 1010,
  },

  // ── New 20 Rounds ────────────────────────────────────────────
  {
    courseKey: "capeKidnappers",
    date: "2025-10-11",
    scores: scores11,
    notes: "Season opener at the Cape. Dramatic cliffside holes. Getting the feel back after winter break.",
    seed: 2001,
  },
  {
    courseKey: "kauriCliffs",
    date: "2025-10-18",
    scores: scores12,
    notes: "Stunning ocean views. Wedge play was sharp — nearly holed out on 15 from 95 yards.",
    seed: 2002,
  },
  {
    courseKey: "taraIti",
    date: "2025-10-25",
    scores: scores13,
    notes: "Links perfection. Ball-striking on point. Wind from the south made club selection tricky.",
    seed: 2003,
  },
  {
    courseKey: "wairakei",
    date: "2025-11-01",
    scores: scores14,
    notes: "Windy conditions all day. Driver was all over the place. Need range time before next event.",
    seed: 2004,
  },
  {
    courseKey: "titirangi",
    date: "2025-11-08",
    scores: scores15,
    notes: "Best round of the trip. Tight tree-lined fairways but everything was on. Bogey-free back nine.",
    seed: 2005,
  },
  {
    courseKey: "newSouthWales",
    date: "2025-11-22",
    scores: scores16,
    notes: "Beautiful coastal conditions. La Perouse headland stunning. Steady round, no big numbers.",
    seed: 2006,
  },
  {
    courseKey: "barnbougleDunes",
    date: "2025-11-29",
    scores: scores17,
    notes: "Fast running links. Putting was excellent. Three birdies on the front nine set the tone.",
    seed: 2007,
  },
  {
    courseKey: "barnbougleLostFarm",
    date: "2025-11-30",
    scores: scores18,
    notes: "Tired from yesterday's round. Bogey-bogey finish cost me. Still a beautiful track.",
    seed: 2008,
  },
  {
    courseKey: "ellerston",
    date: "2025-12-12",
    scores: scores19,
    notes: "Private course treat. Iron play outstanding — hit 14 greens. Just couldn't buy a putt.",
    seed: 2009,
  },
  {
    courseKey: "springCreek",
    date: "2025-12-20",
    scores: scores20,
    notes: "Brutal pin positions. Two doubles wrecked the card. The par 5s played really tough in wind.",
    seed: 2010,
  },
  {
    courseKey: "nationalGC",
    date: "2026-01-10",
    scores: scores21,
    notes: "Sandbelt test — Cape Schanck layout is relentless. Fast greens ate me up on the front.",
    seed: 2011,
  },
  {
    courseKey: "terreyHills",
    date: "2026-01-17",
    scores: scores22,
    notes: "Season best! Six birdies. Everything clicked — driver, irons, putter all firing.",
    seed: 2012,
  },
  {
    courseKey: "peninsulaKingswood",
    date: "2026-01-24",
    scores: scores23,
    notes: "Steady round, no big numbers. Need to create more birdie chances. Fairway bunkers tricky.",
    seed: 2013,
  },
  {
    courseKey: "victoriaGC",
    date: "2026-02-01",
    scores: scores24,
    notes: "Melbourne wind made it tough. Double on 9 from the bunker. Grinded out the back nine well.",
    seed: 2014,
  },
  {
    courseKey: "metropolitanGC",
    date: "2026-02-14",
    scores: scores25,
    notes: "Career round! Eight birdies. Ball-striking was world class. Everything felt effortless.",
    seed: 2015,
  },
  {
    courseKey: "kooyonga",
    date: "2026-02-22",
    scores: scores26,
    notes: "Good form continues from Metropolitan. Adelaide sandbelt is different but equally good.",
    seed: 2016,
  },
  {
    courseKey: "newPlymouth",
    date: "2026-03-01",
    scores: scores27,
    notes: "Back in NZ. Rust from travel showing — iron play not as crisp. Even par is okay here.",
    seed: 2017,
  },
  {
    courseKey: "muriwai",
    date: "2026-03-07",
    scores: scores28,
    notes: "Worst round of the season. 40 km/h wind, double on 9 from OB. Frustrating day.",
    seed: 2018,
  },
  {
    courseKey: "whitfordPark",
    date: "2026-03-14",
    scores: scores29,
    notes: "Bounce-back round. Short game saved me — two great up-and-downs on the back nine.",
    seed: 2019,
  },
  {
    courseKey: "wainui",
    date: "2026-03-22",
    scores: scores30,
    notes: "Season closing strong. Four birdies. Approach play dialled in, wedges were lethal.",
    seed: 2020,
  },
];

function buildRound(def: RoundDef, index: number): Round {
  const course = courses[def.courseKey];
  const holes = generateHoleData(course, def.scores, def.seed);
  const totalScore = def.scores.reduce((a, b) => a + b, 0);
  const id = `seed-round-${index + 1}`;
  const createdAt = new Date(def.date + "T10:00:00Z").toISOString();

  return {
    id,
    date: def.date,
    course,
    holes,
    totalScore,
    notes: def.notes,
    createdAt,
    updatedAt: createdAt,
  };
}

export function getSeedRounds(): Round[] {
  return roundDefs.map((def, i) => buildRound(def, i));
}

// ── Seed Goals ─────────────────────────────────────────────────

export function getSeedGoals(): Goal[] {
  return [
    {
      id: "seed-goal-1",
      statCategory: "girPercentage",
      targetValue: 70.0,
      startValue: 58.0,
      targetDate: "2026-06-01",
      direction: "increase",
      createdAt: "2025-11-01T08:00:00Z",
      isCompleted: false,
      completedAt: null,
    },
    {
      id: "seed-goal-2",
      statCategory: "puttsPerRound",
      targetValue: 28.0,
      startValue: 30.5,
      targetDate: "2026-04-01",
      direction: "decrease",
      createdAt: "2025-11-15T08:00:00Z",
      isCompleted: false,
      completedAt: null,
    },
    {
      id: "seed-goal-3",
      statCategory: "scoringAverage",
      targetValue: 70.0,
      startValue: 72.5,
      targetDate: "2026-06-01",
      direction: "decrease",
      createdAt: "2025-10-01T08:00:00Z",
      isCompleted: false,
      completedAt: null,
    },
    {
      id: "seed-goal-4",
      statCategory: "sgApproach",
      targetValue: 1.0,
      startValue: -0.2,
      targetDate: "2026-03-15",
      direction: "increase",
      createdAt: "2025-12-01T08:00:00Z",
      isCompleted: true,
      completedAt: "2026-02-28T10:00:00Z",
    },
    {
      id: "seed-goal-5",
      statCategory: "upAndDownPercentage",
      targetValue: 65.0,
      startValue: 52.0,
      targetDate: "2026-05-01",
      direction: "increase",
      createdAt: "2025-12-15T08:00:00Z",
      isCompleted: false,
      completedAt: null,
    },
  ];
}

