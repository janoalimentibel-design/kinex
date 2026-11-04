# Kickback con banda · v3.52

Fecha: 2026-11-04. Herramienta: built-in image_gen (sin CLI/API fallback).

## Referencia y alcance

Referencia de montaje: [Bodylastics · Single Arm Tricep Kickback](https://bodylastics.com/exercises/resistance-bands/triceps/single-arm-tricep-kickback).

Se reemplaza la orientación incorrecta de las fotos anteriores: el modelo mira hacia el anclaje delantero, a la derecha de la imagen. La mano se desplaza hacia atrás/izquierda y se aleja del anclaje fijo. Las fases ilustran el recorrido, no cuantifican fuerza ni tolerancia individual.

La única referencia visual inicial es una imagen genérica ya generada para la app en public/assets/exercises/kickback-band/inicio.webp. No se utilizaron fotografías del usuario ni otros datos personales. Medio y Final se derivan de los nuevos originales de esta carpeta para mantener el mismo modelo, entorno y anclaje.

## Archivos

- inicio.png: codo flexionado; mano debajo del torso; anclaje delantero visible.
- medio.png: extensión parcial hacia atrás; mano a la izquierda del codo.
- final.png: brazo casi extendido hacia atrás; mano más alejada del anclaje.

Originales generados inicialmente en $CODEX_HOME/generated_images/01a1a62f-3f94-7280-8a27-7a61582a184d/ y copiados aquí. Optimización: npm run images -- kickback-band-v352.

## Prompt Inicio

Use case: scientific-educational.
Asset type: one photorealistic exercise instruction photograph, INICIO / start phase of a unilateral resistance-band triceps kickback, for a mobile workout app.
Reference image: use the supplied app-generated man ONLY for his appearance, plain black shirt, dark grey shorts, black shoes, dark rubber gym floor and realistic lighting. Disregard its wrong body orientation and band anchor entirely.
Generate a new correct setup. A fixed black gym upright is at the RIGHT side of frame, IN FRONT of the exercising man. A thin green elastic resistance band is securely attached via a clearly visible black anchor loop to the FRONT-FACING upright at the man's standing waist height. Show the anchor loop and the entire green band clearly. This is an ELASTIC BAND, not a pulley cable. The upright and anchor stay at the right; do not put any station behind him.
The man is shown in a clear SIDE / slight three-quarter view, full body, camera at torso height. His head, chest and gaze face RIGHT TOWARD THE ANCHOR. His hips and buttocks are to the LEFT of his head. He hinges forward at the hips toward the right, knees softly bent, back neutral. The free far-side hand rests on the far knee. The camera-side working upper arm is lifted behind the torso and held approximately HORIZONTAL, upper arm parallel to the floor with elbow fixed next to his ribs. At this START phase the elbow is bent 90 degrees and the forearm points DOWN, working hand below his chest near his waist, gripping a single black band handle. The band runs visibly forward/right from this hand to the waist-height anchor in front of him and is already taut. Keep the band in clear view in the camera-side plane, not hidden by clothing. The hand and elbow must have clearly different horizontal/vertical placement so the bent elbow is obvious. This start position leaves a large clear open area to the LEFT behind his body for the hand to extend backward in later phases.
Composition: vertical photo 3:4 to 4:5, man left/center, upright right, include full head, shoes, working arm, band, anchor and space behind hand. One adult male, short dark hair, trimmed beard, athletic build, no logos. Same polished realistic dark gym aesthetics as reference, natural anatomy, clear arm contours.
No text, no arrows, no collage, no watermark, no extra limbs, no slack band, no band around feet, no cable pulley resistance, no anchor behind him. Essential: his face points RIGHT, anchor is RIGHT ahead of him, elbow bent90, upper arm horizontal.

## Prompt Medio

Use case: precise-object-edit.
Asset type: one photorealistic exercise photograph, MEDIO / mid phase of the SAME unilateral resistance-band triceps kickback sequence.
Edit the supplied correct START photo. Preserve absolutely the same man, identity, short dark hair, black shirt, grey shorts, black shoes, stance, torso inclination, head facing RIGHT, free hand resting on knee, gym, lighting, camera, crop, black upright on the RIGHT, and the exact black band anchor loop at waist height in front of him.
Change ONLY the CAMERA-SIDE WORKING FOREARM AND HAND, the grip/handle and the elastic band length necessary for the new pose. Keep the working SHOULDER and ELBOW at exactly their original locations; keep the upper arm high and approximately horizontal, parallel to the floor.
Rotate the forearm BACKWARD TO THE LEFT halfway through elbow extension: make a clearly visible elbow angle of about135 degrees, not the original90 and not fully straight. The working hand must now be visibly to the LEFT of the elbow and slightly BELOW it, behind his torso/hip, significantly farther LEFT from the fixed anchor. The hand should be around one forearm-length LEFT of its starting position, while the elbow stays still. No additional shoulder movement or elbow lifting/lowering.
A single continuous taut GREEN ELASTIC BAND runs from the black handle in this hand all the way forward/right to the SAME black waist-height anchor on the RIGHT upright. The band is now visibly LONGER than in the start photo, because the hand is moving left AWAY from the anchor. Show the entire band and anchor plainly; no slack, no cable pulley, no extra strands, no hidden break. Keep clear background behind the moving hand so the phase can be distinguished at phone size.
Keep natural anatomy with exactly one working hand gripping the handle and the other hand still on the knee. No labels/text/arrows/logos/watermark/collage. Preserve the frame and head-to-shoes composition. Essential: man faces anchor on RIGHT, fixed elbow, forearm midway extended BACKWARD LEFT, green band stretches farther from fixed right anchor.

## Prompt Final

Use case: precise-object-edit.
Asset type: one photorealistic exercise photograph, FINAL / fully extended phase of the SAME single-arm elastic-band triceps kickback.
Image1 is the correct START frame and Image2 is the approved MIDDLE frame. Preserve the same generated man and ALL scene/camera details: black shirt, grey shorts, black shoes, face looking RIGHT toward the anchor, torso bent forward right, knees softly bent, far/free hand on the knee, the exact black upright at the RIGHT edge and its fixed black loop/green-band anchor at waist height. Keep identical camera, crop, lighting, background and body position.
Change ONLY the camera-side working FOREARM, HAND/HANDLE, and green elastic band segment to complete the last part of elbow extension. Keep the working shoulder, HIGH ELBOW, and upper arm at the SAME place as in the start frame. The upper arm stays approximately HORIZONTAL parallel to floor.
The working elbow must now be ALMOST FULLY STRAIGHT, about170–175 degrees without hyperextension. Compared with Image2, lift the working hand visibly UP AND FARTHER BACK TO THE LEFT so the shoulder-upperarm-elbow-forearm form an almost straight horizontal line pointing LEFT behind the torso. This must be unmistakably straighter than the bent elbow in Image2. The hand is LEFT of his hip and LEFT of his elbow, away from the anchor; keep the entire hand, five fingers and black handle visible INSIDE the frame with a little margin at the left edge, do not crop the hand.
The SINGLE taut GREEN ELASTIC BAND must connect continuously from this LEFTMOST hand/handle across the foreground to the EXACT SAME visible waist-height black loop on the RIGHT upright. This is the longest band length of the sequence. Show the complete band and both attachments; no cable pulley, no loose strands, no band around the feet, no wrapping around his body. The elastic band is in the camera-side plane, visible in front of the hip rather than vanishing into the clothes.
Preserve full head-to-shoes framing. One man only. Realistic anatomy. No text, no arrows, no logos, no watermark, no collage.
Essential final geometry: face RIGHT toward upright, anchor fixed in FRONT on RIGHT, elbow unmoved, arm almost STRAIGHT BACKWARD LEFT, hand FARTHER from front anchor than Image1 and Image2.
