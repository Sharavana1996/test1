// =============================================================================
// DATA PARSER  —  handles CSV and XLSX imports
// =============================================================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import RNFS from 'react-native-fs';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function parseValue(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  if (s === '??' || s === '**') return s;
  const n = Number(s);
  return isNaN(n) ? s : n;
}

function rawToRows(data) {
  // data is array of arrays (after header)
  return data.map(row => {
    const obj = {};
    DAYS.forEach((day, i) => {
      obj[day] = parseValue(row[i]);
    });
    return obj;
  });
}

export async function parseFile(filePath, mimeType) {
  const ext = filePath.split('.').pop().toLowerCase();

  if (ext === 'csv') {
    const content = await RNFS.readFile(filePath, 'utf8');
    return new Promise((resolve, reject) => {
      Papa.parse(content, {
        header: false,
        skipEmptyLines: true,
        complete: result => {
          const [header, ...dataRows] = result.data;
          // Accept if header looks like MON/TUE/... or just use positional
          resolve(rawToRows(dataRows));
        },
        error: reject,
      });
    });
  }

  if (ext === 'xlsx' || ext === 'xls') {
    const b64 = await RNFS.readFile(filePath, 'base64');
    const wb  = XLSX.read(b64, { type: 'base64' });
    const ws  = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const [, ...dataRows] = raw;          // skip header row
    return rawToRows(dataRows);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export function getSummary(rows) {
  const summary = {};
  DAYS.forEach(day => {
    const vals = rows
      .map(r => r[day])
      .filter(v => v != null && v !== '**' && v !== '??' && !isNaN(Number(v)))
      .map(Number);

    const missing = rows.filter(r => r[day] === '??' || r[day] === '**').length;

    const mean = vals.length
      ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
      : 0;

    const sorted = [...vals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;

    summary[day] = { count: vals.length, mean: Number(mean), median, missing };
  });
  return summary;
}

export function getMissingCells(rows) {
  const missing = [];
  rows.forEach((row, i) => {
    DAYS.forEach(day => {
      if (row[day] === '??' || row[day] === '**') {
        missing.push({ row: i + 1, day });
      }
    });
  });
  return missing;
}

export { DAYS };
