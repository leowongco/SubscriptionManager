import { forwardRef } from "react"
import { Switch, type SwitchRootProps } from "@chakra-ui/react"

interface CustomSwitchProps extends Omit<SwitchRootProps, 'checked' | 'onCheckedChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const SwitchRoot = forwardRef<HTMLLabelElement, CustomSwitchProps>(
  ({ checked, onCheckedChange, ...props }, ref) => (
    <Switch.Root
      ref={ref}
      checked={checked}
      onCheckedChange={(e) => onCheckedChange?.(e.checked)}
      {...props}
    >
      <Switch.HiddenInput />
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Root>
  )
)
SwitchRoot.displayName = "Switch"

export { SwitchRoot as Switch }
