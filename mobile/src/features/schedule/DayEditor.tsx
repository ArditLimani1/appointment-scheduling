import React from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type TextStyle } from 'react-native';
import { Card } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, radius, spacing, typography } from '@/theme/tokens';
import type { ScheduleDay } from '@/api/types';

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** One day's schedule editor: active toggle, start/end times, breaks. */
export function DayEditor({
  label,
  day,
  onChange,
}: {
  label: string;
  day: ScheduleDay;
  onChange: (next: ScheduleDay) => void;
}) {
  const { t } = useT();

  return (
    <Card style={{ gap: spacing.md, opacity: day.is_active ? 1 : 0.75 }}>
      <View style={styles.headerRow}>
        <Text style={[typography.title as TextStyle, { color: palette.onSurface, textTransform: 'capitalize' }]}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>
            {day.is_active ? t('mobile.schedule.day_active') : t('mobile.schedule.day_off')}
          </Text>
          <Switch value={day.is_active} onValueChange={(v) => onChange({ ...day, is_active: v })} />
        </View>
      </View>

      {day.is_active ? (
        <>
          <View style={styles.timesRow}>
            <TimeInput
              label={t('mobile.schedule.from')}
              value={day.start_time ?? '09:00'}
              onChange={(v) => onChange({ ...day, start_time: v })}
            />
            <TimeInput
              label={t('mobile.schedule.to')}
              value={day.end_time ?? '17:00'}
              onChange={(v) => onChange({ ...day, end_time: v })}
            />
          </View>

          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>
              {t('mobile.schedule.breaks')}
            </Text>
            {day.breaks.map((b, index) => (
              <View key={index} style={styles.timesRow}>
                <TimeInput
                  label=""
                  value={b.start_time}
                  onChange={(v) => {
                    const next = [...day.breaks];
                    next[index] = { ...next[index], start_time: v };
                    onChange({ ...day, breaks: next });
                  }}
                />
                <TimeInput
                  label=""
                  value={b.end_time}
                  onChange={(v) => {
                    const next = [...day.breaks];
                    next[index] = { ...next[index], end_time: v };
                    onChange({ ...day, breaks: next });
                  }}
                />
                <Pressable
                  onPress={() => onChange({ ...day, breaks: day.breaks.filter((_, i) => i !== index) })}
                  style={styles.removeBreak}
                >
                  <Text style={{ color: palette.error, fontSize: 18 }}>×</Text>
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={() => onChange({ ...day, breaks: [...day.breaks, { start_time: '12:00', end_time: '13:00' }] })}
            >
              <Text style={[typography.label as TextStyle, { color: palette.primary }]}>
                + {t('mobile.schedule.add_break')}
              </Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Card>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = isValidTime(value);
  return (
    <View style={{ flex: 1, gap: 4 }}>
      {label ? <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="09:00"
        placeholderTextColor={palette.outline}
        keyboardType="numbers-and-punctuation"
        maxLength={5}
        style={[styles.timeInput, !valid && { borderColor: palette.error }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timesRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  timeInput: {
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    backgroundColor: palette.surfaceContainerLowest,
    color: palette.onSurface,
    fontSize: 15,
    textAlign: 'center',
  },
  removeBreak: {
    width: 36,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
