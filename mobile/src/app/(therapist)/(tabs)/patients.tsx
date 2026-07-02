import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTherapistBookings } from '@/hooks/useTherapistBookings';
import { TherapistService } from '@/services/therapistService';
import { ManualPatient } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

interface PatientRow {
    clientId: string;
    name: string;
    sessions: number;
    manual: boolean;
}

export default function PatientsTab() {
    const { user } = useAuth();
    const { bookings } = useTherapistBookings();
    const [manual, setManual] = useState<ManualPatient[]>([]);
    const [loadingManual, setLoadingManual] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const insets = useSafeAreaInsets();

    const loadManual = useCallback(() => {
        if (!user) return;
        TherapistService.getManualPatients(user.id).then((list) => {
            setManual(list);
            setLoadingManual(false);
        });
    }, [user]);

    useFocusEffect(useCallback(() => loadManual(), [loadManual]));

    const patients = useMemo(() => {
        const map = new Map<string, PatientRow>();
        bookings
            .filter((b) => b.status !== 'pending_payment' && b.status !== 'cancelled')
            .forEach((b) => {
                const existing = map.get(b.clientId);
                if (existing) existing.sessions += 1;
                else map.set(b.clientId, { clientId: b.clientId, name: b.clientName, sessions: 1, manual: false });
            });
        manual.forEach((p) => {
            if (!map.has(p.id)) map.set(p.id, { clientId: p.id, name: p.name, sessions: 0, manual: true });
        });
        const rows = Array.from(map.values());
        const term = search.trim().toLowerCase();
        return (term ? rows.filter((r) => r.name.toLowerCase().includes(term)) : rows).sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }, [bookings, manual, search]);

    const handleAdd = async () => {
        if (!user || !newName.trim()) {
            Alert.alert('Name required', 'Please enter the patient name.');
            return;
        }
        setSaving(true);
        try {
            await TherapistService.addManualPatient(user.id, newName.trim(), newEmail.trim(), newPhone.trim());
            setNewName('');
            setNewEmail('');
            setNewPhone('');
            setModalOpen(false);
            loadManual();
        } catch {
            Alert.alert('Error', 'Failed to add patient.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.warm50, paddingTop: insets.top }}>
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Heading>Patients</Heading>
                    <Pressable style={styles.addBtn} onPress={() => setModalOpen(true)}>
                        <Ionicons name="add" size={22} color={colors.white} />
                    </Pressable>
                </View>
                <Input value={search} onChangeText={setSearch} placeholder="Search patients..." style={styles.search} />
            </View>

            <FlatList
                data={patients}
                keyExtractor={(p) => p.clientId}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}
                ListEmptyComponent={
                    loadingManual ? (
                        <ActivityIndicator color={colors.primary600} style={{ marginTop: spacing.xl }} />
                    ) : (
                        <Body style={{ textAlign: 'center', marginTop: spacing.xl }}>No patients yet.</Body>
                    )
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
                        onPress={() => router.push(`/(therapist)/patient/${item.clientId}?name=${encodeURIComponent(item.name)}`)}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Body style={{ fontWeight: '600' }}>{item.name}</Body>
                            <Muted>
                                {item.sessions} session{item.sessions !== 1 ? 's' : ''}
                                {item.manual ? ' · added manually' : ''}
                            </Muted>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.neutral400} />
                    </Pressable>
                )}
            />

            <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={() => setModalOpen(false)}>
                <View style={styles.modalOverlay}>
                    <Screen scroll={false} style={styles.modalContent}>
                        <Subheading style={{ marginBottom: spacing.lg }}>Add Patient</Subheading>
                        <Input label="Name" value={newName} onChangeText={setNewName} placeholder="Patient name" />
                        <Input label="Email (optional)" value={newEmail} onChangeText={setNewEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />
                        <Input label="Phone (optional)" value={newPhone} onChangeText={setNewPhone} placeholder="Phone number" keyboardType="phone-pad" />
                        <Button title="Add Patient" onPress={handleAdd} loading={saving} />
                        <Button title="Cancel" variant="outline" onPress={() => setModalOpen(false)} style={{ marginTop: spacing.md }} />
                    </Screen>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: radius.full,
        backgroundColor: colors.primary600,
        alignItems: 'center',
        justifyContent: 'center',
    },
    search: { marginTop: spacing.md, marginBottom: 0 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.primary100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '600', color: colors.primary700 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: colors.warm50,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        maxHeight: '80%',
    },
});
