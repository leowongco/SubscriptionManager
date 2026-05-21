import { useState } from 'react';
import {
  Text,
  VStack,
  HStack,
  Button,
  Input,
} from '@chakra-ui/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogClose,
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
    <Dialog open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <DialogContent>
        <DialogHeader>
          <Text fontSize="lg" fontWeight="bold" color="white">
            {editingGroup ? '編輯群組' : '新增 Telegram 群組'}
          </Text>
        </DialogHeader>

        <DialogBody>
          <VStack align="stretch" gap={4}>
            {/* 群組名稱 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="gray.400">
                群組名稱 <Text as="span" color="red.400">*</Text>
              </Text>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：Netflix 家庭共享群"
                bg="gray.700"
                border="1px"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.500' }}
              />
            </VStack>

            {/* Telegram 連結 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="gray.400">
                Telegram 群組連結
              </Text>
              <Input
                value={telegramLink}
                onChange={(e) => setTelegramLink(e.target.value)}
                placeholder="https://t.me/your-group"
                bg="gray.700"
                border="1px"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.500' }}
              />
            </VStack>

            {/* 扣費日 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="gray.400">
                扣費日（每月幾號）<Text as="span" color="red.400">*</Text>
              </Text>
              <select
                value={billingDay}
                onChange={(e) => setBillingDay(e.target.value)}
                style={{
                  background: '#374151',
                  border: '1px solid #4B5563',
                  color: 'white',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  width: '100%',
                  outline: 'none',
                }}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    每月 {day} 日
                  </option>
                ))}
              </select>
            </VStack>

            {/* 收費週期 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="gray.400">
                收費週期類型 <Text as="span" color="red.400">*</Text>
              </Text>
              <select
                value={billingCycleType}
                onChange={(e) => setBillingCycleType(e.target.value as 'monthly' | 'biannually' | 'yearly')}
                style={{
                  background: '#374151',
                  border: '1px solid #4B5563',
                  color: 'white',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  width: '100%',
                  outline: 'none',
                }}
              >
                <option value="monthly">每月</option>
                <option value="biannually">半年</option>
                <option value="yearly">一年</option>
              </select>
            </VStack>

            {/* 備註 */}
            <VStack align="start" gap={2}>
              <Text fontSize="sm" color="gray.400">
                備註
              </Text>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="選填，例如：特殊說明或注意事項"
                bg="gray.700"
                border="1px"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.500' }}
              />
            </VStack>
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={2}>
            <DialogClose asChild>
              <Button size="sm" colorPalette="gray" variant="ghost">
                取消
              </Button>
            </DialogClose>
            <Button
              size="sm"
              colorPalette="blue"
              onClick={handleSubmit}
              loading={loading}
              disabled={!name.trim()}
            >
              {editingGroup ? '儲存變更' : '創建群組'}
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}