# LT Immobiliare — sito web

Sito a pagina unica per **LT Immobiliare di Luca Tagliaferri**, Tecchiena di Alatri (FR).
Tutte le sezioni scorrono dall'alto verso il basso:

1. **Home**: animazione guidata dallo scroll, ricavata dal video (villa → ingresso → salone → scala → vista → logo)
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
js/hero.js              animazione della Home (canvas + scroll)
js/main.js              menu, ricerca, orari, modulo contatti, effetti
js/immobili.js          CATALOGO IMMOBILI (da aggiornare)
assets/hero/frames/     292 fotogrammi dell'animazione (WebP)
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
salone si assesta), poi esporta i fotogrammi in WebP. Nel browser, `js/hero.js` li disegna
seguendo lo scroll con smorzamento e dissolvenza tra fotogrammi adiacenti, così il movimento
è fluido anche con la rotella del mouse. Su desktop l'animazione è in un riquadro con luce
ambientale; su telefono è a schermo intero. Con "riduci movimento" attivo viene mostrato
direttamente il logo finale.

Per rigenerare i fotogrammi (servono `ffmpeg`, Python 3, `Pillow` e `numpy`):

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
