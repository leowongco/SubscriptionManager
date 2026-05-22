import { useState } from 'react';
import {
  Text,
  VStack,
  HStack,
  Button,
  Input,
  NativeSelectRoot,
  NativeSelectField,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import { useColorModeValue } from '../ui/color-mode';
import type { CreateGroupRequest } from '../../types/telegram-groups';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateGroupRequest) => Promise<void>;
  editingGroup?: {
    id: string;
    name: string;
    telegram_link: string | null;
    billing_day: number;
    billing_cycle_type: 'monthly' | 'biannually' | 'yearly';
    notes: string | null;
  } | null;
}

export default function CreateGroupDialog({
  open,
  onOpenChange,
  onSubmit,
  editingGroup,
}: CreateGroupDialogProps) {
  const [name, setName] = useState(editingGroup?.name || '');
  const [telegramLink, setTelegramLink] = useState(editingGroup?.telegram_link || '');
  const [billingDay, setBillingDay] = useState(editingGroup?.billing_day?.toString() || '1');
  const [billingCycleType, setBillingCycleType] = useState<'monthly' | 'biannually' | 'yearly'>(
    editingGroup?.billing_cycle_type || 'monthly'
  );
  const [notes, setNotes] = useState(editingGroup?.notes || '');
  const [loading, setLoading] = useState(false);

  // Color mode values for light/dark mode support
  const dialogBg = useColorModeValue('white', 'gray.900/90');
  const dialogColor = useColorModeValue('gray.800', 'gray.50');
  const dialogBorderColor = useColorModeValue('gray.200', 'gray.700');
  const inputBg = useColorModeValue('gray.50', 'gray.800');
  const inputBorderColor = useColorModeValue('gray.300', 'gray.600');
  const labelColor = useColorModeValue('gray.700', 'gray.300');

  const handleSubmit = async () => {
    if (!name.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        telegram_link: telegramLink.trim() || undefined,
        billing_day: parseInt(billingDay),
        billing_cycle_type: billingCycleType,
        notes: notes.trim() || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
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
            {editingGroup ? '編輯群組' : '新增 Telegram 群組'}
          </DialogTitle>
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={4}>
            {/* 群組名稱 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color={labelColor}>
                群組名稱 <Text as="span" color="red.400">*</Text>
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Netflix 家庭共享群"
                bg={inputBg}
                border="1px"
                borderColor={inputBorderColor}
                _placeholder={{ color: 'gray.500' }}
              />
            </VStack>

            {/* Telegram 連結 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color={labelColor}>
                Telegram 群組連結
              </Text>
              <Input
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                placeholder="https://t.me/your-group"
                bg={inputBg}
                border="1px"
                borderColor={inputBorderColor}
                _placeholder={{ color: 'gray.500' }}
              />
            </VStack>

            {/* 扣費日 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color={labelColor}>
                扣費日 <Text as="span" color="red.400">*</Text>
              </Text>
              <NativeSelectRoot>
                <NativeSelectField
                  value={billingDay}
                  onChange={(e) => setBillingDay(e.target.value)}
                  bg={inputBg}
                  borderColor={inputBorderColor}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                    <option key={day} value={day}>
                      每月 {day} 號
                    </option>
                  ))}
                </NativeSelectField>
              </NativeSelectRoot>
            </VStack>

            {/* 計費週期 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color={labelColor}>
                計費週期 <Text as="span" color="red.400">*</Text>
              </Text>
              <NativeSelectRoot>
                <NativeSelectField
                  value={billingCycleType}
                  onChange={(e) => setBillingCycleType(e.target.value as 'monthly' | 'biannually' | 'yearly')}
                  bg={inputBg}
                  borderColor={inputBorderColor}
                >
                  <option value="monthly">每月</option>
                  <option value="biannually">每半年</option>
                  <option value="yearly">每年</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </VStack>

            {/* 備註 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color={labelColor}>
                備註
              </Text>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="選填備註"
                bg={inputBg}
                border="1px"
                borderColor={inputBorderColor}
                _placeholder={{ color: 'gray.500' }}
              />
            </VStack>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={3}>
            <DialogCloseTrigger asChild>
              <Button variant="outline" colorPalette="gray">
                取消
              </Button>
            </DialogCloseTrigger>
            <Button
              colorPalette="blue"
              loading={loading}
              onClick={handleSubmit}
              disabled={!name.trim()}
            >
              {editingGroup ? '保存' : '新增'}
            </Button>
          </HStack>
        </DialogFooter>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  );
}
