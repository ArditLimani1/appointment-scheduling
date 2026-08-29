import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { SHEET_SLIDE_MS, SheetBackdrop } from '@/components/SheetBackdrop';
import { ToastHost } from '@/components/Toast';
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
    <Modal
      visible={visible}
      transparent
      // `slide` would animate the whole window, dragging the backdrop up with
      // the sheet. Show the backdrop at once and slide only the sheet below.
      animationType="none"
      onRequestClose={onClose}
      // Android 15 is edge-to-edge: without these the modal window stops short of
      // the system bars and the tab bar shows through below the sheet.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SheetBackdrop onPress={onClose} />
      {/* Modals get their own window, so the root toast host cannot paint over
          this sheet — mount one inside it for errors raised while it stays open. */}
      <ToastHost />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={SlideInDown.duration(SHEET_SLIDE_MS)} style={styles.sheet}>
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
        </Animated.View>
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
                  { color: active ? palette.surface : palette.onSurfaceVariant },
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
  sheet: {
    backgroundColor: palette.surfaceContainerLowest,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
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
    backgroundColor: palette.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  chipActive: { backgroundColor: palette.onSurface, borderColor: palette.onSurface },
});
