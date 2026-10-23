//small statistics helpers for section 4, worked out the same way as numpy and pandas

//percentile like numpy (straight line between the two closest values), p is 0-100
export function percentile(values, p) {
  const s = [...values].sort((a, b) => a - b);
  const pos = (s.length - 1) * p / 100, lo = Math.floor(pos), hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export function median(values) { return percentile(values, 50); }

//skewness like pandas .skew(): 0 means even on both sides, above 0 means a long tail to the right
export function skew(values) {
  const n = values.length, m = values.reduce((a, b) => a + b, 0) / n;
  const m2 = values.reduce((s, x) => s + (x - m) ** 2, 0) / n, m3 = values.reduce((s, x) => s + (x - m) ** 3, 0) / n;
  return Math.sqrt(n * (n - 1)) / (n - 2) * m3 / m2 ** 1.5;
}

//pearson correlation between two lists: +1 move together, -1 opposite, 0 no straight line relationship
export function corr(xs, ys) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
  return sxy / Math.sqrt(sxx * syy);
}

//counts values into bins, gives [{lo, hi, n}] for a histogram
//log=true makes the bins even on a log scale, rounded to whole numbers since rentals are whole numbers
export function histogram(values, bins, log = false) {
  const min = Math.min(...values), max = Math.max(...values);
  let edges;
  if (log) {
    const a = Math.log10(min), b = Math.log10(max + 1);
    edges = [...new Set(Array.from({ length: bins + 1 }, (_, i) => Math.ceil(10 ** (a + (b - a) * i / bins))))];
  } else {
    edges = Array.from({ length: bins + 1 }, (_, i) => min + (max - min) * i / bins);
  }
  const counts = new Array(edges.length - 1).fill(0);
  for (const x of values) {
    let i = edges.findIndex((e, j) => j < edges.length - 1 && x >= e && x < edges[j + 1]);
    if (i < 0) i = counts.length - 1; //the max value goes in the last bin, like numpy
    counts[i]++;
  }
  return counts.map((n, i) => ({ lo: edges[i], hi: edges[i + 1], n }));
}
