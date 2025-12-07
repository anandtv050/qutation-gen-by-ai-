from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from anthropic import Anthropic
import google.generativeai as genai
from groq import Groq
from datetime import datetime
from dotenv import load_dotenv
from pdf_generator import HDCQuotationPDF

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="CCTV Quotation API")

# File paths for persistent storage
INVENTORY_FILE = "inventory.json"
LATEST_RESPONSE_FILE = "latest_response.json"
SYSTEM_PROMPT_FILE = "system_prompt.txt"

# CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class InventoryItem(BaseModel):
    id: str
    name: str
    category: str
    price: float
    unit: str
    description: Optional[str] = None

class QuotationItem(BaseModel):
    description: str
    quantity: int
    rate: float
    amount: float

class ProcessRequest(BaseModel):
    raw_text: str

class ProcessResponse(BaseModel):
    items: List[QuotationItem]
    success: bool
    message: str

class PDFRequest(BaseModel):
    items: List[QuotationItem]
    customer_name: Optional[str] = None
    customer_location: Optional[str] = None

# Helper functions for JSON file operations
def load_inventory() -> List[InventoryItem]:
    """Load inventory from JSON file (handles nested structure)"""
    try:
        with open(INVENTORY_FILE, 'r') as f:
            data = json.load(f)

            # Handle nested inventory structure
            inventory_items = []

            # Skip 'rules' section as it's not actual inventory
            sections_to_skip = ['rules']

            for category_key, category_data in data.items():
                if category_key in sections_to_skip or not isinstance(category_data, dict):
                    continue

                # Each category has subcategories (e.g., cameras->ip_cameras, networking->switches)
                for subcategory_key, subcategory_items in category_data.items():
                    if not isinstance(subcategory_items, list):
                        continue

                    # Now iterate through actual items
                    for item in subcategory_items:
                        # Map the nested structure to InventoryItem model
                        inventory_item = InventoryItem(
                            id=item.get('id', f"{category_key}_{subcategory_key}_{item.get('name', 'unknown')}"),
                            name=item.get('name', 'Unknown Item'),
                            category=f"{category_key}/{subcategory_key}",
                            price=item.get('rate', 0),
                            unit=item.get('unit', 'piece'),
                            description=item.get('description', item.get('name', ''))
                        )
                        inventory_items.append(inventory_item)

            return inventory_items

    except FileNotFoundError:
        # Return empty list if file doesn't exist
        return []

def save_inventory(inventory: List[InventoryItem]):
    """Save inventory to JSON file"""
    with open(INVENTORY_FILE, 'w') as f:
        json.dump([item.model_dump() for item in inventory], f, indent=2)

def save_ai_response(response_data: dict):
    """Save latest AI response to JSON file (overwrites previous)"""
    with open(LATEST_RESPONSE_FILE, 'w') as f:
        json.dump(response_data, f, indent=2)

def load_system_prompt() -> str:
    """Load system prompt from text file"""
    try:
        with open(SYSTEM_PROMPT_FILE, 'r') as f:
            return f.read()
    except FileNotFoundError:
        # Fallback to a basic prompt if file doesn't exist
        return "You are a CCTV quotation assistant. Convert raw input into structured quotation JSON."

# Load data from files on startup
inventory_db: List[InventoryItem] = load_inventory()
SYSTEM_PROMPT = load_system_prompt()

# Routes
@app.get("/")
def read_root():
    return {"message": "CCTV Quotation API is running"}

@app.get("/api/inventory")
def get_inventory():
    """Get all inventory items"""
    return inventory_db

@app.post("/api/inventory")
def add_inventory_item(item: InventoryItem):
    """Add new inventory item"""
    inventory_db.append(item)
    save_inventory(inventory_db)  # Save to JSON file
    return {"success": True, "item": item}

@app.delete("/api/inventory/{item_id}")
def delete_inventory_item(item_id: str):
    """Delete inventory item"""
    global inventory_db
    inventory_db = [item for item in inventory_db if item.id != item_id]
    save_inventory(inventory_db)  # Save to JSON file
    return {"success": True, "message": "Item deleted"}

@app.post("/api/generate-pdf")
async def generate_quotation_pdf(request: PDFRequest):
    """Generate PDF quotation from items"""
    try:
        print(f"[PDF] Received request with {len(request.items)} items")
        print(f"[PDF] Customer: {request.customer_name}, Location: {request.customer_location}")

        # Convert Pydantic models to dicts
        items_data = [item.model_dump() for item in request.items]

        print(f"[PDF] Items data: {items_data}")

        # Generate PDF using HDC template
        pdf_gen = HDCQuotationPDF()
        pdf_buffer = pdf_gen.generate_quotation(
            items=items_data,
            customer_name=request.customer_name,
            customer_location=request.customer_location,
            include_info_page=True  # Include the marketing page
        )

        print("[PDF] PDF generated successfully with HDC template")

        # Return PDF as streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=HDC_Quotation_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            }
        )
    except Exception as e:
        print(f"[PDF] Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/process", response_model=ProcessResponse)
