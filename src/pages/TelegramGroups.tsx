import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Spinner,
  Icon,
  Input,
} from '@chakra-ui/react';
import { Plus, Users, DollarSign, TrendingUp, Search } from 'lucide-react';
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
      <Container maxW="container.xl" py={8}>
        <VStack justify="center" minH="400px">
          <Spinner size="xl" color="blue.400" />
          <Text color="gray.400">載入中...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" gap={6}>
        {/* 頁面標題和操作按鈕 */}
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold" color="white">
              Telegram 群組管理
            </Text>
            <Text fontSize="sm" color="gray.400">
              管理團購群組、查看收款狀態
            </Text>
          </VStack>
          <Button
            size="sm"
            colorPalette="blue"
            onClick={handleCreate}
          >
            <HStack gap={2}>
              <Box as={Plus} w={4} h={4} />
              <Text>新增群組</Text>
            </HStack>
          </Button>
        </HStack>

        {/* 統計區 */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box
            p={5}
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
          >
            <HStack gap={3}>
              <Box as={Users} w={8} h={8} color="blue.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.400">
                  總群組數
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {totalGroups}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box
            p={5}
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
          >
            <HStack gap={3}>
              <Box as={TrendingUp} w={8} h={8} color="green.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.400">
                  活躍群組數
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {activeGroups}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box
            p={5}
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
          >
            <HStack gap={3}>
              <Box as={DollarSign} w={8} h={8} color="orange.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.400">
                  關聯 Apple ID
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {totalAccounts}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </SimpleGrid>

        {/* 搜尋框 */}
        <Box
          p={4}
          bg="gray.800"
          rounded="xl"
          border="1px"
          borderColor="gray.700"
        >
          <HStack gap={3}>
            <Box as={Search} w={5} h={5} color="gray.400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋群組名稱或備註..."
              bg="transparent"
              border="none"
              color="white"
              _placeholder={{ color: 'gray.500' }}
              _focus={{ borderColor: 'transparent' }}
            />
          </HStack>
        </Box>

        {/* 群組列表 */}
        {filteredGroups.length === 0 ? (
          <VStack
            justify="center"
            minH="300px"
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
          >
            <Icon as={Users} w={12} h={12} color="gray.400" />
            <Text fontSize="lg" color="gray.400">
              沒有找到群組
            </Text>
            <Text fontSize="sm" color="gray.500">
              {searchQuery ? '嘗試其他搜尋條件' : '點擊「新增群組」開始'}
            </Text>
          </VStack>
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
    </Container>
  );
}