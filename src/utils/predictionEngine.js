// =============================================================================
// HYBRID AI PREDICTION ENGINE  —  JavaScript port for React Native
// Engines: Multi-Scale Frequency, 2nd-Order Markov, Bayesian, Weekday,
//          Monte Carlo, Dynamic Ensemble
// =============================================================================

// ---------------------------------------------------------------------------
// UTILS
// ---------------------------------------------------------------------------

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function normalise(scores) {
  const vals = Object.values(scores);
  const mx = Math.max(...vals);
  if (mx === 0) return scores;
  const out = {};
  for (const [k, v] of Object.entries(scores)) out[k] = v / mx;
  return out;
}

function softmax(scores) {
  const vals = Object.values(scores);
  const mx = Math.max(...vals);
  const exps = vals.map(v => Math.exp(v - mx));
  const sum = exps.reduce((a, b) => a + b, 0);
  const keys = Object.keys(scores);
  const out = {};
  keys.forEach((k, i) => { out[k] = exps[i] / sum; });
  return out;
}

function weightedRandom(obj) {
  const keys = Object.keys(obj);
  const weights = Object.values(obj);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < keys.length; i++) {
    r -= weights[i];
    if (r <= 0) return Number(keys[i]);
  }
  return Number(keys[keys.length - 1]);
}

// ---------------------------------------------------------------------------
// 1. MULTI-SCALE ADAPTIVE FREQUENCY ENGINE
// ---------------------------------------------------------------------------

function computeFrequency(values) {
  const short = {}, medium = {}, long_ = {};
  const DECAY_SHORT = 0.10, DECAY_MEDIUM = 0.03, DECAY_LONG = 0.005;

  [...values].reverse().forEach((val, idx) => {
    const k = String(val);
    short[k]  = (short[k]  || 0) + Math.exp(-DECAY_SHORT  * idx);
    medium[k] = (medium[k] || 0) + Math.exp(-DECAY_MEDIUM * idx);
    long_[k]  = (long_[k]  || 0) + Math.exp(-DECAY_LONG   * idx);
  });

  const allKeys = new Set([...Object.keys(short), ...Object.keys(medium), ...Object.keys(long_)]);
  const scores = {};
  for (const k of allKeys) {
    scores[k] = ((short[k] || 0) + (medium[k] || 0) + (long_[k] || 0)) / 3;
  }
  return normalise(scores);
}

// ---------------------------------------------------------------------------
// 2. 2nd-ORDER MARKOV ENGINE
// ---------------------------------------------------------------------------

function buildMarkov(values) {
  const matrix1 = {};
  const matrix2 = {};

  // 1st order
  for (let i = 0; i < values.length - 1; i++) {
    const cur = String(values[i]), nxt = String(values[i + 1]);
    if (!matrix1[cur]) matrix1[cur] = {};
    matrix1[cur][nxt] = (matrix1[cur][nxt] || 0) + 1;
  }

  // 2nd order
  for (let i = 0; i < values.length - 2; i++) {
    const ctx = `${values[i]},${values[i + 1]}`, nxt = String(values[i + 2]);
    if (!matrix2[ctx]) matrix2[ctx] = {};
    matrix2[ctx][nxt] = (matrix2[ctx][nxt] || 0) + 1;
  }

  // Normalise to probabilities
  const prob1 = {}, prob2 = {};
  for (const [state, trans] of Object.entries(matrix1)) {
    const total = Object.values(trans).reduce((a, b) => a + b, 0);
    prob1[state] = {};
    for (const [k, v] of Object.entries(trans)) prob1[state][k] = v / total;
  }
  for (const [ctx, trans] of Object.entries(matrix2)) {
    const total = Object.values(trans).reduce((a, b) => a + b, 0);
    prob2[ctx] = {};
    for (const [k, v] of Object.entries(trans)) prob2[ctx][k] = v / total;
  }

  return { prob1, prob2 };
}

function markovPredict(prob1, prob2, recentValues) {
  if (recentValues.length >= 2) {
    const ctx = `${recentValues[recentValues.length - 2]},${recentValues[recentValues.length - 1]}`;
    if (prob2[ctx]) return prob2[ctx];
  }
  const last = String(recentValues[recentValues.length - 1]);
  return prob1[last] || {};
}

// ---------------------------------------------------------------------------
// 3. BAYESIAN ENGINE (log-space + Laplace)
// ---------------------------------------------------------------------------

function bayesianCombine(freqScores, markovScores, weekdayScores, alpha = 1.0) {
  const allKeys = new Set([
    ...Object.keys(freqScores),
    ...Object.keys(markovScores),
    ...Object.keys(weekdayScores),
  ]);

  const logPost = {};
  for (const k of allKeys) {
    logPost[k] = (
      Math.log((freqScores[k]    || 0) + alpha) +
      Math.log((markovScores[k]  || 0) + alpha) +
      Math.log((weekdayScores[k] || 0) + alpha)
    );
  }
  return softmax(logPost);
}

// ---------------------------------------------------------------------------
// 4. WEEKDAY ENGINE
// ---------------------------------------------------------------------------

