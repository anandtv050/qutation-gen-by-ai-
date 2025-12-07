import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, Loader2, FileText, Package } from 'lucide-react'
import { InventoryManager } from './InventoryManager'

interface QuotationItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface TextInputFormProps {
  onOpenQuotation: (items?: QuotationItem[]) => void
}

export function TextInputForm({ onOpenQuotation }: TextInputFormProps) {
  const [showInventory, setShowInventory] = useState(false)
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!text.trim()) return

    setIsLoading(true)

    try {
      // Call backend API
      const response = await fetch('http://localhost:8000/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_text: text })
      })

      if (!response.ok) {
        throw new Error('Failed to process request')
      }

      const data = await response.json()

      // Show result
      setResult(`${data.message} - Generated ${data.items.length} items`)

      // Auto-navigate to quotation with populated items
      setTimeout(() => {
        onOpenQuotation(data.items)
      }, 1000)

    } catch (error) {
      console.error('Error processing:', error)
      setResult('Error: Make sure backend is running at http://localhost:8000')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setText('')
    setResult(null)
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl md:text-3xl font-bold text-center">
            Text Input
          </CardTitle>
          <CardDescription className="text-center text-base">
            Enter your text below and click submit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Type something here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[150px] md:min-h-[200px] resize-none text-base"
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground text-right">
                {text.length} characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={!text.trim() || isLoading}
                className="flex-1 h-11 text-base font-semibold"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                disabled={isLoading || (!text && !result)}
                className="h-11 text-base sm:w-auto"
                size="lg"
              >
                Clear
              </Button>
            </div>
          </form>

          {/* Action Buttons */}
          <div className="pt-4 border-t space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => onOpenQuotation()}
                variant="secondary"
                className="h-12 text-base font-semibold"
                size="lg"
              >
                <FileText className="mr-2 h-5 w-5" />
                Create Quotation
              </Button>
              <Button
                onClick={() => setShowInventory(true)}
                variant="outline"
                className="h-12 text-base font-semibold"
                size="lg"
              >
                <Package className="mr-2 h-5 w-5" />
                Manage Inventory
              </Button>
            </div>
          </div>

          {result && (
            <div className="mt-6 p-4 rounded-lg bg-secondary/50 border border-border">
              <h3 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                Result
              </h3>
              <p className="text-base leading-relaxed">{result}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Manager Modal */}
      <InventoryManager open={showInventory} onOpenChange={setShowInventory} />
    </div>
  )
}
