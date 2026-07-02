import { Screen } from '@/components/ui/Screen';
import { Heading, Body } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';

export default function ScheduleTab() {
    return (
        <Screen>
            <Heading style={{ marginBottom: spacing.md }}>Schedule</Heading>
            <Body>Your sessions and availability — coming in the next build step.</Body>
        </Screen>
    );
}
