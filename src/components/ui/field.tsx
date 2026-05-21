import { Box, Text } from '@chakra-ui/react';
import { forwardRef, type ReactNode } from 'react';

interface FieldProps {
    label?: string;
    required?: boolean;
    error?: string;
    helperText?: string;
    children: ReactNode;
}

export const Field = forwardRef<HTMLDivElement, FieldProps>(
    ({ label, required, error, helperText, children }, ref) => {
        return (
            <Box ref={ref} w="full">
                {label && (
                    <Text fontSize="sm" fontWeight="medium" mb={2} color="gray.300">
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
                    <Text fontSize="xs" color="gray.500" mt={1}>
                        {helperText}
                    </Text>
                )}
            </Box>
        );
    }
);

Field.displayName = 'Field';
