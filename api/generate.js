export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language, userName } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante nelle variabili d'ambiente.");

  const isEn = language === 'en';
  const langRule = isEn ? "Write in ENGLISH." : "Scrivi in ITALIANO.";
  const nameToUse = userName && userName !== 'Nome Cognome' ? userName : 'Mario Rossi';

  // Costruzione dei prompt specifici e snelli
  let systemPrompt = "";

  if (section === 'letter') {
    systemPrompt = `Sei un HR Senior. ${langRule} Scrivi una lettera di presentazione breve e persuasiva (max 120 parole) per la posizione di ${role || 'candidato'} in base all'annuncio: ${jobOffer || 'generico'}. Firmala con: ${nameToUse}. Non aggiungere titoli, premesse o note.`;
  } else if (section === 'profile') {
    systemPrompt = `Sei un esperto ATS. ${langRule} Scrivi un profilo professionale d'impatto (max 60 parole) per un ${role || 'professionista'}, usando le keyword dell'annuncio: ${jobOffer || ''}. Basati su questi dati: ${prompt}. Rispondi solo col testo finale.`;
  } else if (section === 'exp') {
    systemPrompt = `Sei un consulente di carriera. ${langRule} Riscrivi e migliora le seguenti esperienze lavorative (max 80 parole) rendendole orientate ai risultati e ottimizzate ATS per il ruolo di ${role || 'professionista'}: ${prompt}. Rispondi solo con il testo rielaborato.`;
  } else if (section === 'skills') {
    systemPrompt = `Sei un recruiter. ${langRule} Elenca 6 competenze chiave per il ruolo ${role || 'professionista'} separate da virgola.`;
  } else {
    systemPrompt = `Sei un copywriter HR. ${langRule} Riscrivi questo testo in modo professionale (max 80 parole): ${prompt}`;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      })
    });

    const data = await response.json();

    // Se l'API restituisce un errore di Google (es. modello non trovato o quota superata)
    if (data.error) {
      return res.status(500).send("Errore Google API: " + data.error.message);
    }

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let cleanText = data.candidates[0].content.parts[0].text
        .replace(/\*\*/g, '')
        .replace(/^[#-]\s*/gm, '')
        .replace(/\[Nome Cognome\]/gi, nameToUse)
        .replace(/\[Tuo Nome\]/gi, nameToUse)
        .trim();
      
      return res.status(200).send(cleanText);
    } else {
      return res.status(500).send("Risposta vuota da Gemini. Riprova tra poco.");
    }
  } catch (error) {
    return res.status(500).send("Errore di connessione: " + error.message);
  }
}
