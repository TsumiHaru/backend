import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("✅ Backend en ligne sur Infomaniak !");
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur port ${PORT}`);
});
