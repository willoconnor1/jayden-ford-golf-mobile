import { Round, HoleData, CourseInfo, FairwayHit } from "./types";

// Deterministic pseudo-random for consistent demo data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateHoleData(
  course: CourseInfo,
  scores: number[],
  seed: number
): HoleData[] {
  const rand = seededRandom(seed);

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

    // Sand save (some missed greens are from bunkers)
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

    return {
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
    };
  });
}

// ── Course Definitions ───────────────────────────────────────────

const STANDARD_PARS = [4, 5, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5];

const courses: Record<string, CourseInfo> = {
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
};

// ── Round Scores (hole-by-hole) ──────────────────────────────────

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

// ── Build Rounds ─────────────────────────────────────────────────

interface RoundDef {
  courseKey: keyof typeof courses;
  date: string;
  scores: number[];
  notes: string;
  seed: number;
}

const roundDefs: RoundDef[] = [
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
    notes: "NZ PGA Pro-Am round. Disaster on 13 — OB left, penalty drop, couldn't save it. Rest of the round was solid.",
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
    notes: "Australasian Tour qualifier. Kept it in play, just couldn't convert enough birdie putts.",
    seed: 1009,
  },
  {
    courseKey: "theHills",
    date: "2026-03-15",
    scores: scores10,
    notes: "Great way to wrap up the Queenstown swing. Dialled-in wedge play, nearly eagled 13.",
    seed: 1010,
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
