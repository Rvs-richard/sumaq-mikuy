const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 SERVIR ARCHIVOS (IMPORTANTE)
app.use(express.static(__dirname));

// 🔍 Verificación al iniciar
console.log("🔑 API KEY cargada:", process.env.GROQ_API_KEY ? "OK" : "NO DETECTADA");

// 🔥 RUTA PRINCIPAL (ARREGLA EL ERROR)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 🔥 TU CHAT (NO SE TOCA)
app.post("/chat", async (req, res) => {
  try {
    const { mensaje } = req.body;

    if (!mensaje) {
      return res.status(400).json({ error: "Mensaje vacío" });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "API KEY no configurada en el servidor" });
    }

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Eres un nutricionista experto en Perú. Responde claro y útil."
          },
          {
            role: "user",
            content: mensaje
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (!response.data || !response.data.choices) {
      return res.status(500).json({ error: "Respuesta inválida de la IA" });
    }

    res.json({
      respuesta: response.data.choices[0].message.content
    });

  } catch (error) {
    console.error("❌ ERROR COMPLETO:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      return res.status(401).json({
        error: "API KEY inválida o expirada"
      });
    }

    res.status(500).json({
      error: "Error en la IA"
    });
  }
});

// 🔥 ESCUCHAR EN TODAS LAS REDES (IMPORTANTE PARA CELULAR)
app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Servidor listo en red:");
  console.log("👉 http://172.22.160.1:3000");
});