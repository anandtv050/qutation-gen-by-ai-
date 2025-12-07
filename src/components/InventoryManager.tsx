import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { type InventoryItem } from '@/data/inventory'
import { Plus, Trash2, X, Loader2 } from 'lucide-react'

interface InventoryManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InventoryManager({ open, onOpenChange }: InventoryManagerProps) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'other',
    price: 0,
    unit: 'piece',
    description: ''
  })

  // Fetch inventory from backend when dialog opens
  useEffect(() => {
    if (open) {
      fetchInventory()
    }
  }, [open])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('http://localhost:8000/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setItems(data)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.price) return

    const item: InventoryItem = {
      id: Date.now().toString(),
      name: newItem.name,
      category: newItem.category as InventoryItem['category'],
      price: newItem.price,
      unit: newItem.unit || 'piece',
      description: newItem.description
    }

    try {
      const response = await fetch('http://localhost:8000/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })

      if (response.ok) {
        await fetchInventory() // Refresh list from backend
        setNewItem({ name: '', category: 'other', price: 0, unit: 'piece', description: '' })
        setIsAdding(false)
      }
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/inventory/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchInventory() // Refresh list from backend
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const categoryColors: Record<string, string> = {
    camera: 'bg-blue-100 text-blue-800',
    nvr: 'bg-purple-100 text-purple-800',
    cable: 'bg-green-100 text-green-800',
    accessory: 'bg-yellow-100 text-yellow-800',
    installation: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Inventory Management</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Total Items: {items.length}
            </p>
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>

          {/* Add New Item Form */}
          {isAdding && (
            <div className="border rounded-lg p-4 bg-secondary/20">
              <h3 className="font-semibold mb-3">Add New Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., CCTV Camera"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value as InventoryItem['category'] })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="camera">Camera</option>
                    <option value="nvr">NVR/DVR</option>
                    <option value="cable">Cable</option>
                    <option value="accessory">Accessory</option>
                    <option value="installation">Installation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    placeholder="piece, meter, job"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddItem} size="sm">Save Item</Button>
                <Button onClick={() => setIsAdding(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="text-left p-3 font-semibold text-sm">Item Name</th>
                    <th className="text-left p-3 font-semibold text-sm">Category</th>
                    <th className="text-right p-3 font-semibold text-sm">Price (₹)</th>
                    <th className="text-center p-3 font-semibold text-sm">Unit</th>
                    <th className="text-left p-3 font-semibold text-sm">Description</th>
                    <th className="text-center p-3 font-semibold text-sm w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-muted/50">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[item.category]}`}>
                          {item.category}
                        </span>
                      </td>
                      <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                      <td className="p-3 text-center text-sm text-muted-foreground">{item.unit}</td>
                      <td className="p-3 text-sm text-muted-foreground">{item.description}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
