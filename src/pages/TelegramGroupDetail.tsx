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
import { ArrowLeft, Edit, ExternalLink, Calendar, Users, DollarSign, Copy, CheckCircle, XCircle } from 'lucide-react';
import BillingCycleCard from '../components/telegram-groups/BillingCycleCard';
import CreateGroupDialog from '../components/telegram-groups/CreateGroupDialog';
import { toaster } from '../components/ui/toaster';
import { useColorModeValue } from '@/components/ui/color-mode';
import type { TelegramGroupDetail, CreateGroupRequest } from '../types/telegram-groups';

export default function TelegramGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<TelegramGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 顏色變量 - 支持亮色/暗色模式
  const headerBg = useColorModeValue('white', 'bg.subtle');
  const headerBorderColor = useColorModeValue('gray.200', 'gray.700');
  const headerTitleColor = useColorModeValue('gray.900', 'white');
  const headerTextColor = useColorModeValue('gray.600', 'gray.300');
  
  const cardBg = useColorModeValue('white', 'gray.900/40');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.300');
  const mutedTextColor = useColorModeValue('gray.500', 'gray.500');
  
  // 表格顏色
  const tableBg = useColorModeValue('white', 'bg.subtle');
  const tableBorderColor = useColorModeValue('gray.200', 'white/10');

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
          <Text color={secondaryTextColor}>載入中...</Text>
        </VStack>
      </Container>
    );
  }

  if (!group) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack justify="center" minH="400px">
          <Text color={secondaryTextColor}>群組不存在</Text>
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
          bg={headerBg}
          border="1px solid"
          borderColor={headerBorderColor}
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
                  <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="black" letterSpacing="tight" color={headerTitleColor}>
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
                      <Text color="blue.400" fontSize="sm" _hover={{ color: 'blue.300' }}>
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
            bg={cardBg}
            rounded="xl"
            border="1px"
            borderColor={cardBorderColor}
          >
            <HStack gap={3}>
              <Box as={Calendar} w={8} h={8} color="blue.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color={secondaryTextColor}>
                  扣費日
                </Text>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  每月 {group.billing_day} 日
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box
            p={5}
            bg={cardBg}
            rounded="xl"
            border="1px"
            borderColor={cardBorderColor}
          >
            <HStack gap={3}>
              <Box as={Users} w={8} h={8} color="green.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color={secondaryTextColor}>
                  關聯 Apple ID
                </Text>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  {group.account_count || 0} 個
                </Text>
              </VStack>
            </HStack>
          </Box>

          <Box
            p={5}
            bg={cardBg}
            rounded="xl"
            border="1px"
            borderColor={cardBorderColor}
          >
            <HStack gap={3}>
              <Box as={DollarSign} w={8} h={8} color="orange.400" />
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color={secondaryTextColor}>
                  收費週期
                </Text>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
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
            borderColor={tableBorderColor}
            bg={tableBg}
            backdropFilter="blur(20px)"
            overflow="hidden"
            shadow="2xl"
          >
            {/* 頂部色條 */}
            <Box h={1.5} w="full" bg="blue.500" />
            <Box p={4} borderBottom="1px" borderColor={tableBorderColor}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                關聯的 Apple ID
              </Text>
            </Box>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Table.ColumnHeader color={secondaryTextColor}>Apple ID</Table.ColumnHeader>
                    <Table.ColumnHeader color={secondaryTextColor}>服務</Table.ColumnHeader>
                    <Table.ColumnHeader color={secondaryTextColor}>成員數</Table.ColumnHeader>
                    <Table.ColumnHeader color={secondaryTextColor}>餘額</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.subscriptions.map((sub) => (
                    <Table.Row key={sub.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.800/30') }}>
                      <Table.Cell color={textColor}>{sub.apple_id || '-'}</Table.Cell>
                      <Table.Cell color={textColor}>{sub.service_name}</Table.Cell>
                      <Table.Cell color={textColor}>{sub.members?.length || 0}</Table.Cell>
                      <Table.Cell color={textColor}>${sub.account_balance?.toFixed(2) || '0.00'}</Table.Cell>
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
            borderColor={tableBorderColor}
            bg={tableBg}
            backdropFilter="blur(20px)"
            overflow="hidden"
            shadow="2xl"
          >
            {/* 頂部色條 */}
            <Box h={1.5} w="full" bg="blue.500" />
            <Box p={4} borderBottom="1px" borderColor={tableBorderColor}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                成員付款狀態
              </Text>
            </Box>
            <Box overflowX="auto">
              <Table.Root>
                <Table.Header>
                  <Table.Row bg={useColorModeValue('gray.50', 'gray.900')}>
                    <Table.ColumnHeader color={secondaryTextColor}>Email</Table.ColumnHeader>
                    <Table.ColumnHeader color={secondaryTextColor}>服務</Table.ColumnHeader>
                    <Table.ColumnHeader color={secondaryTextColor}>備註</Table.ColumnHeader>
                    <Table.ColumnHeader color={secondaryTextColor}>付款狀態</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {group.subscriptions.flatMap((sub) =>
                    (sub.members || []).map((member) => (
                      <Table.Row key={member.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.800/30') }}>
                        <Table.Cell color={textColor}>{member.email}</Table.Cell>
                        <Table.Cell color={textColor}>{sub.service_name}</Table.Cell>
                        <Table.Cell color={secondaryTextColor}>{member.memo || '-'}</Table.Cell>
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
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
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
            bg={cardBg}
            rounded="xl"
            border="1px"
            borderColor={cardBorderColor}
          >
            <Text fontSize="sm" color={secondaryTextColor} mb={2}>
              備註
            </Text>
            <Text color={textColor}>{group.notes}</Text>
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