# Generación del crunch con alcance al frente

Herramienta: image_gen integrada; no CLI/API. Fecha: 2026-10-25.
Referencia de Inicio: base sintética de decline-bench-crunch-v343. La foto privada original no se incorpora al repositorio.

Prompt Inicio:

> Precise pose edit for START phase of forward-reach short crunch. Preserve all equipment geometry EXACTLY from reference: compact white decline abdominal bench, one uninterrupted black pad, two roller pairs, declining slope lower head higher hips, exact legs/ankle contacts. Preserve same man black shirt gray shorts, camera full body framing dark gym. Change ONLY arms to both arms straight and gently reaching FORWARD toward knees, palms face thighs, hands hover above upper thighs. Upper back remains nearly resting on low end pad as reference, neck neutral. Do not sit up, no weight, no straps, no new support or adjustment mechanism, no text.

Prompt Medio (referencia: Inicio sintético):

> Precise minimal pose edit. Middle of extremely short decline bench reach crunch. Preserve all apparatus and body EXCEPT tiny upper-back curl. Raise head and shoulder blades together ONLY 15 image pixels toward top, no more, chin gently tucked neutral. Critical: HEAD CENTER MUST STILL BE VISIBLY LOWER THAN THE TOP OF PELVIS (pixel y coordinate of head center greater than pixel y of pelvis crest). Keep head near low LEFT end, hips elevated RIGHT. Both arms straight reaching slightly farther along thighs. No situp, no whole torso raising, no leg or pelvis change. White compact bench, ONE uninterrupted black sloped pad, two roller pairs and scene exact. We need very small visible short curl, not dramatic flexion. No text.

Prompt Final (referencia: Inicio sintético):

> Precise minimal pose edit. Final of extremely short decline bench reach crunch. Preserve all apparatus and body EXCEPT tiny upper-back curl. Raise head and shoulder blades together ONLY 30 image pixels toward top, no more, chin gently tucked neutral. Critical: HEAD CENTER MUST STILL BE VISIBLY LOWER THAN THE TOP OF PELVIS (pixel y coordinate of head center greater than pixel y of pelvis crest). Keep head near low LEFT end, hips elevated RIGHT. Both arms straight reaching slightly farther along thighs toward knees. No situp, no whole torso raising, no leg or pelvis change. White compact bench, ONE uninterrupted black sloped pad, two roller pairs and scene exact. We need very small visible short curl, not dramatic flexion. No text.

QA: tres poses distintas revisadas, con diferencias pequeñas por recorrido corto. Se rechazaron finales que ascendían demasiado o que solo movían manos. Ninguna imagen certifica seguridad clínica, ángulo o ajuste del equipo. Inicio mantiene cabeza algo elevada, no representa descanso totalmente apoyado. Los píxeles del prompt son controles de generación y no indicaciones físicas para el usuario.
