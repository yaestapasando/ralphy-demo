# PRD — Aplicación Web de Medición de Velocidad de Internet

**Versión:** 1.0  
**Fecha:** Febrero 2026  
**Estado:** Borrador  

---

## 1. Visión General del Producto

### 1.1 Contexto y Motivación

Los usuarios domésticos y profesionales necesitan una herramienta fiable para medir y monitorizar la calidad de su conexión a internet. Las soluciones existentes (Speedtest by Ookla, Fast.com) no ofrecen historiales persistentes sin registro ni identificación automática del tipo de red utilizada, lo que dificulta correlacionar problemas de conectividad con el tipo de conexión o el momento del día.

Este producto es una **aplicación web progresiva (PWA)** que permite realizar tests de velocidad, almacenar un histórico local de resultados y detectar automáticamente el tipo de conexión activa (Wi-Fi, datos móviles, Ethernet, etc.).

### 1.2 Objetivos del Producto

- Proporcionar mediciones precisas de velocidad de descarga, subida y latencia (ping).
- Almacenar un histórico persistente de pruebas en el navegador del usuario (sin necesidad de servidor ni registro).
- Detectar y registrar automáticamente el tipo de red en el momento de cada prueba.
- Ofrecer una interfaz limpia, intuitiva y responsive que funcione en escritorio y móvil.

### 1.3 Usuarios Objetivo

- Usuarios domésticos que desean monitorizar su conexión Wi-Fi o de fibra.
- Trabajadores remotos que alternan entre redes (hogar, oficina, móvil).
- Técnicos y administradores de red que hacen diagnósticos rápidos.

---

## 2. Arquitectura de la Solución

### 2.1 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | HTML5 + CSS3 + JavaScript (Vanilla o React) |
| Almacenamiento | IndexedDB (via `idb` library) o `localStorage` para datos ligeros |
| API de red | Network Information API (`navigator.connection`) |
| Test de velocidad | Fetch API con archivos de referencia o integración con librerías open source (p.ej. `librespeed-speedtest`) |
| PWA | Service Worker + Web App Manifest |
| Visualización | Chart.js para gráficos del histórico |

### 2.2 Diseño de Datos

**Entidad: `SpeedTestResult`**

```json
{
  "id": "uuid-v4",
  "timestamp": "2026-02-24T10:30:00Z",
  "download_mbps": 95.4,
  "upload_mbps": 42.1,
  "ping_ms": 12,
  "jitter_ms": 3.2,
  "connection_type": "wifi",
  "effective_type": "4g",
  "downlink_mbps": 10,
  "rtt_ms": 50,
  "server_used": "auto",
  "ip_address": "redacted",
  "user_agent": "Mozilla/5.0..."
}
```

### 2.3 Flujo General de la Aplicación

```
Usuario abre la app
      │
      ▼
Detección del tipo de conexión (Network Information API)
      │
      ▼
Usuario pulsa "Iniciar Test"
      │
      ├─► Medir Ping / Latencia
      ├─► Medir Velocidad de Descarga
      └─► Medir Velocidad de Subida
            │
            ▼
     Mostrar resultados en pantalla
            │
            ▼
     Guardar resultado en IndexedDB
            │
            ▼
     Actualizar histórico y gráficos
```

---

## 3. Features y Tareas de Implementación

---

### FEATURE 1 — Test de Velocidad

**Descripción:** Núcleo de la aplicación. Permite al usuario lanzar una prueba de velocidad que mide descarga, subida y latencia.

**Criterios de Aceptación:**
- El test se inicia con un único botón.
- Se muestra el progreso en tiempo real (gauge animado o barra de progreso).
- Los resultados finales muestran: download (Mbps), upload (Mbps), ping (ms) y jitter (ms).
- El test completo no debe tardar más de 30 segundos en condiciones normales.
- Si la conexión falla durante el test, se muestra un mensaje de error claro.

**Tareas:**

- [x] **F1-T1** · `Alta` · `4h` — Configurar servidor de ficheros de prueba o integrar librería `librespeed-speedtest` para evitar dependencia externa
- [x] **F1-T2** · `Alta` · `3h` — Implementar medición de latencia (ping) mediante peticiones HTTP repetidas al servidor de test
- [x] **F1-T3** · `Alta` · `5h` — Implementar medición de velocidad de descarga con ficheros de tamaño progresivo (1MB → 10MB → 25MB)
- [x] **F1-T4** · `Alta` · `5h` — Implementar medición de velocidad de subida mediante POST de datos aleatorios al servidor
- [x] **F1-T5** · `Media` · `2h` — Calcular jitter como desviación estándar de las mediciones de latencia
- [x] **F1-T6** · `Alta` · `4h` — Diseñar e implementar el componente UI del gauge animado con actualización en tiempo real
- [x] **F1-T7** · `Alta` · `3h` — Implementar pantalla de resultados finales con valores destacados (download, upload, ping, jitter)
- [x] **F1-T8** · `Media` · `2h` — Manejo de errores: timeout, sin conexión, servidor no disponible
- [x] **F1-T9** · `Media` · `3h` — Tests unitarios para las funciones de cálculo de velocidad

