# Dominadas supinas: revisión v3.48

Pedido: [GitHub #19](https://github.com/janoalimentibel-design/kinex/issues/19).
La secuencia anterior mostraba un agarre confuso y una barra suspendida de un cable.
Se sustituye por una barra fija atornillada al rack y agarre supino con ambas manos,
con instrucciones visibles en cada fase y en la foto ampliada.

Referencia técnica: [ACE, Chin-ups](https://www.acefitness.org/resources/everyone/exercise-library/190/chin-ups/).
La revisión aclara el gesto; no cambia la rutina, las dosis ni las indicaciones
personales del usuario.

## Archivos

- Originales: `assets-src/exercises/chinup-v348/inicio.png`, `medio.png`, `final.png`.
- Publicación: `public/assets/exercises/chinup-v348/inicio.webp`, `medio.webp`,
  `final.webp` y `thumb.webp`.
- Ficha: `src/data/exercises.ts`, identificador `chinup`.
- Mapa e instrucciones por fase: `src/data/images.ts`, identificador `chinup`.

## Generación

Herramienta integrada de imágenes (sin CLI ni clave de API). Prompts usados:

1. **Inicio**: fotografía didáctica vertical 2:3, varón adulto con camiseta gris y
   pantalón corto negro en gimnasio oscuro; barra recta fija atornillada entre dos
   soportes; cuerpo completo suspendido, brazos extendidos, manos al ancho de
   hombros. Ambas manos en agarre supino, palmas hacia el atleta y pulgares rodeando
   la barra. Vista posterior de tres cuartos que permita revisar las dos muñecas.
   Sin cables, cadenas, bandas, agarre mixto, textos ni marcas de agua.
2. **Medio**: editar Inicio conservando atleta, agarre, rack, ropa y cámara. Elevar
   el cuerpo hasta flexión de codos cercana a 90 grados, cabeza todavía debajo de
   la barra, pies sin apoyo y cuerpo sin balanceo. La barra permanece fija.
3. **Final**: editar Inicio conservando la identidad y el agarre bilateral supino;
   elevar el cuerpo hasta mentón a la altura de la barra o ligeramente por encima,
   codos flexionados y cuello neutro. Se corrigió el encuadre de la primera variante
   final para mostrar cabeza completa, ambas manos, pies y soportes, con espacio
   libre sobre la cabeza y barra aproximadamente al 22% de la altura de imagen.

Las variantes descartadas no se incorporaron al proyecto. Se revisaron los tres
fotogramas seleccionados y se optimizaron con `scripts/optimize-images.mjs`.
