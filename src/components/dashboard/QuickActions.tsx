// src/components/dashboard/QuickActions.tsx

import { type ReactNode } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Plus, Calendar, Download } from 'lucide-react';

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

function QuickActionButton({ icon, label, onClick, variant = 'secondary' }: QuickActionProps) {
  const variantStyles = {
    primary: {
      bg: 'rgba(79, 70, 229, 0.8)',
      _hover: { bg: 'rgba(67, 56, 202, 0.9)' },
      color: 'white',
      borderColor: 'rgba(99, 102, 241, 0.5)',
    },
    secondary: {
      bg: 'rgba(38, 38, 38, 0.6)',
      _hover: { bg: 'rgba(38, 38, 38, 0.8)' },
      color: 'gray.200',
      borderColor: 'rgba(55, 65, 81, 0.7)',
    },
    outline: {
      bg: 'transparent',
      _hover: { bg: 'rgba(38, 38, 38, 0.4)' },
      color: 'gray.300',
      borderColor: 'rgba(55, 65, 81, 0.7)',
    },
  };

  return (
    <Button
      onClick={onClick}
      display="flex"
      alignItems="center"
      gap={2}
      px={4}
      py={2.5}
      rounded="xl"
      border="1px solid"
      backdropFilter="blur(4px)"
      fontWeight="medium"
      fontSize="sm"
      {...variantStyles[variant]}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

export function QuickActions() {
  const handleQuickRecharge = () => {
    // Navigate to recharge page
    window.location.href = '/recharge';
  };

  const handleViewUpcoming = () => {
    // Scroll to warnings section
    const warningsSection = document.getElementById('warnings-section');
    if (warningsSection) {
      warningsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleExportReport = () => {
    // Export functionality
    console.log('Export report');
  };

  return (
    <Box
      bg="rgba(23, 23, 23, 0.4)"
      backdropFilter="blur(20px)"
      border="1px solid rgba(38, 38, 38, 0.6)"
      rounded="xl"
      shadow="2xl"
    >
      <Box p={{ base: 4, md: 6 }}>
        <Flex alignItems="center" gap={2} mb={4}>
          <Box p={1.5} bg="rgba(99, 102, 241, 0.1)" rounded="lg">
            <Text fontSize="lg">🎯</Text>
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="gray.100">快速行動</Text>
        </Flex>
        
        <Flex flexWrap="wrap" gap={3}>
          <QuickActionButton
            icon={<Box as={Plus} w={4} h={4} />}
            label="一鍵加值"
            onClick={handleQuickRecharge}
            variant="primary"
          />
          <QuickActionButton
            icon={<Box as={Calendar} w={4} h={4} />}
            label="查看即將到期"
            onClick={handleViewUpcoming}
            variant="secondary"
          />
          <QuickActionButton
            icon={<Box as={Download} w={4} h={4} />}
            label="匯出報告"
            onClick={handleExportReport}
            variant="outline"
          />
        </Flex>
      </Box>
    </Box>
  );
}