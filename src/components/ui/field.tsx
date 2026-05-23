import { Box, Text } from '@chakra-ui/react';
import { forwardRef, type ReactNode } from 'react';
import { useColorModeValue } from '@/components/ui/color-mode';

interface FieldProps {
    label?: ReactNode;
    required?: boolean;
    error?: string;
    helperText?: string;
    children: ReactNode;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
    ({ label, required, error, helperText, children }, ref) => {
        const labelColor = useColorModeValue('gray.700', 'gray.300');
        const helperTextColor = useColorModeValue('gray.500', 'gray.500');
        
        return (
            <Box ref={ref} w="full">
                {label && (
                    <Text fontSize="sm" fontWeight="medium" mb={2} color={labelColor}>
                        {label}
                        {required && <Text as="span" color="red.400" ml={1}>*</Text>}
                    </Text>
                )}
                {children}
                {error && (
                    <Text fontSize="xs" color="red.400" mt={1}>
                        {error}
                    </Text>
                )}
                {helperText && !error && (
                    <Text fontSize="xs" color={helperTextColor} mt={1}>
                        {helperText}
                    </Text>
                )}
            </Box>
        );
    }
);

Field.displayName = 'Field';
