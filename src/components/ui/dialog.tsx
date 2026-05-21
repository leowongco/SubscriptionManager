import * as React from "react"
import { Dialog } from "@chakra-ui/react"

const DialogRoot = Dialog.Root
const DialogTrigger = Dialog.Trigger
const DialogClose = Dialog.CloseTrigger

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Dialog.Backdrop
    ref={ref}
    bg="blackAlpha.600"
    backdropFilter="blur(4px)"
    {...props}
  />
))
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <Dialog.Content
    ref={ref}
    bg="gray.900"
    border="1px solid"
    borderColor="gray.700"
    rounded="2xl"
    shadow="2xl"
    p={6}
    maxW="450px"
    {...props}
  >
    {children}
    <Dialog.CloseTrigger
      position="absolute"
      top={4}
      right={4}
      rounded="sm"
      opacity={0.7}
      transition="opacity 0.2s"
      _hover={{ opacity: 1 }}
    >
      ✕
    </Dialog.CloseTrigger>
  </Dialog.Content>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={className}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    fontSize="xl"
    fontWeight="bold"
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    fontSize="sm"
    color="gray.400"
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  DialogRoot as Dialog,
  DialogTrigger,
  DialogClose,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
