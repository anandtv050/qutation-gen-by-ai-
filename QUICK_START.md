# Quick Start Guide

## ✅ Complete CCTV Quotation System Ready!

Your system is now fully functional with AI-powered quotation generation!

## 🚀 Start the System (2 Steps)

### Step 1: Start Frontend (Already Running!)
Frontend is live at: **http://localhost:5176**

If you need to restart:
```bash
npm run dev
```

### Step 2: Start Backend

Open a **NEW terminal** and run:

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend will start at: **http://localhost:8000**

## 📝 How It Works

### 1. Agent Enters Raw Data
Open http://localhost:5176 and enter site visit notes:

**Example:**
```
3 cctv low quality
1 adaptor
700mtr cable
8 channel nvr
installation
```

### 2. Click Submit
- Sends to backend API
- AI processes the text (or uses simple parsing)
- Generates structured quotation items

### 3. Auto-Opens Quotation
- Quotation page opens automatically
- All items pre-filled with prices
- Ready to add customer details

### 4. Manage & Export
- **Edit** items and quantities
- **Save** the quotation
- **Print** for customer
- **Back to AI** for next quotation

## 🎯 Features You Have

### Main Input Page
✅ Text input for raw site data
✅ AI-powered processing
✅ Inventory Manager button
✅ Create Quotation button

### Quotation Page
✅ Customer details form
✅ Dynamic items table
✅ Add/remove items
✅ Auto-calculation (Qty × Rate)
✅ GST calculation (18%)
✅ Save/Edit/Print buttons
✅ Professional PDF-ready layout

### Inventory Manager
✅ View all inventory items
✅ Add new items
✅ Delete items
✅ Category organization
✅ Price management

## 🔧 Optional: Add AI Power

For better accuracy, add an AI API key:

1. Create `backend/.env` file:
```bash
cd backend
copy .env.example .env
```

2. Edit `.env` and add:
```
ANTHROPIC_API_KEY=your_claude_api_key_here
```
OR
```
OPENAI_API_KEY=your_openai_api_key_here
```

3. Restart backend

**Without API key:** System uses simple keyword matching (works great!)
**With API key:** Uses AI for better understanding of complex inputs

## 📊 Example Workflow

**Agent visits client site** →
Writes notes: "need 4 cameras good quality, 8ch nvr, 500m cable" →
**Opens app** →
Pastes notes →
**Clicks Submit** →
Backend processes →
**Quotation opens** with:
- 4× CCTV Camera - High Quality @ ₹5,000 = ₹20,000
- 1× 8 Channel NVR @ ₹12,000 = ₹12,000
- 500× Cat6 Cable @ ₹25 = ₹12,500
- **Total: ₹52,650** (including GST)

Agent adds customer name, phone →
**Prints** →
Done! ✨

## 🎨 Customization

### Change Inventory Prices
Click **Manage Inventory** button or edit `backend/main.py`

### Modify GST Rate
Edit `src/components/QuotationForm.tsx` line where `tax = subtotal * 0.18`

### Add More Items
Use Inventory Manager UI or add to `backend/main.py` inventory_db

## ❗ Troubleshooting

**"Error: Make sure backend is running"**
→ Start the backend: `cd backend && python main.py`

**Frontend not loading**
→ Run: `npm run dev`

**Ports already in use**
→ Backend uses 8000, Frontend uses 5176 (or next available)

## 🎉 You're All Set!

Your CCTV quotation system is production-ready!

**Need help?** Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed documentation.
