import * as React from "react"
import { Dialog, Portal, Box } from "@chakra-ui/react"
import { keyframes } from "@emotion/react"
import { useColorModeValue } from "@/components/ui/color-mode"

// 動畫關鍵幀定義
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const slideIn = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(-20px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
`

interface DialogContentProps extends Dialog.ContentProps {
  portalled?: boolean
  portalRef?: React.RefObject<HTMLElement | null>
  backdrop?: boolean
  variant?: 'default' | 'glass' | 'solid'
}

const DialogContent = React.forwardRef<
  HTMLDivElement,
  DialogContentProps
>(function DialogContent(props, ref) {
  const {
    children,
    portalled = true,
    portalRef,
    backdrop = true,
    variant = 'glass',
    ...rest
  } = props

  // Glassmorphism 顏色配置
  const glassBg = useColorModeValue(
    'rgba(255, 255, 255, 0.85)',
    'rgba(17, 24, 39, 0.85)'
  )
  const glassBorderColor = useColorModeValue(
    'rgba(255, 255, 255, 0.3)',
    'rgba(75, 85, 99, 0.3)'
  )
  const solidBg = useColorModeValue('white', 'gray.900')
  const solidBorderColor = useColorModeValue('gray.200', 'gray.700')

  // 根據 variant 選擇樣式
  const bg = variant === 'glass' ? glassBg : solidBg
  const borderColor = variant === 'glass' ? glassBorderColor : solidBorderColor

  return (
    <Portal disabled={!portalled} container={portalRef}>
      {backdrop && (
        <Dialog.Backdrop
          bg="blackAlpha.700"
          backdropFilter="blur(8px) saturate(180%)"
          animation={`${fadeIn} 0.2s ease-out`}
        />
      )}
      <Dialog.Positioner>
        <Dialog.Content
          ref={ref}
          {...rest}
          asChild={false}
          bg={bg}
          backdropFilter={variant === 'glass' ? 'blur(40px) saturate(180%)' : undefined}
          border="1px solid"
          borderColor={borderColor}
          rounded="2xl"
          shadow="2xl"
          overflow="hidden"
          animation={`${slideIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1)`}
          _dark={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          }}
          _light={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
        >
          {/* 裝飾性頂部漸層條 */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            h="3px"
            bg="linear-gradient(90deg, #3B82F6 0%, #8B5CF6 50%, #EC4899 100%)"
            opacity={0.8}
          />
          {children}
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  )
})

const DialogCloseTrigger = React.forwardRef<
  HTMLButtonElement,
  Dialog.CloseTriggerProps
>(function DialogCloseTrigger(props, ref) {
  const hoverBg = useColorModeValue('gray.100', 'gray.800')
  
  return (
    <Dialog.CloseTrigger
      ref={ref}
      position="absolute"
      top="4"
      insetEnd="4"
      w="8"
      h="8"
      display="flex"
      alignItems="center"
      justifyContent="center"
      rounded="lg"
      fontSize="sm"
      fontWeight="medium"
      color="gray.500"
      bg="transparent"
      transition="all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
      _hover={{
        bg: hoverBg,
        color: 'gray.700',
        transform: 'scale(1.05)',
      }}
      _active={{
        transform: 'scale(0.95)',
      }}
      {...props}
      asChild
    >
      {props.children || (
        <Box as="span" fontSize="lg" fontWeight="bold" lineHeight="1">
          ✕
        </Box>
      )}
    </Dialog.CloseTrigger>
  )
})

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const borderColor = useColorModeValue('gray.100', 'gray.800')
  
  return (
    <Dialog.Header
      className={className}
      position="relative"
      px={{ base: 6, md: 8 }}
      pt={{ base: 6, md: 8 }}
      pb={{ base: 4, md: 5 }}
      borderBottom="1px solid"
      borderColor={borderColor}
      {...props}
    />
  )
}

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <Dialog.Body
    className={className}
    px={{ base: 6, md: 8 }}
    py={{ base: 5, md: 6 }}
    {...props}
  />
)

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const borderColor = useColorModeValue('gray.100', 'gray.800')
  const bg = useColorModeValue('gray.50/50', 'gray.900/50')
  
  return (
    <Dialog.Footer
      className={className}
      px={{ base: 6, md: 8 }}
      py={{ base: 4, md: 5 }}
      borderTop="1px solid"
      borderColor={borderColor}
      bg={bg}
      {...props}
    />
  )
}

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  Dialog.TitleProps
>(({ className, ...props }, ref) => {
  const titleColor = useColorModeValue('gray.900', 'white')
  
  return (
    <Dialog.Title
      ref={ref}
      fontSize="2xl"
      fontWeight="bold"
      letterSpacing="tight"
      color={titleColor}
      {...props}
    />
  )
})

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const descriptionColor = useColorModeValue('gray.600', 'gray.300')
  
  return (
    <Dialog.Description
      ref={ref}
      fontSize="sm"
      color={descriptionColor}
      mt={1}
      {...props}
    />
  )
})

export const DialogRoot = Dialog.Root
export const DialogTrigger = Dialog.Trigger
export const DialogBackdrop = Dialog.Backdrop
export {
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
