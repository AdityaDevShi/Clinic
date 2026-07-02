import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { addDays, format, isSameDay, startOfToday } from 'date-fns';
import { TimeSlot } from '@/lib/types';
import { formatTimeSlot } from '@/lib/availability';
import { colors, radius, spacing } from '@/constants/theme';

interface SlotPickerProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
    slots: TimeSlot[];
    slotsLoading: boolean;
    selectedSlotKeys: string[];
    onToggleSlot: (slot: TimeSlot) => void;
    daysToShow?: number;
}

export function slotKey(slot: TimeSlot): string {
    return `${format(slot.date, 'yyyy-MM-dd')}_${slot.time}`;
}

/** Horizontal date strip + tappable grid of time slots. */
export function SlotPicker({
    selectedDate,
    onSelectDate,
    slots,
    slotsLoading,
    selectedSlotKeys,
    onToggleSlot,
    daysToShow = 14,
}: SlotPickerProps) {
    const today = startOfToday();
    const dates = Array.from({ length: daysToShow }, (_, i) => addDays(today, i));

    return (
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateStrip}>
                {dates.map((date) => {
                    const selected = isSameDay(date, selectedDate);
                    return (
                        <Pressable
                            key={date.toISOString()}
                            onPress={() => onSelectDate(date)}
                            style={[styles.dateChip, selected && styles.dateChipSelected]}
                        >
                            <Text style={[styles.dateDay, selected && styles.dateTextSelected]}>
                                {format(date, 'EEE')}
                            </Text>
                            <Text style={[styles.dateNum, selected && styles.dateTextSelected]}>
                                {format(date, 'd')}
                            </Text>
                            <Text style={[styles.dateMonth, selected && styles.dateTextSelected]}>
                                {format(date, 'MMM')}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {slotsLoading ? (
                <ActivityIndicator color={colors.primary600} style={{ marginVertical: spacing.xl }} />
            ) : slots.length === 0 ? (
                <Text style={styles.empty}>No sessions available on this day.</Text>
            ) : (
                <View style={styles.grid}>
                    {slots.map((slot) => {
                        const key = slotKey(slot);
                        const isSelected = selectedSlotKeys.includes(key);
                        return (
                            <Pressable
                                key={key}
                                disabled={!slot.isAvailable}
                                onPress={() => onToggleSlot(slot)}
                                style={[
                                    styles.slot,
                                    !slot.isAvailable && styles.slotDisabled,
                                    isSelected && styles.slotSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.slotText,
                                        !slot.isAvailable && styles.slotTextDisabled,
                                        isSelected && styles.slotTextSelected,
                                    ]}
                                >
                                    {formatTimeSlot(slot.time)}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    dateStrip: { gap: spacing.sm, paddingVertical: spacing.md },
    dateChip: {
        width: 56,
        paddingVertical: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.neutral200,
        backgroundColor: colors.white,
        alignItems: 'center',
    },
    dateChipSelected: { backgroundColor: colors.primary600, borderColor: colors.primary600 },
    dateDay: { fontSize: 11, color: colors.neutral500 },
    dateNum: { fontSize: 18, fontWeight: '700', color: colors.neutral800 },
    dateMonth: { fontSize: 11, color: colors.neutral500 },
    dateTextSelected: { color: colors.white },
    empty: { textAlign: 'center', color: colors.neutral500, marginVertical: spacing.xl },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    slot: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.primary300,
        backgroundColor: colors.white,
    },
    slotSelected: { backgroundColor: colors.primary600, borderColor: colors.primary600 },
    slotDisabled: { borderColor: colors.neutral200, backgroundColor: colors.neutral100 },
    slotText: { fontSize: 14, color: colors.primary700, fontWeight: '500' },
    slotTextSelected: { color: colors.white },
    slotTextDisabled: { color: colors.neutral400, textDecorationLine: 'line-through' },
});
