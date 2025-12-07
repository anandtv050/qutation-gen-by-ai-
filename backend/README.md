# CCTV Quotation Backend API

FastAPI backend for processing CCTV quotation requests.

## Setup

1. Install Python 3.8+

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your API key to `.env`:
- For Claude AI: Add `ANTHROPIC_API_KEY=your_key`
- For OpenAI: Add `OPENAI_API_KEY=your_key`
- Without API key: System will use simple parsing

## Run

```bash
python main.py
```

Or with uvicorn:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `GET /` - Health check
- `GET /api/inventory` - Get all inventory items
- `POST /api/inventory` - Add new inventory item
- `DELETE /api/inventory/{item_id}` - Delete inventory item
- `POST /api/process` - Process raw text and generate quotation

## Example Request

```bash
curl -X POST "http://localhost:8000/api/process" \
  -H "Content-Type: application/json" \
  -d '{"raw_text": "3 cctv low quality\n1 adaptor\n700mtr cable"}'
```

## Response

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
