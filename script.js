let total = 0;
let cartItems = [];
let token = localStorage.getItem("token");

// ---- Auth UI Functions ----

function showLogin() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("loginError").innerHTML = "";
    document.getElementById("signupError").innerHTML = "";
}

function showSignup() {
    document.getElementById("authModal").style.display = "flex";
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "block";
    document.getElementById("loginError").innerHTML = "";
    document.getElementById("signupError").innerHTML = "";
}

function closeAuth() {
    document.getElementById("authModal").style.display = "none";
}

function switchToSignup() {
    showSignup();
}

function switchToLogin() {
    showLogin();
}

// ---- Auth API Functions ----

function signup() {
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();

    if (!name || !email || !password) {
        document.getElementById("signupError").innerHTML = "Please fill all fields";
        return;
    }

    fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "Success") {
            token = data.token;
            localStorage.setItem("token", token);
            setUser(data.user);
            closeAuth();
        } else {
            document.getElementById("signupError").innerHTML = data.detail || "Signup failed";
        }
    })
    .catch(err => {
        document.getElementById("signupError").innerHTML = "Server error. Is the server running?";
        console.log(err);
    });
}

function login() {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        document.getElementById("loginError").innerHTML = "Please fill all fields";
        return;
    }

    fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "Success") {
            token = data.token;
            localStorage.setItem("token", token);
            setUser(data.user);
            closeAuth();
        } else {
            document.getElementById("loginError").innerHTML = data.detail || "Login failed";
        }
    })
    .catch(err => {
        document.getElementById("loginError").innerHTML = "Server error. Is the server running?";
        console.log(err);
    });
}

function logout() {
    token = null;
    localStorage.removeItem("token");
    document.getElementById("authButtons").style.display = "flex";
    document.getElementById("userInfo").style.display = "none";
}

function setUser(user) {
    document.getElementById("authButtons").style.display = "none";
    document.getElementById("userInfo").style.display = "flex";
    document.getElementById("userName").innerHTML = "👤 " + user.name;
}

// Check if user is already logged in
function checkAuth() {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
        token = savedToken;
        fetch("/api/me", {
            headers: { "Authorization": "Bearer " + token }
        })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Not authenticated");
        })
        .then(user => {
            setUser(user);
        })
        .catch(() => {
            localStorage.removeItem("token");
            token = null;
        });
    }
}

// ---- Scroll Functions ----

function scrollToMenu() {
    const menuSection = document.querySelector(".menu");
    if (menuSection) {
        menuSection.scrollIntoView({ behavior: "smooth" });
    }
}

// ---- Cart Functions ----

function addCart(food, price) {
    cartItems.push(food);
    total = total + price;

    let cart = document.getElementById("cart");
    let li = document.createElement("li");
    li.innerHTML = food + " - ₹" + price;
    cart.appendChild(li);

    document.getElementById("total").innerHTML = total;
    document.getElementById("count").innerHTML = cartItems.length;
}

function searchFood() {
    let input = document.getElementById("searchBox");
    let filter = input.value.toUpperCase();
    let menuSection = document.querySelector(".menu");
    let foods = menuSection.getElementsByClassName("food");

    for (let i = 0; i < foods.length; i++) {
        let h3 = foods[i].getElementsByTagName("h3")[0];
        if (h3) {
            let txtValue = h3.textContent || h3.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                foods[i].style.display = "";
            } else {
                foods[i].style.display = "none";
            }
        }
    }
}

function checkout() {
    if (cartItems.length === 0) {
        document.getElementById("result").innerHTML = "Your cart is empty!";
        return;
    }

    if (!token) {
        document.getElementById("result").innerHTML = "Please login to place an order!";
        showLogin();
        return;
    }

    fetch("/api/order", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
            items: cartItems,
            total: total
        })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerHTML =
            data.message + " Total ₹" + data.total;
        // Clear cart after successful order
        cartItems = [];
        total = 0;
        document.getElementById("cart").innerHTML = "";
        document.getElementById("total").innerHTML = "0";
        document.getElementById("count").innerHTML = "0";
    })
    .catch(error => {
        console.log(error);
        document.getElementById("result").innerHTML = "Error placing order. Is the server running?";
    });
}

// Check backend connection
fetch("/")
.then(response => {
    if (response.ok) {
        console.log("Backend is running!");
    }
})
.catch(error => {
    console.log("Backend not reachable:", error);
});

// ---- Load Menu from FastAPI Backend ----

function loadMenu() {
    fetch("/api/menu")
    .then(res => res.json())
    .then(menu => {
        const container = document.getElementById("menuContainer");
        container.innerHTML = "";

        menu.forEach((item, index) => {
            const images = ["pissa.jpg", "burger.jpg", "pasta.jpg", "sandw.jpg"];
            const ratings = ["⭐⭐⭐⭐⭐", "⭐⭐⭐⭐☆", "⭐⭐⭐⭐☆", "⭐⭐⭐⭐⭐"];

            const foodDiv = document.createElement("div");
            foodDiv.className = "food";
            foodDiv.innerHTML = `
                <img src="${images[index]}" alt="${item.name}">
                <h3>${item.name}</h3>
                ${ratings[index]}
                <p>₹${item.price}</p>
                <button onclick="addCart('${item.name}',${item.price})">
                    Add To Cart
                </button>
                <button class="fav"></button>
            `;

            container.appendChild(foodDiv);
        });
    })
    .catch(err => {
        console.log("Failed to load menu from API:", err);
    });
}

// Initialize auth state on page load
checkAuth();

// Load menu from FastAPI backend
loadMenu();
