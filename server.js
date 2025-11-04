// === 🚀 FLOUNDERX BACKEND SERVER ===
// Professional. Powerful. Ready for action.

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(express.json());
app.use(cors());

console.log("🐟 Booting up FloundeRx backend...");

// === 🧠 API: Giveaway Confirmation ===
app.post("/api/giveaway", async (req, res) => {
  try {
    const { email, username, amount, baseCoins, bonusCoins, totalCoins, estimatedValue } = req.body;

    if (!email || !username) {
      return res.status(400).json({ error: "Missing email or username." });
    }

    // ✅ Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 📨 Build the giveaway confirmation email
    const mailOptions = {
      from: `"FloundeRx" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🎉 FloundeRx Giveaway Entry Confirmed!",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #111; color: #fff; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: #1a1a1a; border-radius: 12px; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.4);">
              <h1 style="text-align: center; color: #4FC3F7;">🐟 Welcome to FloundeRx, ${username}!</h1>
              <p style="text-align: center; font-size: 1.1em;">You're officially entered into our <strong>Massive Giveaway Event</strong>!<br>
              <em>50% of the company. 50% of the coins. 5 Lucky Winners.</em></p>

              <hr style="border: 1px solid #333; margin: 20px 0;">

              <div style="padding: 10px 0; font-size: 1em; line-height: 1.6;">
                <p><strong>Entry Details:</strong></p>
                <ul>
                  <li>💰 Purchase Amount: <strong>${amount || "N/A"}</strong></li>
                  <li>🪙 Base Coins: <strong>${baseCoins || 0}</strong></li>
                  <li>🎁 Bonus Coins: <strong>${bonusCoins || 0}</strong></li>
                  <li>⚡ Total Coins: <strong>${totalCoins || 0}</strong></li>
                  <li>💎 Estimated Value: <strong>${estimatedValue || "N/A"}</strong></li>
                </ul>

                <p style="margin-top: 10px;">You're officially part of the revolution — no ads, no paywalls, just pure play.  
                At any given moment, someone could be chosen to win BIG. Keep playing. Keep floundering. 🐠</p>
              </div>

              <hr style="border: 1px solid #333; margin: 20px 0;">

              <p style="text-align: center; color: #aaa;">This email confirms your FloundeRx entry.<br>
              Visit <a href="https://flounderx.io" style="color: #4FC3F7; text-decoration: none;">FloundeRx.io</a> to track updates and announcements.</p>

              <p style="text-align: center; margin-top: 15px;">Stay tuned — greatness comes when you least expect it.</p>

              <div style="text-align: center; margin-top: 25px;">
                <p style="color: #4FC3F7; font-weight: bold;">💫 The FloundeRx Team</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };

    // 🚀 Send the email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email successfully sent to ${email}`);

    res.status(200).json({ message: "Email sent successfully!" });
  } catch (err) {
    console.error("❌ Email sending error:", err);
    res.status(500).json({ error: "Internal Server Error. Email not sent." });
  }
});

// === 🧩 Base Route ===
app.get("/", (req, res) => {
  res.send("🐟 FloundeRx Backend is Live & Operational.");
});

// === 🔥 Start Server ===
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`
==========================================
🔥  FLOUNDERX BACKEND ONLINE
🌐  Listening on port: ${PORT}
🎁  Giveaway API: /api/giveaway
🐠  Keep playing, keep floundering.
==========================================
  `);
});
