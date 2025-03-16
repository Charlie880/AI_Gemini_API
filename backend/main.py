from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (update this for production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Configure Gemini API using environment variable
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file")
genai.configure(api_key=GEMINI_API_KEY)

# Global variables for model and parameters
model = genai.GenerativeModel('gemini-1.5-pro-latest')
model_parameters = {
    "temperature": 0.7,
    "top_k": 50,
    "top_p": 0.9,
    "max_output_tokens": 256,
}

# Request model for chat input
class ChatRequest(BaseModel):
    message: str

# Request model for updating parameters
class ParameterUpdateRequest(BaseModel):
    temperature: float
    top_k: int
    top_p: float
    max_output_tokens: int

# Chat endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Generate response using the model with current parameters
        response = model.generate_content(
            request.message,
            generation_config=genai.GenerationConfig(**model_parameters)
        )
        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Update parameters endpoint
@app.post("/update-parameters")
async def update_parameters(request: ParameterUpdateRequest):
    try:
        global model_parameters
        model_parameters = request.dict()
        return {"message": "Parameters updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Fine-tune endpoint
@app.post("/fine-tune")
async def fine_tune(file: UploadFile = File(...)):
    try:
        # Check if the file is a JSON file
        if not file.filename.endswith(".json"):
            raise HTTPException(status_code=400, detail="Only JSON files are allowed")

        # Save the uploaded file
        file_path = f"uploads/{file.filename}"
        os.makedirs("uploads", exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Load the dataset
        with open(file_path, "r") as f:
            dataset = json.load(f)

        # Simulate fine-tuning by updating model parameters
        global model_parameters
        model_parameters["temperature"] = 0.5  # Example: Adjust temperature
        model_parameters["max_output_tokens"] = 512  # Example: Increase max tokens

        return {"message": "Fine-tuning simulation completed successfully"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)