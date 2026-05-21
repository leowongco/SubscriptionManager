import {
    Box,
    Button,
    Text,
    VStack,
    HStack,
    Badge,
} from '@chakra-ui/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Field } from '../ui/field';
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
        <Dialog open={open} onOpenChange={(details) => onOpenChange(details.open)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>調整餘額</DialogTitle>
                </DialogHeader>
                <DialogBody>
                    <VStack gap={4}>
                        {/* 當前餘額顯示 */}
                        <Box p={4} bg="gray.800" rounded="lg" w="full">
                            <HStack justify="space-between">
                                <Text color="gray.400" fontSize="sm">Apple ID</Text>
                                <Text fontWeight="medium">{account?.apple_id || '-'}</Text>
                            </HStack>
                            <HStack justify="space-between" mt={2}>
                                <HStack gap={2}>
                                    <Text color="gray.400" fontSize="sm">當前餘額</Text>
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
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                                輸入正數增加餘額，負數減少餘額
                            </Text>
                        </Field>

                        {/* 調整後餘額預覽 */}
                        {adjustmentAmount && !isNaN(parsedAmount) && (
                            <Box p={3} bg="gray.700" rounded="md" w="full">
                                <HStack justify="space-between">
                                    <Text color="gray.400" fontSize="sm">調整後餘額</Text>
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
                            />
                        </Field>

                        {/* 操作者 */}
                        <Field label="操作者" required>
                            <Input
                                placeholder="您的名稱"
                                value={operator}
                                onChange={(e) => setOperator(e.target.value)}
                            />
                        </Field>
                    </VStack>
                </DialogBody>
                <DialogFooter>
                    <HStack gap={3} justify="flex-end" w="full">
                        <DialogClose asChild>
                            <Button variant="outline" disabled={isSubmitting}>
                                取消
                            </Button>
                        </DialogClose>
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
            </DialogContent>
        </Dialog>
    );
}