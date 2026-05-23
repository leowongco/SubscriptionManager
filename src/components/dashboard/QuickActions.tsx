// src/components/dashboard/QuickActions.tsx

import { type ReactNode } from 'react';
import { Box, Flex, Text, Button } from '@chakra-ui/react';
import { Plus, Calendar, Download, Zap } from 'lucide-react';

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}

function QuickActionButton({ icon, label, onClick, variant = 'secondary' }: QuickActionProps) {
  const variantConfig = {
    primary: {
      colorPalette: 'indigo',
      variant: 'solid' as const,
    },
    secondary: {
      colorPalette: 'gray',
      variant: 'solid' as const,
    },
    outline: {
      colorPalette: 'gray',
      variant: 'outline' as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Button
      onClick={onClick}
      display="flex"
      alignItems="center"
      gap={2}
      px={4}
      py={2.5}
      rounded="xl"
      backdropFilter="blur(4px)"
      fontWeight="medium"
      fontSize="sm"
      colorPalette={config.colorPalette}
      variant={config.variant}
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
      bg="bg.panel"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="border.default"
      rounded="xl"
      shadow="2xl"
    >
      <Box p={{ base: 4, md: 6 }}>
        <Flex alignItems="center" gap={2} mb={4}>
          <Box p={1.5} bg="indigo.subtle" rounded="lg">
            <Box as={Zap} w={5} h={5} color="indigo.solid" />
          </Box>
          <Text fontSize="lg" fontWeight="bold" color="fg.emphasized">快速行動</Text>
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