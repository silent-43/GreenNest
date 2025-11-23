const BACKEND_URL = "http://localhost:5000"; // Backend URL

// -------------------- AUTH --------------------
// Redirect if not logged in
async function checkAuth() {
  const res = await fetch(`${BACKEND_URL}/check-session`, { credentials: "include" });
  const data = await res.json();
  if (!data.loggedIn) {
    if (!window.location.href.includes("index.html") && !window.location.href.includes("register.html")) {
      window.location.href = "index.html";
    }
  } else {
    if (window.location.href.includes("index.html") || window.location.href.includes("register.html")) {
      window.location.href = "home.html";
    }
  }
}

checkAuth();

// Login form
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const body = {
      email: formData.get("email"),
      password: formData.get("password")
    };
    const res = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) window.location.href = "home.html";
    else alert(data.message);
  });
}

// Register form
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password")
    };
    const res = await fetch(`${BACKEND_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.success) window.location.href = "index.html";
    else alert(data.message);
  });
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await fetch(`${BACKEND_URL}/logout`, { method: "POST", credentials: "include" });
    window.location.href = "index.html";
  });
}











// -------------------- CART --------------------

// Initialize cart in localStorage if not exist
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Function to add product safely
function addToCart(product) {
  // Check localStorage cart again
  let currentCart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = currentCart.find(item => item.productId === product.productId);
  if (existing) {
    alert("এই প্রোডাক্ট ইতিমধ্যে কার্টে আছে!");
    return;
  }
  currentCart.push({ ...product, quantity: 1 });
  localStorage.setItem("cart", JSON.stringify(currentCart));
  cart = currentCart; // update global cart
  alert("প্রোডাক্ট কার্টে যোগ করা হয়েছে!");
}

// Event delegation
document.addEventListener("click", function(e) {
  if (e.target && e.target.classList.contains("addToCartBtn")) {
    const product = JSON.parse(e.target.getAttribute("data-product"));
    addToCart(product);
  }
});
