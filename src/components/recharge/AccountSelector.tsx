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
import { getAccountTypeMeta } from '@/lib/accountType';

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
      const groupName = account.telegram_group_name?.toLowerCase() || '';

      return (
        !searchQuery ||
        appleId.includes(searchLower) ||
        groupName.includes(searchLower)
      );
    });
  }, [accounts, searchQuery]);

  // 計算統計
  const selectedAccounts = accounts.filter((a) => selectedIds.includes(a.id));
  const totalBalance = selectedAccounts.reduce((sum, a) => sum + a.balance, 0);
  // 已選帳號鎖定的地區（貨幣）——一旦選了第一個帳號，其他地區的帳號就不能再選，避免同一筆金額套用到不同貨幣
  const lockedCurrency = selectedAccounts[0]?.currency || null;
  const selectableAccounts = lockedCurrency
    ? filteredAccounts.filter((a) => (a.currency || 'HKD') === lockedCurrency)
    : filteredAccounts;

  // 全選/取消全選（只全選跟目前鎖定地區相同的帳號）
  const handleSelectAll = () => {
    if (selectedIds.length === selectableAccounts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableAccounts.map((a) => a.id));
    }
  };

  // 單獨選擇/取消選擇
  const handleToggle = (accountId: string) => {
    if (selectedIds.includes(accountId)) {
      onSelectionChange(selectedIds.filter((id) => id !== accountId));
      return;
    }
    const account = accounts.find((a) => a.id === accountId);
    if (lockedCurrency && account && (account.currency || 'HKD') !== lockedCurrency) {
      return; // 地區不同，不允許加入這次批次選取
    }
    onSelectionChange([...selectedIds, accountId]);
  };

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
              已選擇 {selectedIds.length} / {selectableAccounts.length}
            </Badge>
          </HStack>
          {lockedCurrency && (
            <Text fontSize="xs" color="fg.muted">
              已鎖定加值地區：{lockedCurrency}，只能繼續選擇同地區的帳號
            </Text>
          )}

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
              placeholder="搜尋帳號或群組名稱..."
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
                as={selectedIds.length === selectableAccounts.length && selectableAccounts.length > 0 ? CheckSquare : Square}
                color={selectedIds.length === selectableAccounts.length && selectableAccounts.length > 0 ? 'blue.400' : 'fg.muted'}
              />
              <Text color="fg.muted" fontSize="sm">
                {selectedIds.length === selectableAccounts.length ? '取消全選' : '全選'}
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
            const typeMeta = getAccountTypeMeta(account.account_type);
            const accountCurrency = account.currency || 'HKD';
            const isCurrencyBlocked = !!lockedCurrency && !isSelected && accountCurrency !== lockedCurrency;

            return (
              <Box
                key={account.id}
                p={4}
                bg={isSelected ? 'bg.emphasized' : 'bg.subtle'}
                borderRadius="lg"
                border="1px solid"
                borderColor={isSelected ? 'blue.500' : 'border.default'}
                borderLeftWidth="3px"
                borderLeftColor={`${typeMeta.colorPalette}.solid`}
                cursor={isCurrencyBlocked ? 'not-allowed' : 'pointer'}
                opacity={isCurrencyBlocked ? 0.4 : 1}
                onClick={() => !isCurrencyBlocked && handleToggle(account.id)}
                transition="all 0.2s"
                _hover={isCurrencyBlocked ? undefined : {
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
                      {account.apple_id || '未知帳號'}
                    </Text>
                  </HStack>
                  {isCurrencyBlocked && (
                    <Badge colorPalette="gray" fontSize="10px">地區不同</Badge>
                  )}
                </HStack>

                <VStack gap={1} align="stretch">
                  <HStack gap={1}>
                    <Badge colorPalette={typeMeta.colorPalette} variant="subtle" fontSize="xs" width="fit-content">
                      <Icon as={typeMeta.icon} boxSize={2.5} mr={1} />
                      {typeMeta.label}
                    </Badge>
                    <Badge colorPalette="orange" variant="subtle" fontSize="xs" width="fit-content">
                      {accountCurrency}
                    </Badge>
                  </HStack>
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