export interface InventoryItem {
  id: string
  name: string
  category: 'camera' | 'nvr' | 'cable' | 'accessory' | 'installation' | 'other'
  price: number
  unit: string
  description?: string
}

// ===================================================================
// REMOVED: Inventory data now managed in backend/inventory.json
// Frontend fetches from: http://localhost:8000/api/inventory
// ===================================================================
//
// To update inventory:
// 1. Edit backend/inventory.json directly, OR
// 2. Use "Manage Inventory" button in the app UI
//
// System prompt is also managed in backend (backend/main.py)
// ===================================================================
