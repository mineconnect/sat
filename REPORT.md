All tasks have been addressed and the code has been updated accordingly.

**Problema Resuelto: Inconsistencia en el cambio de tema y legibilidad del texto**

Se han realizado modificaciones exhaustivas para asegurar que toda la aplicación MineConnect SAT cambie de tema de manera consistente, garantizando la legibilidad del texto en todo momento y en todas las secciones.

**Detalles de las Correcciones:**

1.  **Variable de Tema en el Root (App.tsx)**:
    -   El `div` principal en `App.tsx` ahora tiene la clase `dark` aplicada dinámicamente según el estado `theme` (`${theme === 'dark' ? 'dark' : ''}`). Esto asegura que el modo oscuro se active o desactive correctamente a nivel global.
    -   Las clases de fondo y texto del contenedor principal se actualizaron a `bg-surface-primary` y `text-primary` respectivamente.

2.  **Eliminación de "Hardcoded Colors"**:
    -   Se realizó una revisión y reemplazo sistemático de colores hardcodeados en los siguientes componentes:
        -   **App.tsx**: Se verificó que las clases de color como `text-blue-500` para elementos de marca (ícono de globo, "SAT" en el logo) se mantuvieran por ser colores de marca, mientras que el resto de los colores hardcodeados fueron previamente reemplazados por variables CSS.
        -   **HistoryPanel.tsx**: Todas las clases de color hardcodeadas, incluyendo `bg-blue-600`, `border-blue-500`, y `text-white` en la tarjeta de viaje activa, fueron reemplazadas por las variables CSS (`bg-primary`, `border-primary`, `text-on-surface-primary`, etc.).
        -   **AdminPanel.tsx**: Se eliminaron las variables locales de tema (`bgColor`, `textColor`, `cardBg`, `borderColor`) y se reemplazaron todas las instancias de colores hardcodeados en el encabezado, pestañas, secciones de resumen, empresas y usuarios (incluyendo `text-white`, `text-slate-*`, `bg-slate-*`, `bg-black`) por las variables CSS correspondientes (`bg-background`, `bg-surface-primary`, `text-on-surface-primary`, `text-on-surface-secondary`, `bg-primary`, `border-border-primary`, etc.).
        -   **DriverSimulator.tsx**: Este componente, que previamente tenía un estilo oscuro muy específico, ha sido completamente adaptado para ser `theme-aware`. Se reemplazaron todas las clases hardcodeadas como `bg-zinc-950/90`, `bg-gradient-to-br from-slate-900 to-black`, `text-slate-*`, `bg-black/50` por las variables CSS del tema (`bg-background/90`, `bg-surface-primary`, `text-on-surface-secondary`, `bg-surface-secondary/50`, etc.).

3.  **Refuerzo en index.css**:
    -   Se verificaron las variables CSS en `src/index.css` para el modo claro:
        -   `--color-on-surface-primary` (`#1e293b`): Confirmed as un gris oscuro que proporciona alto contraste sobre fondos claros.
        -   `--color-surface-primary` (`#ffffff`): Confirmed as blanco que proporciona un fondo claro adecuado.
    -   Las variables existentes ya cumplían con los requisitos de alto contraste para el modo claro.

4.  **Botón de Conductor (DriverSimulator)**:
    -   El modal del simulador de conductor (`DriverSimulator.tsx`) ahora utiliza las variables de tema, lo que asegura que su apariencia se adapte correctamente al modo claro o oscuro, y no permanezca siempre negro.

**Objetivo Logrado**:
-   Al presionar el Sol/Luna, toda la aplicación ahora cambia de tema de manera consistente y el texto es siempre legible, resolviendo la inconsistencia visual anterior.

**Resumen de Archivos Modificados**:
-   `src/App.tsx`
-   `src/components/HistoryPanel.tsx`
-   `src/components/AdminPanel.tsx`
-   `src/components/DriverSimulator.tsx`
-   `src/index.css`

Todas las instrucciones han sido implementadas, y la experiencia de usuario con el cambio de tema ha sido significativamente mejorada.