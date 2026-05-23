import { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Badge,
  Icon,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';
import { Search, Users, Wallet, CheckSquare, Square } from 'lucide-react';
import type { RechargeAccount } from '../../types/recharge';

interface AccountSelectorProps {
  accounts: RechargeAccount[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

export default function AccountSelector({
  accounts,
  selectedIds,
  onSelectionChange,
  loading = false,
}: AccountSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 篩選帳號
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const searchLower = searchQuery.toLowerCase();
      const appleId = account.apple_id?.toLowerCase() || '';
      const googleAccount = account.google_account?.toLowerCase() || '';
      const groupName = account.telegram_group_name?.toLowerCase() || '';
      
      return (
        !searchQuery ||
        appleId.includes(searchLower) ||
        googleAccount.includes(searchLower) ||
        groupName.includes(searchLower)
      );
    });
  }, [accounts, searchQuery]);

  // 全選/取消全選
  const handleSelectAll = () => {
    if (selectedIds.length === filteredAccounts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredAccounts.map((a) => a.id));
    }
  };

  // 單獨選擇/取消選擇
  const handleToggle = (accountId: string) => {
    if (selectedIds.includes(accountId)) {
      onSelectionChange(selectedIds.filter((id) => id !== accountId));
    } else {
      onSelectionChange([...selectedIds, accountId]);
    }
  };

  // 計算統計
  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
  const totalBalance = selectedAccounts.reduce((sum, a) => sum + a.balance, 0);

  if (loading) {
    return (
      <Box
        bg="bg.panel"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="border.default"
        borderRadius="xl"
        p={6}
        shadow="xl"
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.400" />
          <Text color="fg.muted">載入帳號中...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="bg.panel"
      backdropFilter="blur(20px)"
      border="1px solid"
      borderColor="border.default"
      borderRadius="xl"
      overflow="hidden"
      shadow="xl"
    >
      {/* Header */}
      <Box p={6} borderBottom="1px solid" borderColor="border.default">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <HStack gap={2}>
              <Box p={2} bg="bg.subtle" rounded="lg">
                <Icon as={Users} color="blue.400" boxSize={5} />
              </Box>
              <Text color="fg.default" fontSize="lg" fontWeight="bold">
                選擇加值帳號
              </Text>
            </HStack>
            <Badge colorPalette="blue" variant="solid" fontSize="sm">
              已選擇 {selectedIds.length} / {filteredAccounts.length}
            </Badge>
          </HStack>

          {/* 搜尋框 */}
          <Box position="relative">
            <Icon
              as={Search}
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              color="fg.muted"
            />
            <Input
              placeholder="搜尋 Apple ID、Google Account 或群組名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              pl={10}
              bg="bg.subtle"
              borderColor="border.default"
              color="fg.default"
              _placeholder={{ color: 'fg.muted' }}
              _focus={{ borderColor: 'focus.ring', boxShadow: '0 0 0 1px var(--chakra-colors-focus-ring)' }}
              borderRadius="lg"
            />
          </Box>

          {/* 全選按鈕 */}
          <HStack justify="space-between">
            <HStack
              gap={2}
              cursor="pointer"
              onClick={handleSelectAll}
              _hover={{ opacity: 0.8 }}
            >
              <Icon
                as={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0 ? CheckSquare : Square}
                color={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0 ? 'blue.400' : 'fg.muted'}
              />
              <Text color="fg.muted" fontSize="sm">
                {selectedIds.length === filteredAccounts.length ? '取消全選' : '全選'}
              </Text>
            </HStack>
            
            {selectedIds.length > 0 && (
              <HStack gap={2}>
                <Icon as={Wallet} color="blue.400" />
                <Text color="blue.400" fontSize="sm" fontWeight="medium">
                  總餘額: ${totalBalance.toFixed(2)}
                </Text>
              </HStack>
            )}
          </HStack>
        </VStack>
      </Box>

      {/* 帳號列表 */}
      <Box p={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
          {filteredAccounts.map((account) => {
            const isSelected = selectedIds.includes(account.id);
            
            return (
              <Box
                key={account.id}
                p={4}
                bg={isSelected ? 'bg.emphasized' : 'bg.subtle'}
                borderRadius="lg"
                border="1px solid"
                borderColor={isSelected ? 'blue.500' : 'border.default'}
                cursor="pointer"
                onClick={() => handleToggle(account.id)}
                transition="all 0.2s"
                _hover={{
                  borderColor: isSelected ? 'blue.400' : 'border.emphasized',
                  bg: isSelected ? 'bg.hover' : 'bg.muted',
                }}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack gap={2}>
                    <Icon
                      as={isSelected ? CheckSquare : Square}
                      color={isSelected ? 'blue.400' : 'fg.muted'}
                    />
                    <Text color="fg.default" fontSize="sm" fontWeight="medium">
                      {account.apple_id || account.google_account || '未知帳號'}
                    </Text>
                  </HStack>
                </HStack>

                <VStack gap={1} align="stretch">
                  {account.telegram_group_name && (
                    <Badge colorPalette="blue" variant="subtle" fontSize="xs" width="fit-content">
                      {account.telegram_group_name}
                    </Badge>
                  )}
                  
                  <HStack justify="space-between">
                    <Text color="fg.muted" fontSize="xs">
                      目前餘額
                    </Text>
                    <Text color="blue.400" fontSize="sm" fontWeight="bold">
                      ${account.balance.toFixed(2)}
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            );
          })}
        </SimpleGrid>

        {filteredAccounts.length === 0 && (
          <VStack gap={2} py={8}>
            <Icon as={Users} color="fg.muted" boxSize={8} />
            <Text color="fg.muted">
              {searchQuery ? '沒有找到符合條件的帳號' : '沒有可選擇的帳號'}
            </Text>
          </VStack>
        )}
      </Box>
    </Box>
  );
}