import { forwardRef } from "react"
import { Badge as ChakraBadge } from "@chakra-ui/react"

const Badge = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <ChakraBadge
    ref={ref}
    display="inline-flex"
    alignItems="center"
    rounded="md"
    px={2}
    py={0.5}
    fontSize="xs"
    fontWeight="medium"
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge }
