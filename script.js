const modal = document.getElementById("modal");
const downloadBtn = document.getElementById("downloadBtn");
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");

let turnstileToken = "";

/* OPEN MODAL */
downloadBtn.addEventListener("click", () => {
    modal.style.display = "block";
});

/* CLOSE MODAL */
cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

/* TURNSTILE CALLBACK (OFFICIAL) */
window.onTurnstileSuccess = function (token) {
    console.log("TURNSTILE OK:", token);
    turnstileToken = token;
};

/* CONFIRM FLOW */
confirmBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Enter email");
        return;
    }

    if (!turnstileToken) {
        alert("Please complete verification");
        return;
    }

    try {
        const res = await fetch("download-gate.maketavimas.workers.dev", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                turnstileToken
            })
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Blocked");
            return;
        }

        modal.style.display = "none";

        window.location.href = data.downloadUrl;

    } catch (err) {
        console.error(err);
        alert("Server error");
    }
});
