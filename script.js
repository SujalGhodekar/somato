let total = 0;

// Add item to cart and save to backend
function addCart(food, price) {

    // Add item to cart list
    let cart = document.getElementById("cart");

    let li = document.createElement("li");
    li.innerHTML = food + " - ₹" + price;

    cart.appendChild(li);

    // Update total
    total += price;
    document.getElementById("total").innerHTML = total;

    // Send order to FastAPI
    fetch("http://127.0.0.1:8000/order", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            food: food,
            price: price
        })

    })
    .then(response => response.json())
    .then(data => {
        console.log(data.message);
        alert(data.message);
    })
    .catch(error => {
        console.log(error);
    });

}

// Load previous orders from database
function loadOrders() {

    fetch("http://127.0.0.1:8000/orders")

    .then(response => response.json())

    .then(data => {

        data.forEach(order => {

            let li = document.createElement("li");

            li.innerHTML = order[1] + " - ₹" + order[2];

            document.getElementById("cart").appendChild(li);

        });

    });

}

// Load orders when page starts
loadOrders();