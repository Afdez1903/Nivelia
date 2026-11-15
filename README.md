# Nivelia

Diario de progreso personal: apunta cosas buenas, frustraciones y deporte, y sube de nivel con una barra de experiencia. Incluye calendario, hábitos diarios, gráfica semanal y logros.

Es una web instalable (PWA) sin dependencias ni paso de compilación: solo `index.html`, un manifiesto, un service worker y los iconos.

## Publicarla en GitHub Pages

1. Crea un repositorio nuevo en GitHub, por ejemplo `nivelia`.
2. Sube el contenido de esta carpeta a la raíz del repositorio (arrastra los archivos en "Add file > Upload files", o usa `git`).
3. En el repositorio ve a **Settings > Pages**. En "Build and deployment" elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`. Guarda.
4. Espera un minuto. La app quedará en `https://TU_USUARIO.github.io/nivelia/`.

## Instalarla en el móvil

- **iPhone (Safari):** abre la dirección, pulsa Compartir y elige "Añadir a pantalla de inicio".
- **Android (Chrome):** abre la dirección, pulsa el menú y elige "Instalar app" o "Añadir a pantalla de inicio".

Después se abre como una app a pantalla completa y funciona sin conexión.

## Tus datos

Todo se guarda en el propio dispositivo (`localStorage`). No se envía nada a ningún servidor.

- Los datos de Safari y los de la app instalada en iPhone son independientes. Instálala primero y usa siempre la app instalada.
- Si borras los datos del navegador, se pierden. Desde **Progreso > Copia de seguridad** puedes exportar un archivo `.json` e importarlo en otro dispositivo.

## Reglas de experiencia

| Acción | XP |
| --- | --- |
| Cosa buena (pequeña / media / grande) | +10 / +25 / +50 |
| Deporte | minutos × intensidad (suave 0,6; normal 1; intenso 1,4), mínimo 15 |
| Hábito completado | +8 |
| Reflexión o gratitud del día | +10 |
| Frustración (leve / media / fuerte) | −5 / −15 / −30 |
| Frustración con aprendizaje escrito | la mitad de la penalización |

Subir del nivel *N* al siguiente cuesta `100 + 30 × (N − 1)` XP. El total nunca baja de 0.

Las constantes están al principio del script de `index.html` (`GOOD`, `BAD`, `INT`, `HABIT_XP`, `NOTE_XP`, `DEFAULT_HABITS`, `SPORTS`) por si quieres ajustarlas.

## Actualizar la app

Si cambias archivos, sube el número de `CACHE` en `sw.js` (por ejemplo `nivelia-v2`) para que los móviles descarguen la versión nueva.
