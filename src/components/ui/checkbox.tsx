import { forwardRef } from "react"
import { Checkbox as ChakraCheckbox } from "@chakra-ui/react"

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof ChakraCheckbox.Root> {}

const Checkbox = forwardRef<
  React.ElementRef<typeof ChakraCheckbox.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <ChakraCheckbox.Root ref={ref} {...props}>
    <ChakraCheckbox.Control>
      <ChakraCheckbox.Indicator />
    </ChakraCheckbox.Control>
    <ChakraCheckbox.Label />
  </ChakraCheckbox.Root>
))
Checkbox.displayName = "Checkbox"

export { Checkbox }
