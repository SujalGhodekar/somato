from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
import datetime
import hashlib

app = FastAPI()

# JWT Secret Key
SECRET_KEY = "somato_super_secret_key_2026_32bytes!"
ALGORITHM = "HS256"
security = HTTPBearer()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Food Menu
menu = [
    {"name": "Pizza", "price": 250},
    {"name": "Burger", "price": 150},
    {"name": "Pasta", "price": 220},
    {"name": "Sandwich", "price": 120}
]

# In-memory stores
users = {}  # email -> {name, email, password_hash}
orders = []


# ---------- Models ----------
class Order(BaseModel):
    items: list
    total: int


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------- Helpers ----------
def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def create_token(email: str) -> str:
    payload = {
        "email": email,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload["email"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------- Auth Endpoints ----------
@app.post("/api/signup")
def signup(req: SignupRequest):
    if req.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")

    users[req.email] = {
        "name": req.name,
        "email": req.email,
        "password_hash": hash_password(req.password)
    }
    token = create_token(req.email)
    return {
        "status": "Success",
        "message": "Account created successfully!",
        "token": token,
        "user": {"name": req.name, "email": req.email}
    }


@app.post("/api/login")
def login(req: LoginRequest):
    user = users.get(req.email)
    if not user or user["password_hash"] != hash_password(req.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(req.email)
    return {
        "status": "Success",
        "message": "Login successful!",
        "token": token,
        "user": {"name": user["name"], "email": user["email"]}
    }


@app.get("/api/me")
def get_current_user(email: str = Depends(verify_token)):
    user = users.get(email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"name": user["name"], "email": user["email"]}


# ---------- Order Endpoints ----------
@app.get("/api/menu")
def get_menu():
    return menu


@app.post("/api/order")
def place_order(order: Order, email: str = Depends(verify_token)):
    orders.append({"user": email, "items": order.items, "total": order.total, "time": str(datetime.datetime.now())})
    return {
        "status": "Success",
        "message": "Order Placed Successfully!",
        "total": order.total
    }


@app.get("/api/orders")
def get_orders(email: str = Depends(verify_token)):
    user_orders = [o for o in orders if o["user"] == email]
    return user_orders


# Serve static files (HTML, CSS, JS, images)
app.mount("/", StaticFiles(directory=".", html=True), name="static")
