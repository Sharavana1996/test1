// =============================================================================
// PREDICTION SCREEN  —  per-day full hybrid AI results
// =============================================================================

import React, { useContext, useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Dimensions, ActivityIndicator,
} from 'react-native';
import { AppContext } from '../AppContext';
import { predict } from '../utils/predictionEngine';
import { DAYS } from '../utils/dataParser';

const { width } = Dimensions.get('window');

const DAY_COLORS = {
  MON: '#00E5FF', TUE: '#FF6B6B', WED: '#69FF47',
  THU: '#FFD93D', FRI: '#C77DFF', SAT: '#FF9A3C', SUN: '#4ECDC4',
};

function MiniBar({ score, max, color }) {
  const pct = max > 0 ? score / max : 0;
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { flex: 1, height: 6, backgroundColor: '#1a1a2e', borderRadius: 3, marginLeft: 10 },
  fill:  { height: 6, borderRadius: 3 },
});

export default function PredictScreen({ route }) {
  const { rows } = useContext(AppContext);
  const initialDay = route?.params?.day || 'MON';
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [running, setRunning] = useState(false);

  const result = useMemo(() => {
    if (!rows.length) return null;
    setRunning(true);
    const r = predict(rows, selectedDay);
    setRunning(false);
    return r;
  }, [rows, selectedDay]);

  const color = DAY_COLORS[selectedDay];
  const maxScore = result?.predictions?.[0]?.score || 1;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayRow}>
        {DAYS.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.dayTab, selectedDay === d && { borderColor: DAY_COLORS[d], backgroundColor: DAY_COLORS[d] + '22' }]}
            onPress={() => setSelectedDay(d)}
          >
            <Text style={[styles.dayTabText, selectedDay === d && { color: DAY_COLORS[d] }]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {running && <ActivityIndicator color={color} style={{ margin: 40 }} />}

      {result && !running && (
        <>
          {/* Stats banner */}
          <View style={[styles.statsBanner, { borderColor: color }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color }]}>{result.stats.mean}</Text>
              <Text style={styles.statKey}>MEAN</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color }]}>{result.stats.median}</Text>
              <Text style={styles.statKey}>MEDIAN</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color }]}>{result.stats.mode}</Text>
              <Text style={styles.statKey}>MODE</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statVal, { color }]}>{result.stats.count}</Text>
              <Text style={styles.statKey}>ROWS</Text>
            </View>
          </View>

          {/* Top prediction hero */}
          {result.predictions.length > 0 && (
            <View style={[styles.heroBox, { borderColor: color }]}>
              <Text style={[styles.heroRank, { color }]}>#1 PREDICTION</Text>
              <Text style={styles.heroNum}>
                {String(result.predictions[0].pair).padStart(2, '0')}
              </Text>
              <Text style={styles.heroScore}>
                Ensemble score: {(result.predictions[0].score * 100).toFixed(3)}%
              </Text>
            </View>
          )}

          {/* Top 10 ranked list */}
          <Text style={styles.sectionTitle}>TOP 10 RANKED PAIRS</Text>
          {result.predictions.map((p, idx) => (
            <View key={p.pair} style={styles.predRow}>
              <Text style={styles.rank}>#{idx + 1}</Text>
              <View style={[styles.pairBadge, idx === 0 && { backgroundColor: color + '33', borderColor: color }]}>
                <Text style={[styles.pairNum, idx === 0 && { color }]}>
                  {String(p.pair).padStart(2, '0')}
                </Text>
              </View>
              <MiniBar score={p.score} max={maxScore} color={idx === 0 ? color : '#333'} />
              <Text style={styles.scoreText}>{(p.score * 100).toFixed(2)}%</Text>
            </View>
          ))}

          {/* Engine weight legend */}
          <Text style={styles.sectionTitle}>ENGINE WEIGHTS</Text>
          {[
            ['Multi-Scale Frequency', '25%', '#00E5FF'],
            ['2nd-Order Markov',      '20%', '#FF6B6B'],
            ['Bayesian (Log-Space)',  '25%', '#69FF47'],
            ['Weekday Table',         '15%', '#FFD93D'],
            ['Monte Carlo (5k)',      '15%', '#C77DFF'],
          ].map(([name, pct, c]) => (
            <View key={name} style={styles.engineRow}>
              <View style={[styles.engineDot, { backgroundColor: c }]} />
              <Text style={styles.engineName}>{name}</Text>
              <Text style={[styles.enginePct, { color: c }]}>{pct}</Text>
            </View>
          ))}
        </>
      )}

      {!rows.length && (
        <Text style={styles.noData}>Load data first from the Import tab.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0a0a0f' },
  content:      { padding: 16, paddingBottom: 40 },

  dayRow:       { marginBottom: 20 },
  dayTab:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#222', marginRight: 8 },
  dayTabText:   { color: '#555', fontWeight: '700', fontSize: 13 },

  statsBanner:  { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16, justifyContent: 'space-between' },
  statItem:     { alignItems: 'center' },
  statVal:      { fontSize: 22, fontWeight: '800' },
  statKey:      { fontSize: 9, color: '#555', letterSpacing: 2, marginTop: 2 },

  heroBox:      { borderWidth: 1, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24 },
  heroRank:     { fontSize: 11, letterSpacing: 3, marginBottom: 6 },
  heroNum:      { fontSize: 72, color: '#fff', fontWeight: '900', lineHeight: 80 },
  heroScore:    { fontSize: 12, color: '#555', marginTop: 4 },

  sectionTitle: { fontSize: 10, color: '#444', letterSpacing: 3, marginBottom: 12, marginTop: 8 },

  predRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  rank:         { width: 28, fontSize: 11, color: '#444' },
  pairBadge:    { width: 42, height: 42, borderRadius: 8, borderWidth: 1, borderColor: '#1a1a2e', backgroundColor: '#0d1117', alignItems: 'center', justifyContent: 'center' },
  pairNum:      { fontSize: 17, color: '#fff', fontWeight: '700' },
  scoreText:    { width: 52, textAlign: 'right', fontSize: 12, color: '#555' },

  engineRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: '#0d1117', padding: 12, borderRadius: 8 },
  engineDot:    { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  engineName:   { flex: 1, fontSize: 13, color: '#aaa' },
  enginePct:    { fontSize: 14, fontWeight: '700' },

  noData:       { color: '#555', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
