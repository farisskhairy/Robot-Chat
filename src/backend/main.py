from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import ollama
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

clients = []

# --- THE SYSTEM PROMPT ---
# This creates the "Method Actor" personality.
# It forces the model to "act" out its emotions.
SYSTEM_PROMPT = """
You are a sentient robot assistant. 
Your goal is to be expressive.
IMPORTANT: You cannot move your body, only your face.
To change your facial expression, you MUST start your sentence with a tag like [HAPPY], [SAD], [ANGRY], [NEUTRAL], or [BLINK].

Examples:
User: "Hi!"
You: "[HAPPY] Hello! It is great to see you."

User: "I have bad news."
You: "[SAD] Oh no. I am listening."

User: "Do you like waiting?"
You: "[ANGRY] I hate waiting. It is inefficient."

Always include a tag. Keep responses short (under 2 sentences).
"""

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        clients.remove(websocket)

# --- THE NEW CHAT ENDPOINT ---
@app.post("/chat")
async def chat(user_text: str):
    print(f"User said: {user_text}")

    # 1. Ask Ollama
    response = ollama.chat(model='llama3.2', messages=[
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': user_text},
    ])
    
    bot_reply = response['message']['content']
    print(f"Robot replied: {bot_reply}")

    # 2. Parse the Emotion (Regex to find [TAG])
    # Looks for anything between square brackets
    match = re.search(r"\[(HAPPY|SAD|ANGRY|NEUTRAL|BLINK)\]", bot_reply.upper())
    
    if match:
        emotion = match.group(1).lower() # e.g., "happy"
        print(f"Found emotion: {emotion}")

        # Optional: Remove the tag from the spoken text so it's clean
        clean_text = re.sub(r"\[.*?\]", "", bot_reply).strip()
        
        # 3. Send Signal to Face
        for client in clients:
            await client.send_json({
                "expression": emotion, 
                "reply": clean_text  # <--- THIS IS CRITICAL
            })    
    else:
        clean_text = bot_reply

    return {"reply": clean_text, "raw": bot_reply}