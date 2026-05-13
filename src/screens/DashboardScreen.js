// =============================================================================
// DASHBOARD SCREEN
// =============================================================================

import React, { useContext, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions,
} from 'react-native';
import { AppContext } from '../AppContext';
import { getSummary, DAYS } from '../utils/dataParser';
import { predict } from '../utils/predictionEngine';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

const DAY_COLORS = {
  MON: '#00E5FF', TUE: '#FF6B6B', WED: '#69FF47',
  THU: '#FFD93D', FRI: '#C77DFF', SAT: '#FF9A3C', SUN: '#4ECDC4',
};

export default function DashboardScreen({ navigation }) {
  const { rows } = useContext(AppContext);

  const summary = useMemo(() => rows.length ? getSummary(rows) : null, [rows]);

  const todayPrediction = useMemo(() => {
    if (!rows.length) return null;
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = dayNames[new Date().getDay()];
    return { day: today, result: predict(rows, today) };
  }, [rows]);

  if (!rows.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📂</Text>
        <Text style={styles.emptyTitle}>No Data Loaded</Text>
        <Text style={styles.emptySubtitle}>
          Go to Import tab to load your Excel / CSV file
        </Text>
        <TouchableOpacity
          style={styles.importBtn}
          onPress={() => navigation.navigate('Import')}
        >
          <Text style={styles.importBtnText}>Import Data →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalMissing = summary
    ? Object.values(summary).reduce((a, d) => a + d.missing, 0)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PREDICTOR</Text>
        <Text style={styles.headerSub}>{rows.length} rows loaded</Text>
      </View>

      {/* Today's top prediction */}
      {todayPrediction && todayPrediction.result.predictions.length > 0 && (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>TODAY ({todayPrediction.day}) TOP PICK</Text>
          <Text style={styles.heroNumber}>
            {String(todayPrediction.result.predictions[0].pair).padStart(2, '0')}
          </Text>
          <Text style={styles.heroScore}>
            Score: {(todayPrediction.result.predictions[0].score * 100).toFixed(2)}%
          </Text>
          <View style={styles.heroAlts}>
            {todayPrediction.result.predictions.slice(1, 5).map(p => (
              <View key={p.pair} style={styles.altChip}>
                <Text style={styles.altChipText}>{String(p.pair).padStart(2, '0')}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.heroAltLabel}>Alternatives ↑</Text>
        </View>
      )}

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{rows.length}</Text>
          <Text style={styles.statLabel}>Rows</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{totalMissing}</Text>
          <Text style={styles.statLabel}>Missing (?)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>7</Text>
          <Text style={styles.statLabel}>Days</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>9</Text>
          <Text style={styles.statLabel}>Engines</Text>
        </View>
      </View>

      {/* Per-day cards */}
      <Text style={styles.sectionTitle}>DAY OVERVIEW</Text>
      <View style={styles.cardsGrid}>
        {DAYS.map(day => {
          const s = summary[day];
          const color = DAY_COLORS[day];
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayCard, { borderColor: color }]}
              onPress={() => navigation.navigate('Predict', { day })}
            >
              <Text style={[styles.dayCardTitle, { color }]}>{day}</Text>
              <Text style={styles.dayCardStat}>μ {s.mean}</Text>
              <Text style={styles.dayCardStat}>med {s.median}</Text>
              <Text style={styles.dayCardRows}>{s.count} rows</Text>
              {s.missing > 0 && (
                <View style={[styles.missingBadge, { backgroundColor: color }]}>
                  <Text style={styles.missingBadgeText}>{s.missing} ??</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.navigate('Missing')}
      >
        <Text style={styles.actionBtnText}>🔍  Fill All Missing Cells</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: '#1a1a2e' }]}
        onPress={() => navigation.navigate('Predict', { day: 'MON' })}
      >
        <Text style={styles.actionBtnText}>🤖  Run Full Prediction</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a0f' },
  content:     { padding: 16, paddingBottom: 40 },
  empty:       { flex: 1, backgroundColor: '#0a0a0f', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon:   { fontSize: 64, marginBottom: 16 },
  emptyTitle:  { fontSize: 24, color: '#fff', fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 32 },
  importBtn:   { backgroundColor: '#00E5FF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8 },
  importBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },

  header:      { marginBottom: 20, marginTop: 8 },
  headerTitle: { fontSize: 32, color: '#fff', fontWeight: '900', letterSpacing: 6 },
  headerSub:   { fontSize: 13, color: '#555', marginTop: 2 },

  heroCard:    { backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#00E5FF', borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center' },
  heroLabel:   { fontSize: 11, color: '#00E5FF', letterSpacing: 3, marginBottom: 8 },
  heroNumber:  { fontSize: 80, color: '#fff', fontWeight: '900', lineHeight: 90 },
  heroScore:   { fontSize: 13, color: '#555', marginTop: 4, marginBottom: 16 },
  heroAlts:    { flexDirection: 'row', gap: 8 },
  altChip:     { backgroundColor: '#1a1a2e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  altChipText: { color: '#00E5FF', fontSize: 16, fontWeight: '700' },
  heroAltLabel: { fontSize: 10, color: '#333', marginTop: 6, letterSpacing: 2 },

  statsRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  statBox:     { flex: 1, backgroundColor: '#0d1117', borderRadius: 10, padding: 12, marginHorizontal: 3, alignItems: 'center' },
  statNum:     { fontSize: 24, color: '#fff', fontWeight: '800' },
  statLabel:   { fontSize: 10, color: '#555', marginTop: 2, letterSpacing: 1 },

  sectionTitle: { fontSize: 11, color: '#444', letterSpacing: 3, marginBottom: 12, marginTop: 4 },

  cardsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  dayCard:     { width: CARD_W, backgroundColor: '#0d1117', borderWidth: 1, borderRadius: 12, padding: 14, position: 'relative' },
  dayCardTitle: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  dayCardStat: { fontSize: 13, color: '#aaa', lineHeight: 20 },
  dayCardRows: { fontSize: 11, color: '#444', marginTop: 4 },
  missingBadge: { position: 'absolute', top: 10, right: 10, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  missingBadgeText: { fontSize: 10, color: '#000', fontWeight: '700' },

  actionBtn:   { backgroundColor: '#0d1117', borderWidth: 1, borderColor: '#222', borderRadius: 10, padding: 16, marginBottom: 10 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