async def process_raw_text(request: ProcessRequest):
    """Process raw agent input and generate quotation items using AI"""

    try:
        # Prepare inventory data for AI
        inventory_json = json.dumps([item.model_dump() for item in inventory_db], indent=2)

        # Get API key from environment variable
        gemini_key = os.getenv("GEMINI_API_KEY")
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        # Priority: Groq (FREE) > Gemini > Anthropic > OpenAI > Simple parsing
        groq_key = os.getenv("GROQ_API_KEY")

        if groq_key:
            try:
                items = await process_with_groq(request.raw_text, inventory_json, groq_key)
                ai_provider = "Groq AI (FREE)"
            except Exception as groq_error:
                print(f"[Groq] Error: {groq_error}")
                # Fallback to Gemini if Groq fails
                if gemini_key:
                    try:
                        items = await process_with_gemini(request.raw_text, inventory_json, gemini_key)
                        ai_provider = "Gemini AI"
                    except Exception as gemini_error:
                        print(f"[Gemini] Error: {gemini_error}")
                        items = simple_parse(request.raw_text)
                        ai_provider = "basic parsing (AI failed)"
                else:
                    items = simple_parse(request.raw_text)
                    ai_provider = "basic parsing (Groq failed)"
        elif gemini_key:
            try:
                items = await process_with_gemini(request.raw_text, inventory_json, gemini_key)
                ai_provider = "Gemini AI"
            except Exception as gemini_error:
                print(f"[Gemini] Error: {gemini_error}")
                # Fallback to simple parsing if Gemini fails (quota exceeded, etc.)
                items = simple_parse(request.raw_text)
                ai_provider = "basic parsing (Gemini quota exceeded)"
        elif anthropic_key:
            items = await process_with_claude(request.raw_text, inventory_json)
            ai_provider = "Claude AI"
        elif openai_key:
            items = await process_with_openai(request.raw_text, inventory_json)
            ai_provider = "OpenAI"
        else:
            # Fallback to simple parsing if no API key
            items = simple_parse(request.raw_text)
            ai_provider = "basic parsing (no AI API key found)"

        # Save AI response to JSON file (overwrites previous)
        response_data = {
            "raw_input": request.raw_text,
            "ai_provider": ai_provider,
            "items": [item.model_dump() for item in items],
            "item_count": len(items)
        }
        save_ai_response(response_data)

        return ProcessResponse(
            items=items,
            success=True,
            message=f"Generated {len(items)} items using {ai_provider}"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def process_with_groq(raw_text: str, inventory_json: str, api_key: str) -> List[QuotationItem]:
    """Process using Groq AI (FREE and FAST)"""
    print(f"\n{'='*50}")
    print(f"[Groq] Starting process...")
    print(f"[Groq] API Key (first 10 chars): {api_key[:10]}...")
    print(f"[Groq] Raw text input: {raw_text}")

    client = Groq(api_key=api_key)

    full_prompt = f"""{SYSTEM_PROMPT}

Inventory List:
{inventory_json}

Agent Input:
{raw_text}"""

    print(f"[Groq] Prompt length: {len(full_prompt)} chars")
    print(f"[Groq] Sending request to Groq API...")

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": full_prompt}
        ],
        temperature=0.2,
        max_tokens=4096,
    )

    # Parse AI response
    response_text = response.choices[0].message.content.strip()
    print(f"[Groq] Response received!")
    print(f"[Groq] Response length: {len(response_text)} chars")
    print(f"[Groq] Response preview: {response_text[:500]}...")

    # Extract JSON from response (in case there's markdown)
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    print(f"[Groq] Extracted JSON: {response_text[:300]}...")
    parsed_response = json.loads(response_text)

    # Handle both formats: direct array or object with "items" field
    if isinstance(parsed_response, list):
        items_data = parsed_response
    elif isinstance(parsed_response, dict) and "items" in parsed_response:
        items_data = parsed_response["items"]
    else:
        raise ValueError("Invalid response format from AI")

    return [QuotationItem(**item) for item in items_data]

async def process_with_gemini(raw_text: str, inventory_json: str, api_key: str) -> List[QuotationItem]:
    """Process using Google Gemini AI"""
    print(f"\n{'='*50}")
    print(f"[Gemini] Starting process...")
    print(f"[Gemini] API Key (first 10 chars): {api_key[:10]}...")
    print(f"[Gemini] Raw text input: {raw_text}")

    genai.configure(api_key=api_key)

    # Try experimental model (often has separate/higher quota)
    model_name = 'gemini-2.0-flash-exp'
    print(f"[Gemini] Using model: {model_name}")
    model = genai.GenerativeModel(model_name)

    full_prompt = f"""{SYSTEM_PROMPT}

Inventory List:
{inventory_json}

Agent Input:
{raw_text}"""

    print(f"[Gemini] Prompt length: {len(full_prompt)} chars")
    print(f"[Gemini] Sending request to Gemini API...")

    response = model.generate_content(
        full_prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=0.2,
            max_output_tokens=4096,
        )
    )

    # Parse AI response
    response_text = response.text.strip()
    print(f"[Gemini] Response received!")
    print(f"[Gemini] Response length: {len(response_text)} chars")
    print(f"[Gemini] Response preview: {response_text[:500]}...")

    # Extract JSON from response (in case there's markdown)
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    print(f"[Gemini] Extracted JSON: {response_text[:300]}...")
    parsed_response = json.loads(response_text)

    # Handle both formats: direct array or object with "items" field
    if isinstance(parsed_response, list):
        items_data = parsed_response
    elif isinstance(parsed_response, dict) and "items" in parsed_response:
        items_data = parsed_response["items"]
    else:
        raise ValueError("Invalid response format from AI")

    return [QuotationItem(**item) for item in items_data]

