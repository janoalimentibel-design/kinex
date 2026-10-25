# Generación de las imágenes del banco declinado

Herramienta: image_gen integrada (no CLI/API). Fecha: 2026-10-25.
Referencia: foto de equipo suministrada privadamente por el usuario; no se incorpora la foto original al repositorio.

Prompt de base final (edición de un primer resultado sintético con la referencia del equipo):

> Precise-object-edit exercise instructional photo. Image 1 is edit target; image 2 is equipment reference. Keep man black shirt grey shorts, supine START position arms crossed, setting, camera, lighting, declining slope and body orientation from image 1. Correct ONLY apparatus and lower legs to match reference compact Boomerang bench: ONE continuous rigid padded BLACK rectangular board, no seam/hinge/folding articulated piece anywhere. Its low head end close to floor and upper pelvis end by tall WHITE post. Exactly TWO pairs rollers on SAME white post at distinct heights as reference. Upper rollers support the BACKS of bent knees; shins descend downward along post and lower rollers support FRONT of ankles with feet underneath/behind lower rollers. Keep knees flexed and both pairs actually gently engaging appropriate leg position, NOT calves resting atop upper roller with feet floating forward. Reference image 2 is geometry guide, not copied background. No extra parts. Body head lower than hips. START relaxed shoulders down on one-piece declining pad, no situp. Photorealistic no text.

Prompt Medio (referencia: Inicio sintético):

> Precise minimal pose edit of this image, not a new photo. Keep apparatus, torso position, hips and legs EXACT. Only lift the shoulder blades VERY SLIGHTLY, around 15 image pixels toward top, and tuck chin gently to neutral. This is an extremely short crunch middle phase. Critical visual requirement: HEAD CENTER MUST REMAIN BELOW the horizontal line through TOP OF PELVIS in this image. Do not raise whole head/shoulders 100 pixels. Head remains near low pad at LEFT, hips remain higher at RIGHT. Shoulder blades barely peel off declining pad. Arms crossed chest as is. Keep white post two roller pairs one black continuous pad, all scene identical. No sit-up and no big visible torso rise.

Prompt Final (referencia: Inicio sintético):

> Precise minimal pose edit. Final of extremely short decline bench crunch. Preserve all apparatus and body EXCEPT tiny upper-back curl. Raise head and shoulder blades together ONLY 30 image pixels toward top, no more, chin gently tucked neutral. Critical: HEAD CENTER MUST STILL BE VISIBLY LOWER THAN THE TOP OF PELVIS (pixel y coordinate of head center greater than pixel y of pelvis crest). Keep head near low LEFT end, hips elevated RIGHT. No situp, no whole torso raising, no leg or pelvis change. Arms crossed. White compact bench, ONE uninterrupted black sloped pad, two roller pairs and scene exact. We need a very small visible short curl, not dramatic flexion. No text.

QA visual: tres poses distintas, declive cabeza abajo, sin sit-up. Se rechazaron resultados con acolchado articulado inventado, apoyo de piernas discordante o elevación demasiado grande. Las imágenes seleccionadas son representaciones sintéticas del tipo de aparato, no mediciones del ángulo ni réplicas exactas. Inicio conserva la cabeza algo elevada; no debe presentarse como descanso completamente apoyado. Las distancias/píxeles del prompt son instrucciones de generación, no distancias medidas ni recomendaciones clínicas. Medio y Final difieren poco por el recorrido corto; revisar ampliadas, no solo por hash.

La variante isométrica puede mostrar solo Final de este conjunto como Sostén; no hay tres fases diferentes de un sostén.
