import { forwardRef } from "react"
import { Select as ChakraSelect, createListCollection } from "@chakra-ui/react"

interface SelectRootProps {
  value?: string
  onValueChange?: (value: string) => void
  children?: React.ReactNode
}

const SelectRoot = forwardRef<HTMLDivElement, SelectRootProps>(
  ({ value, onValueChange, children }, ref) => {
    // Create a collection from children items
    const items: string[] = []
    // Extract values from SelectItem children
    if (children) {
      const childArray = Array.isArray(children) ? children : [children]
      childArray.forEach((child: any) => {
        if (child?.props?.value) {
          items.push(child.props.value)
        }
      })
    }
    
    const collection = createListCollection({ items })
    
    return (
      <ChakraSelect.Root
        ref={ref}
        collection={collection}
        value={value ? [value] : undefined}
        onValueChange={(e) => onValueChange?.(e.value[0] || '')}
      >
        {children}
      </ChakraSelect.Root>
    )
  }
)
SelectRoot.displayName = "Select"

const SelectTrigger = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => (
  <ChakraSelect.Trigger ref={ref} {...props}>
    <ChakraSelect.ValueText>{children}</ChakraSelect.ValueText>
  </ChakraSelect.Trigger>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => (
  <ChakraSelect.Positioner>
    <ChakraSelect.Content ref={ref} {...props}>
      {children}
    </ChakraSelect.Content>
  </ChakraSelect.Positioner>
))
SelectContent.displayName = "SelectContent"

const SelectItem = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ value, children, ...props }, ref) => (
  <ChakraSelect.Item ref={ref} item={value} {...props}>
    <ChakraSelect.ItemText>{children}</ChakraSelect.ItemText>
  </ChakraSelect.Item>
))
SelectItem.displayName = "SelectItem"

const SelectValue = ChakraSelect.ValueText

export { SelectRoot, SelectTrigger, SelectContent, SelectItem, SelectValue }
export { SelectRoot as Select }
