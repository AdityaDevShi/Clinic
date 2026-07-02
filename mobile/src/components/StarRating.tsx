import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '@/constants/theme';

interface StarRatingProps {
    rating: number;
    onChange?: (rating: number) => void;
    size?: number;
}

export function StarRating({ rating, onChange, size = 32 }: StarRatingProps) {
    return (
        <View style={styles.row}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={onChange ? () => onChange(star) : undefined} disabled={!onChange}>
                    <Ionicons
                        name={star <= rating ? 'star' : 'star-outline'}
                        size={size}
                        color={star <= rating ? '#f59e0b' : '#d4d4d4'}
                    />
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
});
