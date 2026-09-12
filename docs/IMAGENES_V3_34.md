# Imágenes v3.34 — cierre de cobertura del catálogo

Generación y correcciones con la herramienta integrada imagegen, no CLI. Fotografías de referencia generadas. Cobertura: **138 de 138 fichas con imágenes, 0 fichas pendientes de imagen**. Esto no significa que todas las imágenes históricas se hayan vuelto a auditar ni que todas las solicitudes funcionales estén resueltas.

## Archivos del lote

Verificación final local: 49/49 pruebas unitarias, 97/97 pruebas de navegador,
TypeScript/build correctos, 552 WebP referenciados existentes sin archivos
idénticos por hash. Se abrieron las diez capturas móviles y se repitió la
revisión de Serrato después de cambiar la toma y el ancho de comparación.
La compilación conserva la advertencia de bundle mayor a 500 kB; no impide
el build. No se certifica técnica por un profesional sanitario/deportivo.

- **Tibialis Raise** (`tibialis`): originales `assets-src/exercises/tibialis-v3/{inicio,medio,final}.png`; WebP `public/assets/exercises/tibialis-v3/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/tibialis-v3.png`.
- **Polea alta tras nuca / a la espalda** (`lat_pulldown_back`): originales `assets-src/exercises/lat-pulldown-back/{inicio,medio,final}.png`; WebP `public/assets/exercises/lat-pulldown-back/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/lat-pulldown-back.png`.
- **Serratus Push-Up** (`serratus`): originales `assets-src/exercises/serratus-pushup/{inicio,medio,final}.png`; WebP `public/assets/exercises/serratus-pushup/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/serratus-pushup.png`.
- **Chin-Up asistida** (`chin_assist`): originales `assets-src/exercises/chinup-assisted/{inicio,medio,final}.png`; WebP `public/assets/exercises/chinup-assisted/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/chinup-assisted.png`.
- **Chin-Up isométrica** (`chin_iso`): originales `assets-src/exercises/chinup-isometric/{inicio,medio,final}.png`; WebP `public/assets/exercises/chinup-isometric/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/chinup-isometric.png`.
- **Flexión diamante regresada** (`diamond_tri`): originales `assets-src/exercises/diamond-triceps/{inicio,medio,final}.png`; WebP `public/assets/exercises/diamond-triceps/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/diamond-triceps.png`.
- **Isométrico de extensión** (`tri_iso`): originales `assets-src/exercises/triceps-isometric/{inicio,medio,final}.png`; WebP `public/assets/exercises/triceps-isometric/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/triceps-isometric.png`.
- **Fondos asistidos** (`dips_assist`): originales `assets-src/exercises/dips-assisted/{inicio,medio,final}.png`; WebP `public/assets/exercises/dips-assisted/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/dips-assisted.png`.
- **Rotaciones explosivas** (`rot_expl`): originales `assets-src/exercises/rotations-explosive/{inicio,medio,final}.png`; WebP `public/assets/exercises/rotations-explosive/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/rotations-explosive.png`.
- **Sentadilla Sissy** (`sissy_squat`): originales `assets-src/exercises/sissy-squat/{inicio,medio,final}.png`; WebP `public/assets/exercises/sissy-squat/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/sissy-squat.png`.

## Revisión y decisiones

- Tibiales: se rechazó la primera fase intermedia por parecerse al final; se regeneró con una elevación menor de las puntas, manteniendo talones apoyados.
- Serratus Push-Up: se regeneró desde una vista posterior sin camiseta para ver las escápulas. Se muestran solo Inicio y Final, en dos columnas más grandes; no se presenta el intermedio redundante. La misma selección se aplica en Hoy y Biblioteca. La galería explica el movimiento corto con codos estirados.
- Chin-Up asistida: se regeneró el encuadre para que la cabeza no quede recortada al terminar. Banda bajo pies y fijada a barra, tres alturas distintas del cuerpo.
- Chin-Up isométrica y extensión isométrica: una postura visible, no tres supuestas fases. Vistas adicionales archivadas por compatibilidad con el pipeline.
- Flexión diamante: variante regresada con rodillas apoyadas, manos juntas, tres grados de flexión de codos. Se integró en la ficha de Tríceps, distinta de la ficha homónima de Pecho.
- Fondos asistidos: asistencia de pies contra el suelo, no una dominada ni un fondo sin apoyo.
- Rotaciones: giro de torso y pelvis con pivote del pie al finalizar.
- Sissy: apoyo estable, talones elevados y cuerpo inclinado hacia atrás sin convertirla en sentadilla convencional.
- Jalón tras nuca: imágenes de la variante existente, conservando sus advertencias; no constituye una nueva recomendación de entrenamiento.

