# Imágenes v3.33 — seis fichas nuevas

Herramienta: generación integrada de imagegen (no CLI/API). Fotos de referencia generadas, no fotografías documentales de una persona real.

Cobertura: 128 de 138 fichas con imágenes, 10 pendientes (92,8%). El conteo mide fichas con assets, no una auditoría nueva de todas las imágenes históricas.

## Archivos y visualización

Los seis ejercicios muestran una sola postura activa (`display: 'hold'`), tomada de `inicio.webp`. No se presentan vistas repetidas como una secuencia de movimiento. Las otras dos vistas quedan archivadas para compatibilidad con el pipeline de tres fases existente.

- **Isométrico arriba de flexión** (`top_hold`): originales `assets-src/exercises/top-hold/{inicio,medio,final}.png`; publicación `public/assets/exercises/top-hold/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/top-hold.png`.
- **Hollow Hold regresado** (`hollow_reg`): originales `assets-src/exercises/hollow-regressed/{inicio,medio,final}.png`; publicación `public/assets/exercises/hollow-regressed/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/hollow-regressed.png`.
- **Respiración 90/90 + bracing** (`bracing_90`): originales `assets-src/exercises/bracing-90/{inicio,medio,final}.png`; publicación `public/assets/exercises/bracing-90/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/bracing-90.png`.
- **Curl isométrico con banda** (`curl_iso`): originales `assets-src/exercises/curl-isometric/{inicio,medio,final}.png`; publicación `public/assets/exercises/curl-isometric/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/curl-isometric.png`.
- **Hang supino** (`supine_hang`): originales `assets-src/exercises/supine-hang/{inicio,medio,final}.png`; publicación `public/assets/exercises/supine-hang/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/supine-hang.png`.
- **Toalla Hold / Grip Hold** (`towel_hold`): originales `assets-src/exercises/towel-hold/{inicio,medio,final}.png`; publicación `public/assets/exercises/towel-hold/{inicio,medio,final,thumb}.webp`; captura móvil `verification/a3-fase2/towel-hold.png`.

## Revisión visual del lote

- Plancha alta: manos y puntas de pies apoyadas, rodillas elevadas, cuerpo completo.
- Hollow regresado: rodillas flexionadas, hombros y pies elevados, pelvis apoyada; no variante de piernas extendidas.
- Respiración 90/90: cabeza apoyada, piernas sostenidas por banco; respiraciones descritas en las indicaciones.
- Curl isométrico: banda bajo ambos pies, codos junto al torso a unos 90°.
- Hang supino: agarre bajo barra fija, brazos extendidos y pies suspendidos.
- Towel Hold: la toma generada usa dos toallas plegadas sobre una barra fija, una por mano (variante válida del agarre con toalla), no una sola como pedía el prompt. Pies suspendidos, manos sujetan las toallas y no la barra.

El tríptico original se separó mecánicamente con Sharp en tres vistas sin alterar la anatomía. La app muestra solo la primera vista, con cuerpo completo. No se modificaron rutinas, almacenamiento ni historial.

## Pendientes después del lote

Verificación local: 46/46 pruebas unitarias, 87/87 pruebas de navegador,
compilación y control de 512 archivos referenciados correctos. Se abrieron
las seis capturas de detalle a 390 px y se verificó que la postura completa
se ve sin recortes. Esto no equivale a una certificación profesional de técnica.

`tibialis`, `lat_pulldown_back`, `serratus`, `chin_assist`, `chin_iso`, `diamond_tri`, `tri_iso`, `dips_assist`, `rot_expl`, `sissy_squat`.

## Prompts completos

### top_hold

