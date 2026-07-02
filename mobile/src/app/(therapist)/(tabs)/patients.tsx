import { Screen } from '@/components/ui/Screen';
import { Heading, Body } from '@/components/ui/Typography';
import { spacing } from '@/constants/theme';

export default function PatientsTab() {
    return (
        <Screen>
            <Heading style={{ marginBottom: spacing.md }}>Patients</Heading>
            <Body>Your patient list — coming in the next build step.</Body>
        </Screen>
    );
}
