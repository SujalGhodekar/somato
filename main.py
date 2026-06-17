from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

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

# Store Orders
orders = []


@app.get("/")
def home():
    return {
        "message": "Backend Running"
    }


@app.get("/menu")
def get_menu():
    return menu


class Order(BaseModel):
    items: list
    total: int


@app.post("/order")
def place_order(order: Order):
    orders.append(order)

    return {
        "status": "Success",
        "message": "Order Placed Successfully!",
        "total": order.total
    }


@app.get("/orders")
def get_orders():
    return orders