async def process_with_claude(raw_text: str, inventory_json: str) -> List[QuotationItem]:
    """Process using Claude AI"""
    client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    full_prompt = f"""{SYSTEM_PROMPT}

Inventory List:
{inventory_json}

Agent Input:
{raw_text}"""

    message = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=2048,
        messages=[
            {"role": "user", "content": full_prompt}
        ]
    )

    # Parse AI response
    response_text = message.content[0].text

    # Extract JSON from response (in case there's markdown)
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    parsed_response = json.loads(response_text)

    # Handle both formats: direct array or object with "items" field
    if isinstance(parsed_response, list):
        items_data = parsed_response
    elif isinstance(parsed_response, dict) and "items" in parsed_response:
        items_data = parsed_response["items"]
    else:
        raise ValueError("Invalid response format from AI")

    return [QuotationItem(**item) for item in items_data]

async def process_with_openai(raw_text: str, inventory_json: str) -> List[QuotationItem]:
    """Process using OpenAI"""
    # TODO: Implement OpenAI integration if needed
    import openai

    openai.api_key = os.getenv("OPENAI_API_KEY")

    full_prompt = f"""{SYSTEM_PROMPT}

Inventory List:
{inventory_json}

Agent Input:
{raw_text}"""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a CCTV quotation assistant."},
            {"role": "user", "content": full_prompt}
        ]
    )

    response_text = response.choices[0].message.content

    # Extract JSON from response
    if "```json" in response_text:
        response_text = response_text.split("```json")[1].split("```")[0].strip()
    elif "```" in response_text:
        response_text = response_text.split("```")[1].split("```")[0].strip()

    parsed_response = json.loads(response_text)

    # Handle both formats: direct array or object with "items" field
    if isinstance(parsed_response, list):
        items_data = parsed_response
    elif isinstance(parsed_response, dict) and "items" in parsed_response:
        items_data = parsed_response["items"]
    else:
        raise ValueError("Invalid response format from AI")

    return [QuotationItem(**item) for item in items_data]

def simple_parse(raw_text: str) -> List[QuotationItem]:
    """Simple parsing fallback when no AI API key is available"""
    items = []
    lines = raw_text.lower().split('\n')

    for line in lines:
        if not line.strip():
            continue

        # Parse patterns like "3 cctv low quality", "700mtr cable", etc.
        import re
        number_match = re.search(r'(\d+)\s*(?:x|pcs|piece|pieces|mtr|meter|meters)?', line)
        quantity = int(number_match.group(1)) if number_match else 1

        if 'cctv' in line or 'camera' in line:
            if 'low' in line:
                items.append(QuotationItem(description='CCTV Camera - Low Quality', quantity=quantity, rate=2500, amount=quantity * 2500))
            elif 'medium' in line:
                items.append(QuotationItem(description='CCTV Camera - Medium Quality', quantity=quantity, rate=3500, amount=quantity * 3500))
            elif 'high' in line:
                items.append(QuotationItem(description='CCTV Camera - High Quality', quantity=quantity, rate=5000, amount=quantity * 5000))
            else:
                items.append(QuotationItem(description='CCTV Camera - Medium Quality', quantity=quantity, rate=3500, amount=quantity * 3500))

        if 'adaptor' in line:
            items.append(QuotationItem(description='Adaptor', quantity=quantity, rate=300, amount=quantity * 300))

        if 'cable' in line:
            rate = 20 if 'coax' in line else 25
            desc = 'Coaxial Cable' if 'coax' in line else 'Cat6 Cable'
            items.append(QuotationItem(description=desc, quantity=quantity, rate=rate, amount=quantity * rate))

        if 'nvr' in line or 'dvr' in line:
            if '4' in line:
                items.append(QuotationItem(description='4 Channel NVR', quantity=1, rate=8000, amount=8000))
            elif '8' in line:
                items.append(QuotationItem(description='8 Channel NVR', quantity=1, rate=12000, amount=12000))
            elif '16' in line:
                items.append(QuotationItem(description='16 Channel NVR', quantity=1, rate=18000, amount=18000))

        if 'install' in line:
            items.append(QuotationItem(description='Installation Basic', quantity=1, rate=5000, amount=5000))

    return items

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
