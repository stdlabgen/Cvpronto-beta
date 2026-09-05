export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');

  const { section, prompt, role, jobOffer, language } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API non configurata su Vercel.");

  // Istruzioni per l'IA - Obiettivo ATS & Matching
  let instructions = `Sei un esperto HR e ATS di nuova generazione. Ottimizza per il ruolo: ${role}. Lingua: ${language}. Annuncio: ${jobOffer}.`;
  
  if (section === 'letter') {
    instructions += " Scrivi una lettera di presentazione professionale, persuasiva e moderna di max 200 parole.";
  } else {
    instructions += " Ottimizza per superare i filtri ATS più evoluti, inserendo le keyword dell'annuncio in modo naturale. Solo testo pulito, no grassetti o Markdown.";
  }

  try {
    // Puntiamo direttamente al modello 3.6 Flash
    const model = "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: instructions + "\n\nTesto utente da elaborare: " + (prompt || "Genera contenuto professionale da zero") }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).send("Errore Google API (" + model + "): " + data.error.message);
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiText = data.candidates[0].content.parts[0].text;
      res.status(200).send(aiText);
    } else {
      res.status(500).send("Il modello " + model + " non ha prodotto risultati. Verifica i permessi della chiave.");
    }

  } catch (error) {
    res.status(500).send("Errore critico sistema: " + error.message);
  }
}
