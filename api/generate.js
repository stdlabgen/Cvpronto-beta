export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante.");

  // Regola rigida per forzare la lingua di output
  const isEn = language === 'en';
  const langRule = isEn 
    ? "CRITICAL MANDATE: You MUST write the output EXCLUSIVELY in ENGLISH language, regardless of the input language provided." 
    : "MANDATO CRITICO: Devi scrivere l'output ESCLUSIVAMENTE in lingua ITALIANA, indipendentemente dalla lingua dell'input.";

  let instructions = `Sei un esperto HR Senior e ATS 2026. ${langRule} Ruolo target: ${role || 'Professionista'}. Annuncio di riferimento: ${jobOffer || 'Nessuno'}.`;
  
  if (section === 'letter') {
    instructions += " Scrivi una lettera di presentazione persuasiva di max 200 parole. Fornisci solo il testo finale pulito, senza introduzioni o commenti.";
  } else if (section === 'skills') {
    instructions += " Suggerisci 6 competenze tecniche e soft pertinenti separate da virgola. Fornisci solo il testo finale.";
  } else {
    instructions += " Ottimizza per superare i filtri ATS inserendo le keyword dell'annuncio. Nessun formattato speciale o grassetto.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: instructions + "\n\nTesto utente da ottimizzare: " + (prompt || "Genera testo professionale") }] }] })
    });
    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      res.status(200).send(data.candidates[0].content.parts[0].text);
    } else {
      res.status(500).send("Risposta IA non valida.");
    }
  } catch (error) {
    res.status(500).send("Errore IA: " + error.message);
  }
}
