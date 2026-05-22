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
        bg="gray.800"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="xl"
        p={6}
      >
        <VStack gap={4}>
          <Spinner size="lg" color="blue.400" />
          <Text color="gray.300">載入帳號中...</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor="gray.700"
      borderRadius="xl"
      overflow="hidden"
    >
      {/* Header */}
      <Box p={6} borderBottom="1px solid" borderColor="gray.700">
        <VStack gap={4} align="stretch">
          <HStack justify="space-between">
            <HStack gap={2}>
              <Icon as={Users} color="blue.400" />
              <Text color="white" fontSize="lg" fontWeight="bold">
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
              color="gray.300"
            />
            <Input
              placeholder="搜尋 Apple ID、Google Account 或群組名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              pl={10}
              bg="gray.900"
              borderColor="gray.600"
              color="white"
              _placeholder={{ color: 'gray.500' }}
              _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
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
                color={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0 ? 'blue.400' : 'gray.300'}
              />
              <Text color="gray.300" fontSize="sm">
                {selectedIds.length === filteredAccounts.length ? '取消全選' : '全選'}
              </Text>
            </HStack>
            
            {selectedIds.length > 0 && (
              <HStack gap={2}>
                <Icon as={Wallet} color="green.400" />
                <Text color="green.400" fontSize="sm" fontWeight="medium">
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
                bg={isSelected ? 'rgba(49, 130, 206, 0.2)' : 'rgba(26, 32, 44, 0.5)'}
                borderRadius="lg"
                border="1px solid"
                borderColor={isSelected ? 'blue.500' : 'gray.700'}
                cursor="pointer"
                onClick={() => handleToggle(account.id)}
                transition="all 0.2s"
                _hover={{
                  borderColor: isSelected ? 'blue.400' : 'gray.600',
                  bg: isSelected ? 'rgba(49, 130, 206, 0.3)' : 'rgba(26, 32, 44, 0.7)',
                }}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack gap={2}>
                    <Icon
                      as={isSelected ? CheckSquare : Square}
                      color={isSelected ? 'blue.400' : 'gray.500'}
                    />
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {account.apple_id || account.google_account || '未知帳號'}
                    </Text>
                  </HStack>
                </HStack>

                <VStack gap={1} align="stretch">
                  {account.telegram_group_name && (
                    <Badge colorPalette="purple" variant="subtle" fontSize="xs" width="fit-content">
                      {account.telegram_group_name}
                    </Badge>
                  )}
                  
                  <HStack justify="space-between">
                    <Text color="gray.300" fontSize="xs">
                      目前餘額
                    </Text>
                    <Text color="green.400" fontSize="sm" fontWeight="bold">
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
            <Icon as={Users} color="gray.500" boxSize={8} />
            <Text color="gray.500">
              {searchQuery ? '沒有找到符合條件的帳號' : '沒有可選擇的帳號'}
            </Text>
          </VStack>
        )}
      </Box>
    </Box>
  );
}