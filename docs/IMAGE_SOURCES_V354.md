# Fuentes de imágenes v3.54

Generadas con la herramienta integrada ImageGen (no API ni CLI). Los prompts finales se conservan junto a cada fuente como `assets-src/exercises/<slug>-v354/prompt.txt`. Para `seated-calf-raise-db-v354`, `prompt-final.txt` describe la fuente seleccionada y tiene precedencia sobre el prompt inicial descartado.

Slugs: `concentration-curl`, `cable-overhead-triceps`, `decline-barbell-press`, `neutral-lat-pulldown`, `front-raise-db`, `seated-calf-raise-db`, `kneeling-cable-crunch`.

`sequence.png` es la fuente horizontal de tres momentos. La galería utiliza únicamente los recortes independientes `inicio.png`, `medio.png` y `final.png`, sin texto ni separadores. Se dividió la anchura en tercios, redondeando los bordes, y se retiraron dos píxeles del perímetro de cada panel para eliminar separadores. Las fuentes originales se conservan fuera del bundle público.

Regeneración WebP: `node scripts/optimize-images.mjs concentration-curl-v354 cable-overhead-triceps-v354 decline-barbell-press-v354 neutral-lat-pulldown-v354 front-raise-db-v354 seated-calf-raise-db-v354 kneeling-cable-crunch-v354`.

La revisión visual comprueba correspondencia con las fichas, fases distintas, apoyos, equipo y continuidad de cables. No constituye una validación clínica individual.
