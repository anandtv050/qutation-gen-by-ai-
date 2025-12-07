# CCTV Quotation System - Complete Setup Guide

## System Overview

This is a complete CCTV quotation generation system with:
- **Frontend**: React + TypeScript + shadcn/ui
- **Backend**: Python FastAPI with AI processing
- **AI Integration**: Claude AI or OpenAI (optional, falls back to simple parsing)

## Workflow

1. **Agent enters raw data** from site visit (e.g., "3 cctv low quality, 1 adaptor, 700mtr cable")
2. **Submit** triggers backend API call
3. **Backend** processes with:
   - Raw text input
   - System prompt
   - Inventory JSON
   - AI processing (Claude/OpenAI or simple parsing)
4. **Returns structured quotation** items as JSON
5. **Auto-navigates** to quotation form with populated items
6. **Agent can edit, save, and print** the quotation

## Installation

### Frontend Setup

1. Navigate to the project root:
```bash
cd c:\Users\anand\Desktop\qutation
```

2. Install dependencies (if not already done):
```bash
npm install
```

3. Start frontend:
```bash
npm run dev
```

Frontend will run at: **http://localhost:5176** (or next available port)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Create Python virtual environment:
```bash
python -m venv venv
```

3. Activate virtual environment:
- Windows:
  ```bash
  venv\Scripts\activate
  ```
- Mac/Linux:
  ```bash
  source venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. (Optional) Set up AI API Key:
   - Copy `.env.example` to `.env`
   - Add your API key:
     ```
     ANTHROPIC_API_KEY=your_key_here
     ```
     OR
     ```
     OPENAI_API_KEY=your_key_here
     ```
   - **Note**: System works without API key using simple parsing

6. Start backend:
```bash
python main.py
```

Backend will run at: **http://localhost:8000**

## How to Use

### 1. Start Both Servers

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Backend):
```bash
cd backend
python main.py
```

### 2. Enter Raw Data

Open the frontend in your browser and enter raw site visit data:

**Example Input:**
```
3 cctv low quality
1 adaptor
700mtr cable
8 channel nvr
installation
```

### 3. Submit & Process

- Click **Submit** button
- System sends data to backend
- Backend processes with AI (or simple parsing)
- Returns structured quotation items

### 4. Review Quotation

- Automatically navigates to quotation page
- All items pre-filled with quantities and prices
- Add customer details
- Edit items if needed

### 5. Actions

- **Save**: Lock the quotation for viewing
- **Edit**: Re-enable editing mode
- **Print**: Open browser print dialog
- **Back to AI**: Return to input page

### 6. Manage Inventory

- Click **Manage Inventory** button
- View all inventory items
- Add new items
- Delete items
- Inventory syncs with backend

## API Endpoints

### GET /api/inventory
Get all inventory items

### POST /api/inventory
Add new inventory item

### DELETE /api/inventory/{item_id}
Delete inventory item

### POST /api/process
Process raw text and generate quotation

**Request:**
```json
{
  "raw_text": "3 cctv low quality\n1 adaptor\n700mtr cable"
}
```

**Response:**
```json
{
  "items": [
    {
      "description": "CCTV Camera - Low Quality",
      "quantity": 3,
      "rate": 2500,
      "amount": 7500
    },
    {
      "description": "Adaptor",
      "quantity": 1,
      "rate": 300,
      "amount": 300
    },
    {
      "description": "Cat6 Cable",
      "quantity": 700,
      "rate": 25,
      "amount": 17500
    }
  ],
  "success": true,
  "message": "Generated 3 items successfully"
}
```

## Features

### Text Input Page
- Free text input area
- Character counter
- Submit button (calls backend)
- Clear button
- Create Quotation button (manual entry)
- **Manage Inventory button** (NEW)

### Quotation Page
- Customer details form
- Dynamic items table
- Add/remove items
- Auto-calculation (quantity × rate)
- Subtotal, GST (18%), Total
- Save/Edit/Print buttons
- **Back to AI button**

### Inventory Manager (NEW)
- View all inventory items
- Add new items
- Delete items
- Category-wise organization
- Price management

## Customization

### Adding AI Integration

Edit `backend/main.py` and add your Claude or OpenAI API key to `.env` file.

The system automatically uses AI if key is present, otherwise falls back to simple parsing.

### Modifying Inventory

Edit inventory in:
- Frontend: `src/data/inventory.ts`
- Backend: `backend/main.py` (inventory_db)

Or use the Inventory Manager UI.

### Changing System Prompt

Edit `backend/main.py` - modify `SYSTEM_PROMPT` variable.

## Troubleshooting

### Backend not connecting
- Make sure backend is running at http://localhost:8000
- Check CORS settings in `backend/main.py`

### AI not working
- Verify API key in `.env` file
- System falls back to simple parsing if no API key

### Frontend errors
- Run `npm install` again
- Clear browser cache
- Check console for errors

## Production Deployment

### Frontend
```bash
npm run build
```
Deploy `dist` folder to your hosting service.

### Backend
- Use a production WSGI server like Gunicorn
- Set up proper environment variables
- Configure database instead of in-memory storage
- Add authentication and authorization

## File Structure

```
qutation/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── .env.example         # Environment variables template
│   └── README.md            # Backend documentation
├── src/
│   ├── components/
│   │   ├── TextInputForm.tsx      # Main input page
│   │   ├── QuotationForm.tsx      # Quotation display/edit
│   │   ├── InventoryManager.tsx   # Inventory management
│   │   └── ui/                    # shadcn/ui components
│   ├── data/
│   │   └── inventory.ts           # Inventory data & prompts
│   └── App.tsx                     # Main app router
├── package.json
└── SETUP_GUIDE.md           # This file
```

## Support

For issues or questions, refer to:
- Frontend: React + shadcn/ui documentation
- Backend: FastAPI documentation
- AI: Anthropic Claude or OpenAI documentation
