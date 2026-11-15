# Nivelia

Diario de progreso personal: apunta cosas buenas, frustraciones, deporte, sueño, contadores y más, y sube de nivel con una barra de experiencia.

Es una web instalable (PWA) sin dependencias ni compilación. Archivos: `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js` e `icons/`.

## Publicarla en GitHub Pages

1. Sube el contenido de esta carpeta a la raíz del repositorio (los archivos sueltos, sin carpeta intermedia).
2. En **Settings > Pages**: Deploy from a branch, rama `main`, carpeta `/ (root)`.
3. En uno o dos minutos estará en `https://TU_USUARIO.github.io/NOMBRE-DEL-REPO/`.
4. En el móvil, ábrela y elige "Añadir a pantalla de inicio" (iPhone, Safari) o "Instalar app" (Android, Chrome).

Al actualizar, sube la versión de `CACHE` en `sw.js` y, en el móvil, cierra la app del todo y ábrela dos veces.

## Qué incluye

- **Día:** cosas buenas, deporte, mente (lectura, estudio, meditación), tiempo con otros, frustraciones, gastos, contadores, sueño, pasos, peso, cintura, hábitos, reflexión y frase destacada. Etiquetas opcionales en las entradas.
- **Calendario:** vista mensual con puntos de colores y búsqueda en todas tus entradas.
- **Progreso:** resumen de la semana, la anterior, el mes o el mes anterior; gráficas de XP, sueño y peso; qué influye en tu ánimo; rangos por categoría; días sin.
- **Retos:** 2 misiones diarias y 3 semanales (cambian solas), objetivos a largo plazo y 28 logros.
- **Ajustes:** metas de sueño y pasos, contadores propios, conexión con el reloj y copia de seguridad.
- **Comodín de racha:** uno al mes, para un día en el que no apuntaste nada.

## Reglas de experiencia

| Acción | XP |
| --- | --- |
| Cosa buena (pequeña / media / grande) | +10 / +25 / +50 |
| Deporte | minutos × intensidad (0,6 / 1 / 1,4), mínimo 15 |
| Mente | minutos × 0,5, mínimo 5 |
| Tiempo con otros | minutos ÷ 6, mínimo 5 |
| Hábito completado | +8 |
| Reflexión del día | +10 |
| Dormir tu objetivo (o hasta 1 h menos) | +10 (+4) |
| Pasos: objetivo / 1,5 × objetivo | +8 / +12 |
| Contador de objetivo cumplido (agua) | +10 |
| Contador de límite: cada unidad de más | resta lo que configures (alcohol −6, café −2...) |
| Día sin alcohol (si registraste algo ese día) | +5 |
| Frustración (leve / media / fuerte) | −5 / −15 / −30; la mitad si escribes qué aprendes |
| Misión diaria / semanal | +10 / +30 |
| Objetivo a largo plazo completado | +100 |

Subir del nivel *N* al siguiente cuesta `100 + 30 × (N − 1)` XP. El total nunca baja de 0. Las constantes están al principio de `app.js`.

## Tus datos

Todo se guarda en el dispositivo (`localStorage`). No se envía nada a ningún servidor. En iPhone, Safari y la app instalada tienen datos separados: instálala primero y usa siempre el icono. Desde **Ajustes > Copia de seguridad** puedes exportar un `.json` e importarlo en otro dispositivo.

## Conectar con el reloj

Una web no puede leer Apple Salud, Health Connect ni las apps de los relojes. Hay dos vías que sí funcionan:

### 1. Atajos que abren una dirección (sueño, pasos, peso, entrenamientos)

Nivelia entiende direcciones con datos, por ejemplo:

```
https://TU_USUARIO.github.io/nivelia/?sueno=7.5&pasos=8200
```

Parámetros (todos opcionales):

| Parámetro | Ejemplo | Qué hace |
| --- | --- | --- |
| `sueno` | `7.5` o `7:30` | Horas dormidas. Sobrescribe el valor del día |
| `calidad` | `1`, `2` o `3` | Mala, normal o buena |
| `pasos` | `8200` | Pasos del día |
| `peso` | `72.4` | Peso en kg |
| `cintura` | `84` | Cintura en cm |
| `agua` | `6` | Vasos de agua, si tienes ese contador |
| `deporte` | `Correr` | Deporte (Running, Run, Bici, Natación... se reconocen) |
| `min` | `35` | Minutos del deporte (obligatorio con `deporte`) |
| `intensidad` | `s`, `n`, `h` | Suave, normal, intenso |
| `detalle` | `5 km` | Texto libre |
| `ext` | `abc123` | Identificador para no repetir el mismo entrenamiento |
| `fecha` | `2026-11-14` | Día al que se apunta. Por defecto, hoy |

El sueño, los pasos, el peso y la cintura se sobrescriben, así que lanzar el atajo dos veces no duplica nada. Los entrenamientos con el mismo `ext`, o con el mismo deporte y duración parecida ese día, tampoco se repiten.

**En iPhone (app Atajos).** Los nombres de las acciones pueden variar según la versión de iOS:

1. Crea un atajo nuevo.
2. Añade "Buscar muestras de Salud", tipo Pasos, de hoy, y "Calcular estadísticas" (suma) para obtener el total.
3. Haz lo mismo con Sueño (últimas 24 horas) y convierte la suma a horas.
4. Añade una acción "Texto" con la dirección de Nivelia y los valores insertados como variables: `https://TU_USUARIO.github.io/nivelia/?sueno=VARIABLE&pasos=VARIABLE`.
5. Añade "Abrir URL" con ese texto.
6. En la pestaña Automatización puedes lanzarlo, por ejemplo, al apagar la alarma. Según la versión de iOS, puede pedir un toque para confirmar.

Si tu reloj no es Apple Watch, mientras sincronice con la app Salud del iPhone, el atajo lo verá.

**En Android.** Apps como Tasker o HTTP Shortcuts pueden abrir una dirección igual, pero leer Health Connect depende del reloj y de la app que lo conecte. Si usas este camino, empieza por los pasos y el sueño.

### 2. Importar entrenamientos en GPX o TCX

En **Ajustes > Importar entrenamientos** puedes elegir uno o varios archivos `.gpx` o `.tcx`, que exportan Garmin Connect, Strava y la mayoría de apps de relojes. Se reconocen el deporte, la fecha, la duración y la distancia. Los repetidos se ignoran.

## Pendiente

No hay fotos del día: guardarlas en el navegador llenaría el almacenamiento. Se podrían añadir con otro sistema de guardado.