---

### FEATURE 2 — Detección del Tipo de Conexión

**Descripción:** Identificar automáticamente el tipo de red que el usuario está utilizando en el momento del test, usando la Network Information API del navegador y heurísticas adicionales.

**Criterios de Aceptación:**
- Se detecta y muestra el tipo de conexión antes de iniciar el test: `wifi`, `cellular` (4G/5G/3G), `ethernet`, `bluetooth`, `unknown`.
- La información se actualiza automáticamente si la red cambia mientras la app está abierta.
- En navegadores que no soporten la Network Information API, se muestra "No disponible" sin romper la funcionalidad.
- El tipo de conexión queda registrado junto con cada resultado del histórico.

**Tareas:**

- [x] **F2-T1** · `Alta` · `3h` — Implementar módulo de detección usando `navigator.connection` (type, effectiveType, downlink, rtt)
- [x] **F2-T2** · `Media` · `3h` — Crear lógica de fallback para navegadores sin soporte (Firefox, Safari parcial) usando User Agent + heurísticas de velocidad
- [ ] **F2-T3** · `Alta` · `2h` — Diseñar e implementar el componente UI del indicador de tipo de conexión (icono + etiqueta) en la cabecera de la app
- [ ] **F2-T4** · `Media` · `2h` — Implementar listener `connection.onchange` para actualizar el indicador en tiempo real si cambia la red
- [ ] **F2-T5** · `Baja` · `1h` — Mapear los valores de la API (`wifi`, `cellular`, `ethernet`, etc.) a iconos y etiquetas legibles en español
- [ ] **F2-T6** · `Baja` · `1h` — Documentar las limitaciones de la API por navegador y añadir tooltip informativo en la UI

---

### FEATURE 3 — Histórico de Pruebas

**Descripción:** Almacenar localmente todos los resultados de pruebas anteriores y presentarlos en una vista de historial con capacidad de filtrado y visualización gráfica.

**Criterios de Aceptación:**
- Cada resultado se guarda automáticamente tras completarse el test.
- El histórico persiste entre sesiones (cierre/apertura del navegador).
- El usuario puede ver una lista de resultados anteriores con: fecha, hora, tipo de conexión, download, upload y ping.
- El usuario puede filtrar el histórico por tipo de conexión y por rango de fechas.
- Se muestra un gráfico de evolución temporal de la velocidad de descarga.
- El usuario puede eliminar entradas individuales o borrar todo el histórico.
- El histórico puede exportarse en formato CSV o JSON.

**Tareas:**

- [ ] **F3-T1** · `Alta` · `3h` — Configurar IndexedDB con la librería `idb` y definir el esquema de la base de datos (`SpeedTestResult`)
- [ ] **F3-T2** · `Alta` · `3h` — Implementar funciones CRUD: `saveResult`, `getAllResults`, `deleteResult`, `clearAll`
- [ ] **F3-T3** · `Media` · `2h` — Implementar función de migración de esquema para versiones futuras de la BD
- [ ] **F3-T4** · `Alta` · `4h` — Diseñar e implementar la vista de lista del histórico con tabla responsive (fecha, tipo red, download, upload, ping)
- [ ] **F3-T5** · `Media` · `4h` — Implementar filtros de la lista: por tipo de conexión (multiselect) y por rango de fechas (date picker)
- [ ] **F3-T6** · `Alta` · `4h` — Integrar Chart.js e implementar gráfico de líneas de la evolución de velocidad de descarga y subida a lo largo del tiempo
- [ ] **F3-T7** · `Media` · `2h` — Añadir selector en el gráfico para cambiar la métrica visualizada (download, upload, ping)
- [ ] **F3-T8** · `Media` · `2h` — Implementar botón de eliminación por fila con confirmación modal
- [ ] **F3-T9** · `Media` · `1h` — Implementar botón "Borrar todo el historial" con confirmación modal
- [ ] **F3-T10** · `Media` · `2h` — Implementar exportación del histórico a CSV
- [ ] **F3-T11** · `Baja` · `1h` — Implementar exportación del histórico a JSON
- [ ] **F3-T12** · `Media` · `3h` — Mostrar estadísticas resumidas en el histórico: media, máximo y mínimo de download/upload/ping

---

### FEATURE 4 — Interfaz de Usuario y Experiencia (UI/UX)

**Descripción:** Diseño visual de la aplicación, navegación entre secciones y adaptación a distintos dispositivos.

**Criterios de Aceptación:**
- La aplicación funciona correctamente en escritorio, tablet y móvil.
- Existe navegación clara entre la vista principal (test) y la vista de histórico.
- El diseño sigue un sistema de diseño coherente (colores, tipografía, espaciado).
- La aplicación cumple con un mínimo de accesibilidad WCAG AA (contraste, etiquetas ARIA, navegación por teclado).