No se cambiaron sugerencias, rutinas, datos guardados ni importación/exportación. La cobertura es de fichas existentes, incluyendo variantes y nombres repetidos entre grupos; no implica 138 movimientos únicos.

## Prompts completos

### tibialis

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Tibialis Raise. WALL TIBIALIS RAISE. Full body strict SIDE profile, man faces RIGHT in every panel. Back and buttocks lean against wall at LEFT; feet30cm in front of wall toward RIGHT; knees almost straight. LEFT: both feet flat on floor. CENTER: both forefeet and toes lifted halfway, heels remain firmly grounded. RIGHT: BOTH forefeet and toes raised HIGH toward shins in dorsiflexion, clearly visible gap underneath ALL toes, only heels touch floor. Ankles flex, never stand on tiptoes. Same camera and body position, no body rocking. Frame full body but feet large enough to distinguish10deg versus30deg dorsiflexion. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-d35bfcc3-c338-48fc-b1c9-62a39e5462ac.png`.

### lat_pulldown_back

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Polea alta tras nuca / a la espalda. Seated BEHIND-NECK LAT PULLDOWN with wide overhand grip on cable machine. Full body REAR three-quarter view showing back of man and entire wide bar. Knees secured under thigh pads, feet flat. Bar connected by ONE continuous cable from its midpoint to overhead pulley. LEFT: arms extended overhead bar HIGH. CENTER: elbows bend to lower bar to crown-of-head height BEHIND head. RIGHT: bar lowered only to base of skull/upper neck behind head, NOT shoulders or lower back. Neutral neck not excessively bent, upright torso fixed. Distinct3bar heights; all hands/bar ends fit. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-0c185c05-296d-4d31-9a63-1a876a291ee1.png`.

### serratus

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Serratus Push-Up. SERRATUS PUSH-UP PLUS, small scapular protraction movement in high plank. Full body fixed SIDE three-quarter view. Both palms flat directly under shoulders, elbows remain STRAIGHT in ALL3panels; toes support straight legs knees airborne. LEFT: neutral high plank straight upper back. CENTER: actively push floor away with straight elbows, upper back rises slightly through shoulder-blade protraction. RIGHT: full controlled protraction, upper back subtly rounded between shoulder blades, chest farther from floor, pelvis stays same aligned height. Do NOT do elbow bending regular pushups or pike hips. Small but clearly distinct shoulder positions. Full hands/head/toes in frame. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-830aee42-ebab-46fd-a7ef-404de7b14e01.png`.

### chin_assist

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Chin-Up asistida. BAND ASSISTED UNDERHAND CHIN-UP. Full body fixed front three-quarter view, fixed welded power-rack pullup bar. Hands shoulder width UNDERHAND palms facing self. A single green closed-loop resistance band girth-hitched around bar midpoint; long taut loop descends from that central anchor under BOTH SHOES together, feet rest IN the band bottom, never floor. LEFT: arms straight, suspended low, band stretched longest. CENTER: elbows bent90°, body lifted halfway and band shorter. RIGHT: chin above bar, elbows bent deeply at sides, body higher, band shorter still. Head to shoes and entire bar/cablefree band visible every panel. Never use cables, no missing band anchor, no standing on floor. This is existing manual library option, not automatic suggestion. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-a0d94a37-47e6-45b6-a56b-3bf3a9afe0a7.png`.

