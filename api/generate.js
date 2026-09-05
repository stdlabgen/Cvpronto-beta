export default async function handler(req, res) {
  // Accetta solo richieste POST
  if (req.method !== 'POST') {
    return res.status(405).send('Metodo non consentito');
  }

  const { section, prompt, role, jobOffer, language } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  // Istruzioni per l'IA: Missione Superare ATS
  let instructions = `Sei un esperto HR e specialista ATS. Ottimizza per il ruolo: ${role}. Lingua: ${language}. Annuncio: ${jobOffer}.`;
  
  if (section === 'cover_letter') {
    instructions += " Scrivi una lettera di presentazione professionale e convincente di max 200 parole.";
  } else {
    instructions += " Ottimizza il testo per superare i filtri ATS, usando le keyword dell'annuncio. Non usare grassetti o introduzioni, solo il testo pulito.";
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: instructions + "\n\nTesto da elaborare: " + prompt }] }]
      })
    });

    const data = await response.json();
    const aiText = data.candidates[0].content.parts[0].text;
    res.status(200).send(aiText);
  } catch (error) {
    res.status(500).send("Errore IA: " + error.message);
  }
}
