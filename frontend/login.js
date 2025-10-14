document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/.netlify/functions/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            localStorage.setItem("loggedIn", "true");
            window.location.href = "index.html"; // Login successful -> redirect
        } else {
            document.getElementById("errorMsg").innerText = data.message;
        }
    } catch (err) {
        document.getElementById("errorMsg").innerText = "Server error!";
    }
});
