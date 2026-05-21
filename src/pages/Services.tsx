import { useState } from 'react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Badge,
    Flex,
    Grid,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogCloseTrigger,
    Field,
    NativeSelectRoot,
    NativeSelectField,
    Table,
    Spinner,
} from '@chakra-ui/react';

interface Service {
    id: string;
    name: string;
    base_price: number;
    currency: string;
    cycle: 'monthly' | 'yearly';
    next_price: number | null;
    effective_date: string | null;
}

export default function Services() {
    const { data: services, mutate } = useSWR<Service[]>('services', api.getServices);
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<Service | null>(null);

    const [formData, setFormData] = useState<Partial<Service>>({
        name: '',
        base_price: 0,
        currency: 'HKD',
        cycle: 'monthly',
        next_price: null,
        effective_date: null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            await api.updateService({ ...formData, id: editing.id });
        } else {
            await api.createService(formData);
        }
        setIsOpen(false);
        setEditing(null);
        mutate();
    };

    const handleDelete = async (id: string) => {
        if (confirm('確定要刪除此服務嗎？')) {
            await api.deleteService(id);
            mutate();
        }
    };

    const openEdit = (service: Service) => {
        setEditing(service);
        setFormData(service);
        setIsOpen(true);
    };

    const openNew = () => {
        setEditing(null);
        setFormData({ name: '', base_price: 0, currency: 'HKD', cycle: 'monthly', next_price: null, effective_date: null });
        setIsOpen(true);
    };

    return (
        <VStack gap={10} maxW="7xl" mx="auto" pb={10} align="stretch">
            {/* Header Section */}
            <Box
                position="relative"
                overflow="hidden"
                rounded="3xl"
                bg="bg.subtle"
                border="1px solid"
                borderColor="gray.700"
                p={8}
                shadow="2xl"
                backdropFilter="blur(20px)"
            >
                <Flex justify="space-between" alignItems="center">
                    <Box position="relative" zIndex={10}>
                        <Text fontSize="3xl" fontWeight="black" letterSpacing="tight" color="white" textShadow="md">
                            服務與定價維護
                        </Text>
                        <Text color="gray.400" mt={2} fontSize="sm" fontWeight="medium">
                            管理訂閱服務及未來價格調整計畫，精準掌控成本。
                        </Text>
                    </Box>

                    <DialogRoot open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={openNew}
                                position="relative"
                                zIndex={10}
                                colorPalette="blue"
                                rounded="xl"
                                h={12}
                                px={6}
                                shadow="lg"
                                _hover={{ transform: 'scale(1.02)' }}
                                transition="all"
                            >
                                <Box as={Plus} w={5} h={5} mr={2} />
                                新增服務
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            maxW="450px"
                            bg="gray.900/90"
                            backdropFilter="blur(40px)"
                            color="gray.50"
                            borderColor="gray.700"
                            rounded="2xl"
                            shadow="2xl"
                        >
                            <DialogHeader>
                                <DialogTitle fontSize="xl" fontWeight="bold">
                                    {editing ? '編輯服務' : '新增服務'}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit}>
                                <VStack gap={5} pt={4}>
                                    <Field.Root>
                                        <Field.Label fontSize="xs" color="gray.400" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            服務名稱
                                        </Field.Label>
                                        <Input
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            bg="gray.950/50"
                                            borderColor="gray.800"
                                            rounded="xl"
                                            h={12}
                                            _focus={{ borderColor: 'blue.500/50' }}
                                        />
                                    </Field.Root>

                                    <Field.Root>
                                        <Field.Label fontSize="xs" color="gray.400" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            基礎價格
                                        </Field.Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formData.base_price || ''}
                                            onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                                            required
                                            bg="gray.950/50"
                                            borderColor="gray.800"
                                            rounded="xl"
                                            h={12}
                                            _focus={{ borderColor: 'blue.500/50' }}
                                            fontFamily="mono"
                                        />
                                    </Field.Root>

                                    <Grid templateColumns="2" gap={5}>
                                        <Field.Root>
                                            <Field.Label fontSize="xs" color="gray.400" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                幣種
                                            </Field.Label>
                                            <NativeSelectRoot>
                                                <NativeSelectField
                                                    value={formData.currency}
                                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                                    bg="gray.950/50"
                                                    borderColor="gray.800"
                                                    rounded="xl"
                                                    h={12}
                                                >
                                                    {['HKD', 'TWD', 'TRY', 'ARS', 'USD'].map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </NativeSelectField>
                                            </NativeSelectRoot>
                                        </Field.Root>

                                        <Field.Root>
                                            <Field.Label fontSize="xs" color="gray.400" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                計費週期
                                            </Field.Label>
                                            <NativeSelectRoot>
                                                <NativeSelectField
                                                    value={formData.cycle}
                                                    onChange={(e) => setFormData({ ...formData, cycle: e.target.value as 'monthly' | 'yearly' })}
                                                    bg="gray.950/50"
                                                    borderColor="gray.800"
                                                    rounded="xl"
                                                    h={12}
                                                >
                                                    <option value="monthly">每月 (Monthly)</option>
                                                    <option value="yearly">每年 (Yearly)</option>
                                                </NativeSelectField>
                                            </NativeSelectRoot>
                                        </Field.Root>
                                    </Grid>

                                    <Box
                                        border="1px solid"
                                        borderColor="gray.700"
                                        bg="gray.950/30"
                                        p={5}
                                        rounded="2xl"
                                        w="full"
                                    >
                                        <Text fontSize="sm" fontWeight="bold" color="blue.400" display="flex" alignItems="center" gap={2} mb={4}>
                                            <Box as="span" w={1.5} h={1.5} rounded="full" bg="blue.400" />
                                            未來價格調整 (選填)
                                        </Text>
                                        <Grid templateColumns="2" gap={4}>
                                            <Field.Root>
                                                <Field.Label fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                    新價格
                                                </Field.Label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.next_price || ''}
                                                    onChange={e => setFormData({ ...formData, next_price: e.target.value ? parseFloat(e.target.value) : null })}
                                                    bg="gray.900"
                                                    borderColor="gray.700"
                                                    rounded="xl"
                                                    h={11}
                                                    _focus={{ borderColor: 'blue.500/50' }}
                                                    fontFamily="mono"
                                                />
                                            </Field.Root>
                                            <Field.Root>
                                                <Field.Label fontSize="xs" color="gray.500" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                                    生效日期
                                                </Field.Label>
                                                <Input
                                                    type="date"
                                                    value={formData.effective_date?.split('T')[0] || ''}
                                                    onChange={e => setFormData({ ...formData, effective_date: e.target.value })}
                                                    bg="gray.900"
                                                    borderColor="gray.700"
                                                    rounded="xl"
                                                    h={11}
                                                    _focus={{ borderColor: 'blue.500/50' }}
                                                />
                                            </Field.Root>
                                        </Grid>
                                    </Box>

                                    <Button
                                        type="submit"
                                        w="full"
                                        colorPalette="blue"
                                        rounded="xl"
                                        h={12}
                                        fontSize="md"
                                        fontWeight="bold"
                                        shadow="lg"
                                    >
                                        {editing ? '儲存變更' : '建立服務'}
                                    </Button>
                                </VStack>
                            </form>
                            <DialogCloseTrigger />
                        </DialogContent>
                    </DialogRoot>
                </Flex>
            </Box>

            {/* Services Table */}
            <Box
                rounded="3xl"
                border="1px solid"
                borderColor="gray.700"
                bg="gray.900/40"
                backdropFilter="blur(20px)"
                overflow="hidden"
                shadow="2xl"
            >
                <Box h={1.5} w="full" bg="linear-gradient(to right, var(--chakra-colors-blue-500), var(--chakra-colors-cyan-500), var(--chakra-colors-indigo-500))" />
                <Box overflowX="auto">
                    <Table.Root>
                        <Table.Header bg="gray.950/60">
                            <Table.Row borderColor="gray.700">
                                <Table.ColumnHeader color="gray.400" fontWeight="semibold" letterSpacing="wider" pl={6} py={4}>
                                    服務名稱
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontWeight="semibold" letterSpacing="wider">
                                    當前價格
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontWeight="semibold" letterSpacing="wider">
                                    週期
                                </Table.ColumnHeader>
                                <Table.ColumnHeader color="gray.400" fontWeight="semibold" letterSpacing="wider">
                                    未來調整計畫
                                </Table.ColumnHeader>
                                <Table.ColumnHeader textAlign="right" color="gray.400" fontWeight="semibold" letterSpacing="wider" pr={6}>
                                    操作
                                </Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {services === undefined && (
                                <Table.Row>
                                    <Table.Cell colSpan={5} textAlign="center" py={12} color="gray.500">
                                        <Spinner size="sm" /> 讀取服務資料中...
                                    </Table.Cell>
                                </Table.Row>
                            )}
                            {services?.length === 0 && (
                                <Table.Row>
                                    <Table.Cell colSpan={5} textAlign="center" py={12} color="gray.500">
                                        尚未設定任何服務，點擊「新增服務」開始。
                                    </Table.Cell>
                                </Table.Row>
                            )}
                            {services?.map((service) => (
                                <Table.Row
                                    key={service.id}
                                    borderColor="gray.700"
                                    _hover={{ bg: 'gray.800/40' }}
                                    transition="all"
                                >
                                    <Table.Cell fontWeight="bold" color="gray.200" pl={6}>
                                        {service.name}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Flex alignItems="baseline" gap={1.5}>
                                            <Text color="gray.500" fontSize="xs">{service.currency}</Text>
                                            <Text fontFamily="mono" fontSize="lg" fontWeight="bold" color="gray.100">
                                                {service.base_price.toFixed(2)}
                                            </Text>
                                        </Flex>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Badge
                                            colorPalette={service.cycle === 'yearly' ? 'purple' : 'blue'}
                                            variant="subtle"
                                            px={2.5}
                                            py={1}
                                            rounded="md"
                                            fontSize="xs"
                                            fontWeight="semibold"
                                        >
                                            {service.cycle === 'yearly' ? '每年 (Yearly)' : '每月 (Monthly)'}
                                        </Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                        {service.next_price && service.effective_date ? (
                                            <Box
                                                display="inline-flex"
                                                flexDirection="column"
                                                gap={1}
                                                p={2}
                                                bg="gray.950/50"
                                                rounded="lg"
                                                border="1px solid"
                                                borderColor="gray.700"
                                            >
                                                <Text color="orange.400" fontWeight="black" fontFamily="mono" fontSize="sm" display="flex" alignItems="center" gap={1}>
                                                    <Text as="span" opacity={0.5} fontSize="xs">➔</Text> {service.currency} {service.next_price.toFixed(2)}
                                                </Text>
                                                <Text color="gray.500" fontSize="10px" textTransform="uppercase" fontWeight="semibold" letterSpacing="wider">
                                                    生效日: {new Date(service.effective_date).toLocaleDateString()}
                                                </Text>
                                            </Box>
                                        ) : (
                                            <Text color="gray.600" pl={4}>-</Text>
                                        )}
                                    </Table.Cell>
                                    <Table.Cell textAlign="right" pr={6}>
                                        <HStack justify="flex-end" gap={2}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEdit(service)}
                                                color="gray.400"
                                                _hover={{ color: 'blue.400', bg: 'blue.500/10' }}
                                                rounded="lg"
                                                aria-label="編輯服務"
                                            >
                                                <Box as={Pencil} w={4} h={4} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(service.id)}
                                                color="gray.400"
                                                _hover={{ color: 'red.400', bg: 'red.500/10' }}
                                                rounded="lg"
                                                aria-label="刪除服務"
                                            >
                                                <Box as={Trash2} w={4} h={4} />
                                            </Button>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                </Box>
            </Box>
        </VStack>
    );
}
