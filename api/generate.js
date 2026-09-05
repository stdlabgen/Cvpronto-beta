export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');

  const { section, prompt, role, jobOffer, language } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante su Vercel.");

  // Istruzioni per l'IA
  let instructions = `Sei un esperto HR e ATS. Ottimizza per il ruolo: ${role}. Lingua: ${language}. Annuncio: ${jobOffer}.`;
  if (section === 'letter') {
    instructions += " Scrivi una lettera di presentazione professionale di max 200 parole.";
  } else {
    instructions += " Ottimizza per filtri ATS, usa keyword dell'annuncio. Solo testo pulito, no grassetti.";
  }

  try {
    // URL AGGIORNATO ALLA VERSIONE STABILE (v1)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instructions + "\n\nTesto: " + (prompt || "Genera testo professionale") }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).send("Errore Google API: " + data.error.message);
    }

    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const aiText = data.candidates[0].content.parts[0].text;
      res.status(200).send(aiText);
    } else {
      res.status(500).send("Risposta IA non valida. Riprova.");
    }

  } catch (error) {
    res.status(500).send("Errore connessione: " + error.message);
  }
}
