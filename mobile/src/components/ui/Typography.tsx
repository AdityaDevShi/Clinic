import { StyleSheet, Text, TextProps } from 'react-native';
import { colors, fonts } from '@/constants/theme';

/** Serif page heading — matches web's Playfair Display h1/h2. */
export function Heading({ style, ...rest }: TextProps) {
    return <Text style={[styles.heading, style]} {...rest} />;
}

export function Subheading({ style, ...rest }: TextProps) {
    return <Text style={[styles.subheading, style]} {...rest} />;
}

export function Body({ style, ...rest }: TextProps) {
    return <Text style={[styles.body, style]} {...rest} />;
}

export function Muted({ style, ...rest }: TextProps) {
    return <Text style={[styles.muted, style]} {...rest} />;
}

const styles = StyleSheet.create({
    heading: {
        fontFamily: fonts.serif,
        fontSize: 28,
        lineHeight: 36,
        color: colors.primary700,
    },
    subheading: {
        fontFamily: fonts.serif,
        fontSize: 20,
        lineHeight: 28,
        color: colors.primary700,
    },
    body: { fontSize: 15, lineHeight: 22, color: colors.neutral700 },
    muted: { fontSize: 13, lineHeight: 18, color: colors.neutral500 },
});
