import { forwardRef } from "react"
import { Button as ChakraButton } from "@chakra-ui/react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: {
        bg: "gray.900",
        color: "white",
        _hover: { bg: "gray.800" },
      },
      destructive: {
        bg: "red.600",
        color: "white",
        _hover: { bg: "red.700" },
      },
      outline: {
        bg: "transparent",
        border: "1px solid",
        borderColor: "gray.300",
        color: "gray.700",
        _hover: { bg: "gray.50" },
      },
      secondary: {
        bg: "gray.100",
        color: "gray.900",
        _hover: { bg: "gray.200" },
      },
      ghost: {
        bg: "transparent",
        color: "gray.700",
        _hover: { bg: "gray.100" },
      },
      link: {
        bg: "transparent",
        color: "blue.600",
        textDecoration: "underline",
        _hover: { color: "blue.700" },
      },
    }

    const sizeStyles = {
      default: { h: "36px", px: 4, py: 2, fontSize: "sm" },
      sm: { h: "32px", px: 3, fontSize: "xs" },
      lg: { h: "40px", px: 8, fontSize: "md" },
      icon: { h: "36px", w: "36px", p: 0 },
    }

    return (
      <ChakraButton
        ref={ref}
        {...variantStyles[variant]}
        {...sizeStyles[size]}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
