import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Button } from '@/components/ui';
import { palette, radius, spacing, typography } from '@/theme/tokens';

/** Shared bottom-sheet chrome for the admin CRUD forms. */
export function FormSheet({
  title,
  visible,
  onClose,
  onSubmit,
  submitLabel,
  submitting,
  children,
  footer,
}: {
  title: string;
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={[typography.headline as TextStyle, { color: palette.onSurface, marginBottom: spacing.md }]}>
            {title}
          </Text>
          <ScrollView
            contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {children}
            <Button title={submitLabel} onPress={onSubmit} loading={submitting} />
            {footer}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ChipPicker<T extends string | number>({
  label,
  options,
  selected,
  onToggle,
  single,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
  single?: boolean;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => {
          const active = selected.includes(option.value);
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onToggle(option.value)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text
                style={[
                  typography.label as TextStyle,
                  { color: active ? palette.onPrimary : palette.onSurfaceVariant },
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: palette.surfaceContainerLowest,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    maxHeight: '88%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.outlineVariant,
    marginBottom: spacing.md,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: palette.surfaceContainer,
  },
  chipActive: { backgroundColor: palette.primary },
});