Use case: scientific-educational. Asset type: KINEX exercise posture reference photography. Create ONE wide triptych, exactly three equal square panels in a horizontal row, 3072x1024, no gutters or borders, no text. Each panel shows the SAME ACTIVE ISOMETRIC POSTURE from a distinct camera angle, NOT a motion sequence or setup/rest pose. Adult athletic man short dark hair and light stubble, charcoal black t-shirt, black shorts, black sneakers; realistic anatomy and natural gym photography. Dark neutral uncluttered gym, soft even light, black floor mat where appropriate. Each panel FULL BODY with generous 12% framing margin, no cropped extremities. Exercise: Isométrico arriba de flexión. Technique: High plank, the top of a push-up. Both palms flat on floor exactly below shoulders, elbows straight, legs fully extended, only hands and toes support body, knees airborne. Straight aligned head-hips-heels, abdominal tension, shoulders actively pushing floor away. Entire body including both hands and toes visible. Side view first; two slightly different three-quarter views after. No captions, no labels, no logos, no watermark. Anatomically credible hands, exactly two arms and two legs. Never crop body or equipment at panel borders.

Fuente generada: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-1d2a4c10-de99-4248-b9b4-2248a04b1449.png`.

### hollow_reg

Use case: scientific-educational. Asset type: KINEX exercise posture reference photography. Create ONE wide triptych, exactly three equal square panels in a horizontal row, 3072x1024, no gutters or borders, no text. Each panel shows the SAME ACTIVE ISOMETRIC POSTURE from a distinct camera angle, NOT a motion sequence or setup/rest pose. Adult athletic man short dark hair and light stubble, charcoal black t-shirt, black shorts, black sneakers; realistic anatomy and natural gym photography. Dark neutral uncluttered gym, soft even light, black floor mat where appropriate. Each panel FULL BODY with generous 12% framing margin, no cropped extremities. Exercise: Hollow Hold regresado. Technique: Regressed tucked hollow body hold on black mat. Lower back and pelvis remain grounded; shoulder blades and head raised slightly, neutral neck with gaze toward knees. Both knees bent about 90 degrees over hips, shins horizontal, feet airborne. Both straight arms reach forward beside thighs, palms facing down, arms airborne. Not a situp, not straight-legged hollow. Side view first; two slightly different three-quarter views after. No captions, no labels, no logos, no watermark. Anatomically credible hands, exactly two arms and two legs. Never crop body or equipment at panel borders.

Fuente generada: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-2d0fdef6-2c85-4473-ba35-2453104ea63d.png`.

### bracing_90

Use case: scientific-educational. Asset type: KINEX exercise posture reference photography. Create ONE wide triptych, exactly three equal square panels in a horizontal row, 3072x1024, no gutters or borders, no text. Each panel shows the SAME ACTIVE ISOMETRIC POSTURE from a distinct camera angle, NOT a motion sequence or setup/rest pose. Adult athletic man short dark hair and light stubble, charcoal black t-shirt, black shorts, black sneakers; realistic anatomy and natural gym photography. Dark neutral uncluttered gym, soft even light, black floor mat where appropriate. Each panel FULL BODY with generous 12% framing margin, no cropped extremities. Exercise: Respiración 90/90 + bracing. Technique: Supine supported 90/90 breathing and abdominal bracing on black mat. Head and shoulders rest comfortably on mat. Hips flexed 90 degrees, thighs vertical, knees bent90 degrees, BOTH calves supported horizontally on a simple flat gym bench. Feet and calves rest on bench, not floating. Hands lightly on lower side ribs to feel breathing. Relaxed neutral face. Entire body AND bench visible. Side view first; two different three-quarter views after. No captions, no labels, no logos, no watermark. Anatomically credible hands, exactly two arms and two legs. Never crop body or equipment at panel borders.

