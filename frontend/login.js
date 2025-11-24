const BACKEND_URL = "http://127.0.0.1:5000";

const password = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");

togglePassword.addEventListener("click", () => {
  if(password.type === "password"){
    password.type = "text";
    togglePassword.textContent = "🙈";
  } else {
    password.type = "password";
    togglePassword.textContent = "👁️";
  }
});

document.getElementById("loginForm").addEventListener("submit", async (e)=>{
  e.preventDefault();

  const email = document.getElementById("email").value;
  const passwordValue = password.value;
  const role = document.getElementById("role").value;

  try {
    const res = await fetch(`${BACKEND_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: passwordValue, role })
    });

    const data = await res.json();
    const msg = document.getElementById("message");

    if(data.success){
      msg.style.color = "green";
      msg.innerText = "Login successful! Redirecting...";

      if(data.role === "admin"){
        setTimeout(()=>{ window.location.href = "admin-dashboard.html"; }, 1200);
      } else {
        setTimeout(()=>{ window.location.href = "index.html"; }, 1200);
      }
    } else {
      msg.style.color = "red";
      msg.innerText = data.message;
    }

  } catch(err){
    console.error(err);
    document.getElementById("message").innerText = "Server error!";
  }
});


