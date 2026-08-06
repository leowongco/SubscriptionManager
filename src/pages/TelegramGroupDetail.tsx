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
  Flex,
} from '@chakra-ui/react';
import { ArrowLeft, Edit, ExternalLink, Calendar, Users, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import BillingCycleCard from '../components/telegram-groups/BillingCycleCard';
import CreateGroupDialog from '../components/telegram-groups/CreateGroupDialog';
import { toaster } from '../components/ui/toaster';
import type { TelegramGroupDetail, CreateGroupRequest, MemberPayment } from '../types/telegram-groups';
import { api } from '../lib/api';

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

  // 管理員確認收款：成員在 Telegram bot 回報「我已繳費」後只是待確認狀態，
  // 這裡按下去才會真的把 member_payments.paid 改成 1。
  const handleConfirmPayment = async (payment: MemberPayment) => {
    try {
      await api.updateMemberPayment(payment.id, { paid: true });
      toaster.create({
        title: '已確認收款',
        description: payment.member?.email ? `「${payment.member.email}」的付款已確認` : '付款已確認',
        type: 'success',
      });
      await loadGroup();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
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
      `💳 開始收款日期：${new Date(group.start_date).toLocaleDateString()}`,
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
          <Spinner size="xl" color="focus.ring" />
          <Text color="fg.muted">載入中...</Text>
        </VStack>
      </Container>
    );
  }

  if (!group) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack justify="center" minH="400px">
          <Text color="fg.muted">群組不存在</Text>
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
                  <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color="fg.emphasized">
                    {group.name}
                  </Text>
                  <Badge colorPalette="blue" fontSize="xs">
                    {cycleLabel[group.billing_cycle_type]}
                  </Badge>
                </HStack>
                {group.telegram_link && (
                  <HStack gap={1}>
                    <Box as={ExternalLink} w={4} h={4} color="focus.ring" />
                    <a
                      href={group.telegram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Text color="focus.ring" fontSize="sm" _hover={{ color: 'blue.300' }}>
                        Telegram 群組
                      </Text>
                    </a>
                  </HStack>
                )}
              </VStack>
            </HStack>
            <HStack gap={3}>
              <Button
                colorPalette="blue"
                variant="outline"
                rounded="xl"
                h={12}
                px={6}
                onClick={generatePost}
              >
                <HStack gap={2}>
                  <Box as={Calendar} w={4} h={4} />
                  <Text>生成貼文</Text>
                </HStack>
              </Button>
              <Button
                colorPalette="blue"
                rounded="xl"
                h={12}
                px={6}
                shadow="lg"
                _hover={{ transform: 'scale(1.02)' }}
                transition="all"
                onClick={() => setDialogOpen(true)}
              >
                <HStack gap={2}>
                  <Box as={Edit} w={4} h={4} />
                  <Text>編輯群組</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* 基本信息卡片 */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          <Box
            p={5}
            bg="bg.panel"
            rounded="xl"
            border="1px"
            borderColor="border.default"
          >
            <HStack gap={3}>
              <Box as={Calendar} w={8} h={8} color="focus.ring" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="fg.muted">
                  開始收款日期
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="fg.default">
                  {new Date(group.start_date).toLocaleDateString()}
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box
            p={5}
            bg="bg.panel"
            rounded="xl"
            border="1px"
            borderColor="border.default"
          >
            <HStack gap={3}>
              <Box as={Users} w={8} h={8} color="fg.success" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="fg.muted">
                  關聯 Apple ID
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="fg.default">
                  {group.account_count || 0} 個
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box
            p={5}
            bg="bg.panel"
            rounded="xl"
            border="1px"
            borderColor="border.default"
          >
            <HStack gap={3}>
              <Box as={DollarSign} w={8} h={8} color="fg.warning" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="fg.muted">
                  收費週期
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="fg.default">
                  {cycleLabel[group.billing_cycle_type]}
                </Text>
              </VStack>
            </HStack>
          </Box>
        </SimpleGrid>

        {/* 關聯的 Apple ID 列表 */}
        {group.subscriptions && group.subscriptions.length > 0 && (
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
            <Box h={1.5} w="full" bg="focus.ring" />
            <Box p={4} borderBottom="1px" borderColor="border.default">
              <Text fontSize="lg" fontWeight="bold" color="fg.default">
                關聯的 Apple ID
              </Text>
            </Box>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader color="fg.muted">Apple ID</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">服務</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">服務登入帳號</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">成員數</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">餘額</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.subscriptions.map((sub) => (
                    <Table.Row key={sub.id} _hover={{ bg: 'bg.hover' }}>
                      <Table.Cell color="fg.default">{sub.apple_id || '-'}</Table.Cell>
                      <Table.Cell color="fg.default">{sub.service_name}</Table.Cell>
                      <Table.Cell color="fg.default">
                        {sub.service_account ? (
                          <Badge colorPalette="orange" fontFamily="mono" fontSize="xs">
                            {sub.service_account}
                          </Badge>
                        ) : (
                          <Text color="fg.muted" fontSize="xs">與 Apple ID 相同</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell color="fg.default">{sub.members?.length || 0}</Table.Cell>
                      <Table.Cell color="fg.default">${sub.account_balance?.toFixed(2) || '0.00'}</Table.Cell>
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
            rounded="3xl"
            border="1px solid"
            borderColor="border.default"
            bg="bg.panel"
            backdropFilter="blur(20px)"
            overflow="hidden"
            shadow="2xl"
          >
            {/* 頂部色條 */}
            <Box h={1.5} w="full" bg="focus.ring" />
            <Box p={4} borderBottom="1px" borderColor="border.default">
              <Text fontSize="lg" fontWeight="bold" color="fg.default">
                成員付款狀態
              </Text>
            </Box>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader color="fg.muted">Email</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">服務</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">備註</Table.ColumnHeader>
                    <Table.ColumnHeader color="fg.muted">付款狀態</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.subscriptions.flatMap((sub) =>
                    (sub.members || []).map((member) => (
                      <Table.Row key={member.id} _hover={{ bg: 'bg.hover' }}>
                        <Table.Cell color="fg.default">{member.email}</Table.Cell>
                        <Table.Cell color="fg.default">{sub.service_name}</Table.Cell>
                        <Table.Cell color="fg.muted">{member.memo || '-'}</Table.Cell>
                        <Table.Cell>
                          <HStack gap={2}>
                            {member.payment_status ? (
                              <>
                                <Box as={CheckCircle} w={4} h={4} color="fg.success" />
                                <Text color="fg.success" fontSize="sm">已付款</Text>
                              </>
                            ) : (
                              <>
                                <Box as={XCircle} w={4} h={4} color="fg.error" />
                                <Text color="fg.error" fontSize="sm">未付款</Text>
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
            <Text fontSize="lg" fontWeight="bold" color="fg.default">
              帳單週期歷史
            </Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              {group.billing_cycles.map((cycle) => (
                <BillingCycleCard key={cycle.id} cycle={cycle} memberPayments={cycle.member_payments} onConfirmPayment={handleConfirmPayment} />
              ))}
            </SimpleGrid>
          </VStack>
        )}

        {/* 備註 */}
        {group.notes && (
          <Box
            p={4}
            bg="bg.panel"
            rounded="xl"
            border="1px"
            borderColor="border.default"
          >
            <Text fontSize="sm" color="fg.muted" mb={2}>
              備註
            </Text>
            <Text color="fg.default">{group.notes}</Text>
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
