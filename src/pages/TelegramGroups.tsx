import { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Spinner,
  Icon,
  Input,
  Flex,
  EmptyState,
} from '@chakra-ui/react';
import { Plus, Users, DollarSign, TrendingUp, Search, AlertCircle } from 'lucide-react';
import GroupCard from '../components/telegram-groups/GroupCard';
import CreateGroupDialog from '../components/telegram-groups/CreateGroupDialog';
import { toaster } from '../components/ui/toaster';
import type { TelegramGroup, CreateGroupRequest } from '../types/telegram-groups';

export default function TelegramGroups() {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TelegramGroup | null>(null);

  // 載入數據
  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/telegram-groups');
      if (!response.ok) {
        throw new Error('Failed to load groups');
      }
      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load groups:', error);
      toaster.create({
        title: '載入失敗',
        description: '無法載入 Telegram 群組列表',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
     
  }, []);

  // 創建或更新群組
  const handleSubmit = async (data: CreateGroupRequest) => {
    try {
      const url = editingGroup
        ? `/api/telegram-groups?id=${editingGroup.id}`
        : '/api/telegram-groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(editingGroup ? 'Failed to update group' : 'Failed to create group');
      }

      toaster.create({
        title: editingGroup ? '更新成功' : '創建成功',
        description: editingGroup
          ? `群組 "${data.name}" 已更新`
          : `群組 "${data.name}" 已創建`,
        type: 'success',
      });

      await loadGroups();
      setEditingGroup(null);
    } catch (error) {
      console.error('Submit error:', error);
      toaster.create({
        title: editingGroup ? '更新失敗' : '創建失敗',
        description: '請稍後再試',
        type: 'error',
      });
      throw error;
    }
  };

  // 篩選群組
  const filteredGroups = groups.filter((group) =>
    !searchQuery ||
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.notes && group.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // 計算統計數據
  const totalGroups = groups.length;
  const activeGroups = groups.filter((g) => g.account_count && g.account_count > 0).length;
  const totalAccounts = groups.reduce((sum, g) => sum + (g.account_count || 0), 0);

  // 打開編輯對話框
  const handleEdit = (group: TelegramGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  // 打開創建對話框
  const handleCreate = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <VStack gap={{ base: 6, md: 10 }} maxW="7xl" mx="auto" pb={10} px={{ base: 0, sm: 4 }} align="stretch">
        <VStack justify="center" minH="400px">
          <Spinner size="xl" colorPalette="blue" />
          <Text color="fg.muted">載入中...</Text>
        </VStack>
      </VStack>
    );
  }

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
        <Flex justify="space-between" alignItems="center" flexWrap="wrap" gap={4}>
          <Box position="relative" zIndex={10}>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="fg.default">
              Telegram 群組管理
            </Text>
            <Text color="fg.muted" mt={2} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="medium" maxW="2xl">
              管理團購群組、查看收款狀態
            </Text>
          </Box>
          <Button
            colorPalette="accent"
            onClick={handleCreate}
            rounded="xl"
            h={12}
            px={6}
            shadow="lg"
            _hover={{ transform: 'scale(1.02)' }}
            transition="all"
            position="relative"
            zIndex={10}
          >
            <HStack gap={2}>
              <Box as={Plus} w={4} h={4} />
              <Text>新增群組</Text>
            </HStack>
          </Button>
        </Flex>
      </Box>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <Box
          p={5}
          bg="bg.panel"
          backdropFilter="blur(20px)"
          rounded="xl"
          border="1px solid"
          borderColor="border.default"
          shadow="xl"
          transition="all"
          _hover={{ transform: 'scale(1.02)' }}
        >
          <HStack gap={3}>
            <Box p={2} bg="bg.subtle" rounded="xl">
              <Box as={Users} w={5} h={5} colorPalette="blue" />
            </Box>
            <VStack align="start" gap={1}>
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                總群組數
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="fg.default">
                {totalGroups}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={5}
          bg="bg.panel"
          backdropFilter="blur(20px)"
          rounded="xl"
          border="1px solid"
          borderColor="border.default"
          shadow="xl"
          transition="all"
          _hover={{ transform: 'scale(1.02)' }}
        >
          <HStack gap={3}>
            <Box p={2} bg="bg.subtle" rounded="xl">
              <Box as={TrendingUp} w={5} h={5} colorPalette="green" />
            </Box>
            <VStack align="start" gap={1}>
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                活躍群組數
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="fg.default">
                {activeGroups}
              </Text>
            </VStack>
          </HStack>
        </Box>

        <Box
          p={5}
          bg="bg.panel"
          backdropFilter="blur(20px)"
          rounded="xl"
          border="1px solid"
          borderColor="border.default"
          shadow="xl"
          transition="all"
          _hover={{ transform: 'scale(1.02)' }}
        >
          <HStack gap={3}>
            <Box p={2} bg="bg.subtle" rounded="xl">
              <Box as={DollarSign} w={5} h={5} colorPalette="orange" />
            </Box>
            <VStack align="start" gap={1}>
              <Text fontSize="sm" color="fg.muted" fontWeight="medium">
                關聯 Apple ID
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="fg.default">
                {totalAccounts}
              </Text>
            </VStack>
          </HStack>
        </Box>
      </SimpleGrid>

      {/* Search Box */}
      <Box
        p={4}
        bg="bg.panel"
        backdropFilter="blur(20px)"
        rounded="xl"
        border="1px solid"
        borderColor="border.default"
        shadow="xl"
      >
        <HStack gap={3}>
          <Box as={Search} w={5} h={5} color="fg.muted" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋群組名稱或備註..."
            bg="transparent"
            border="none"
            color="fg.default"
            _placeholder={{ color: 'fg.muted' }}
            _focus={{ borderColor: 'transparent' }}
          />
        </HStack>
      </Box>

        {/* 群組列表 */}
        {filteredGroups.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Icon as={AlertCircle} />
              </EmptyState.Indicator>
              <VStack textAlign="center" gap={2}>
                <EmptyState.Title>
                  {searchQuery ? '沒有符合條件的群組' : '尚未新增群組'}
                </EmptyState.Title>
                <EmptyState.Description>
                  {searchQuery ? '請調整搜尋條件' : '點擊上方「新增群組」按鈕開始'}
                </EmptyState.Description>
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {filteredGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onEdit={handleEdit}
              />
            ))}
          </SimpleGrid>
        )}

        {/* 創建/編輯對話框 */}
        <CreateGroupDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          editingGroup={editingGroup}
        />
      </VStack>
  );
}