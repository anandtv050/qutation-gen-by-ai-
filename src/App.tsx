import { useState } from 'react'
import { TextInputForm } from './components/TextInputForm'
import { QuotationForm } from './components/QuotationForm'

type View = 'text-input' | 'quotation'

interface QuotationItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

function App() {
  const [currentView, setCurrentView] = useState<View>('text-input')
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([])

  const handleOpenQuotation = (items?: QuotationItem[]) => {
    if (items) {
      setQuotationItems(items)
    }
    setCurrentView('quotation')
  }

  return (
    <>
      {currentView === 'text-input' && (
        <TextInputForm onOpenQuotation={handleOpenQuotation} />
      )}
      {currentView === 'quotation' && (
        <QuotationForm
          onBackToAI={() => setCurrentView('text-input')}
          initialItems={quotationItems}
        />
      )}
    </>
  )
}

export default App
