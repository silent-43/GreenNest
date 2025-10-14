document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("http://127.0.0.1:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (data.success) {
      document.getElementById("message").style.color = "green";
      document.getElementById("message").innerText =
        "Registration successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    } else {
      document.getElementById("message").style.color = "red";
      document.getElementById("message").innerText = data.message;
    }
  } catch (err) {
    console.error("Fetch error:", err);
    document.getElementById("message").style.color = "red";
    document.getElementById("message").innerText = "Server error!";
  }
});
