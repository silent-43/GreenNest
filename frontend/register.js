document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value; // নতুন field

  if (!role) {
    document.getElementById("message").style.color = "red";
    document.getElementById("message").innerText = "Please select a role!";
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password, role }), // role পাঠানো হচ্ছে
    });

    const data = await response.json();

    const msg = document.getElementById("message");
    if (data.success) {
      msg.style.color = "green";
      msg.innerText = "Registration successful! Redirecting...";
      setTimeout(() => {
        window.location.href = "login.html"; // registration successful → login page
      }, 1500);
    } else {
      msg.style.color = "red";
      msg.innerText = data.message;
    }
  } catch (err) {
    console.error("Fetch error:", err);
    const msg = document.getElementById("message");
    msg.style.color = "red";
    msg.innerText = "Server error!";
  }
});
