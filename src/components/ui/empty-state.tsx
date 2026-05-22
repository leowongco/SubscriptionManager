import { Box, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@/components/ui/color-mode';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');

  return (
    <Box textAlign="center" py={10}>
      {icon && (
        <Box mb={4} color={textColor}>
          {icon}
        </Box>
      )}
      <Text color={textColor} fontSize="lg" fontWeight="medium">
        {title}
      </Text>
      {description && (
        <Text color={mutedTextColor} fontSize="sm" mt={2}>
          {description}
        </Text>
      )}
      {action && (
        <Box mt={4}>
          {action}
        </Box>
      )}
    </Box>
  );
}