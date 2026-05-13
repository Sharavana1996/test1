// =============================================================================
// MISSING CELLS SCREEN  —  fills all ?? and ** with AI guesses
// =============================================================================

import React, { useContext, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { AppContext } from '../AppContext';
import { guessMissing } from '../utils/predictionEngine';
import { getMissingCells } from '../utils/dataParser';

const DAY_COLORS = {
  MON: '#00E5FF', TUE: '#FF6B6B', WED: '#69FF47',
  THU: '#FFD93D', FRI: '#C77DFF', SAT: '#FF9A3C', SUN: '#4ECDC4',
};

export default function MissingScreen() {
  const { rows } = useContext(AppContext);
  const [computed, setComputed] = useState(false);
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  const missingCount = useMemo(() => getMissingCells(rows).length, [rows]);

  function runGuesses() {
    setLoading(true);
    setTimeout(() => {               // allow UI to show spinner first
      const guesses = guessMissing(rows);
      setResults(guesses);
      setComputed(true);
      setLoading(false);
    }, 100);
  }

  if (!rows.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data loaded. Go to Import first.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>MISSING CELLS</Text>
      <Text style={styles.subtitle}>
        {missingCount} cells marked ?? or ** found in your data
      </Text>

      {!computed && (
        <TouchableOpacity
          style={styles.runBtn}
          onPress={runGuesses}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.runBtnText}>🤖  Predict All {missingCount} Cells</Text>
          }
        </TouchableOpacity>
      )}

      {computed && results.length === 0 && (
        <Text style={styles.noneText}>No ?? or ** cells found in the loaded data.</Text>
      )}

      {results.map((item, idx) => {
        const color = DAY_COLORS[item.day];
        return (
          <View key={idx} style={[styles.card, { borderColor: color + '44' }]}>
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={[styles.dayBadge, { backgroundColor: color + '22', borderColor: color }]}>
                <Text style={[styles.dayBadgeText, { color }]}>{item.day}</Text>
              </View>
              <Text style={styles.cardRow}>Row {item.rowIdx}</Text>
              <View style={styles.confidencePill}>
                <Text style={styles.confidenceText}>{item.confidence}</Text>
              </View>
            </View>

            {/* Main guess */}
            <View style={styles.guessRow}>
              <Text style={styles.guessLabel}>BEST GUESS</Text>
              <Text style={[styles.guessNum, { color }]}>
                {item.guess !== null ? String(item.guess).padStart(2, '0') : '—'}
              </Text>
            </View>

            {/* Alternatives */}
            {item.alternatives.length > 0 && (
              <View style={styles.altsRow}>
                <Text style={styles.altsLabel}>ALT: </Text>
                {item.alternatives.map(a => (
                  <View key={a} style={styles.altChip}>
                    <Text style={styles.altChipText}>{String(a).padStart(2, '0')}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}

      {computed && results.length > 0 && (
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>SUMMARY</Text>
          <Text style={styles.summaryText}>
            {results.length} cells predicted using the Hybrid AI engine.{'\n'}
            Top predictions are based on 2nd-order Markov chains, multi-scale
            frequency analysis, Bayesian posteriors, and weekday tables.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a0f' },
  content:     { padding: 16, paddingBottom: 40 },
  empty:       { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center' },
  emptyText:   { color: '#555', fontSize: 15 },

  title:       { fontSize: 28, color: '#fff', fontWeight: '900', letterSpacing: 4, marginBottom: 4, marginTop: 8 },
  subtitle:    { fontSize: 13, color: '#555', marginBottom: 24 },

  runBtn:      { backgroundColor: '#00E5FF', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 24 },
  runBtnText:  { color: '#000', fontWeight: '800', fontSize: 16 },

  noneText:    { color: '#555', textAlign: 'center', marginTop: 40, fontSize: 15 },

  card:        { backgroundColor: '#0d1117', borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  dayBadge:    { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  dayBadgeText:{ fontSize: 12, fontWeight: '800' },
  cardRow:     { flex: 1, fontSize: 12, color: '#555' },
  confidencePill: { backgroundColor: '#1a1a2e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  confidenceText: { fontSize: 11, color: '#aaa' },

  guessRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  guessLabel:  { fontSize: 10, color: '#555', letterSpacing: 2 },
  guessNum:    { fontSize: 40, fontWeight: '900' },

  altsRow:     { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  altsLabel:   { fontSize: 11, color: '#444' },
  altChip:     { backgroundColor: '#1a1a2e', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  altChipText: { color: '#aaa', fontSize: 13, fontWeight: '600' },

  summaryBox:  { backgroundColor: '#0d1117', borderRadius: 12, padding: 16, marginTop: 16 },
  summaryTitle:{ fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 8 },
  summaryText: { fontSize: 13, color: '#666', lineHeight: 20 },
});
