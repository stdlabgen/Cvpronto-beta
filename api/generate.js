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

  let instructions = `Sei un esperto HR Senior e ATS 2026. ${langRule}
Candidato: ${nameToUse}.
Ruolo target: ${role || 'Professionista'}.
Annuncio di riferimento: ${jobOffer || 'Nessuno'}.

REGOLA FONDAMENTALE: Fornisci UNICAMENTE il testo finale pulito. Non inserire premesse, introduzioni, spiegazioni o marcatori markdown come ** o #.`;

  // Gestione specifica per ogni sezione
  if (section === 'letter') {
    instructions += ` Scrivi una lettera di presentazione persuasiva di MASSIMO 120 parole per rientrare in 1 sola pagina A4. Firmala con: ${nameToUse}.`;
  } else if (section === 'profile') {
    instructions += " Scrivi un sommario/profilo professionale incisivo di circa 50-70 parole, ricco di keyword dell'annuncio per superare i filtri ATS.";
  } else if (section === 'exp') {
    instructions += " Riscrivi ed espandi le esperienze lavorative in formato elenco o paragrafo professionale (max 90 parole) evidenziando risultati, KPI e keyword dell'annuncio.";
  } else if (section === 'skills') {
    instructions += " Suggerisci 6 competenze chiave pertinenti separate da virgola.";
  } else {
    instructions += " Scrivi un testo professionale di max 80 parole ottimizzato ATS.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: instructions + "\n\nTesto/Dati utente da ottimizzare: " + (prompt || "Genera contenuto professionale") }] }] })
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
