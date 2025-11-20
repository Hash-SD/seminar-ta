export default function Snippet() {
  return (
    <div>
      <h1>Proof of Work</h1>
      <p>The table component is implemented and the build passes.</p>
      <pre>
{`
// components/ui/table.tsx
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"
`}
      </pre>
    </div>
  )
}
