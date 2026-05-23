import { useState } from 'react';
import {
  Text,
  VStack,
  HStack,
  Button,
  Input,
  NativeSelectRoot,
  NativeSelectField,
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
      <DialogContent maxW="480px" variant="glass">
        <DialogHeader>
          <DialogTitle>
            {editingGroup ? '編輯群組' : '新增 Telegram 群組'}
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={5}>
            {/* 群組名稱 */}
            <VStack align="start" gap={2}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color="fg.muted"
              >
                群組名稱 <Text as="span" color="fg.error">*</Text>
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Netflix 家庭共享群"
                bg="bg.subtle"
                border="1px"
                borderColor="border.default"
                rounded="xl"
                h={12}
                _placeholder={{ color: 'fg.muted' }}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)',
                }}
                transition="all 0.2s"
              />
            </VStack>

            {/* Telegram 連結 */}
            <VStack align="start" gap={2}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color="fg.muted"
              >
                Telegram 群組連結
              </Text>
              <Input
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                placeholder="https://t.me/your-group"
                bg="bg.subtle"
                border="1px"
                borderColor="border.default"
                rounded="xl"
                h={12}
                _placeholder={{ color: 'fg.muted' }}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)',
                }}
                transition="all 0.2s"
              />
            </VStack>

            {/* 扣費日和計費週期 - 使用 Grid */}
            <HStack gap={4}>
              {/* 扣費日 */}
              <VStack align="start" gap={2} flex={1}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="fg.muted"
                >
                  扣費日 <Text as="span" color="fg.error">*</Text>
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={billingDay}
                    onChange={(e) => setBillingDay(e.target.value)}
                    bg="bg.subtle"
                    borderColor="border.default"
                    rounded="xl"
                    h={12}
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)',
                    }}
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
              <VStack align="start" gap={2} flex={1}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  color="fg.muted"
                >
                  計費週期 <Text as="span" color="fg.error">*</Text>
                </Text>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={billingCycleType}
                    onChange={(e) => setBillingCycleType(e.target.value as 'monthly' | 'biannually' | 'yearly')}
                    bg="bg.subtle"
                    borderColor="border.default"
                    rounded="xl"
                    h={12}
                    _focus={{
                      borderColor: 'blue.400',
                      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)',
                    }}
                  >
                    <option value="monthly">每月</option>
                    <option value="biannually">每半年</option>
                    <option value="yearly">每年</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </VStack>
            </HStack>

            {/* 備註 */}
            <VStack align="start" gap={2}>
              <Text
                fontSize="xs"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
                color="fg.muted"
              >
                備註
              </Text>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="選填備註"
                bg="bg.subtle"
                border="1px"
                borderColor="border.default"
                rounded="xl"
                h={12}
                _placeholder={{ color: 'fg.muted' }}
                _focus={{
                  borderColor: 'blue.400',
                  boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.2)',
                }}
                transition="all 0.2s"
              />
            </VStack>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={3} justify="end" w="full">
            <DialogCloseTrigger asChild>
              <Button
                variant="outline"
                colorPalette="gray"
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
              loading={loading}
              onClick={handleSubmit}
              disabled={!name.trim()}
              rounded="xl"
              h={11}
              px={8}
              fontWeight="semibold"
              transition="all 0.2s"
              _hover={{ transform: 'scale(1.02)' }}
              _active={{ transform: 'scale(0.98)' }}
            >
              {editingGroup ? '保存' : '新增'}
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
