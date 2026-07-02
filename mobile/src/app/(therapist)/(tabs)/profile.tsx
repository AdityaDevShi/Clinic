import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TherapistService } from '@/services/therapistService';
import { Therapist } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { colors, spacing } from '@/constants/theme';

const listToText = (v?: string[]) => (v || []).join(', ');
const textToList = (t: string) => t.split(',').map((s) => s.trim()).filter(Boolean);

export default function TherapistProfileTab() {
    const { user, logout } = useAuth();
    const [form, setForm] = useState<Partial<Therapist>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!user) return;
            getDoc(doc(db, 'therapists', user.id)).then((snap) => {
                setForm(snap.exists() ? (snap.data() as Therapist) : {});
                setLoading(false);
            });
        }, [user])
    );

    const set = <K extends keyof Therapist>(key: K, value: Therapist[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await TherapistService.saveProfile(user.id, {
                name: form.name,
                specialization: form.specialization,
                bio: form.bio,
                about: form.about,
                hourlyRate: Number(form.hourlyRate) || 0,
                languages: form.languages,
                qualifications: form.qualifications,
                sessionDuration: form.sessionDuration,
                workingHoursStart: form.workingHoursStart,
                workingHoursEnd: form.workingHoursEnd,
                lunchBreakStart: form.lunchBreakStart,
                discountEnabled: form.discountEnabled,
                discountedRate: form.discountEnabled ? Number(form.discountedRate) || 0 : 0,
            });

            // Regenerate availability so the booking calendar reflects new hours.
            await TherapistService.regenerateAvailability(
                user.id,
                form.workingHoursStart || '10:30',
                form.workingHoursEnd || '19:00',
                form.lunchBreakStart || '13:00'
            );

            Alert.alert('Saved', 'Your profile and schedule have been updated.');
        } catch (err: unknown) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.replace('/(auth)/login');
    };

    if (loading) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    return (
        <Screen>
            <Heading style={{ marginBottom: spacing.lg }}>My Profile</Heading>

            <Input label="Name" value={form.name || ''} onChangeText={(v) => set('name', v)} />
            <Input label="Specialization" value={form.specialization || ''} onChangeText={(v) => set('specialization', v)} placeholder="e.g. Clinical Psychologist" />
            <Input label="Session Fee (₹)" value={form.hourlyRate ? String(form.hourlyRate) : ''} onChangeText={(v) => set('hourlyRate', Number(v.replace(/\D/g, '')))} keyboardType="number-pad" />
            <Input label="About" value={form.about || form.bio || ''} onChangeText={(v) => set('about', v)} multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
            <Input label="Languages (comma separated)" value={listToText(form.languages)} onChangeText={(v) => set('languages', textToList(v))} placeholder="English, Hindi" />
            <Input label="Qualifications (comma separated)" value={listToText(form.qualifications)} onChangeText={(v) => set('qualifications', textToList(v))} />

            <Subheading style={{ marginBottom: spacing.sm }}>Working Hours</Subheading>
            <Muted style={{ marginBottom: spacing.md }}>
                Saving regenerates your Mon–Sat availability. Use 24h format (e.g. 10:30).
            </Muted>
            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Input label="Start" value={form.workingHoursStart || '10:30'} onChangeText={(v) => set('workingHoursStart', v)} placeholder="10:30" />
                </View>
                <View style={{ flex: 1 }}>
                    <Input label="End" value={form.workingHoursEnd || '19:00'} onChangeText={(v) => set('workingHoursEnd', v)} placeholder="19:00" />
                </View>
            </View>
            <Input label="Lunch Break Start" value={form.lunchBreakStart || '13:00'} onChangeText={(v) => set('lunchBreakStart', v)} placeholder="13:00" />

            <View style={styles.discountRow}>
                <View style={{ flex: 1 }}>
                    <Body style={{ fontWeight: '600' }}>Enable discount</Body>
                    <Muted>Show a reduced session fee.</Muted>
                </View>
                <Switch
                    value={!!form.discountEnabled}
                    onValueChange={(v) => set('discountEnabled', v)}
                    trackColor={{ true: colors.primary400, false: colors.neutral300 }}
                    thumbColor={form.discountEnabled ? colors.primary600 : colors.neutral100}
                />
            </View>
            {form.discountEnabled ? (
                <Input label="Discounted Fee (₹)" value={form.discountedRate ? String(form.discountedRate) : ''} onChangeText={(v) => set('discountedRate', Number(v.replace(/\D/g, '')))} keyboardType="number-pad" />
            ) : null}

            <Button title="Save Profile" onPress={handleSave} loading={saving} />
            <Button title="Sign Out" variant="outline" onPress={handleLogout} style={{ marginTop: spacing.md }} />
        </Screen>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.md },
    discountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
});
