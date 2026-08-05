import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, CreditCard, Menu, X, Apple, MessageCircle, Moon, Sun, LogOut } from 'lucide-react';
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
import { useColorMode, useColorModeValue } from '@/components/ui/color-mode';
import { useAuth } from '@/context/AuthContext';

export default function Layout() {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const { colorMode, toggleColorMode } = useColorMode();
    const { logout } = useAuth();

    // Color mode values
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const textColor = useColorModeValue('gray.900', 'white');
    const sidebarBg = useColorModeValue('white', 'gray.800');
    const sidebarBorder = useColorModeValue('gray.200', 'gray.700');
    const navItemBgActive = useColorModeValue('blue.50', 'blue.950');
    const navItemColorActive = useColorModeValue('blue.600', 'blue.300');
    const navItemBorderActive = useColorModeValue('blue.200', 'blue.800');
    const navItemColor = useColorModeValue('gray.600', 'gray.300');
    const navItemHoverBg = useColorModeValue('gray.100', 'gray.700');
    const navItemHoverColor = useColorModeValue('gray.900', 'white');
    const mobileHeaderBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(31, 41, 55, 0.8)');
    const drawerBg = useColorModeValue('white', 'gray.800');
    const focusRingColor = useColorModeValue('blue.500', 'blue.400');

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
        <Flex minH="100vh" bg={bgColor} color={textColor}>
            {/* Sidebar (Desktop) */}
            <Box
                w={{ base: '48', md: '56', lg: '64' }}
                bg={sidebarBg}
                borderRight="1px"
                borderColor={sidebarBorder}
                display={{ base: 'none', md: 'flex' }}
                flexDirection="column"
                flexShrink={0}
            >
                <Box p={6}>
                    <HStack justify="space-between" align="center">
                        <Text
                            fontSize="xl"
                            fontWeight="black"
                            color="blue.400"
                            letterSpacing="tight"
                        >
                            Subscription Master
                        </Text>
                        <IconButton
                            aria-label="切換主題"
                            onClick={toggleColorMode}
                            variant="ghost"
                            size="sm"
                            color={navItemColor}
                            _hover={{ color: navItemHoverColor, bg: navItemHoverBg }}
                        >
                            {colorMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </IconButton>
                    </HStack>
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
                                bg={isActive(item.href) ? navItemBgActive : 'transparent'}
                                color={isActive(item.href) ? navItemColorActive : navItemColor}
                                border={isActive(item.href) ? '1px solid' : 'none'}
                                borderColor={isActive(item.href) ? navItemBorderActive : 'transparent'}
                                _hover={{
                                    color: isActive(item.href) ? navItemColorActive : navItemHoverColor,
                                    bg: isActive(item.href) ? navItemBgActive : navItemHoverBg,
                                }}
                                _focusVisible={{
                                    outline: '2px solid',
                                    outlineColor: focusRingColor,
                                    outlineOffset: '2px',
                                }}
                            >
                                <Box as={item.icon} w={5} h={5} />
                                {item.name}
                            </Box>
                        </Link>
                    ))}
                </VStack>
                <Box p={4} borderTop="1px" borderColor={sidebarBorder} bg={useColorModeValue('gray.50', 'rgba(3, 7, 18, 0.2)')}>
                    <Box
                        as="button"
                        onClick={logout}
                        display="flex"
                        alignItems="center"
                        gap={2}
                        w="full"
                        px={3}
                        py={2}
                        rounded="lg"
                        fontSize="sm"
                        fontWeight="semibold"
                        color={navItemColor}
                        _hover={{ color: 'red.400', bg: navItemHoverBg }}
                        transition="all 0.2s"
                    >
                        <Box as={LogOut} w={4} h={4} />
                        登出
                    </Box>
                    <Text fontSize="10px" color={navItemColor} textAlign="center" textTransform="uppercase" letterSpacing="widest" fontWeight="black" mt={3}>
                        Version 1.0.0
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
                    borderColor={sidebarBorder}
                    alignItems="center"
                    justifyContent="space-between"
                    px={6}
                    bg={mobileHeaderBg}
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
                    <HStack gap={2}>
                        <IconButton
                            aria-label="切換主題"
                            onClick={toggleColorMode}
                            variant="ghost"
                            color={navItemColor}
                            _hover={{ color: navItemHoverColor }}
                        >
                            {colorMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </IconButton>
                        <IconButton
                            aria-label="Open menu"
                            variant="ghost"
                            color={navItemColor}
                            _hover={{ color: navItemHoverColor }}
                            onClick={() => setOpen(true)}
                        >
                            <Menu />
                        </IconButton>
                    </HStack>
                </Box>

                {/* Mobile Drawer */}
                <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="end" size="xs">
                    <Portal>
                        <Drawer.Backdrop bg="rgba(0, 0, 0, 0.6)" backdropFilter="blur(4px)" />
                    </Portal>
                    <Portal>
                      <Drawer.Positioner>
                        <DrawerContent bg={drawerBg} borderColor={sidebarBorder} borderLeft="1px">
                            <DrawerHeader borderBottom="1px" borderColor={sidebarBorder}>
                                <HStack justify="space-between">
                                    <Text fontWeight="black" color={navItemColor} letterSpacing="wider">
                                        選單
                                    </Text>
                                    <DrawerCloseTrigger asChild>
                                        <IconButton
                                            aria-label="Close menu"
                                            variant="ghost"
                                            color={navItemColor}
                                            _hover={{ color: navItemHoverColor }}
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
                                                bg={isActive(item.href) ? navItemBgActive : 'transparent'}
                                                color={isActive(item.href) ? navItemColorActive : navItemColor}
                                                border={isActive(item.href) ? '1px solid' : 'none'}
                                                borderColor={isActive(item.href) ? navItemBorderActive : 'transparent'}
                                                _hover={{
                                                    color: isActive(item.href) ? navItemColorActive : navItemHoverColor,
                                                    bg: isActive(item.href) ? navItemBgActive : navItemHoverBg,
                                                }}
                                            >
                                                <Box as={item.icon} w={5} h={5} flexShrink={0} />
                                                {item.name}
                                            </Box>
                                        </Link>
                                    ))}
                                </VStack>
                            </DrawerBody>
                            <DrawerFooter p={4} borderTop="1px" borderColor={sidebarBorder} bg={useColorModeValue('gray.50', 'rgba(3, 7, 18, 0.2)')} flexDirection="column">
                                <Box
                                    as="button"
                                    onClick={logout}
                                    display="flex"
                                    alignItems="center"
                                    gap={2}
                                    w="full"
                                    px={4}
                                    py={2.5}
                                    rounded="xl"
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color={navItemColor}
                                    _hover={{ color: 'red.400', bg: navItemHoverBg }}
                                    transition="all 0.2s"
                                >
                                    <Box as={LogOut} w={4} h={4} />
                                    登出
                                </Box>
                                <Text fontSize="10px" color={navItemColor} textAlign="center" textTransform="uppercase" letterSpacing="widest" fontWeight="black" mt={3}>
                                    Version 1.0.0
                                </Text>
                            </DrawerFooter>
                        </DrawerContent>
                      </Drawer.Positioner>
                    </Portal>
                </Drawer.Root>

                <Box as="main" flex={1} p={{ base: 4, md: 8 }} overflowY="auto">
                    <Outlet />
                </Box>
            </Flex>
        </Flex>
    );
}
