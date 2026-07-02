import { Screen } from '@/components/ui/Screen';
import { Heading, Body } from '@/components/ui/Typography';
import { useAuth } from '@/contexts/AuthContext';
import { spacing } from '@/constants/theme';

export default function DashboardTab() {
    const { user } = useAuth();
    return (
        <Screen>
            <Heading style={{ marginBottom: spacing.md }}>
                Welcome, {user?.name?.split(' ')[0] || 'Doctor'}
            </Heading>
            <Body>Your dashboard — coming in the next build step.</Body>
        </Screen>
    );
}
