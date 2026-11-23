/* =========================================================
   CATALOGO IMMOBILI
   ---------------------------------------------------------
   Aggiungi qui gli immobili reali, uno per riga, dentro le parentesi
   quadre di `immobili`. Finché l'elenco è vuoto, la sezione Ricerca
   mostra il messaggio "catalogo in aggiornamento" con i contatti.

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
  demo: false,
  immobili: [
    // Esempio di formato (togli le // davanti alle righe per attivarlo):
    // { rif: "LT-101", titolo: "Villa indipendente con giardino", contratto: "vendita", tipologia: "villa",
    //   comune: "Tecchiena (Alatri)", prezzo: 320000, mq: 220, locali: 6, bagni: 3, classe: "B",
    //   extra: ["giardino", "box"], descrizione: "Su due livelli, con giardino privato.",
    //   foto: "assets/immobili/lt-101.webp" },
  ]
};
