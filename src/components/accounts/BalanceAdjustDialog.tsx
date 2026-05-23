import {
    Box,
    Button,
    Text,
    VStack,
    HStack,
    Badge,
    Input,
    Icon,
} from '@chakra-ui/react';
import {
    DialogRoot,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogBody,
    DialogFooter,
    DialogCloseTrigger,
} from '../ui/dialog';
import { Field } from '../ui/field';
import { useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import { DollarSign, User, FileText, TrendingUp, TrendingDown } from 'lucide-react';

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
        <DialogRoot open={open} onOpenChange={(details) => onOpenChange(details.open)}>
            <DialogContent maxW="500px" variant="glass">
                <DialogHeader>
                    <DialogTitle>
                        調整餘額
                    </DialogTitle>
                    <DialogCloseTrigger />
                </DialogHeader>
                
                <DialogBody>
                    <VStack gap={5}>
                        {/* 當前餘額顯示 - 增強設計 */}
                        <Box
                            p={5}
                            bg="bg.subtle"
                            rounded="xl"
                            w="full"
                            border="1px solid"
                            borderColor="border.muted"
                            position="relative"
                            overflow="hidden"
                            _before={{
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                h: '2px',
                                bg: 'blue.500',
                            }}
                        >
                            <VStack align="stretch" gap={3}>
                                <HStack justify="space-between">
                                    <HStack gap={2}>
                                        <Icon as={DollarSign} w={4} h={4} color="blue.500" />
                                        <Text color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            Apple ID
                                        </Text>
                                    </HStack>
                                    <Text fontWeight="semibold" fontSize="sm" color="fg.default">{account?.apple_id || '-'}</Text>
                                </HStack>
                                
                                <HStack justify="space-between">
                                    <HStack gap={2}>
                                        <Text color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                            當前餘額
                                        </Text>
                                        {account?.currency && account.currency !== 'HKD' && (
                                            <Badge colorPalette="cyan" fontSize="xs" variant="subtle">
                                                {account.currency}
                                            </Badge>
                                        )}
                                    </HStack>
                                    <Text fontWeight="bold" fontSize="xl" color="blue.500" fontFamily="mono">
                                        {formatCurrency(account?.balance || 0, account?.currency)}
                                    </Text>
                                </HStack>
                            </VStack>
                        </Box>

                        {/* 調整金額 */}
                        <Field label={
                            <HStack gap={2}>
                                <Icon as={parsedAmount >= 0 ? TrendingUp : TrendingDown} w={3.5} h={3.5} />
                                <Text>調整金額</Text>
                                <Text as="span" color="fg.error">*</Text>
                            </HStack>
                        } required>
                            <Input
                                type="number"
                                placeholder="正數增加，負數減少"
                                value={adjustmentAmount}
                                onChange={(e) => setAdjustmentAmount(e.target.value)}
                                step="0.01"
                                bg="bg.subtle"
                                borderColor="border.default"
                                rounded="xl"
                                h={12}
                                fontFamily="mono"
                                fontSize="lg"
                                _placeholder={{ color: 'fg.muted' }}
                                _focus={{
                                    borderColor: "focus.ring",
                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                }}
                                transition="all 0.2s"
                            />
                            <Text fontSize="xs" color="fg.muted" mt={1}>
                                輸入正數增加餘額，負數減少餘額
                            </Text>
                        </Field>

                        {/* 調整後餘額預覽 - 增強設計 */}
                        {adjustmentAmount && !isNaN(parsedAmount) && (
                            <Box
                                p={4}
                                bg="bg.subtle"
                                rounded="xl"
                                w="full"
                                border="1px solid"
                                borderColor={newBalance >= 0 ? 'green.500' : 'red.500'}
                                backdropFilter="blur(10px)"
                                transition="all 0.3s"
                            >
                                <HStack justify="space-between">
                                    <Text color="fg.muted" fontSize="xs" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                                        調整後餘額
                                    </Text>
                                    <HStack gap={2}>
                                        {parsedAmount !== 0 && (
                                            <Icon
                                                as={parsedAmount > 0 ? TrendingUp : TrendingDown}
                                                w={4}
                                                h={4}
                                                color={parsedAmount > 0 ? 'fg.success' : 'fg.error'}
                                            />
                                        )}
                                        <Text
                                            fontWeight="bold"
                                            fontSize="xl"
                                            color={newBalance >= 0 ? 'fg.success' : 'fg.error'}
                                            fontFamily="mono"
                                        >
                                            {formatCurrency(newBalance, account?.currency)}
                                        </Text>
                                    </HStack>
                                </HStack>
                            </Box>
                        )}

                        {/* 調整原因 */}
                        <Field label={
                            <HStack gap={2}>
                                <Icon as={FileText} w={3.5} h={3.5} />
                                <Text>調整原因</Text>
                                <Text as="span" color="fg.error">*</Text>
                            </HStack>
                        } required>
                            <Input
                                placeholder="例如：手動加值、退款調整"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                bg="bg.subtle"
                                borderColor="border.default"
                                rounded="xl"
                                h={12}
                                _placeholder={{ color: 'fg.muted' }}
                                _focus={{
                                    borderColor: "focus.ring",
                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                }}
                                transition="all 0.2s"
                            />
                        </Field>

                        {/* 操作者 */}
                        <Field label={
                            <HStack gap={2}>
                                <Icon as={User} w={3.5} h={3.5} />
                                <Text>操作者</Text>
                                <Text as="span" color="fg.error">*</Text>
                            </HStack>
                        } required>
                            <Input
                                placeholder="您的名稱"
                                value={operator}
                                onChange={(e) => setOperator(e.target.value)}
                                bg="bg.subtle"
                                borderColor="border.default"
                                rounded="xl"
                                h={12}
                                _placeholder={{ color: 'fg.muted' }}
                                _focus={{
                                    borderColor: "focus.ring",
                                    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2)",
                                }}
                                transition="all 0.2s"
                            />
                        </Field>
                    </VStack>
                </DialogBody>
                
                <DialogFooter>
                    <HStack gap={3} justify="end" w="full">
                        <DialogCloseTrigger asChild>
                            <Button 
                                variant="outline" 
                                disabled={isSubmitting}
                                rounded="xl"
                                h={11}
                                px={6}
                                transition="all 0.2s"
                                _hover={{ transform: 'scale(1.02)' }}
                            >
                                取消
                            </Button>
                        </DialogCloseTrigger>
                        <Button
                            colorPalette="blue"
                            disabled={!isValid || isSubmitting}
                            loading={isSubmitting}
                            onClick={handleConfirm}
                            rounded="xl"
                            h={11}
                            px={8}
                            fontWeight="semibold"
                            transition="all 0.2s"
                            _hover={{ transform: 'scale(1.02)' }}
                            _active={{ transform: 'scale(0.98)' }}
                        >
                            確認調整
                        </Button>
                    </HStack>
                </DialogFooter>
            </DialogContent>
        </DialogRoot>
    );
}