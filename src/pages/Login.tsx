import { useState } from 'react';
import { Box, VStack, Text, Button, Input, Field, Center } from '@chakra-ui/react';
import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        const result = await login(username, password);
        setSubmitting(false);
        if (!result.ok) {
            setError(result.error || '登入失敗');
        }
    };

    return (
        <Center minH="100vh" bg="bg.subtle" px={4}>
            <Box
                as="form"
                onSubmit={handleSubmit}
                w="full"
                maxW="380px"
                bg="bg.panel"
                border="1px solid"
                borderColor="border.default"
                rounded="2xl"
                shadow="2xl"
                p={{ base: 6, md: 8 }}
            >
                <VStack gap={1} mb={6} align="start">
                    <Box p={2.5} bg="accent.subtle" rounded="xl" mb={2}>
                        <Box as={Lock} w={5} h={5} color="accent.fg" />
                    </Box>
                    <Text fontSize="xl" fontWeight="black" color="fg.default">
                        Subscription Master
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                        請登入以繼續
                    </Text>
                </VStack>

                <VStack gap={4} align="stretch">
                    <Field.Root required>
                        <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                            帳號
                        </Field.Label>
                        <Input
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            autoFocus
                            required
                            bg="bg.subtle"
                            borderColor="border.emphasized"
                            rounded="xl"
                            h={12}
                            fontFamily="mono"
                        />
                    </Field.Root>

                    <Field.Root required>
                        <Field.Label fontSize="xs" color="fg.muted" fontWeight="semibold" textTransform="uppercase" letterSpacing="wider">
                            密碼
                        </Field.Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            bg="bg.subtle"
                            borderColor="border.emphasized"
                            rounded="xl"
                            h={12}
                        />
                    </Field.Root>

                    {error && (
                        <Text fontSize="sm" color="fg.error" bg="red.subtle" px={3} py={2} rounded="lg" border="1px solid" borderColor="red.emphasized">
                            {error}
                        </Text>
                    )}

                    <Button
                        type="submit"
                        w="full"
                        colorPalette="accent"
                        rounded="xl"
                        h={12}
                        fontWeight="bold"
                        loading={submitting}
                        shadow="lg"
                    >
                        登入
                    </Button>
                </VStack>
            </Box>
        </Center>
    );
}
