import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Badge,
  Icon,
  Spinner,
  Flex,
  Table,
  EmptyState,
} from '@chakra-ui/react';
import {
  CreditCard,
  History as HistoryIcon,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import AccountSelector from '@/components/recharge/AccountSelector';
import RechargePreview from '@/components/recharge/RechargePreview';
import RechargeProgress from '@/components/recharge/RechargeProgress';
import { toaster } from '@/components/ui/toaster';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import type { RechargeAccount, RechargePreview as RechargePreviewType, RechargeProgress as RechargeProgressType } from '@/types/recharge';
import { format } from 'date-fns';

export default function Recharge() {
  const { data: accounts, isLoading: accountsLoading } = useSWR<any[]>('accounts', api.getAccounts);
  const { data: telegramGroups } = useSWR<any[]>('telegram-groups', api.getTelegramGroups);
  const { data: history, mutate: mutateHistory } = useSWR<any[]>('history', api.getHistory);

  // 篩選狀態
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currencyFilter, setCurrencyFilter] = useState<string>('');

  // 加值表單狀態
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [operator, setOperator] = useState<string>('');
  const [giftCard, setGiftCard] = useState<string>('');

  // 選擇的帳號
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // 預覽和進度狀態
  const [showPreview, setShowPreview] = useState(false);
  const [rechargeProgress, setRechargeProgress] = useState<RechargeProgressType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 歷史記錄分頁
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 處理帳號數據，添加 Telegram Group 信息
  const processedAccounts: RechargeAccount[] = useMemo(() => {
    if (!accounts) return [];
    
    return accounts.map((acc) => {
      // 查找帳號關聯的 Telegram Group
      let telegramGroupId: string | null = null;
      let telegramGroupName: string | null = null;
      
      if (acc.subscriptions && acc.subscriptions.length > 0) {
        for (const sub of acc.subscriptions) {
          if (sub.telegram_group_id) {
            telegramGroupId = sub.telegram_group_id;
            const group = telegramGroups?.find((g: any) => g.id === sub.telegram_group_id);
            if (group) {
              telegramGroupName = group.name;
            }
            break;
          }
        }
      }
      
      return {
        id: acc.id,
        apple_id: acc.apple_id,
        account_type: acc.account_type,
        balance: acc.balance || 0,
        currency: acc.subscriptions?.[0]?.currency || 'HKD',
        telegram_group_id: telegramGroupId,
        telegram_group_name: telegramGroupName,
      };
    });
  }, [accounts, telegramGroups]);

  // 根據篩選條件過濾帳號
  const filteredAccounts = useMemo(() => {
    return processedAccounts.filter((account) => {
      // Telegram Group 篩選
      if (selectedGroupId && account.telegram_group_id !== selectedGroupId) {
        return false;
      }
      
      // 搜尋篩選
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const appleId = account.apple_id?.toLowerCase() || '';
        if (!appleId.includes(searchLower)) {
          return false;
        }
      }
      
      // 幣種篩選
      if (currencyFilter && account.currency !== currencyFilter) {
        return false;
      }
      
      return true;
    });
  }, [processedAccounts, selectedGroupId, searchQuery, currencyFilter]);

  // 預覽數據
  const previews: RechargePreviewType[] = useMemo(() => {
    const amountNum = parseFloat(amount) || 0;
    return selectedAccountIds
      .map((id) => {
        const account = processedAccounts.find((a) => a.id === id);
        if (!account) return null;
        return {
          account_id: id,
          apple_id: account.apple_id,
          current_balance: account.balance,
          recharge_amount: amountNum,
          new_balance: account.balance + amountNum,
        };
      })
      .filter((p): p is RechargePreviewType => p !== null);
  }, [selectedAccountIds, processedAccounts, amount]);

  const totalAmount = previews.reduce((sum, p) => sum + p.recharge_amount, 0);

  // 歷史記錄數據
  const historyData = useMemo(() => {
    if (!history) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return history.slice(start, start + itemsPerPage);
  }, [history, currentPage]);

  const totalPages = Math.ceil((history?.length || 0) / itemsPerPage);

  // 處理預覽
  const handlePreview = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toaster.create({
        title: '錯誤',
        description: '請輸入有效的加值金額',
        type: 'error',
      });
      return;
    }
    
    if (selectedAccountIds.length === 0) {
      toaster.create({
        title: '錯誤',
        description: '請選擇至少一個帳號',
        type: 'error',
      });
      return;
    }

    const selectedCurrencies = new Set(
      processedAccounts.filter(a => selectedAccountIds.includes(a.id)).map(a => a.currency || 'HKD')
    );
    if (selectedCurrencies.size > 1) {
      toaster.create({
        title: '錯誤',
        description: `所選帳號地區不一致（${[...selectedCurrencies].join('、')}），同一筆金額無法套用到不同貨幣的帳號，請用上方「地區」篩選分開加值`,
        type: 'error',
        duration: 6000,
      });
      return;
    }

    if (!reason.trim()) {
      toaster.create({
        title: '錯誤',
        description: '請輸入加值原因',
        type: 'error',
      });
      return;
    }
    
    if (!operator.trim()) {
      toaster.create({
        title: '錯誤',
        description: '請輸入操作者名稱',
        type: 'error',
      });
      return;
    }
    
    setShowPreview(true);
  };

  // 確認加值
  const handleConfirmRecharge = async () => {
    setIsProcessing(true);
    setRechargeProgress({
      total: selectedAccountIds.length,
      completed: 0,
      success: 0,
      failed: 0,
      results: [],
      isProcessing: true,
    });
    
    try {
      const response = await api.batchRechargeByGroup({
        account_ids: selectedAccountIds,
        amount: parseFloat(amount),
        reason: reason,
        operator: operator,
        gift_card: giftCard || undefined,
      });
      
      // 更新進度
      setRechargeProgress({
        total: selectedAccountIds.length,
        completed: response.results.length,
        success: response.success,
        failed: response.failed,
        results: response.results,
        isProcessing: false,
      });
      
      // 顯示結果
      if (response.success === selectedAccountIds.length) {
        toaster.create({
          title: '加值成功',
          description: `已成功為 ${response.success} 個帳號加值`,
          type: 'success',
        });
      } else if (response.success > 0) {
        toaster.create({
          title: '部分成功',
          description: `成功 ${response.success} 個，失敗 ${response.failed} 個`,
          type: 'warning',
        });
      } else {
        toaster.create({
          title: '加值失敗',
          description: '所有加值操作都失敗了',
          type: 'error',
        });
      }
      
      // 刷新歷史記錄
      mutateHistory();
      
      // 重置表單
      setTimeout(() => {
        setShowPreview(false);
        setRechargeProgress(null);
        setSelectedAccountIds([]);
        setAmount('');
        setReason('');
        setGiftCard('');
        setIsProcessing(false);
      }, 3000);
    } catch (error: any) {
      toaster.create({
        title: '加值失敗',
        description: error.message || '未知錯誤',
        type: 'error',
      });
      setIsProcessing(false);
      setRechargeProgress(null);
    }
  };

  // 取消預覽
  const handleCancelPreview = () => {
    setShowPreview(false);
  };

  return (
    <VStack gap={{ base: 6, md: 10 }} maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }} align="stretch">
      {/* Header Section */}
      <Box
        position="relative"
        overflow="hidden"
        rounded={{ base: '2xl', md: '3xl' }}
        bg="bg.panel"
        border="1px solid"
        borderColor="border.default"
        p={{ base: 5, md: 8 }}
        shadow="2xl"
        backdropFilter="blur(20px)"
        transition="all 0.3s"
      >
        <Box position="relative" zIndex={10}>
          <HStack gap={3}>
            <Box p={2} bg="bg.subtle" rounded="xl">
              <Icon as={CreditCard} color="blue.400" boxSize={6} />
            </Box>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="fg.default">
              批次加值中心
            </Text>
          </HStack>
          <Text color="fg.muted" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" maxW="2xl">
            快速為多個 Apple ID 批量登錄禮品卡充值紀錄，支援按 Telegram Group 篩選。
          </Text>
        </Box>
      </Box>

      {/* Filter Section */}
      <Box
        bg="bg.panel"
        backdropFilter="blur(20px)"
        border="1px solid"
        borderColor="border.default"
        borderRadius="xl"
        p={6}
        shadow="xl"
      >
        <VStack gap={4} align="stretch">
          <HStack gap={2}>
            <Box p={2} bg="bg.subtle" rounded="lg">
              <Icon as={Filter} color="blue.400" boxSize={5} />
            </Box>
            <Text color="fg.default" fontSize="lg" fontWeight="bold">
              篩選條件
            </Text>
          </HStack>
          
          <Flex gap={4} wrap="wrap">
            {/* Telegram Group 選擇 */}
            <Box flex="1" minW="200px">
              <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                Telegram Group
              </Text>
              <Select
                value={selectedGroupId}
                onValueChange={(val) => setSelectedGroupId(val)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg">
                  <SelectValue>選擇 Telegram Group</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectItem value="">
                    <Text color="fg.muted">全部群組</Text>
                  </SelectItem>
                  {telegramGroups?.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      <Text color="fg.default">{group.name}</Text>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
            
            {/* Apple ID 搜尋 */}
            <Box flex="1" minW="200px">
              <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                Apple ID 搜尋
              </Text>
              <Input
                placeholder="搜尋 Apple ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="bg.subtle"
                borderColor="border.default"
                color="fg.default"
                _placeholder={{ color: 'fg.muted' }}
                borderRadius="lg"
              />
            </Box>
            
            {/* 幣種篩選 */}
            <Box flex="1" minW="200px">
              <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                幣種
              </Text>
              <Select
                value={currencyFilter}
                onValueChange={(val) => setCurrencyFilter(val)}
              >
                <SelectTrigger className="bg-gray-50 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-lg">
                  <SelectValue>選擇幣種</SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                  <SelectItem value="">
                    <Text color="fg.muted">全部幣種</Text>
                  </SelectItem>
                  <SelectItem value="HKD">
                    <Text color="fg.default">HKD</Text>
                  </SelectItem>
                  <SelectItem value="USD">
                    <Text color="fg.default">USD</Text>
                  </SelectItem>
                  <SelectItem value="TWD">
                    <Text color="fg.default">TWD</Text>
                  </SelectItem>
                  <SelectItem value="TRY">
                    <Text color="fg.default">TRY</Text>
                  </SelectItem>
                  <SelectItem value="ARS">
                    <Text color="fg.default">ARS</Text>
                  </SelectItem>
                </SelectContent>
              </Select>
            </Box>
          </Flex>
        </VStack>
      </Box>

      {/* 加值表單 */}
      {!showPreview && !rechargeProgress && (
        <>
          <Box
            bg="bg.panel"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="border.default"
            borderRadius="xl"
            p={6}
            shadow="xl"
          >
            <VStack gap={4} align="stretch">
              <HStack gap={2}>
                <Box p={2} bg="bg.subtle" rounded="lg">
                  <Icon as={CreditCard} color="blue.400" boxSize={5} />
                </Box>
                <Text color="fg.default" fontSize="lg" fontWeight="bold">
                  加值設定
                </Text>
              </HStack>
              
              <Flex gap={4} wrap="wrap">
                {/* 加值金額 */}
                <Box flex="1" minW="200px">
                  <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                    加值金額 *
                  </Text>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    bg="bg.subtle"
                    borderColor="border.default"
                    color="fg.default"
                    _placeholder={{ color: 'fg.muted' }}
                    borderRadius="lg"
                    fontSize="lg"
                    fontWeight="bold"
                  />
                </Box>
                
                {/* 加值原因 */}
                <Box flex="1" minW="200px">
                  <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                    加值原因 *
                  </Text>
                  <Input
                    placeholder="例如：禮品卡加值"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    bg="bg.subtle"
                    borderColor="border.default"
                    color="fg.default"
                    _placeholder={{ color: 'fg.muted' }}
                    borderRadius="lg"
                  />
                </Box>
                
                {/* 操作者 */}
                <Box flex="1" minW="200px">
                  <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                    操作者 *
                  </Text>
                  <Input
                    placeholder="輸入您的名稱"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    bg="bg.subtle"
                    borderColor="border.default"
                    color="fg.default"
                    _placeholder={{ color: 'fg.muted' }}
                    borderRadius="lg"
                  />
                </Box>
              </Flex>
              
              {/* 禮品卡序號 */}
              <Box>
                <Text color="fg.muted" fontSize="sm" mb={2} fontWeight="medium">
                  禮品卡序號 / 備註（選填）
                </Text>
                <Input
                  placeholder="輸入禮品卡序號或備註..."
                  value={giftCard}
                  onChange={(e) => setGiftCard(e.target.value)}
                  bg="bg.subtle"
                  borderColor="border.default"
                  color="fg.default"
                  _placeholder={{ color: 'fg.muted' }}
                  borderRadius="lg"
                />
              </Box>
            </VStack>
          </Box>

          {/* 帳號選擇 */}
          <AccountSelector
            accounts={filteredAccounts}
            selectedIds={selectedAccountIds}
            onSelectionChange={setSelectedAccountIds}
            loading={accountsLoading}
          />

          {/* 預覽按鈕 */}
          <HStack justify="flex-end">
            <Button
              colorPalette="accent"
              onClick={handlePreview}
              disabled={isProcessing || selectedAccountIds.length === 0}
            >
              <Icon as={CreditCard} mr={2} />
              預覽加值
            </Button>
          </HStack>
        </>
      )}

      {/* 預覽 */}
      {showPreview && !rechargeProgress && (
        <RechargePreview
          previews={previews}
          totalAmount={totalAmount}
          onConfirm={handleConfirmRecharge}
          onCancel={handleCancelPreview}
          loading={isProcessing}
        />
      )}

      {/* 進度 */}
      {rechargeProgress && (
        <RechargeProgress progress={rechargeProgress} />
      )}

      {/* 歷史記錄 */}
      <VStack gap={4} align="stretch">
        <HStack justify="space-between" borderBottom="1px solid" borderColor="border.default" pb={3}>
          <HStack gap={2}>
            <Box p={2} bg="bg.subtle" rounded="lg">
              <Icon as={HistoryIcon} color="blue.400" boxSize={5} />
            </Box>
            <Text color="fg.default" fontSize="xl" fontWeight="bold">
              歷史加值紀錄
            </Text>
          </HStack>
          <Badge colorPalette="blue" variant="solid">
            {history?.length || 0} 筆記錄
          </Badge>
        </HStack>

        <Box
          rounded="3xl"
          border="1px solid"
          borderColor="border.default"
          bg="bg.panel"
          backdropFilter="blur(20px)"
          overflow="hidden"
          shadow="2xl"
        >
          {/* 頂部色條 */}
          <Box h={1.5} w="full" bg="blue.500" />
          {!history ? (
            <VStack py={12}>
              <Spinner size="lg" color="blue.400" />
              <Text color="fg.muted">載入中...</Text>
            </VStack>
          ) : historyData.length === 0 ? (
            <EmptyState.Root>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <Icon as={AlertCircle} />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={2}>
                  <EmptyState.Title>暫無加值紀錄</EmptyState.Title>
                  <EmptyState.Description>選擇帳號並進行加值後，紀錄將顯示在這裡</EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : (
            <Box overflowX="auto">
              <Table.Root width="full">
                <Table.Header bg="bg.subtle">
                  <Table.Row>
                    <Table.ColumnHeader p={4} textAlign="left" color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      日期
                    </Table.ColumnHeader>
                    <Table.ColumnHeader p={4} textAlign="left" color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      帳號
                    </Table.ColumnHeader>
                    <Table.ColumnHeader p={4} textAlign="right" color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      金額
                    </Table.ColumnHeader>
                    <Table.ColumnHeader p={4} textAlign="left" color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      類型
                    </Table.ColumnHeader>
                    <Table.ColumnHeader p={4} textAlign="left" color="fg.muted" fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      備註
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {historyData.map((item, idx) => (
                    <Table.Row
                      key={idx}
                      borderBottom="1px solid"
                      borderColor="border.default"
                      _hover={{ bg: 'bg.hover' }}
                    >
                      <Table.Cell p={4} color="fg.muted" fontSize="sm" fontFamily="mono">
                        {item.created_at ? format(new Date(item.created_at), 'yyyy/MM/dd HH:mm') : '-'}
                      </Table.Cell>
                      <Table.Cell p={4} color="fg.default" fontSize="sm" fontWeight="medium">
                        {item.apple_id ? item.apple_id.split('@')[0] : 'Unknown'}
                      </Table.Cell>
                      <Table.Cell p={4} textAlign="right" color="blue.400" fontSize="sm" fontWeight="bold" fontFamily="mono">
                        +{typeof item.amount === 'number' ? item.amount.toFixed(2) : '0.00'}
                      </Table.Cell>
                      <Table.Cell p={4}>
                        <Badge colorPalette="blue" variant="subtle" fontSize="xs">
                          {item.type || 'recharge'}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell p={4} color="fg.muted" fontSize="sm">
                        {item.memo}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>

        {/* 分頁 */}
        {totalPages > 1 && (
          <HStack justify="center" gap={4}>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              borderColor="border.emphasized"
              color="fg.muted"
            >
              <Icon as={ChevronLeft} />
            </Button>
            <Text color="fg.muted" fontSize="sm">
              第 {currentPage} 頁，共 {totalPages} 頁
            </Text>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              borderColor="border.emphasized"
              color="fg.muted"
            >
              <Icon as={ChevronRight} />
            </Button>
          </HStack>
        )}
      </VStack>
    </VStack>
  );
}
