export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language, userName } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante.");

  const isEn = language === 'en';
  const langRule = isEn 
    ? "CRITICAL MANDATE: Write EXCLUSIVELY in ENGLISH." 
    : "MANDATO CRITICO: Scrivi ESCLUSIVAMENTE in ITALIANO.";

  let instructions = `Sei un esperto HR Senior e ATS 2026. ${langRule}
Candidato: ${userName || 'Mario Rossi'}.
Ruolo target: ${role || 'Professionista'}.
Annuncio di riferimento: ${jobOffer || 'Nessuno'}.

REGOLA FONDAMENTALE: Fornisci UNICAMENTE il testo finale da inserire. Non inserire mai premesse, introduzioni (es. "Ecco il testo:"), spiegazioni, elenchi di opzioni multiple o marcatori markdown (es. **).`;

  if (section === 'letter') {
    instructions += ` Scrivi una lettera di presentazione persuasiva di massimo 200 parole. Firmala con il nome del candidato: ${userName || 'Mario Rossi'}. Non inserire mai [Nome Cognome] tra parentesi.`;
  } else if (section === 'skills') {
    instructions += " Suggerisci 6 competenze chiave pertinenti separate da virgola.";
  } else {
    instructions += " Scrivi un singolo paragrafo professionale ottimizzato per filtri ATS che integri le keyword dell'annuncio.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: instructions + "\n\nTesto utente da ottimizzare: " + (prompt || "Genera contenuto professionale") }] }] })
    });
    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let cleanText = data.candidates[0].content.parts[0].text
        .replace(/\*\*/g, '')
        .replace(/^[#-]\s*/gm, '')
        .replace(/\[Nome Cognome\]/gi, userName || '')
        .replace(/\[Tuo Nome\]/gi, userName || '')
        .trim();
      res.status(200).send(cleanText);
    } else {
      res.status(500).send("Risposta IA non valida.");
    }
  } catch (error) {
    res.status(500).send("Errore IA: " + error.message);
  }
}
