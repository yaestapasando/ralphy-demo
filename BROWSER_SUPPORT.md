# Soporte de Navegadores — Network Information API

Este documento describe las limitaciones y el soporte de la **Network Information API** en diferentes navegadores, así como las estrategias de fallback implementadas en la aplicación.

## Estado del Soporte de la API

### Navegadores con Soporte Completo

| Navegador | Plataforma | Versión | Soporte |
|-----------|------------|---------|---------|
| Chrome | Escritorio / Android | 61+ | ✅ Completo |
| Edge | Escritorio / Android | 79+ | ✅ Completo |
| Opera | Escritorio / Android | 48+ | ✅ Completo |
| Samsung Internet | Android | 8.0+ | ✅ Completo |

### Navegadores con Soporte Parcial o Nulo

| Navegador | Plataforma | Estado | Notas |
|-----------|------------|--------|-------|
| Firefox | Escritorio | ❌ Sin soporte | No implementada |
| Firefox | Android | ⚠️ Parcial | Solo en algunas versiones experimentales |
| Safari | iOS / macOS | ❌ Sin soporte | No planificado |
| Safari Technology Preview | macOS | ❌ Sin soporte | Sin implementación prevista |

### Referencias

- **MDN Web Docs**: [Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API)
- **Can I Use**: [navigator.connection](https://caniuse.com/netinfo)
- **Chrome Platform Status**: [Network Information API](https://chromestatus.com/feature/6338383617982464)

## Propiedades de la API

La Network Information API expone el objeto `navigator.connection` (o variantes prefijadas) con las siguientes propiedades:

### `type` (string)

Tipo de conexión física detectada por el sistema operativo:

- `'wifi'` — Conexión Wi-Fi
- `'ethernet'` — Cable Ethernet
- `'cellular'` — Datos móviles (4G/5G/3G/2G)
- `'bluetooth'` — Conexión vía Bluetooth
- `'none'` — Sin conexión
- `'unknown'` — Tipo desconocido

**Disponibilidad**: Chrome 61+, Edge 79+, Opera 48+

### `effectiveType` (string)

Calidad efectiva de la conexión estimada por el navegador:

- `'4g'` — Velocidad equivalente a 4G o superior
- `'3g'` — Velocidad equivalente a 3G
- `'2g'` — Velocidad equivalente a 2G
- `'slow-2g'` — Velocidad muy baja (< 50 kbps)

**Disponibilidad**: Chrome 61+, Edge 79+, Opera 48+

### `downlink` (number)

Estimación del ancho de banda de bajada en **Mbps**.

**Disponibilidad**: Chrome 61+, Edge 79+, Opera 48+

### `rtt` (number)

Tiempo estimado de ida y vuelta (Round-Trip Time) en **milisegundos**.

**Disponibilidad**: Chrome 61+, Edge 79+, Opera 48+

### Evento `change`

Dispara cuando cambia el tipo de conexión o las propiedades de red.

```javascript
navigator.connection.addEventListener('change', () => {
  console.log('La conexión ha cambiado:', navigator.connection.type);
});
```

**Disponibilidad**: Chrome 61+, Edge 79+, Opera 48+

## Estrategia de Fallback

Para navegadores sin soporte de la Network Information API (Firefox, Safari), la aplicación implementa un sistema de **detección heurística** basado en:

### 1. Análisis del User Agent

- Detecta el navegador, sistema operativo y si el dispositivo es móvil
- Ejemplo: dispositivos iOS/Android son más probablemente móviles

### 2. Métricas de Velocidad Medidas

Durante el test de velocidad, la aplicación mide:

- **RTT (Round-Trip Time)**: Latencia en milisegundos
- **Downlink**: Velocidad de descarga en Mbps
- **Jitter**: Variabilidad de la latencia

### 3. Reglas Heurísticas

Basándose en las métricas, se infiere el tipo de conexión:

| Condiciones | Tipo Inferido | Calidad |
|-------------|---------------|---------|
| RTT < 10ms, Downlink ≥ 50 Mbps, Jitter < 3ms | `ethernet` | `4g` |
| RTT < 50ms, Downlink ≥ 5 Mbps | `wifi` | `4g` |
| RTT ≥ 20ms, Downlink ≥ 5 Mbps, móvil | `cellular` | `4g` |
| RTT ≥ 50ms, Downlink ≥ 0.5 Mbps | `cellular` | `3g` |
| RTT ≥ 200ms, Downlink ≥ 0.05 Mbps | `cellular` | `2g` |
| RTT ≥ 500ms | `cellular` | `slow-2g` |

**Nota**: En dispositivos móviles, las detecciones de `wifi` con alta latencia se reclasifican como `cellular`, y las detecciones de `ethernet` se reclasifican como `wifi`.

## Limitaciones Conocidas

### Privacidad y Precisión

1. **Precisión variable**: Los valores de `downlink` y `rtt` son estimaciones del navegador, no mediciones exactas.
2. **Restricciones de privacidad**: Safari y Firefox no implementan la API por motivos de privacidad y fingerprinting.
3. **VPNs y proxies**: La API puede no detectar correctamente el tipo de conexión si se usa VPN.

### Comportamiento en Diferentes Plataformas

1. **Android**: Soporte completo en Chrome, Edge y Samsung Internet.
2. **iOS**: Sin soporte en Safari; sin alternativas nativas disponibles.
3. **Desktop**: Soporte completo en Chrome/Edge/Opera; sin soporte en Firefox/Safari.

### Cambios Dinámicos

1. **Cambio de red**: El evento `change` solo se dispara en navegadores compatibles.
2. **Modo avión**: En algunos dispositivos, el cambio a modo avión puede no detectarse instantáneamente.
3. **Tethering**: La API puede no distinguir entre conexión directa móvil y tethering desde otro dispositivo.

## Recomendaciones para el Usuario

### En Navegadores Compatibles (Chrome, Edge, Opera)

- La detección de red es **automática y en tiempo real**
- El tipo de conexión se actualiza automáticamente al cambiar de red
- Los valores de latencia y ancho de banda son estimaciones del sistema

### En Navegadores Sin Soporte (Firefox, Safari)

- La detección de red se realiza **mediante heurísticas** basadas en el test de velocidad
- El tipo de conexión se actualiza **después de ejecutar un test completo**
- La precisión depende de las condiciones de red en el momento del test
- Se recomienda realizar tests periódicos para mantener la información actualizada

## Implementación Técnica

### Archivos Relevantes

- **`src/services/network-detection.js`**: Módulo de detección usando `navigator.connection`
- **`src/services/network-fallback.js`**: Lógica de fallback con heurísticas
- **`src/components/connection-indicator.js`**: Componente UI del indicador de conexión

### Uso en la Aplicación

```javascript
import { getConnectionInfo } from './services/network-detection.js';
import { getConnectionInfoWithFallback } from './services/network-fallback.js';

// Detectar con API nativa o fallback
const connectionInfo = getConnectionInfoWithFallback();

if (connectionInfo.supported) {
  console.log('API nativa disponible');
} else {
  console.log('Usando detección heurística');
}
```

### Estructura del Objeto `ConnectionInfo`

```typescript
{
  supported: boolean;        // true si la API está disponible
  type: string | null;       // 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'none' | 'unknown'
  effectiveType: string | null;  // '4g' | '3g' | '2g' | 'slow-2g'
  downlink: number | null;   // Mbps
  rtt: number | null;        // Milisegundos
  source?: string;           // 'api' | 'heuristic' | 'none'
}
```

---

**Última actualización**: Febrero 2026
**Versión de la aplicación**: 1.0
