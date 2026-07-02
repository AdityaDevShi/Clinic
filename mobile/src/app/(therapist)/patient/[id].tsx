import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { TherapistService } from '@/services/therapistService';
import { PatientNote } from '@/lib/types';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Subheading, Body, Muted } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';

export default function PatientDetail() {
    const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
    const { user } = useAuth();
    const [notes, setNotes] = useState<PatientNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [savingNote, setSavingNote] = useState(false);
    const [meetLink, setMeetLink] = useState('');
    const [savingLink, setSavingLink] = useState(false);

    const load = useCallback(() => {
        if (!user || !id) return;
        Promise.all([
            TherapistService.getNotes(user.id, id),
            TherapistService.getSessionLink(user.id, id),
        ]).then(([noteList, link]) => {
            setNotes(noteList);
            setMeetLink(link);
            setLoading(false);
        });
    }, [user, id]);

    useFocusEffect(useCallback(() => load(), [load]));

    const handleAddNote = async () => {
        if (!user || !id || !newNote.trim()) return;
        setSavingNote(true);
        try {
            await TherapistService.addNote(user.id, id, newNote.trim());
            setNewNote('');
            load();
        } catch {
            Alert.alert('Error', 'Failed to save the note.');
        } finally {
            setSavingNote(false);
        }
    };

    const handleDeleteNote = (noteId: string) => {
        Alert.alert('Delete Note', 'Delete this note?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await TherapistService.deleteNote(noteId);
                    load();
                },
            },
        ]);
    };

    const handleSaveLink = async () => {
        if (!user || !id) return;
        setSavingLink(true);
        try {
            await TherapistService.setSessionLink(user.id, id, meetLink.trim());
            Alert.alert('Saved', 'Session link updated. The patient can now join from their app.');
        } catch {
            Alert.alert('Error', 'Failed to save the link.');
        } finally {
            setSavingLink(false);
        }
    };

    if (loading) {
        return (
            <Screen scroll={false} style={{ alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary600} />
            </Screen>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: true, title: name || 'Patient', headerTintColor: colors.primary700, headerStyle: { backgroundColor: colors.warm50 } }} />
            <Screen>
                <View style={styles.section}>
                    <Subheading style={{ marginBottom: spacing.sm }}>Session Link</Subheading>
                    <Muted style={{ marginBottom: spacing.sm }}>
                        Add a Google Meet / video link the patient can join from their bookings.
                    </Muted>
                    <Input value={meetLink} onChangeText={setMeetLink} placeholder="https://meet.google.com/..." autoCapitalize="none" keyboardType="url" />
                    <Button title="Save Link" onPress={handleSaveLink} loading={savingLink} />
                </View>

                <View style={styles.section}>
                    <Subheading style={{ marginBottom: spacing.sm }}>Session Notes</Subheading>
                    <Input
                        value={newNote}
                        onChangeText={setNewNote}
                        placeholder="Add a private note about this session..."
                        multiline
                        numberOfLines={3}
                        style={{ minHeight: 80, textAlignVertical: 'top' }}
                    />
                    <Button title="Add Note" onPress={handleAddNote} loading={savingNote} />
                </View>

                {notes.length === 0 ? (
                    <Body style={{ textAlign: 'center', color: colors.neutral500 }}>No notes yet.</Body>
                ) : (
                    notes.map((note) => (
                        <View key={note.id} style={styles.noteCard}>
                            <View style={styles.noteHeader}>
                                <Muted>{format(note.createdAt, 'MMM d, yyyy · h:mm a')}</Muted>
                                <Text onPress={() => handleDeleteNote(note.id)}>
                                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                                </Text>
                            </View>
                            <Body style={{ marginTop: spacing.xs }}>{note.content}</Body>
                        </View>
                    ))
                )}
            </Screen>
        </>
    );
}

const styles = StyleSheet.create({
    section: {
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.lg,
    },
    noteCard: {
        backgroundColor: colors.white,
        borderRadius: radius.md,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.neutral200,
        marginBottom: spacing.sm,
    },
    noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
