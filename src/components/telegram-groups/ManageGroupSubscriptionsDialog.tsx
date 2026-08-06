import { useEffect, useState } from 'react';
import { Text, VStack, HStack, Button, Spinner } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '../ui/dialog';
import { Checkbox } from '../ui/checkbox';
import { api } from '@/lib/api';
import { toaster } from '../ui/toaster';

interface SubscriptionOption {
  id: string;
  service_name: string;
  apple_id: string;
  telegram_group_id: string | null;
  telegram_group_name: string | null;
}

interface AccountWithSubscriptions {
  id: string;
  apple_id: string;
  subscriptions?: Array<{
    id: string;
    service_name: string;
    telegram_group_id: string | null;
    telegram_group_name: string | null;
  }>;
}

interface ManageGroupSubscriptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  onSaved: () => void;
}

export default function ManageGroupSubscriptionsDialog({
  open,
  onOpenChange,
  groupId,
  groupName,
  onSaved,
}: ManageGroupSubscriptionsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<AccountWithSubscriptions[]>([]);
  // subscription_id -> 目前勾選狀態（初始值是「這筆訂閱現在是不是屬於這個群組」）
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const [initialState, setInitialState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);
    api.getAccounts()
      .then((data: AccountWithSubscriptions[]) => {
        if (cancelled) return;
        setAccounts(data);
        const initial: Record<string, boolean> = {};
        for (const acc of data) {
          for (const sub of acc.subscriptions || []) {
            initial[sub.id] = sub.telegram_group_id === groupId;
          }
        }
        setCheckedState(initial);
        setInitialState(initial);
      })
      .catch((error) => console.error('Failed to load accounts:', error))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [open, groupId]);

  const handleSave = async () => {
    const changedIds = Object.keys(checkedState).filter((id) => checkedState[id] !== initialState[id]);
    if (changedIds.length === 0) {
      onOpenChange(false);
      return;
    }

    setSaving(true);
    try {
      await Promise.all(changedIds.map((subId) =>
        api.updateSubscription(subId, { telegram_group_id: checkedState[subId] ? groupId : null })
      ));
      toaster.create({
        title: '已更新關聯訂閱',
        description: `異動了 ${changedIds.length} 筆訂閱的群組關聯`,
        type: 'success',
      });
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Failed to update subscription group links:', error);
    } finally {
      setSaving(false);
    }
  };

  const subscriptionOptions: SubscriptionOption[] = accounts.flatMap((acc) =>
    (acc.subscriptions || []).map((sub) => ({
      id: sub.id,
      service_name: sub.service_name,
      apple_id: acc.apple_id,
      telegram_group_id: sub.telegram_group_id,
      telegram_group_name: sub.telegram_group_name,
    }))
  );

  return (
    <DialogRoot open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <DialogContent maxW="520px" variant="glass">
        <DialogHeader>
          <DialogTitle>管理「{groupName}」的關聯訂閱</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>

        <DialogBody>
          {loading ? (
            <HStack justify="center" py={8}>
              <Spinner />
            </HStack>
          ) : subscriptionOptions.length === 0 ? (
            <Text fontSize="sm" color="fg.muted" textAlign="center" py={8}>
              目前沒有任何訂閱，請先在「訂閱關係對應」頁面新增。
            </Text>
          ) : (
            <VStack align="stretch" gap={2} maxH="420px" overflowY="auto">
              {subscriptionOptions.map((sub) => {
                const belongsToOther = sub.telegram_group_id && sub.telegram_group_id !== groupId;
                return (
                  <HStack
                    key={sub.id}
                    justify="space-between"
                    p={3}
                    bg="bg.subtle"
                    rounded="lg"
                    border="1px solid"
                    borderColor="border.default"
                  >
                    <Checkbox
                      checked={checkedState[sub.id] || false}
                      onCheckedChange={(e) => setCheckedState((prev) => ({ ...prev, [sub.id]: !!e.checked }))}
                    >
                      <VStack align="start" gap={0}>
                        <Text fontSize="sm" fontWeight="semibold" color="fg.default">
                          {sub.apple_id} · {sub.service_name}
                        </Text>
                        {belongsToOther && (
                          <Text fontSize="xs" color="fg.warning">
                            目前屬於「{sub.telegram_group_name}」，勾選會改成這個群組
                          </Text>
                        )}
                      </VStack>
                    </Checkbox>
                  </HStack>
                );
              })}
            </VStack>
          )}
        </DialogBody>

        <DialogFooter>
          <HStack gap={3} justify="end" w="full">
            <DialogCloseTrigger asChild>
              <Button variant="outline" colorPalette="gray" rounded="xl" h={11} px={6} disabled={saving}>
                取消
              </Button>
            </DialogCloseTrigger>
            <Button
              colorPalette="blue"
              loading={saving}
              onClick={handleSave}
              rounded="xl"
              h={11}
              px={8}
              fontWeight="semibold"
            >
              儲存
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

