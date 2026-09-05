export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language, userName } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante.");

  const isEn = language === 'en';
  const langRule = isEn 
    ? "CRITICAL MANDATE: Write EXCLUSIVELY in ENGLISH." 
    : "MANDATO CRITICO: Scrivi ESCLUSIVAMENTE in ITALIANO.";

  const nameToUse = userName && userName !== 'Nome Cognome' ? userName : 'Mario Rossi';

  let instructions = `Sei un esperto HR Senior e consulente ATS 2026. ${langRule}
Candidato: ${nameToUse}.
Ruolo target: ${role || 'Professionista'}.
Annuncio di lavoro: ${jobOffer || 'Nessuno'}.

REGOLA FONDAMENTALE: Restituisci ESCLUSIVAMENTE il testo finale pulito. Non aggiungere mai premesse, frasi introduttive (es. "Ecco il profilo:"), note o formattazione Markdown con asterischi (**).`;

  if (section === 'letter') {
    instructions += ` Scrivi una lettera di presentazione persuasiva di MASSIMO 120 parole per rientrare in 1 sola pagina A4. Firmala con: ${nameToUse}.`;
  } else if (section === 'profile') {
    instructions += " Scrivi un sommario/profilo professionale incisivo di circa 50-60 parole, integrando le keyword chiave dell'annuncio per superare i filtri ATS.";
  } else if (section === 'exp') {
    instructions += " Riscrivi ed espandi l'esperienza lavorativa fornita dall'utente in un paragrafo o elenco sintetico (max 80 parole) evidenziando KPI, strumenti e keyword dell'annuncio.";
  } else if (section === 'skills') {
    instructions += " Suggerisci 6 competenze chiave pertinenti separate da virgola.";
  } else {
    instructions += " Scrivi un testo professionale di max 80 parole ottimizzato ATS.";
  }

  try {
    // Utilizziamo il modello ufficiale e stabile gemini-1.5-flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        contents: [{ 
          parts: [{ text: instructions + "\n\nTesto utente da elaborare: " + (prompt || "Genera contenuto per candidatura") }] 
        }] 
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let cleanText = data.candidates[0].content.parts[0].text
        .replace(/\*\*/g, '')
        .replace(/^[#-]\s*/gm, '')
        .replace(/\[Nome Cognome\]/gi, nameToUse)
        .replace(/\[Tuo Nome\]/gi, nameToUse)
        .replace(/\[\s*\]/g, '')
        .trim();
      
      res.status(200).send(cleanText);
    } else {
      res.status(500).send("Risposta IA vuota o non valida.");
    }
  } catch (error) {
    res.status(500).send("Errore server IA: " + error.message);
  }
}
