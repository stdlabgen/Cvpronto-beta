export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Metodo non consentito');
  const { section, prompt, role, jobOffer, language } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).send("Errore: Chiave API mancante.");

  // ISTRUZIONI RIGIDE PER EVITARE TESTO IN PIU
  let instructions = `Sei un HR Senior. Lingua: ${language === 'en' ? 'Inglese' : 'Italiano'}. Ruolo: ${role}. Annuncio: ${jobOffer}.`;
  
  if (section === 'profile') {
    instructions += " Scrivi solo un paragrafo di testo per il PROFILO professionale. Non includere nomi, contatti o intestazioni.";
  } else if (section === 'exp') {
    instructions += " Scrivi ESCLUSIVAMENTE punti elenco professionali per l'ESPERIENZA lavorativa. NON includere il nome del candidato, NON includere intestazioni come 'Esperienza Professionale' o 'Istruzione'. Solo le mansioni.";
  } else if (section === 'letter') {
    instructions += " Scrivi una lettera di presentazione di max 200 parole. Solo il corpo del testo.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: instructions + "\n\nTesto utente da elaborare: " + prompt }] }] })
    });
    const data = await response.json();
    let result = data.candidates[0].content.parts[0].text;
    
    // Pulizia finale per sicurezza
    result = result.replace(/Nome Cognome/gi, '').replace(/Profilo Professionale/gi, '').trim();
    
    res.status(200).send(result);
  } catch (error) {
    res.status(500).send("Errore IA: " + error.message);
  }
}
