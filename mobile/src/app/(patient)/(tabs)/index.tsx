import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { Button } from '@/components/ui/Button';
import { Heading, Subheading, Body, Muted } from '@/components/ui/Typography';
import { WorkshopBanner } from '@/components/WorkshopBanner';
import { useAuth } from '@/contexts/AuthContext';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const SERVICES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
    { icon: 'person-outline', title: 'Individual Therapy', desc: 'Support for anxiety, depression, stress, and personal growth.' },
    { icon: 'heart-outline', title: 'Child & Adolescent Therapy', desc: 'Helping young minds navigate challenges and emotions.' },
    { icon: 'people-outline', title: 'Couples Counseling', desc: 'Improving communication and relationship harmony.' },
    { icon: 'clipboard-outline', title: 'Training & Supervision', desc: 'Professional training and supervision for psychology interns and students.' },
];

const WHY_US: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
    { icon: 'ribbon-outline', title: 'Experienced Care', desc: 'Licensed Clinical Psychologist.' },
    { icon: 'shield-outline', title: 'Confidential & Safe', desc: 'Secure and private online sessions.' },
    { icon: 'leaf-outline', title: 'Holistic Approach', desc: 'Tailored therapies for mind well-being.' },
];

const SUPPORT_PHONE = '+91 7075829856';
const SUPPORT_EMAIL = 'care@arambh.net';

export default function HomeTab() {
    const { user } = useAuth();

    return (
        <Screen padded={false}>
            <View style={styles.padded}>
                <WorkshopBanner />
            </View>

            {/* Hero — mirrors the website's entrance */}
            <View style={styles.hero}>
                <Text style={styles.heroTitle}>
                    <Text style={styles.heroTitleDark}>Arambh</Text> Mental Health Centre
                </Text>
                <Text style={styles.heroTagline}>A Beginning of Your Becoming</Text>
                {user?.name ? (
                    <Muted style={{ marginTop: spacing.sm }}>
                        Welcome back, {user.name.split(' ')[0]} 🌿
                    </Muted>
                ) : null}
                <Button
                    title="Book an Appointment"
                    onPress={() => router.push('/(patient)/(tabs)/therapists')}
                    style={styles.heroCta}
                />
            </View>

            {/* Our Services */}
            <View style={styles.section}>
                <Subheading style={styles.sectionTitle}>Our Services</Subheading>
                <View style={styles.grid}>
                    {SERVICES.map((s) => (
                        <View key={s.title} style={styles.serviceCard}>
                            <View style={styles.iconCircle}>
                                <Ionicons name={s.icon} size={20} color={colors.primary600} />
                            </View>
                            <Text style={styles.cardTitle}>{s.title}</Text>
                            <Muted style={styles.cardDesc}>{s.desc}</Muted>
                        </View>
                    ))}
                </View>
                <Body style={styles.sectionNote}>
                    All sessions are conducted online, ensuring privacy, accessibility, and
                    consistent mental health support.
                </Body>
            </View>

            {/* When should you see a psychologist */}
            <View style={[styles.section, styles.sectionAlt]}>
                <Subheading style={styles.sectionTitle}>When Should You See a Clinical Psychologist?</Subheading>
                <Body style={{ textAlign: 'center' }}>
                    Clinical psychologists can help manage emotional, behavioral, and cognitive
                    difficulties. Seeking professional support is a sign of strength, not weakness.
                </Body>
                <Pressable onPress={() => router.push('/(patient)/(tabs)/therapists')}>
                    <Text style={styles.link}>Meet our therapists →</Text>
                </Pressable>
            </View>

            {/* Why choose us */}
            <View style={styles.section}>
                <Subheading style={styles.sectionTitle}>Why Choose Us</Subheading>
                {WHY_US.map((w) => (
                    <View key={w.title} style={styles.whyRow}>
                        <View style={styles.iconCircle}>
                            <Ionicons name={w.icon} size={20} color={colors.primary600} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>{w.title}</Text>
                            <Muted>{w.desc}</Muted>
                        </View>
                    </View>
                ))}
            </View>

            {/* Contact */}
            <View style={[styles.section, styles.sectionAlt, { marginBottom: spacing.xxl }]}>
                <Subheading style={styles.sectionTitle}>Contact Us</Subheading>
                <Muted style={{ textAlign: 'center', marginBottom: spacing.md }}>
                    We&apos;re here to help. Get in touch anytime.
                </Muted>
                <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`)}>
                    <Ionicons name="call-outline" size={18} color={colors.primary600} />
                    <Text style={styles.contactText}>{SUPPORT_PHONE}</Text>
                </Pressable>
                <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
                    <Ionicons name="mail-outline" size={18} color={colors.primary600} />
                    <Text style={styles.contactText}>{SUPPORT_EMAIL}</Text>
                </Pressable>
                <View style={styles.contactRow}>
                    <Ionicons name="globe-outline" size={18} color={colors.primary600} />
                    <Text style={styles.contactText}>Online Services Available</Text>
                    <View style={styles.dot} />
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    padded: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    hero: {
        alignItems: 'center',
        paddingVertical: spacing.xxl + spacing.lg,
        paddingHorizontal: spacing.xl,
        backgroundColor: colors.warm100,
    },
    heroTitle: {
        fontFamily: fonts.serif,
        fontSize: 30,
        lineHeight: 40,
        textAlign: 'center',
        color: colors.primary500,
    },
    heroTitleDark: { color: colors.primary700 },
    heroTagline: {
        fontStyle: 'italic',
        fontSize: 15,
        color: colors.neutral500,
        marginTop: spacing.sm,
    },
    heroCta: { marginTop: spacing.xl, alignSelf: 'stretch' },
    section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.xl },
    sectionAlt: { backgroundColor: colors.warm100 },
    sectionTitle: { textAlign: 'center', marginBottom: spacing.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    serviceCard: {
        flexBasis: '47%',
        flexGrow: 1,
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.neutral200,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: radius.full,
        backgroundColor: colors.warm100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontFamily: fonts.serif,
        fontSize: 15,
        color: colors.primary700,
        textAlign: 'center',
        marginBottom: 4,
    },
    cardDesc: { textAlign: 'center' },
    sectionNote: { textAlign: 'center', marginTop: spacing.lg },
    link: {
        color: colors.primary600,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: spacing.md,
        fontSize: 15,
    },
    whyRow: {
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
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm,
    },
    contactText: { fontSize: 15, color: colors.neutral700 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
});