Fuente generada: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-caf8e5e6-1a09-49bc-a8c7-4cb11c6a67a7.png`.

### curl_iso

Use case: scientific-educational. Asset type: KINEX exercise posture reference photography. Create ONE wide triptych, exactly three equal square panels in a horizontal row, 3072x1024, no gutters or borders, no text. Each panel shows the SAME ACTIVE ISOMETRIC POSTURE from a distinct camera angle, NOT a motion sequence or setup/rest pose. Adult athletic man short dark hair and light stubble, charcoal black t-shirt, black shorts, black sneakers; realistic anatomy and natural gym photography. Dark neutral uncluttered gym, soft even light, black floor mat where appropriate. Each panel FULL BODY with generous 12% framing margin, no cropped extremities. Exercise: Curl isométrico con banda. Technique: Standing ISOMETRIC biceps curl with resistance band. Full body head to shoes. Band runs UNDER BOTH shoes, two taut strands rise vertically to hands. Elbows tucked beside ribs, bent exactly90 degrees, upper arms vertical, forearms horizontal forward, palms upward gripping band, fists about waist height. Hold this halfway curl position, no elbow movement, no hands up near shoulders. Torso upright no lean. First three-quarter side view showing elbow angle; second frontal and third other three-quarter views. No captions, no labels, no logos, no watermark. Anatomically credible hands, exactly two arms and two legs. Never crop body or equipment at panel borders.

Fuente generada: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-acd626e5-980a-45fe-abb6-96860809e6ca.png`.

### supine_hang

Use case: scientific-educational. Asset type: KINEX exercise posture reference photography. Create ONE wide triptych, exactly three equal square panels in a horizontal row, 3072x1024, no gutters or borders, no text. Each panel shows the SAME ACTIVE ISOMETRIC POSTURE from a distinct camera angle, NOT a motion sequence or setup/rest pose. Adult athletic man short dark hair and light stubble, charcoal black t-shirt, black shorts, black sneakers; realistic anatomy and natural gym photography. Dark neutral uncluttered gym, soft even light, black floor mat where appropriate. Each panel FULL BODY with generous 12% framing margin, no cropped extremities. Exercise: Hang supino. Technique: Active underhand dead hang on a FIXED horizontal pullup bar welded between tall power-rack uprights, NOT cable equipment. SUPINATED grip: palms face the man's face, hands shoulder-width. Arms extend overhead nearly straight, shoulders active slightly drawn down from ears. Entire body suspended, feet clearly off floor, legs together straight with slight bend acceptable. Full body AND hands AND fixed bar must be visible. First front three-quarter view clearly revealing palms facing inward toward himself; second side and third opposite three-quarter. No captions, no labels, no logos, no watermark. Anatomically credible hands, exactly two arms and two legs. Never crop body or equipment at panel borders.

Fuente generada: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-b7106d40-eca8-44d6-8d05-a722ed096624.png`.

### towel_hold

Use case: scientific-educational. Asset type: KINEX exercise posture reference photography. Create ONE wide triptych, exactly three equal square panels in a horizontal row, 3072x1024, no gutters or borders, no text. Each panel shows the SAME ACTIVE ISOMETRIC POSTURE from a distinct camera angle, NOT a motion sequence or setup/rest pose. Adult athletic man short dark hair and light stubble, charcoal black t-shirt, black shorts, black sneakers; realistic anatomy and natural gym photography. Dark neutral uncluttered gym, soft even light, black floor mat where appropriate. Each panel FULL BODY with generous 12% framing margin, no cropped extremities. Exercise: Toalla Hold / Grip Hold. Technique: Towel grip dead hang. One thick white towel draped over a FIXED horizontal pullup bar welded to a power rack. Its two ends hang down side-by-side. Each hand grips one towel end tightly BELOW the bar; neither hand touches bar. Towel visibly loops OVER bar with realistic gravity and tension. Arms extend almost straight upward, shoulders active, body hangs vertically, feet airborne20cm, knees slightly bent, no swinging. Full body, feet, hands, entire towel loop and fixed bar all in frame. First frontal three-quarter view shows both towel tails and separate gripping hands; second side view and third other three-quarter. No captions, no labels, no logos, no watermark. Anatomically credible hands, exactly two arms and two legs. Never crop body or equipment at panel borders.

Fuente generada: `/Users/janoalimentibel/.codex/generated_images/019f0920-b360-7953-9966-c19368f41780/exec-e66d863e-02e0-4f6b-a94a-220832c8aa94.png`.
