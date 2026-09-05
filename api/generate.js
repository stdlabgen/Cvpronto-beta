export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language, userName } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante.");

  const isEn = language === 'en';
  const langRule = isEn ? "Scrivi in INGLESE." : "Scrivi in ITALIANO.";
  const nameToUse = userName && userName !== 'Nome Cognome' ? userName : 'Mario Rossi';

  let systemPrompt = "";

  if (section === 'letter') {
    systemPrompt = `Sei un HR Senior. ${langRule} Scrivi una lettera di presentazione (MAX 120 parole) per la posizione di ${role || 'candidato'} basandoti sull'annuncio: ${jobOffer || 'generico'}. Firmala con: ${nameToUse}. Non aggiungere premesse o note.`;
  } else if (section === 'profile') {
    systemPrompt = `Sei un consulente ATS. ${langRule} Scrivi un profilo professionale (MAX 60 parole) per un ${role || 'professionista'} usando le keyword dell'annuncio: ${jobOffer || ''}. Dati utente: ${prompt}. Rispondi solo con il testo.`;
  } else if (section === 'exp') {
    systemPrompt = `Sei un esperto di carriere. ${langRule} Riscrivi queste esperienze (MAX 80 parole) in ottica ATS per il ruolo di ${role || 'professionista'}: ${prompt}. Rispondi solo con il testo.`;
  } else if (section === 'skills') {
    systemPrompt = `Sei un recruiter. ${langRule} Elenca 6 competenze chiave per ${role || 'professionista'} separate da virgola.`;
  } else {
    systemPrompt = `Sei un copywriter. ${langRule} Riscrivi questo testo in modo professionale (MAX 80 parole): ${prompt}`;
  }

  const callGemini = async (modelName) => {
    return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
    });
  };

  try {
    let response = await callGemini('gemini-3.6-flash');
    let data = await response.json();

    if (data.error && (data.error.code === 429 || data.error.message.includes('quota'))) {
      response = await callGemini('gemini-3.5-flash');
      data = await response.json();
    }

    if (data.error) {
      return res.status(500).send("Errore Google API: " + data.error.message);
    }

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      let cleanText = data.candidates[0].content.parts[0].text
        .replace(/\*\*/g, '')
        .replace(/\$/g, '')
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
