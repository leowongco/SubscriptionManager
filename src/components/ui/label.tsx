import { forwardRef } from "react"
import { Text, type TextProps } from "@chakra-ui/react"

interface LabelProps extends TextProps {
  htmlFor?: string
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, htmlFor, ...props }, _ref) => (
    <Text
      as="label"
      fontSize="sm"
      fontWeight="medium"
      lineHeight="none"
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
