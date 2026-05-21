import { forwardRef } from "react"
import { Input as ChakraInput, type InputProps } from "@chakra-ui/react"

interface CustomInputProps extends Omit<InputProps, 'size'> {
  className?: string
}

const Input = forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <ChakraInput
        type={type}
        ref={ref}
        h="36px"
        w="full"
        rounded="md"
        border="1px solid"
        borderColor="gray.300"
        bg="transparent"
        px={3}
        py={1}
        fontSize={{ base: "base", md: "sm" }}
        shadow="sm"
        transition="all 0.2s"
        _placeholder={{ color: "gray.400" }}
        _focus={{
          outline: "none",
          ring: "1px",
          ringColor: "blue.500",
        }}
        _disabled={{
          cursor: "not-allowed",
          opacity: 0.5,
        }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