function buildWeekdayTable(rows) {
  // rows: [{MON, TUE, WED, THU, FRI, SAT, SUN}, ...]
  const tables = {};
  for (const day of DAYS) {
    const vals = rows.map(r => r[day]).filter(v => v != null && v !== '**' && v !== '??');
    const counts = {};
    for (const v of vals) counts[String(v)] = (counts[String(v)] || 0) + 1;
    const total = vals.length;
    tables[day] = {};
    for (const [k, c] of Object.entries(counts)) tables[day][k] = c / total;
  }
  return tables;
}

// ---------------------------------------------------------------------------
// 5. MONTE CARLO ENGINE
// ---------------------------------------------------------------------------

function monteCarlo(prob1, startVal, simulations = 5000, steps = 5) {
  const outcomes = {};
  for (let s = 0; s < simulations; s++) {
    let cur = String(startVal);
    for (let step = 0; step < steps; step++) {
      const trans = prob1[cur];
      if (!trans || Object.keys(trans).length === 0) break;
      cur = String(weightedRandom(trans));
    }
    outcomes[cur] = (outcomes[cur] || 0) + 1;
  }
  const total = Object.values(outcomes).reduce((a, b) => a + b, 0);
  const result = {};
  for (const [k, v] of Object.entries(outcomes)) result[k] = v / total;
  return result;
}

// ---------------------------------------------------------------------------
// 6. DYNAMIC ENSEMBLE
// ---------------------------------------------------------------------------

const DEFAULT_WEIGHTS = {
  freq: 0.25, markov: 0.20, bayes: 0.25, weekday: 0.15, mc: 0.15,
};

function ensembleCombine(freqS, markovS, bayesS, weekdayS, mcS, weights = DEFAULT_WEIGHTS) {
  const allKeys = new Set([
    ...Object.keys(freqS), ...Object.keys(markovS),
    ...Object.keys(bayesS), ...Object.keys(weekdayS), ...Object.keys(mcS),
  ]);

  const final = {};
  for (const k of allKeys) {
    final[k] = (
      weights.freq    * (freqS[k]    || 0) +
      weights.markov  * (markovS[k]  || 0) +
      weights.bayes   * (bayesS[k]   || 0) +
      weights.weekday * (weekdayS[k] || 0) +
      weights.mc      * (mcS[k]      || 0)
    );
  }

  return Object.entries(final)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([pair, score]) => ({ pair: Number(pair), score }));
}

// ---------------------------------------------------------------------------
// MAIN PREDICTION FUNCTION
// ---------------------------------------------------------------------------

/**
 * predict(rows, targetDay)
 * rows      — array of row objects {MON, TUE, ...} with numeric or null values
 * targetDay — 'MON' | 'TUE' | ... | 'SUN'
 * returns   — { predictions: [{pair, score}], stats: {...} }
 */
export function predict(rows, targetDay) {
  // Build flat sequence of values for the target day
  const dayValues = rows
    .map(r => r[targetDay])
    .filter(v => v != null && v !== '**' && v !== '??' && !isNaN(Number(v)))
    .map(Number);

  if (dayValues.length < 10) {
    return { predictions: [], stats: { error: 'Not enough data' } };
  }

  const { prob1, prob2 } = buildMarkov(dayValues);
  const weekdayTables     = buildWeekdayTable(rows);
  const freqScores        = computeFrequency(dayValues);
  const markovScores      = markovPredict(prob1, prob2, dayValues.slice(-16));
  const weekdayScores     = weekdayTables[targetDay] || {};
  const bayesScores       = bayesianCombine(freqScores, markovScores, weekdayScores);
  const mcScores          = monteCarlo(prob1, dayValues[dayValues.length - 1]);

  const predictions = ensembleCombine(
    freqScores, markovScores, bayesScores, weekdayScores, mcScores
  );

  // Basic stats
  const mean   = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
  const sorted = [...dayValues].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const counts = {};
  for (const v of dayValues) counts[v] = (counts[v] || 0) + 1;
  const mode = Number(Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0]);

  return {
    predictions,
    stats: {
      mean: mean.toFixed(1),
      median,
      mode,
      count: dayValues.length,
      min: Math.min(...dayValues),
      max: Math.max(...dayValues),
    },
  };
}

/**
 * guessMissing(rows)
 * Finds all cells marked '??' or '**' and returns guesses for each.
 */
export function guessMissing(rows) {
  const missing = [];
  rows.forEach((row, rowIdx) => {
    DAYS.forEach(day => {
      if (row[day] === '??' || row[day] === '**') {
        const result = predict(rows.slice(0, rowIdx), day);
        const top    = result.predictions[0];
        missing.push({
          rowIdx: rowIdx + 1,
          day,
          guess: top ? top.pair : null,
          confidence: top ? (top.score * 100).toFixed(1) + '%' : 'N/A',
          alternatives: result.predictions.slice(1, 4).map(p => p.pair),
        });
      }
    });
  });
  return missing;
}

export { DAYS };
