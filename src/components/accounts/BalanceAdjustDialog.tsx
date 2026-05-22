import {
    Box,
    Button,
    Text,
    VStack,
    HStack,
    Badge,
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
    Input,
} from '@chakra-ui/react';
import { Field } from '../ui/field';
import { useColorModeValue } from '../ui/color-mode';
import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';

interface BalanceAdjustDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account: {
        id: string;
        apple_id: string;
        balance: number;
        currency?: string;
    } | null;
    onConfirm: (accountId: string, data: { adjustment_amount: number; reason: string; operator: string }) => Promise<void>;
}

export function BalanceAdjustDialog({ open, onOpenChange, account, onConfirm }: BalanceAdjustDialogProps) {
    const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [operator, setOperator] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Color mode values for light/dark mode support
    const dialogBg = useColorModeValue('white', 'gray.900/90');
    const dialogColor = useColorModeValue('gray.800', 'gray.50');
    const dialogBorderColor = useColorModeValue('gray.200', 'gray.700');
    const inputBg = useColorModeValue('gray.50', 'gray.800');
    const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
    const labelColor = useColorModeValue('gray.700', 'gray.300');
    const infoBoxBg = useColorModeValue('gray.50', 'gray.800');
    const previewBoxBg = useColorModeValue('gray.100', 'gray.700');

    const parsedAmount = parseFloat(adjustmentAmount) || 0;
    const newBalance = account ? account.balance + parsedAmount : 0;

    const handleConfirm = async () => {
        if (!account || !adjustmentAmount || !reason || !operator) return;

        setIsSubmitting(true);
        try {
            await onConfirm(account.id, {
                adjustment_amount: parsedAmount,
                reason,
                operator,
            });
            // Reset form
            setAdjustmentAmount('');
            setReason('');
            setOperator('');
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = adjustmentAmount && reason && operator && !isNaN(parsedAmount);

    return (
        <DialogRoot open={open} onOpenChange={(details) => onOpenChange(details.open)}>
            <DialogContent
                maxW="450px"
                bg={dialogBg}
                backdropFilter="blur(40px)"
                color={dialogColor}
                borderColor={dialogBorderColor}
                rounded="2xl"
                shadow="2xl"
            >
                <DialogHeader>
                    <DialogTitle fontSize="xl" fontWeight="bold">
                        調整餘額
                    </DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <VStack gap={4}>
                        {/* 當前餘額顯示 */}
                        <Box p={4} bg={infoBoxBg} rounded="lg" w="full">
                            <HStack justify="space-between">
                                <Text color={labelColor} fontSize="sm">Apple ID</Text>
                                <Text fontWeight="medium">{account?.apple_id || '-'}</Text>
                            </HStack>
                            <HStack justify="space-between" mt={2}>
                                <HStack gap={2}>
                                    <Text color={labelColor} fontSize="sm">當前餘額</Text>
                                    {account?.currency && account.currency !== 'HKD' && (
                                        <Badge colorPalette="cyan" fontSize="xs">
                                            {account.currency}
                                        </Badge>
                                    )}
                                </HStack>
                                <Text fontWeight="bold" fontSize="lg" color="blue.400">
                                    {formatCurrency(account?.balance || 0, account?.currency)}
                                </Text>
                            </HStack>
                        </Box>

                        {/* 調整金額 */}
                        <Field label="調整金額" required>
                            <Input
                                type="number"
                                placeholder="正數增加，負數減少"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                step="0.01"
                                bg={inputBg}
                                borderColor={inputBorderColor}
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                輸入正數增加餘額，負數減少餘額
                            </Text>
                        </Field>

                        {/* 調整後餘額預覽 */}
                        {adjustmentAmount && !isNaN(parsedAmount) && (
                            <Box p={3} bg={previewBoxBg} rounded="md" w="full">
                                <HStack justify="space-between">
                                    <Text color={labelColor} fontSize="sm">調整後餘額</Text>
                                    <Text fontWeight="bold" color={newBalance >= 0 ? 'green.400' : 'red.400'}>
                                        {formatCurrency(newBalance, account?.currency)}
                                    </Text>
                                </HStack>
                            </Box>
                        )}

                        {/* 調整原因 */}
                        <Field label="調整原因" required>
                            <Input
                                placeholder="例如：手動加值、退款調整"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                bg={inputBg}
                                borderColor={inputBorderColor}
                            />
                        </Field>

                        {/* 操作者 */}
                        <Field label="操作者" required>
                            <Input
                                placeholder="您的名稱"
                                value={operator}
                                onChange={(e) => setOperator(e.target.value)}
                                bg={inputBg}
                                borderColor={inputBorderColor}
                            />
                        </Field>
                    </VStack>
                </DialogBody>
                <DialogFooter>
                    <HStack gap={3} justify="flex-end" w="full">
                        <DialogCloseTrigger asChild>
                            <Button variant="outline" disabled={isSubmitting}>
                                取消
                            </Button>
                        </DialogCloseTrigger>
                        <Button
                            colorPalette="blue"
                            disabled={!isValid || isSubmitting}
                            loading={isSubmitting}
                            onClick={handleConfirm}
                        >
                            確認調整
                        </Button>
                    </HStack>
                </DialogFooter>
                <DialogCloseTrigger />
            </DialogContent>
        </DialogRoot>
    );
}