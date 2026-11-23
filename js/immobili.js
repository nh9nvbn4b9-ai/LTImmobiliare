/* =========================================================
   CATALOGO IMMOBILI
   ---------------------------------------------------------
   Gli annunci qui sotto sono ESEMPI per mostrare il funzionamento
   della ricerca. Sostituiscili con gli immobili reali e imposta
   `demo: false` per nascondere l'avviso "annunci di esempio".

   Campi di ogni immobile:
     rif          codice di riferimento (es. "LT-101")
     titolo       titolo breve
     contratto    "vendita" | "affitto"
     tipologia    "appartamento" | "villa" | "casa" | "rustico" | "commerciale" | "terreno"
     comune       es. "Tecchiena (Alatri)"
     prezzo       numero in euro (per l'affitto: canone mensile)
     mq           superficie in m²
     locali       numero di locali (0 per i terreni)
     bagni        numero di bagni
     classe       classe energetica "A4".."G" (facoltativa)
     extra        elenco tra: "giardino", "box", "terrazzo", "ascensore", "arredato", "piscina"
     descrizione  testo breve (facoltativo)
     foto         percorso di una foto, es. "assets/immobili/lt-101.webp" (facoltativa:
                  senza foto viene mostrata un'illustrazione elegante della tipologia)
   ========================================================= */
window.LT_CATALOGO = {
  demo: true,
  immobili: [
    { rif: "LT-112", titolo: "Villa indipendente con giardino", contratto: "vendita", tipologia: "villa", comune: "Tecchiena (Alatri)", prezzo: 320000, mq: 220, locali: 6, bagni: 3, classe: "B", extra: ["giardino", "box", "terrazzo"], descrizione: "Su due livelli, ampio giardino privato e box doppio." },
    { rif: "LT-111", titolo: "Appartamento luminoso con balcone", contratto: "vendita", tipologia: "appartamento", comune: "Frosinone", prezzo: 135000, mq: 95, locali: 4, bagni: 2, classe: "D", extra: ["box", "ascensore", "terrazzo"], descrizione: "Terzo piano con ascensore, doppia esposizione." },
    { rif: "LT-110", titolo: "Bilocale arredato", contratto: "affitto", tipologia: "appartamento", comune: "Alatri", prezzo: 480, mq: 55, locali: 2, bagni: 1, classe: "E", extra: ["arredato"], descrizione: "Pronto da abitare, a due passi dal centro." },
    { rif: "LT-109", titolo: "Rustico in pietra da ristrutturare", contratto: "vendita", tipologia: "rustico", comune: "Fumone", prezzo: 69000, mq: 140, locali: 5, bagni: 1, classe: "G", extra: ["giardino"], descrizione: "Immerso nel verde, con terreno di pertinenza." },
    { rif: "LT-108", titolo: "Locale commerciale su strada", contratto: "affitto", tipologia: "commerciale", comune: "Tecchiena (Alatri)", prezzo: 900, mq: 120, locali: 2, bagni: 1, classe: "C", extra: ["box"], descrizione: "Ampia vetrina sulla S.S. 155, parcheggio antistante." },
    { rif: "LT-107", titolo: "Terreno edificabile", contratto: "vendita", tipologia: "terreno", comune: "Veroli", prezzo: 58000, mq: 2500, locali: 0, bagni: 0, extra: [], descrizione: "Pianeggiante, servito da strada comunale." },
    { rif: "LT-106", titolo: "Casa indipendente su due livelli", contratto: "vendita", tipologia: "casa", comune: "Ferentino", prezzo: 189000, mq: 160, locali: 5, bagni: 2, classe: "E", extra: ["giardino", "box"], descrizione: "Con cortile, cantina e posto auto coperto." },
    { rif: "LT-105", titolo: "Attico con terrazzo panoramico", contratto: "vendita", tipologia: "appartamento", comune: "Fiuggi", prezzo: 210000, mq: 110, locali: 4, bagni: 2, classe: "C", extra: ["terrazzo", "ascensore"], descrizione: "Ultimo piano con terrazzo vivibile e vista aperta." },
    { rif: "LT-104", titolo: "Trilocale con posto auto", contratto: "affitto", tipologia: "appartamento", comune: "Frosinone", prezzo: 600, mq: 80, locali: 3, bagni: 1, classe: "D", extra: ["box", "terrazzo"], descrizione: "Zona servita, vicino a scuole e negozi." },
    { rif: "LT-103", titolo: "Villa bifamiliare con piscina", contratto: "vendita", tipologia: "villa", comune: "Boville Ernica", prezzo: 245000, mq: 200, locali: 7, bagni: 3, classe: "C", extra: ["giardino", "box", "piscina"], descrizione: "Porzione di bifamiliare con piscina e giardino." },
    { rif: "LT-102", titolo: "Casa indipendente con orto", contratto: "affitto", tipologia: "casa", comune: "Tecchiena (Alatri)", prezzo: 750, mq: 130, locali: 5, bagni: 2, classe: "F", extra: ["giardino"], descrizione: "Tranquilla, con orto e ampio spazio esterno." },
    { rif: "LT-101", titolo: "Ufficio in zona centrale", contratto: "vendita", tipologia: "commerciale", comune: "Alatri", prezzo: 98000, mq: 85, locali: 3, bagni: 1, classe: "D", extra: ["ascensore"], descrizione: "Tre vani più servizio, ideale per studio professionale." }
  ]
};