### chin_iso

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Chin-Up isométrica. ISOMETRIC TOP HOLD of UNDERHAND CHIN-UP. In ALL3panels maintain chin ABOVE fixed power-rack pullup bar, bent elbows down beside ribs, hands shoulderwidth palms facing himself, body suspended straight, feet airborne. No resistance band, no cable, no assistance. Same active top position from first front threequarter then side then opposite threequarter angle. Whole man and entire hands/bar in frame. Do NOT show bottom hang or midrise; all views TOP hold. Three different views of the SAME ACTUAL HOLD, not a fake movement sequence. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-af8c7eca-58e7-491a-90fc-72239aec5373.png`.

### diamond_tri

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Flexión diamante regresada. KNEELING DIAMOND PUSH-UP for triceps. Full body fixed elevated threequarter SIDE view. Both knees on mat ALL panels, body straight from knees to hips to shoulders. Hands TOUCH in diamond below chest, thumbs and index fingers form small diamond; elbows track BACK close to body. LEFT elbows straight chest high. CENTER halfway down elbows at about90°, chest halfway lowered. RIGHT bottom chest just above hands5cm, elbows deeply bent and tucked. No extra hands or fingers, hands same exact location, knees grounded, hips not bent like tabletop. Whole body and shoes visible with margins. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-340b7b73-ca3a-4d37-9203-ec8722a49ef8.png`.

### tri_iso

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Isométrico de extensión. Isometric triceps press against FIXED support at90-degree elbows. Man stands upright beside heavy bolted waist-high horizontal power-rack safety rail. Palms press DOWN on TOP of padded rail in front of waist. Elbows tucked beside ribs and bent exactly90degrees, upper arms vertical, forearms horizontal forward. Torso upright, shoulders down, wrists neutral, rail absolutely fixed cannot move. This is downward pressing with triceps, NOT biceps holding up weight. Both palms contacting TOP of rail. In all3panels same90degree hold shown from different angles, firstSIDE clearly shows elbow90. Entire body shoes and entire support in frame. Three different views of the SAME ACTUAL HOLD, not a fake movement sequence. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-e3aed6ab-23c2-4dab-a5a3-26c38e295c39.png`.

### dips_assist

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Fondos asistidos. FOOT ASSISTED PARALLEL BAR DIP. Low stable parallel gym dip bars about waist-high, man between bars, palms on each rail beside hips. Feet flat on floor slightly in front, knees bent to provide assistance, NOT suspended. Torso nearly upright. LEFT elbows straight top support, knees bent modestly. CENTER lowered halfway elbows bent45degrees, knees flex more. RIGHT bottom elbows at90degrees MAXIMUM, shoulders level near elbows, feet still flat floor and knees more bent to follow downward motion. Use FEET assistance not band or machine. All body and both rails visible fixed threequarter front side camera. Shoulder depression, elbows back not flared. No deep below90degree dip. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-fda2a345-08db-4a70-b967-ad42f136dcfc.png`.

### rot_expl

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Rotaciones explosivas. Standing athletic ROTATION WITH LIGHT MEDICINE BALL held close to chest at chest height, not a throw. Full body fixed FRONT camera. Feet shoulderwidth knees soft. LEFT prep: chest and pelvis rotated toward LEFT of image30degrees, hands carrying ball in front of sternum. CENTER: chest pelvis face directly forward, ball in front sternum. RIGHT finish: chest AND pelvis rotate together toward RIGHT of image60degrees, trailing heel LIFTS and foot pivots on ball of foot, lead knee tracks foot. Arms carry ball with torso rotation, never just arms twisting alone. Ball retained in hands throughout. Distinct whole body rotation, same scene. Do not imply speed via ghosting; this is a clear threephase movement illustration. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-8dedf5a7-92c7-4876-8434-b0fde558c74d.png`.

### sissy_squat

Use case: scientific-educational. Asset type: KINEX exercise reference photography. ONE wide triptych exactly THREE equal square panels in horizontal row, 3072x1024, subtle narrow dividers. Adult athletic man short dark hair, light stubble, charcoal T-shirt, black shorts, black trainers, consistent identity and clothing in all three panels. Dark neutral gym with even soft light and realistic anatomy. Each panel FULL BODY with margins, all feet, hands and relevant equipment visible, no cropped joints. Exercise: Sentadilla Sissy. SUPPORTED SISSY SQUAT, fixed strict SIDE camera. Man faces RIGHT, holds a stable upright metal rack post on RIGHT with right hand at chest height throughout. Body from knees through hips to shoulders forms ONE STRAIGHT LINE (hips remain extended) when leaning back, NOT regular squat. LEFT: upright standing knees almost straight heels slightly elevated on toes. CENTER: knees move FORWARD/right and bend moderately while entire straight thighs-hips-torso tilts BACK/left about20degrees, heels lifted, toes remain planted. RIGHT: deeper controlled knees-forward sissy squat, straight thighs-hips-torso leans BACK/left about35degrees, knees flex70degrees, heels HIGH with weight on toes, supporting hand still on post. Never sit hips back, never hinge at hip, no kneeling. Full head to toes and rack contact all visible. Three distinct phases LEFT setup, CENTER intermediate, RIGHT end. Same camera and equipment across all three. No text, logos, captions, arrows or watermark; exactly two arms and two legs.

Fuente final: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-5f531fc1-c0b9-4891-b736-26a97af74f64.png`.