**Tareas:**

- [ ] **F4-T1** · `Alta` · `3h` — Definir y documentar el sistema de diseño: paleta de colores, tipografía, espaciado e iconografía
- [ ] **F4-T2** · `Alta` · `3h` — Implementar la estructura de layout principal con barra de navegación y dos vistas (Test / Histórico)
- [ ] **F4-T3** · `Alta` · `5h` — Diseñar e implementar la pantalla principal del test (indicador de red, botón de inicio, gauge, resultados)
- [ ] **F4-T4** · `Alta` · `4h` — Implementar diseño responsive con CSS Grid/Flexbox para escritorio, tablet y móvil
- [ ] **F4-T5** · `Media` · `3h` — Implementar tema oscuro/claro con `prefers-color-scheme` y toggle manual
- [ ] **F4-T6** · `Media` · `3h` — Añadir animaciones y transiciones suaves (gauge en movimiento, aparición de resultados)
- [ ] **F4-T7** · `Media` · `3h` — Revisión de accesibilidad: contraste de colores, atributos ARIA, focus visible, labels en formularios
- [ ] **F4-T8** · `Baja` · `2h` — Implementar pantalla de error global y estado vacío para el histórico

---

### FEATURE 5 — Progressive Web App (PWA)

**Descripción:** Configurar la aplicación como PWA para permitir su instalación en el dispositivo y funcionamiento parcial sin conexión.

**Criterios de Aceptación:**
- La app puede instalarse desde el navegador en escritorio y móvil.
- La interfaz principal carga sin conexión a internet (shell cacheada).
- El histórico es accesible offline.

**Tareas:**

- [ ] **F5-T1** · `Alta` · `1h` — Crear `manifest.json` con nombre, iconos, colores y modo de visualización (`standalone`)
- [ ] **F5-T2** · `Alta` · `3h` — Implementar Service Worker con estrategia cache-first para assets estáticos
- [ ] **F5-T3** · `Media` · `1h` — Generar iconos de la aplicación en todos los tamaños requeridos (192px, 512px, etc.)
- [ ] **F5-T4** · `Media` · `2h` — Implementar pantalla de splash y comportamiento offline con mensaje informativo cuando se intenta hacer un test sin conexión
- [ ] **F5-T5** · `Media` · `2h` — Validar instalabilidad y puntuación Lighthouse (objetivo: >90 en Performance, PWA, Accessibility)

---

## 4. Roadmap y Priorización

### Fase 1 — MVP (Semanas 1-3)
- Feature 1: Test de Velocidad (tareas F1-T1 a F1-T8)
- Feature 2: Detección de Conexión (tareas F2-T1 a F2-T4)
- Feature 3: Histórico básico (tareas F3-T1 a F3-T6)
- Feature 4: UI base y responsive (tareas F4-T1 a F4-T4)

### Fase 2 — Producto Completo (Semanas 4-5)
- Feature 3: Filtros, exportación, estadísticas (F3-T7 a F3-T12)
- Feature 4: Tema oscuro, accesibilidad, estados de error (F4-T5 a F4-T8)
- Feature 5: PWA completa (F5-T1 a F5-T5)

### Fase 3 — Mejoras Futuras (Post-lanzamiento)
- Compartir resultados con enlace único (requiere backend ligero).
- Comparativa entre resultados de la misma red en el tiempo.
- Integración con servidor de test propio para mayor privacidad.
- Notificaciones push programadas para tests automáticos periódicos.

---

## 5. Consideraciones Técnicas y Limitaciones

### Network Information API
La `Network Information API` tiene soporte limitado: disponible en Chrome/Edge y en Android, pero **no disponible en Firefox ni en Safari**. Para estos navegadores, la detección del tipo de conexión se realizará mediante heurísticas basadas en el resultado del propio test de velocidad (velocidades bajas + latencia alta → posiblemente móvil).

### Privacidad
- Todos los datos se almacenan **localmente en el navegador** del usuario (IndexedDB).
- No se envía ningún dato a servidores externos salvo el tráfico propio del test de velocidad.
- No se usa ningún tipo de analítica ni tracking de terceros.

### Precisión del Test
- Los resultados pueden verse afectados por otros procesos que consuman ancho de banda en el dispositivo.
- Se recomienda mostrar un aviso al usuario para cerrar otras aplicaciones antes de iniciar el test.

---

## 6. Métricas de Éxito

| Métrica | Objetivo |
|---|---|
| Tiempo hasta primer resultado (test completo) | < 30 segundos |
| Puntuación Lighthouse Performance | > 90 |
| Puntuación Lighthouse Accessibility | > 90 |
| Puntuación Lighthouse PWA | > 90 |
| Tasa de error en guardado de histórico | < 0.1% |
| Soporte de navegadores | Chrome, Edge, Firefox, Safari (últimas 2 versiones) |

---

*Documento generado como PRD inicial. Sujeto a revisión y actualización durante el ciclo de desarrollo.*
