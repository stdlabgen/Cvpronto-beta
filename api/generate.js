export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante.");

  let instructions = `Sei un esperto HR Senior e ATS 2026. Ottimizza per il ruolo: ${role}. Lingua: ${language === 'en' ? 'Inglese' : 'Italiano'}. Annuncio: ${jobOffer}.`;
  
  if (section === 'letter') {
    instructions += " Scrivi una lettera di presentazione persuasiva di max 200 parole. Solo testo pulito.";
  } else if (section === 'skills') {
    instructions += " Suggerisci 6 competenze tecniche e soft per questo ruolo separate da virgola.";
  } else {
    instructions += " Ottimizza per superare i filtri ATS, usa parole chiave dell'annuncio. No grassetti.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: instructions + "\n\nTesto: " + (prompt || "Genera") }] }] })
    });
    const data = await response.json();
    res.status(200).send(data.candidates[0].content.parts[0].text);
  } catch (error) {
    res.status(500).send("Errore IA: " + error.message);
  }
}