## Prompts de corrección

### Serrato: toma final posterior

Use case scientific-educational. Photorealistic exercise reference, a wide triptych of three equal square panels. SERRATUS SCAPULAR PUSHUP. Same athletic adult man short dark hair, SHIRTLESS so shoulder blades are clearly visible, black shorts black trainers, dark uncluttered gym. Fixed ELEVATED REAR THREE-QUARTER camera looks down along man's spine toward head and hands; entire body including toes, head, both hands in frame with margins. High plank with arms completely straight in ALL panels. LEFT: scapulae gently retracted toward spine, visible shoulder blade borders closer together, sternum lowers slightly between straight arms. CENTER neutral scapulae. RIGHT: strong scapular PROTRACTION, shoulder blades separate WIDELY along ribcage, rounded broad upper back, pushes sternum UP away from floor with STRAIGHT elbows. Pelvis height and legs stay exactly unchanged, no knee support, no hip pike, no bending elbows. Clear visible contrast narrow shoulder blades in left vs spread shoulder blades in right. Natural anatomy not exaggerated. Side light reveals scapular contours. No text arrows logos watermark. Precisely same full-body camera and same man all3panels.

### Tibiales

Edit this exercise triptych ONLY center panel: lower both toes/forefeet close to the floor, just2cm off ground, about10 degrees ankle dorsiflexion, heels stay planted. Center must be visibly HALFWAY between left flat feet and right fully raised toes. Keep left and right panels completely unchanged; same man, clothing, wall, pose, framing, camera, lighting. Preserve full body. No text. Do not raise heels: tibialis raise lifts TOES with heels grounded.

### Serrato

Edit this exercise triptych, preserve man, dark gym, hands/toes positions, clothing, framing. LEFT panel: neutral high plank, shoulder blades neutral, upper back flat, arms completely straight. RIGHT panel: clear full scapular PROTRACTION push-up plus, push floor strongly away with arms completely straight, shoulder blades spread apart, thoracic upper back visibly domed upward between shoulders. Chest elevated relative to left by6cm, shoulders further from floor. Pelvis remains exactly same height, legs stay straight, knees airborne, no hip pike, no elbow bending. CENTER halfway protraction. Full body must remain visible. This is a small upper back action, not whole spine flexion. No text or graphics.

### Chin-up asistida

Edit this image to widen camera framing in ALL THREE PANELS equally so the ENTIRE man and hair at top fit with at least15% empty margin above head at the HIGHEST final chin-up pose. Currently right head is cropped; correct it. Maintain equal square panels, same dark gym, man, black clothes, fixed bar, underhand grip and green resistance band supporting shoes. Preserve three distinct phases: bottom hang, halfway elbows bent90, final chin above bar. Fixed bar must remain same HEIGHT within each panel, body changes height only. No text. No anatomical changes besides completing the cropped head. Full feet in each panel too.
