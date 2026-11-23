# LT Immobiliare — sito web

Sito a pagina unica per **LT Immobiliare di Luca Tagliaferri**, Tecchiena di Alatri (FR).
Tutte le sezioni scorrono dall'alto verso il basso:

1. **Home**: animazione che parte da sola appena si apre il sito, ricavata dal video (villa → ingresso → salone → scala → vista → logo)
2. **Ricerca immobili**: filtri per contratto, tipologia, comune, prezzo, locali, superficie e caratteristiche
3. **I nostri servizi**
4. **Chi siamo**
5. **Contatti**: Facebook, Telefono e WhatsApp in verticale, con collegamento diretto, più un modulo che apre WhatsApp o l'email
6. **Orari**, con lo stato "aperto / chiuso" calcolato sull'ora italiana
7. **Dove ci troviamo**: mappa Google cliccabile, "Apri in Google Maps" e "Indicazioni stradali"

È un sito statico (HTML, CSS, JavaScript), senza dipendenze e senza build: basta caricare la cartella su qualsiasi hosting.

## Struttura

```
index.html              pagina
css/style.css           stile
js/hero.js              animazione della Home (riproduzione automatica)
js/main.js              menu, ricerca, orari, modulo contatti, effetti
js/immobili.js          CATALOGO IMMOBILI (da aggiornare)
assets/hero/hero.mp4    animazione della Home, 60 fps
assets/hero/frames/     292 fotogrammi WebP (riserva se il browser blocca l'autoplay)
assets/img/             foto dell'agenzia
assets/logo.svg         logo vettoriale
tools/build_hero_frames.py   rigenera i fotogrammi dal video
```

## Aggiornare gli immobili

Gli annunci in `js/immobili.js` sono **esempi**. Sostituiscili con quelli reali seguendo i campi
descritti in testa al file e imposta `demo: false` per togliere l'avviso "annunci di esempio".
Per mettere una foto, salvala per esempio in `assets/immobili/lt-101.webp` e indica il percorso nel campo `foto`.
I comuni del filtro vengono generati in automatico dagli annunci.

## Animazione della Home

Il video originale aveva un taglio netto tra la porta d'ingresso e il salone. Lo script
`tools/build_hero_frames.py` lo sostituisce con una transizione continua (la camera avanza
oltre la porta con zoom e sfocatura radiale, un bagliore caldo accompagna il passaggio e il
salone si assesta). Poi crea `assets/hero/hero.mp4`: i fotogrammi vengono interpolati
(interpolazione di movimento) da 24 a 60 fps e rallentati a 0,8×, per un movimento morbido e
cinematografico (circa 15 secondi).

Appena si apre il sito, `js/hero.js` avvia l'animazione da sola, senza bisogno di scorrere.
I testi, la barra di avanzamento e i capitoli (su desktop) seguono il video; alla fine resta
il logo con i pulsanti "Cerca immobili" e "Contattaci". Ci sono i comandi Pausa, Salta e
Rivedi, e l'animazione si mette in pausa da sola quando non è visibile.
Se il browser blocca i video automatici (per esempio iPhone in "Risparmio energetico"),
la stessa animazione viene riprodotta in automatico dai fotogrammi WebP su `<canvas>`.
Con "riduci movimento" attivo viene mostrato il logo finale con il pulsante "Guarda l'animazione".
Su desktop l'animazione è in un riquadro con luce ambientale; su telefono è a schermo intero.

Per rigenerare video e fotogrammi (servono `ffmpeg`, Python 3, `Pillow` e `numpy`; l'interpolazione richiede qualche minuto):

```
python3 tools/build_hero_frames.py percorso/del/video.mov
```

## Provarlo in locale

```
python3 -m http.server 8000
```

poi apri http://localhost:8000

## Pubblicazione su GitHub Pages

Impostazioni del repository → **Pages** → *Deploy from a branch* → scegli il ramo e la cartella `/ (root)`.
