import { forwardRef } from "react"
import { Table } from "@chakra-ui/react"

const TableRoot = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <Table.Root
    ref={ref}
    w="full"
    {...props}
  />
))
TableRoot.displayName = "Table"

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <Table.Header ref={ref} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <Table.Body ref={ref} {...props} />
))
TableBody.displayName = "TableBody"

const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <Table.ColumnHeader
    ref={ref}
    fontSize="sm"
    fontWeight="medium"
    color="gray.500"
    textAlign="left"
    py={3}
    px={4}
    borderBottom="1px solid"
    borderColor="gray.200"
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <Table.Row ref={ref} {...props} />
))
TableRow.displayName = "TableRow"

const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <Table.Cell
    ref={ref}
    py={3}
    px={4}
    borderBottom="1px solid"
    borderColor="gray.100"
    {...props}
  />
))
TableCell.displayName = "TableCell"

export { TableRoot as Table, TableHeader, TableBody, TableHead, TableRow, TableCell }
