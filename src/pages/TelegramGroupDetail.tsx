import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Spinner,
  Badge,
  Table,
} from '@chakra-ui/react';
import { ArrowLeft, Edit, ExternalLink, Calendar, Users, DollarSign, Copy, CheckCircle, XCircle } from 'lucide-react';
import BillingCycleCard from '../components/telegram-groups/BillingCycleCard';
import CreateGroupDialog from '../components/telegram-groups/CreateGroupDialog';
import { toaster } from '../components/ui/toaster';
import type { TelegramGroupDetail, CreateGroupRequest } from '../types/telegram-groups';

export default function TelegramGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<TelegramGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 載入群組詳情
  const loadGroup = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/telegram-groups?id=${id}`);
      if (!response.ok) {
        throw new Error('Failed to load group');
      }
      const data = await response.json();
      setGroup(data);
    } catch (error) {
      console.error('Failed to load group:', error);
      toaster.create({
        title: '載入失敗',
        description: '無法載入群組詳情',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 更新群組
  const handleUpdate = async (data: CreateGroupRequest) => {
    try {
      const response = await fetch(`/api/telegram-groups?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update group');
      }

      toaster.create({
        title: '更新成功',
        description: `群組 "${data.name}" 已更新`,
        type: 'success',
      });

      await loadGroup();
    } catch (error) {
      console.error('Update error:', error);
      toaster.create({
        title: '更新失敗',
        description: '請稍後再試',
        type: 'error',
      });
      throw error;
    }
  };

  // 生成 Telegram 貼文
  const generatePost = () => {
    if (!group) return;

    const cycleLabel = {
      monthly: '每月',
      biannually: '半年',
      yearly: '一年',
    };

    const lines = [
      `📱 ${group.name} 收款通知`,
      '',
      `📅 收費週期：${cycleLabel[group.billing_cycle_type]}`,
      `💳 扣費日：每月 ${group.billing_day} 日`,
      '',
      '👥 成員付款狀態：',
    ];

    // 添加成員付款狀態
    group.subscriptions.forEach((sub) => {
      sub.members?.forEach((member) => {
        const status = member.payment_status ? '✅ 已付款' : '❌ 未付款';
        lines.push(`  ${member.email} - ${status}`);
      });
    });

    lines.push('', '請各位成員按時付款，謝謝！');

    const postText = lines.join('\n');

    // 複製到剪貼板
    navigator.clipboard.writeText(postText).then(() => {
      toaster.create({
        title: '已複製',
        description: '貼文內容已複製到剪貼板',
        type: 'success',
      });
    }).catch(() => {
      toaster.create({
        title: '複製失敗',
        description: '請手動複製貼文內容',
        type: 'error',
      });
    });
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

  if (!group) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack justify="center" minH="400px">
          <Text color="gray.400">群組不存在</Text>
          <Button size="sm" onClick={() => navigate('/groups')}>
            返回列表
          </Button>
        </VStack>
      </Container>
    );
  }

  const cycleLabel = {
    monthly: '每月',
    biannually: '半年',
    yearly: '一年',
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" gap={6}>
        {/* 返回按鈕和標題 */}
        <HStack justify="space-between" align="center">
          <HStack gap={4}>
            <Button
              size="sm"
              variant="ghost"
              colorPalette="gray"
              onClick={() => navigate('/groups')}
            >
              <HStack gap={2}>
                <Box as={ArrowLeft} w={4} h={4} />
                <Text>返回</Text>
              </HStack>
            </Button>
            <VStack align="start" gap={1}>
              <HStack gap={3}>
                <Text fontSize="2xl" fontWeight="bold" color="white">
                  {group.name}
                </Text>
                <Badge colorPalette="blue" fontSize="xs">
                  {cycleLabel[group.billing_cycle_type]}
                </Badge>
              </HStack>
              {group.telegram_link && (
                <HStack gap={1}>
                  <Box as={ExternalLink} w={4} h={4} color="blue.400" />
                  <a
                    href={group.telegram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Text
                      fontSize="sm"
                      color="blue.400"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      Telegram 群組
                    </Text>
                  </a>
                </HStack>
              )}
            </VStack>
          </HStack>
          <HStack gap={2}>
            <Button
              size="sm"
              colorPalette="green"
              variant="outline"
              onClick={generatePost}
            >
              <HStack gap={2}>
                <Box as={Copy} w={4} h={4} />
                <Text>生成貼文</Text>
              </HStack>
            </Button>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={() => setDialogOpen(true)}
            >
              <HStack gap={2}>
                <Box as={Edit} w={4} h={4} />
                <Text>編輯</Text>
              </HStack>
            </Button>
          </HStack>
        </HStack>

        {/* 基本信息卡片 */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box
            p={5}
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
          >
            <HStack gap={3}>
              <Box as={Calendar} w={8} h={8} color="blue.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.400">
                  扣費日
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  每月 {group.billing_day} 日
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
              <Box as={Users} w={8} h={8} color="green.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="gray.400">
                  關聯 Apple ID
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {group.account_count || 0} 個
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
                  收費週期
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="white">
                  {cycleLabel[group.billing_cycle_type]}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </SimpleGrid>

        {/* 關聯的 Apple ID 列表 */}
        {group.subscriptions && group.subscriptions.length > 0 && (
          <Box
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
            overflow="hidden"
          >
            <Box p={4} borderBottom="1px" borderColor="gray.700">
              <Text fontSize="lg" fontWeight="bold" color="white">
                關聯的 Apple ID
              </Text>
            </Box>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg="gray.700">
                    <Table.ColumnHeader color="gray.400">Apple ID</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">服務</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">成員數</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">餘額</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.subscriptions.map((sub) => (
                    <Table.Row key={sub.id} _hover={{ bg: 'gray.700' }}>
                      <Table.Cell color="white">{sub.apple_id || '-'}</Table.Cell>
                      <Table.Cell color="white">{sub.service_name}</Table.Cell>
                      <Table.Cell color="white">{sub.members?.length || 0}</Table.Cell>
                      <Table.Cell color="white">${sub.account_balance?.toFixed(2) || '0.00'}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        )}

        {/* 成員付款狀態 */}
        {group.subscriptions && group.subscriptions.length > 0 && (
          <Box
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
            overflow="hidden"
          >
            <Box p={4} borderBottom="1px" borderColor="gray.700">
              <Text fontSize="lg" fontWeight="bold" color="white">
                成員付款狀態
              </Text>
            </Box>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg="gray.700">
                    <Table.ColumnHeader color="gray.400">Email</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">服務</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">備註</Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.400">付款狀態</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.subscriptions.flatMap((sub) =>
                    (sub.members || []).map((member) => (
                      <Table.Row key={member.id} _hover={{ bg: 'gray.700' }}>
                        <Table.Cell color="white">{member.email}</Table.Cell>
                        <Table.Cell color="white">{sub.service_name}</Table.Cell>
                        <Table.Cell color="gray.400">{member.memo || '-'}</Table.Cell>
                        <Table.Cell>
                          <HStack gap={2}>
                            {member.payment_status ? (
                              <>
                                <Box as={CheckCircle} w={4} h={4} color="green.400" />
                                <Text color="green.400" fontSize="sm">已付款</Text>
                              </>
                            ) : (
                              <>
                                <Box as={XCircle} w={4} h={4} color="red.400" />
                                <Text color="red.400" fontSize="sm">未付款</Text>
                              </>
                            )}
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </Box>
          </Box>
        )}

        {/* 帳單週期歷史 */}
        {group.billing_cycles && group.billing_cycles.length > 0 && (
          <VStack align="stretch" gap={4}>
            <Text fontSize="lg" fontWeight="bold" color="white">
              帳單週期歷史
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {group.billing_cycles.map((cycle) => (
                <BillingCycleCard key={cycle.id} cycle={cycle} />
              ))}
            </SimpleGrid>
          </VStack>
        )}

        {/* 備註 */}
        {group.notes && (
          <Box
            p={4}
            bg="gray.800"
            rounded="xl"
            border="1px"
            borderColor="gray.700"
          >
            <Text fontSize="sm" color="gray.400" mb={2}>
              備註
            </Text>
            <Text color="white">{group.notes}</Text>
          </Box>
        )}

        {/* 編輯對話框 */}
        <CreateGroupDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleUpdate}
          editingGroup={group}
        />
      </VStack>
    </Container>
  );
}