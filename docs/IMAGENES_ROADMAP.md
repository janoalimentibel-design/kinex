# Roadmap de imágenes — hacia las 81 fichas con fotos

Estado: 6 de 81 ejercicios con fotos (Batch 1: Flexiones, Dominadas estrictas,
Step-Up bajo · Batch 2: Dead Bug, Bird Dog, Wall Sit). Faltan **75 ejercicios
= 225 imágenes** (3 fases cada uno).

## Por qué por batches y no todo de una

El fallo histórico del proyecto (A2.6) fue generar imágenes en masa sin revisión:
fases repetidas o casi idénticas. La regla desde entonces es que **ningún batch se
declara terminado sin abrir la app en móvil y comprobar que Inicio/Medio/Final son
posiciones distintas y técnicamente coherentes**. Esa revisión es el cuello de
botella real — la integración ya es barata (pipeline automatizado).

Con la base A3 el costo por batch bajó mucho:
1. originales a `assets-src/exercises/<slug>/{inicio,medio,final}.png`
2. `npm run images` (WebP + thumb automáticos)
3. entrada en `src/data/images.ts`
4. `npm run check:assets` (duplicados por hash, fases faltantes)
5. test E2E de galería + captura en `verification/`
6. revisión visual y push (deploy automático)

Por eso los batches pueden crecer de 3 ejercicios (A2.7/A2.8) a **12–18**.

## Priorización (calculada sobre la lógica real de selección)

De los 75 sin foto, **36 aparecen en la selección automática** de sesiones
(formatos Base/Extendido/Largo en los tres modos) — son los que se ven a diario.
Los otros 39 solo aparecen al buscar en Biblioteca o al reemplazar manualmente.

- **Batch 3 (~18):** los ejercicios de selección automática más frecuentes:
  Isométrico de extensión, Balance a una pierna, Extensión de cuádriceps en
  máquina, Gemelos en máquina, Active Hang, Band Lat Pulldown, Band Pull-Apart
  (espalda y hombro), Flexiones con rodillas, Flexiones inclinadas, Face Pull,
  Press de hombro con banda, Curl con banda, Curl alterno con banda, Curl corto
  alta repetición, Extensión de tríceps con banda, Extensión unilateral con
  banda, Farmer Carry con mochila.
- **Batch 4 (~18):** el resto de los 36 de selección automática.
- **Batches 5–7 (~13 c/u):** los 39 de biblioteca, agrupados por grupo muscular.

Meta: **todo el catálogo con fotos al cierre del Batch 7.**

## Reglas de generación (heredadas, siguen vigentes)

- Misma persona, ropa, gimnasio, iluminación y encuadre que Batches 1–2
  (usar las imágenes existentes como referencia visual).
- Tres fases claramente distintas; sin texto, flechas, collage ni marcas de agua.
- Anatomía y técnica correctas para el ejercicio.
- Nunca base64; nunca dos fases con el mismo archivo ni casi iguales.
- Regenerar sin discutir cualquier fase que se lea ambigua en la tarjeta móvil.
