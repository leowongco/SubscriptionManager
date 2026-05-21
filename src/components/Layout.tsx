import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, CreditCard, Menu, X, Apple, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  IconButton,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  DrawerCloseTrigger,
  Portal,
} from '@chakra-ui/react';

export default function Layout() {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    // Close menu when route changes
    useEffect(() => {
        setOpen(false);
    }, [location.pathname]);

    const navigation = [
        { name: '綜合儀表板', href: '/', icon: Home },
        { name: 'Apple ID 管理', href: '/accounts', icon: Apple },
        { name: 'Telegram 群組', href: '/groups', icon: MessageCircle },
        { name: '訂閱關係對應', href: '/mapping', icon: Users },
        { name: '服務與定價管理', href: '/services', icon: Settings },
        { name: '批次禮品卡加值', href: '/recharge', icon: CreditCard },
    ];

    const isActive = (href: string) => {
        if (href === '/groups') {
            return location.pathname.startsWith('/groups');
        }
        return location.pathname === href;
    };

    return (
        <Flex minH="100vh" bg="gray.900" color="white">
            {/* Sidebar (Desktop) */}
            <Box
                w={{ base: '48', md: '56', lg: '64' }}
                bg="gray.800"
                borderRight="1px"
                borderColor="gray.700"
                display={{ base: 'none', md: 'flex' }}
                flexDirection="column"
                flexShrink={0}
            >
                <Box p={6}>
                    <Text
                        fontSize="xl"
                        fontWeight="black"
                        color="blue.400"
                        letterSpacing="tight"
                    >
                        Subscription Master
                    </Text>
                </Box>
                <VStack as="nav" flex={1} px={4} gap={2} mt={4} align="stretch">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            style={{ textDecoration: 'none' }}
                        >
                            <Box
                                display="flex"
                                alignItems="center"
                                gap={3}
                                px={3}
                                py={2.5}
                                rounded="xl"
                                transition="all 0.2s"
                                fontSize="sm"
                                fontWeight="semibold"
                                bg={isActive(item.href) ? 'rgba(37, 99, 235, 0.1)' : 'transparent'}
                                color={isActive(item.href) ? 'blue.400' : 'gray.400'}
                                border={isActive(item.href) ? '1px solid' : 'none'}
                                borderColor={isActive(item.href) ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}
                                shadow={isActive(item.href) ? '0 0 15px rgba(59,130,246,0.1)' : 'none'}
                                _hover={{
                                    color: isActive(item.href) ? 'blue.400' : 'white',
                                    bg: isActive(item.href) ? 'rgba(37, 99, 235, 0.1)' : 'gray.700',
                                }}
                            >
                                <Box as={item.icon} w={5} h={5} />
                                {item.name}
                            </Box>
                        </Link>
                    ))}
                </VStack>
                <Box p={6} borderTop="1px" borderColor="rgba(55, 65, 81, 0.5)" bg="rgba(3, 7, 18, 0.2)">
                    <Text fontSize="10px" color="gray.600" textAlign="center" textTransform="uppercase" letterSpacing="widest" fontWeight="black">
                        Version 1.0 Pro Max
                    </Text>
                </Box>
            </Box>

            {/* Main Content Area */}
            <Flex flex={1} flexDirection="column" minW={0}>
                {/* Mobile Header */}
                <Box
                    display={{ base: 'flex', md: 'none' }}
                    h={16}
                    borderBottom="1px"
                    borderColor="gray.700"
                    alignItems="center"
                    justifyContent="space-between"
                    px={6}
                    bg="rgba(31, 41, 55, 0.8)"
                    position="sticky"
                    top={0}
                    zIndex={50}
                >
                    <Text
                        fontSize="lg"
                        fontWeight="black"
                        color="blue.400"
                    >
                        Sub Master
                    </Text>
                    <IconButton
                        aria-label="Open menu"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: 'white' }}
                        onClick={() => setOpen(true)}
                    >
                        <Menu />
                    </IconButton>
                </Box>

                {/* Mobile Drawer */}
                <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="end" size="xs">
                    <Portal>
                        <Drawer.Backdrop bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(4px)" />
                    </Portal>
                    <Portal>
                        <DrawerContent bg="gray.800" borderColor="gray.700" borderLeft="1px">
                            <DrawerHeader borderBottom="1px" borderColor="rgba(55, 65, 81, 0.5)">
                                <HStack justify="space-between">
                                    <Text fontWeight="black" color="gray.300" letterSpacing="wider">
                                        選單
                                    </Text>
                                    <DrawerCloseTrigger asChild>
                                        <IconButton
                                            aria-label="Close menu"
                                            variant="ghost"
                                            color="gray.500"
                                            _hover={{ color: 'white' }}
                                        >
                                            <X />
                                        </IconButton>
                                    </DrawerCloseTrigger>
                                </HStack>
                            </DrawerHeader>
                            <DrawerBody py={6}>
                                <VStack gap={3} align="stretch">
                                    {navigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            to={item.href}
                                            style={{ textDecoration: 'none' }}
                                            onClick={() => setOpen(false)}
                                        >
                                            <Box
                                                display="flex"
                                                alignItems="center"
                                                gap={4}
                                                px={4}
                                                py={3.5}
                                                rounded="2xl"
                                                transition="all 0.2s"
                                                fontSize="sm"
                                                fontWeight="bold"
                                                bg={isActive(item.href) ? 'rgba(37, 99, 235, 0.2)' : 'transparent'}
                                                color={isActive(item.href) ? 'blue.400' : 'gray.400'}
                                                border={isActive(item.href) ? '1px solid' : 'none'}
                                                borderColor={isActive(item.href) ? 'rgba(59, 130, 246, 0.3)' : 'transparent'}
                                                _hover={{
                                                    color: isActive(item.href) ? 'blue.400' : 'white',
                                                    bg: isActive(item.href) ? 'rgba(37, 99, 235, 0.2)' : 'gray.700',
                                                }}
                                            >
                                                <Box as={item.icon} w={5} h={5} flexShrink={0} />
                                                {item.name}
                                            </Box>
                                        </Link>
                                    ))}
                                </VStack>
                            </DrawerBody>
                            <DrawerFooter p={6} borderTop="1px" borderColor="rgba(55, 65, 81, 0.5)" bg="rgba(3, 7, 18, 0.2)">
                                <Text fontSize="10px" color="gray.600" textAlign="center" textTransform="uppercase" letterSpacing="widest" fontWeight="black">
                                    Version 1.0 Pro Max
                                </Text>
                            </DrawerFooter>
                        </DrawerContent>
                    </Portal>
                </Drawer.Root>

                <Box as="main" flex={1} p={{ base: 4, md: 8 }} overflowY="auto">
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    );
}
