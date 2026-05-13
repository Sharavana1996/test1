// =============================================================================
// IMPORT SCREEN
// =============================================================================

import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { AppContext } from '../AppContext';
import { parseFile, getSummary, getMissingCells, DAYS } from '../utils/dataParser';

export default function ImportScreen({ navigation }) {
  const { rows, setRows } = useContext(AppContext);
  const [loading, setLoading]   = useState(false);
  const [fileName, setFileName] = useState(null);
  const [summary, setSummary]   = useState(null);

  async function pickFile() {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      const ext = res.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext)) {
        Alert.alert('Unsupported file', 'Please pick a .csv or .xlsx file');
        return;
      }

      setLoading(true);
      const parsed = await parseFile(res.uri.replace('file://', ''), res.type);
      setRows(parsed);
      setFileName(res.name);
      setSummary(getSummary(parsed));
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', String(err.message));
      }
    }
  }

  const missingCells = rows.length ? getMissingCells(rows) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>IMPORT DATA</Text>
      <Text style={styles.subtitle}>Load your weekly pairs Excel or CSV file</Text>

      {/* Drop zone / picker */}
      <TouchableOpacity style={styles.dropZone} onPress={pickFile} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#00E5FF" size="large" />
          : <>
              <Text style={styles.dropIcon}>📂</Text>
              <Text style={styles.dropTitle}>
                {fileName || 'Tap to choose file'}
              </Text>
              <Text style={styles.dropHint}>Supports .xlsx  .xls  .csv</Text>
            </>
        }
      </TouchableOpacity>

      {/* Expected format */}
      <View style={styles.formatBox}>
        <Text style={styles.formatTitle}>EXPECTED FORMAT</Text>
        <View style={styles.formatRow}>
          {DAYS.map(d => (
            <Text key={d} style={styles.formatHeader}>{d}</Text>
          ))}
        </View>
        <View style={styles.formatRow}>
          {['16','54','7','70','1','94','28'].map((v, i) => (
            <Text key={i} style={styles.formatCell}>{v}</Text>
          ))}
        </View>
        <View style={styles.formatRow}>
          {['64','**','0','??','42','97','76'].map((v, i) => (
            <Text key={i} style={[styles.formatCell, (v === '**' || v === '??') && styles.formatMissing]}>{v}</Text>
          ))}
        </View>
        <Text style={styles.formatNote}>
          Use <Text style={styles.formatCode}>??</Text> or <Text style={styles.formatCode}>**</Text> for cells you want predicted
        </Text>
      </View>

      {/* Summary after load */}
      {summary && (
        <>
          <Text style={styles.sectionTitle}>LOADED: {rows.length} ROWS</Text>
          {DAYS.map(day => {
            const s = summary[day];
            const barW = (s.count / rows.length) * 100;
            return (
              <View key={day} style={styles.summaryRow}>
                <Text style={styles.summaryDay}>{day}</Text>
                <View style={styles.summaryBarTrack}>
                  <View style={[styles.summaryBarFill, { width: `${barW}%` }]} />
                </View>
                <Text style={styles.summaryCount}>{s.count}</Text>
                {s.missing > 0 && (
                  <Text style={styles.summaryMissing}>{s.missing}??</Text>
                )}
              </View>
            );
          })}

          {missingCells.length > 0 && (
            <TouchableOpacity
              style={styles.guessBtn}
              onPress={() => navigation.navigate('Missing')}
            >
              <Text style={styles.guessBtnText}>
                🔍  Predict {missingCells.length} missing cells
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.predictBtn}
            onPress={() => navigation.navigate('Predict')}
          >
            <Text style={styles.predictBtnText}>🤖  Go to Predictions →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a0f' },
  content:     { padding: 16, paddingBottom: 40 },
  title:       { fontSize: 28, color: '#fff', fontWeight: '900', letterSpacing: 4, marginBottom: 4, marginTop: 8 },
  subtitle:    { fontSize: 13, color: '#555', marginBottom: 24 },

  dropZone:    { borderWidth: 2, borderColor: '#00E5FF', borderStyle: 'dashed', borderRadius: 16, padding: 40, alignItems: 'center', marginBottom: 24, backgroundColor: '#00E5FF0a' },
  dropIcon:    { fontSize: 48, marginBottom: 12 },
  dropTitle:   { fontSize: 16, color: '#fff', fontWeight: '600', marginBottom: 6 },
  dropHint:    { fontSize: 12, color: '#555' },

  formatBox:   { backgroundColor: '#0d1117', borderRadius: 12, padding: 16, marginBottom: 24 },
  formatTitle: { fontSize: 10, color: '#555', letterSpacing: 3, marginBottom: 12 },
  formatRow:   { flexDirection: 'row', marginBottom: 6 },
  formatHeader:{ flex: 1, fontSize: 10, color: '#00E5FF', fontWeight: '700', textAlign: 'center' },
  formatCell:  { flex: 1, fontSize: 12, color: '#aaa', textAlign: 'center' },
  formatMissing: { color: '#FF6B6B', fontWeight: '700' },
  formatNote:  { fontSize: 11, color: '#444', marginTop: 8 },
  formatCode:  { color: '#FF6B6B', fontFamily: 'monospace' },

  sectionTitle:{ fontSize: 10, color: '#444', letterSpacing: 3, marginBottom: 12 },

  summaryRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  summaryDay:  { width: 36, fontSize: 11, color: '#aaa', fontWeight: '700' },
  summaryBarTrack: { flex: 1, height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, marginHorizontal: 8 },
  summaryBarFill:  { height: 4, backgroundColor: '#00E5FF', borderRadius: 2 },
  summaryCount:{ width: 28, fontSize: 11, color: '#555', textAlign: 'right' },
  summaryMissing: { width: 32, fontSize: 10, color: '#FF6B6B', marginLeft: 6 },

  guessBtn:    { backgroundColor: '#FF6B6B22', borderWidth: 1, borderColor: '#FF6B6B', borderRadius: 10, padding: 16, marginTop: 20, marginBottom: 10 },
  guessBtnText:{ color: '#FF6B6B', fontWeight: '700', fontSize: 15 },
  predictBtn:  { backgroundColor: '#00E5FF', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10 },
  predictBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
