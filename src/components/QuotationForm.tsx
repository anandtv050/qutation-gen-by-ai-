import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Edit, Printer, Plus, Trash2 } from 'lucide-react'

interface QuotationItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
}

interface IncomingItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

interface QuotationFormProps {
  onBackToAI: () => void
  initialItems?: IncomingItem[]
}

export function QuotationForm({ onBackToAI, initialItems }: QuotationFormProps) {
  const [isEditing, setIsEditing] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0])
  const [quotationNumber, setQuotationNumber] = useState(`QT-${Date.now().toString().slice(-6)}`)

  const [items, setItems] = useState<QuotationItem[]>([])

  // Load initial items if provided
  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      const quotationItems: QuotationItem[] = initialItems.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        ...item
      }))
      setItems(quotationItems)
    }
  }, [initialItems])

  const addItem = () => {
    const newItem: QuotationItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof QuotationItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate
        }
        return updated
      }
      return item
    }))
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const tax = subtotal * 0.18 // 18% GST
  const total = subtotal + tax

  const handleSave = () => {
    setIsEditing(false)
    alert('Quotation saved successfully!')
  }

  const handlePrint = async () => {
    try {
      // Prepare data for PDF generation
      const pdfData = {
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount
        })),
        customer_name: customerName || undefined,
        customer_location: customerAddress || undefined
      }

      // Call backend API to generate PDF
      const response = await fetch('http://localhost:8000/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pdfData)
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `quotation_${quotationNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 print:hidden">
          <Button
            variant="outline"
            onClick={onBackToAI}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI
          </Button>

          <div className="flex-1" />

          {isEditing ? (
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          ) : (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}

          <Button onClick={handlePrint} variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>

        {/* Quotation Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-slate-50 dark:bg-slate-900">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-3xl font-bold text-primary">
                  QUOTATION
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  CCTV Implementation Services
                </p>
              </div>
              <div className="text-left md:text-right space-y-1">
                <div className="text-sm">
                  <span className="font-semibold">Quotation No:</span> {quotationNumber}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Date:</span> {quotationDate}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Customer Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter customer name"
                    className="disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter phone number"
                    className="disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter email address"
                    className="disabled:opacity-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerAddress">Address</Label>
                  <Input
                    id="customerAddress"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter address"
                    className="disabled:opacity-100"
                  />
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold border-b pb-2 flex-1">Items & Services</h3>
                {isEditing && (
                  <Button
                    onClick={addItem}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 print:hidden"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-primary">
                      <th className="text-left p-2 font-semibold">Description</th>
                      <th className="text-center p-2 font-semibold w-24">Qty</th>
                      <th className="text-right p-2 font-semibold w-32">Rate (₹)</th>
                      <th className="text-right p-2 font-semibold w-32">Amount (₹)</th>
                      {isEditing && <th className="w-12 print:hidden"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">
                          {isEditing ? (
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              placeholder="Item description"
                              className="h-8"
                            />
                          ) : (
                            <span>{item.description}</span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                              className="h-8 text-center"
                              min="1"
                            />
                          ) : (
                            <span>{item.quantity}</span>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {isEditing ? (
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              className="h-8 text-right"
                              min="0"
                              step="0.01"
                            />
                          ) : (
                            <span>{item.rate.toFixed(2)}</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {item.amount.toFixed(2)}
                        </td>
                        {isEditing && (
                          <td className="p-2 text-center print:hidden">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium">GST (18%):</span>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-primary">
                  <span className="text-lg font-bold">Total Amount:</span>
                  <span className="text-lg font-bold text-primary">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-2 mt-6 pt-6 border-t">
              <h4 className="font-semibold">Terms & Conditions:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Payment terms: 50% advance, 50% on completion</li>
                <li>Quotation valid for 30 days from the date of issue</li>
                <li>1 year warranty on all equipment</li>
                <li>Installation will be completed within 7 working days</li>
                <li>Free technical support for 6 months</li>
              </ul>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-6 border-t">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Prepared By:</p>
                <div className="border-t border-dashed pt-12 mt-8">
                  <p className="text-sm text-center">Authorized Signature</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold">Customer Acceptance:</p>
                <div className="border-t border-dashed pt-12 mt-8">
                  <p className="text-sm text-center">Customer Signature</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
