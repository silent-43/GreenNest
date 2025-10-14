const BACKEND_URL = "http://localhost:5000"; // Add this at the top

// Redirect if not logged in
async function checkAuth(){
  const res = await fetch(`${BACKEND_URL}/check-session`, { credentials:"include" });
  const data = await res.json();
  if(!data.loggedIn){
    if(!window.location.href.includes("index.html") && !window.location.href.includes("register.html")){
      window.location.href="index.html";
    }
  } else {
    if(window.location.href.includes("index.html") || window.location.href.includes("register.html")){
      window.location.href="home.html";
    }
  }
}

checkAuth();

// Login form
const loginForm = document.getElementById("loginForm");
if(loginForm){
  loginForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const formData = new FormData(loginForm);
    const body = {
      email: formData.get("email"),
      password: formData.get("password")
    };
    const res = await fetch(`${BACKEND_URL}/login`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"include",
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(data.success) window.location.href="home.html";
    else alert(data.message);
  });
}

// Register form
const registerForm = document.getElementById("registerForm");
if(registerForm){
  registerForm.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const formData = new FormData(registerForm);
    const body = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password")
    };
    const res = await fetch(`${BACKEND_URL}/signup`, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      credentials:"include",
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if(data.success) window.location.href="index.html";
    else alert(data.message);
  });
}

// Logout
const logoutBtn = document.getElementById("logoutBtn");
if(logoutBtn){
  logoutBtn.addEventListener("click", async ()=>{
    await fetch(`${BACKEND_URL}/logout`, { method:"POST", credentials:"include" });
    window.location.href="index.html";
  });
}
