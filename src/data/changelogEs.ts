import type { ChangelogEntry } from './changelog';

// Spanish translations keyed by version. Entries missing here fall back to English.
export const changelogEs: Record<string, Pick<ChangelogEntry, 'date' | 'changes'>> = {
  "3.1.0": {
    date: "12 de noviembre de 2026",
    changes: {
      added: [
        "Mini reproductor: un temporizador de estudio flotante y compacto que permanece encima de todas las ventanas (Document Picture-in-Picture) con play/pausa — se abre desde el botón Picture-in-Picture del encabezado del panel de Estudio",
        "El mini reproductor muestra cada temporizador sincronizado con su propio color (azul de estudio, rojo de pomodoro, verde de cuenta regresiva) y se ensancha para acomodarlos",
        "Sincronización entre pestañas: la misma sesión se mantiene sincronizada entre ventanas y pestañas abiertas — pausar, reanudar o elegir una sesión en una se refleja al instante en las demás",
        "Mini reproductor arrastrable dentro de la app para navegadores sin soporte de Picture-in-Picture"
      ],
      improved: [
        "Mini reproductor con estilo de HUD minimalista: hora en números tabulares, línea de estado en versalitas diminutas (Temporizador · en curso/en pausa/sin sesión) y controles ghost",
        "La respiración del Pomodoro en el descanso ahora va al unísono — el borde del anillo y los dígitos pulsan al mismo ritmo de 1.4s en lugar de desfasarse",
        "Los tres paneles de temporizador mantienen los relojes a la misma altura: las filas de controles tienen altura fija y la Cuenta regresiva sincronizada reserva su fila de forma invisible"
      ]
    }
  },
  "3.0.0": {
    date: "11 de noviembre de 2026",
    changes: {
      added: [
        "Internacionalización completa: toda la app ya está disponible en inglés, español e hindi, con una landing para India y seguimiento de referidos",
        "La barra de navegación superior sustituye a la barra lateral en toda la app",
        "Soporte de Document Picture-in-Picture para ventanas flotantes del temporizador",
        "Cola de mutaciones offline: los cambios de tareas se aplican al instante y se sincronizan cuando vuelve la conexión",
        "Aviso de permiso de notificaciones y función Compartir racha",
        "La hora de la cuenta regresiva ahora es editable: haz clic en los dígitos o en el botón del lápiz para ajustar horas, minutos y segundos (el temporizador se pausa al editar)",
        "Las estadísticas de Finalizar sesión ahora muestran cuándo empezó la sesión (hora del día) y el tiempo total en pausa",
        "Cuenta regresiva añadida a la vitrina de la landing, y las demos ahora reflejan los componentes reales del temporizador",
        "Popover de tareas del día en la vista mensual, y etiqueta de asignatura sobre los títulos en Tareas pendientes",
        "Botones de inicio de sesión en la navbar y en la página de Sesión para usuarios sin sesión"
      ],
      improved: [
        "Todos los temporizadores y duraciones se muestran como HH:MM:SS en toda la app — temporizadores en vivo, modales de sesión, estadísticas, gráficos, calendario, demos de la landing y exportaciones — mediante un único formateador compartido",
        "Landing rediseñada con un look minimalista inspirado en Resend, además de metadatos SEO completos y datos estructurados",
        "El card de Tareas pendientes ahora se ajusta a su contenido en vez de estirarse hasta la altura del calendario",
        "La vista mensual marca los días con una insignia estilo iOS en lugar de puntos de tareas",
        "Controles del temporizador rediseñados como botones horizontales estilo ghost",
        "Los sonidos de lluvia y océano ahora comparten un bus de reverb en el motor de audio para una mezcla más natural",
        "La página de Sesión y el Temporizador unificado aparecen con fundidos escalonados",
        "Responsividad móvil y disposición de formularios refinadas en las páginas de sesión, calendario, landing y tareas"
      ],
      fixed: [
        "El card de Tareas pendientes mostraba una sección negra vacía abajo cuando el calendario era más alto",
        "Los dígitos editables de la cuenta regresiva mostraban un anillo de foco en cada campo y estaban demasiado separados",
        "Responsividad móvil y condiciones de carrera del estado de autenticación en toda la app",
        "Los modales de incorporación podían cerrarse por accidente con un clic fuera"
      ],
      removed: [
        "Navegación lateral — reemplazada por completo por la navbar superior",
        "La vista de día del calendario",
        "Etiqueta Focus/Break/Long Break dentro del anillo del Pomodoro — solo queda el tiempo",
        "Efecto de elevación y sombra al pasar el cursor en las tarjetas de sonido del Generador de ruido"
      ]
    }
  },
  "2.1.0": {
    date: "18 de septiembre de 2026",
    changes: {
      added: [
        "Botón Finalizar sesión (check verde) junto a play/pausa en el Temporizador de estudio",
        "El seguimiento de hábitos ahora muestra el número del día en cada celda con nombres de días, racha, mejor racha, conteo semanal y total por hábito",
        "Las notas del diario para días futuros ahora son editables (marcadas con borde discontinuo) y toda la semana siempre es visible",
        "Gestionar tareas completadas reconstruido como historial desplazable agrupado por mes con restaurar a pendiente, renombrar en línea y eliminación persistente",
        "Las tareas completadas en la página de Tareas se agrupan por mes con conteos por mes",
        "La vista mensual del calendario muestra cada día como una tarjeta individual con elevación al pasar el cursor y borde de selección de acento",
        "Los controles deslizantes y hovers del botón de play del Generador de ruido ahora usan el color de tema de cada sonido (ámbar, azul, cian)",
        "Checkbox circular en el Bloc de notas igual al estilo de check de tareas"
      ],
      improved: [
        "El directorio de notas usa tarjetas compactas que muestran solo título y fechas de creación/edición, con botón de eliminar siempre visible",
        "El encabezado de la vista de nota condensado en una sola línea: volver, asignatura, fecha y última edición a la izquierda, título centrado, acciones a la derecha",
        "Las líneas del Bloc de notas se renderizan como texto plano sin bordes de input, y el botón de checkbox alterna la línea actual en lugar de añadir",
        "El historial de pausas de la sesión muestra la pausa más reciente primero, resalta la pausa en curso y muestra el tiempo total en pausa",
        "Gestionar asignaturas reorganizado en una lista compacta con colores semánticos de pendiente/completada y un panel de detalle ordenado por fecha de entrega y finalización",
        "El detalle mensual de Gestionar sesiones reemplazó las tarjetas anidadas de semana/día/sesión por una lista plana desplazable de filas de sesión",
        "El estado vacío de Tareas es más grande, está centrado verticalmente y el botón de ajustes se llama 'Task Page Settings'",
        "Las tareas completadas se ordenan de más reciente a más antigua y ya no muestran el selector de estado",
        "El selector de estado de tarea ahora resalta el estado seleccionado con el borde de acento",
        "Los controles del Temporizador de estudio se dividen en ajustes de tiempo a la izquierda y botones de acción a la derecha",
        "La página de Hábitos ahora es responsive: tarjetas de estadísticas compactas en una fila de 4 columnas desde pantallas pequeñas, tracker arriba y notas del diario abajo en móvil/tablet, lado a lado en escritorio",
        "Las filas de notas del diario muestran nombres completos de día (ej. 'miércoles 17')",
        "La navegación semanal se movió arriba de la página de Hábitos como control tipo píldora con un botón Nuevo hábito a juego",
        "Los días futuros en el tracker de hábitos siguen totalmente visibles con solo el cuadro del checkbox atenuado",
        "La vista mensual del calendario ahora llena la altura disponible con filas iguales en vez de celdas cuadradas gigantes en pantallas medianas",
        "El selector de espacio de trabajo en la página de Tareas solo se muestra en móvil — el footer flotante ya muestra el espacio en pantallas grandes",
        "El botón Nuevo hábito usa un estilo de contorno consistente con otras acciones secundarias",
        "El sufijo 'h' de Tiempo de estudio en Estadísticas usa tamaño de texto normal",
        "Los encabezados de mes en Notas ya no están subrayados",
        "Los elementos completados del bloc de notas siguen legibles en color secundario en vez de un tachado tenue"
      ],
      fixed: [
        "El Pomodoro se reanudaba tras recargar mientras estaba sincronizado — ahora se queda en pausa como el Temporizador de estudio",
        "El Pomodoro se reiniciaba a la duración completa del modo al recargar — el estado inicial emitido por el Temporizador de estudio ya no borra el tiempo guardado",
        "El checkbox circular y la marca de tiempo de completado del Bloc de notas eran casi invisibles por la opacidad en variables de color hex",
        "Editar tareas completadas no hacía nada y las eliminaciones no persistían en la base de datos",
        "Los ajustes de la página de tareas y los botones de añadir rápido quedaban tapados por la navbar y el footer flotante",
        "Error de tipo en el visor de tareas del calendario cuando una tarea tenía fecha de entrega nula"
      ],
      removed: [
        "La fila de resumen diario de completados del tracker de Hábitos",
        "El toggle 'Mostrar días anteriores' en las notas del diario de hábitos",
        "La vista previa del cuerpo de la nota y el icono grande de las tarjetas de nota",
        "La barra de footer inferior del visor de notas",
        "La columna 'Done' duplicada en el tablero de estados de tareas",
        "El aviso 'Guardado localmente · se mantiene entre sesiones' en el Bloc de notas",
        "El icono de check superpuesto en las celdas de hábito completadas — los días completados ahora solo muestran el relleno de acento",
        "La barra de progreso dentro de las tarjetas de Gestionar asignaturas",
        "Los botones de exportar PDF y la sección Importar tareas en los ajustes de Datos"
      ]
    }
  },
  "2.0.2": {
    date: "9 de septiembre de 2026",
    changes: {
      added: [
        "Rutas independientes para cada sección de la app: Estudio, Tareas, Calendario, Analíticas, Diario, Notas y Enfoque",
        "Biblioteca de notas organizada por tarjetas de asignatura con notas agrupadas por fecha",
        "Calendario mensual responsive con celdas de día cuadradas compactas",
        "Gráfico de barras dinámico de Estadísticas con selectores de Semana, Mes y Año dentro de un solo card"
      ],
      improved: [
        "La navegación lateral ahora es permanentemente compacta con el logo UT",
        "Tipografía responsive, estados de foco, controles, bordes y espaciado en tamaños de laptop y monitor",
        "El diseño del calendario ahora coloca el calendario junto a las Próximas tareas en escritorio",
        "Notas y Hábitos ahora mantienen los datos en caché visibles mientras cargan para evitar destellos de estado vacío",
        "El Generador de tareas con IA siempre usa el modelo openrouter/free",
        "Los usuarios autenticados son redirigidos directamente a la app en lugar de la landing",
        "Configuración de build de producción optimizada con SWC más rápido y builds locales basados en esbuild"
      ],
      fixed: [
        "Crear tu primera tarea ahora abre el formulario cuando un espacio de trabajo no tiene tareas activas",
        "Las sesiones de estudio ahora incluyen una duración inicial y manejan columnas heredadas de la base de datos de forma segura",
        "El cambio entre vistas Mes, Semana y Día del calendario ahora funciona correctamente",
        "El Generador de tareas con IA no se puede cerrar por accidente mientras hay una petición en curso"
      ]
    }
  },
  "2.0.1": {
    date: "3 de septiembre de 2026",
    changes: {
      added: [
        "Card de Estadísticas consolidado con selector de período semana/mes/año a la derecha"
      ],
      improved: [
        "La página de Sesión ahora centra verticalmente los temporizadores y el Generador de ruido como un solo grupo",
        "El estado vacío de Tareas ahora ocupa menos espacio vertical",
        "La barra lateral ahora es fija e independiente de la altura del contenido principal"
      ],
      fixed: []
    }
  },
  "2.0.0": {
    date: "30 de julio de 2026",
    changes: {
      added: [
        "Vista de Temporizador unificado que combina Temporizador de estudio, Pomodoro y Cuenta regresiva en una sola interfaz cohesiva con pestañas",
        "Esquemas de validación Zod centralizados en toda la app para una validación robusta de entradas",
        "Limitación de tasa añadida a los endpoints de la API para mayor seguridad y prevención de abuso",
        "Configuración de pruebas completa con tests unitarios de Vitest y tests E2E de Playwright",
        "Fuente Inter integrada en toda la app para una tipografía más limpia y profesional",
        "Soporte de viewport-fit y safe-area insets para mejor renderizado en móviles y dispositivos con notch",
        "Toggle de modo de vista para cambiar entre distintos diseños de página dinámicamente",
        "Navbar plegable para maximizar el área de trabajo",
        "Ajustes convertidos de página independiente a modal dentro de la app con secciones en pestañas",
        "Landings con sitio de marketing completo: inicio, precios, comparativa y blog",
        "Mejoras de SEO incluyendo meta tags mejorados, Open Graph y sitemap",
        "Seguimiento del historial de pausas de sesión con entradas detalladas (hora de inicio, fin y duración)",
        "Animaciones de anillo de progreso circular para el Temporizador de estudio y la Cuenta regresiva con animación de giro en pausa",
        "Visualización de segundos en el Temporizador de estudio (MM:SS bajo 1 hora, HH:MM sobre 1 hora)",
        "Navegación con teclas de flecha (Arriba/Abajo/Izquierda/Derecha) entre los campos del temporizador",
        "Manejo de teclado consciente de modales que desactiva la navegación con flechas cuando hay un diálogo abierto"
      ],
      improved: [
        "Rediseño radical de la UI en todas las páginas con un sistema de diseño más cohesivo",
        "Componentes de temporizador fuertemente refactorizados: StudyTimer, Pomodoro y Countdown ahora comparten gestión de estado y lógica de sincronización",
        "Página de Sesión reconstruida con Temporizador unificado, controles mejorados y diseño más limpio",
        "Vistas Día/Semana/Mes del calendario refinadas con mejor manejo del tiempo y correcciones de diseño",
        "Diseño de la app de altura fija con anchos de borde aumentados para una apariencia más estructurada",
        "Problemas de desbordamiento horizontal resueltos en varias páginas",
        "Estados de pausa del temporizador mejorados con la visualización precisa de 'última pausa hace N minutos' que sobrevive a la recarga",
        "Círculo de la cuenta regresiva limpiado: eliminada la etiqueta redundante 'Countdown' dentro del anillo",
        "El display del Temporizador de estudio ahora muestra segundos bajo 1 hora para feedback en tiempo real",
        "README completamente reescrito con documentación mejorada y SEO",
        "Fetches y manejo de datos mejorados en los servicios de sesión y tareas",
        "Sonidos del generador de ruido corregidos y mejorados para mejor calidad de audio",
        "Mejoras generales de calidad de código con esquemas centralizados y menos duplicación"
      ],
      fixed: [
        "El Temporizador de estudio mostraba 00 sin cambios visibles — ahora muestra segundos en tiempo real",
        "La cuenta regresiva mostraba la etiqueta 'Countdown' dentro del círculo — eliminada",
        "El estado de pausa del temporizador no sobrevivía a la recarga — ahora se restaura correctamente desde localStorage",
        "Errores de renderizado y manejo del tiempo de la vista de día del calendario resueltos",
        "Desbordamiento horizontal en varias páginas corregido",
        "Problemas de calidad de audio del generador de ruido corregidos",
        "Varias inconsistencias de UI en las páginas resueltas con el rediseño del sistema de diseño"
      ],
      removed: [
        "Página de ajustes independiente — reemplazada por el modal de ajustes dentro de la app",
        "Etiqueta redundante 'Countdown' dentro del círculo de la cuenta regresiva",
        "Formato antiguo del temporizador que solo mostraba horas y minutos sin segundos"
      ],
      soon: [
        "App móvil con integración de Capacitor",
        "Panel avanzado de analíticas e insights de estudio",
        "Funciones mejoradas de colaboración en espacios de trabajo"
      ]
    }
  },
  "1.4.0": {
    date: "30 de junio de 2026",
    changes: {
      added: [
        "Gran rediseño de UI en casi todas las páginas de la app para un look más cohesivo y moderno",
        "Footer flotante tipo isla rediseñado con selector de espacio de trabajo, insignia de tareas, temporizador de sesión activa, toggle de tema y botón de añadir tarea rápida",
        "Página de Hábitos completamente rediseñada con vistas Hoy e Historial, seguimiento de rachas (actual y mejor), tasa de completado mensual y sub-vistas de mapa de calor/calendario/semana",
        "Vista de bienvenida de Notas rediseñada con búsqueda y notas agrupadas por asignatura",
        "Modal de ajustes reconstruido con interfaz de pestañas: Aspecto, Cuenta, Datos, Novedades y Acerca de",
        "Visor de changelog integrado directamente en Ajustes bajo la pestaña Novedades",
        "El modal de espacios de trabajo ahora incluye filtrado por búsqueda",
        "La barra lateral del calendario ahora es redimensionable arrastrando y puede alternarse entre posición izquierda y derecha",
        "Nuevo hook useResizable para funcionalidad reutilizable de arrastrar para redimensionar",
        "Nuevo TaskPageSettingsModal para la configuración de la página de tareas",
        "Botón de añadir tarea rápida en el footer flotante que navega a tareas y abre el formulario"
      ],
      improved: [
        "Actualización visual en toda la app: Tareas, Calendario, Notas, Hábitos, Estadísticas, Sesión y modales recibieron mejoras visuales",
        "Temporizador Pomodoro fuertemente refactorizado con prevención de closures obsoletos vía refs y limpieza correcta de intervalos en el reinicio de medianoche",
        "La hora de los elementos de tarea ahora usa formato compacto (ej. 8–9 AM en vez de 08:00 AM - 09:00 AM)",
        "El parseo de fechas de las tareas ya no convierte zonas horarias, corrigiendo etiquetas incorrectas de Hoy/Mañana",
        "El estado de tarea en espera ahora usa una animación de pulso lenta para mejor distinción visual",
        "Vistas Día, Semana y Mes del calendario mejoradas con mejor diseño y manejo del tiempo",
        "Navbar simplificada eliminando elementos redundantes ahora en el footer flotante",
        "Panel lateral y selector móvil de Notas mejorados con mejor diseño y navegación",
        "Varios modales actualizados para estilo consistente (BaseModal, modales de sesión, modales de tareas)",
        "Páginas de Estadísticas actualizadas con paneles de gráficos e insights más limpios",
        "El toggle de tema ahora es instantáneo sin retraso de transición"
      ],
      fixed: [
        "Línea separadora duplicada eliminada del footer flotante cuando el temporizador de sesión está activo",
        "El intervalo de reinicio de medianoche del Pomodoro ahora se limpia correctamente para evitar fugas de memoria",
        "Errores de etiqueta de fecha en TaskItem corregidos con extracción de fecha segura ante zonas horarias"
      ],
      removed: [
        "Título editable antiguo y selector de fecha eliminados de la vista de bienvenida de Notas",
        "Contenido redundante del botón de ajustes de la navbar eliminado (ahora en las pestañas del modal de Ajustes)"
      ]
    }
  },
  "1.3.5": {
    date: "26 de junio de 2026",
    changes: {
      added: [
        "El encabezado del Generador de ruido ahora muestra el número de sonidos activos"
      ],
      improved: [
        "Modal de Iniciar sesión rediseñado con opciones de temporizador estilo chip y botones de acción más limpios",
        "Los botones de play/pausa del temporizador ahora usan un borde gris sutil en lugar de colores temáticos",
        "Los iconos de reinicio en Pomodoro, Temporizador de estudio y Cuenta regresiva ahora son grises para un look más limpio",
        "Tarjetas de asignatura simplificadas para usar un solo color de acento y una etiqueta de progreso más clara",
        "Diseño del encabezado del Generador de ruido mejorado con el título a la izquierda y controles agrupados a la derecha"
      ],
      fixed: [
        "El card de Tiempo de estudio hoy ahora suma correctamente las sesiones completadas desde la base de datos en vez de solo leer el temporizador activo",
        "Errores de TypeScript de la sección Tareas completadas resueltos"
      ],
      removed: [
        "Sección de selección de tareas eliminada del modal Iniciar sesión"
      ]
    }
  },
  "1.3.4": {
    date: "17 de marzo de 2026",
    changes: {
      improved: [
        "Ruido marrón: eliminado el siseo para un sonido más limpio",
        "Olas del océano: rediseñadas por completo para un sonido oceánico realista",
        "Sonido de lluvia: añadidas frecuencias altas nítidas para mejor textura de lluvia"
      ],
      fixed: [
        "Problemas de siseo del ruido marrón",
        "Calidad de sonido artificial de las olas del océano",
        "Filtrado apagado del sonido de lluvia"
      ]
    }
  },
  "1.3.3": {
    date: "10 de marzo de 2026",
    changes: {
      added: [
        "Widget tipo isla dinámica con selector de espacio de trabajo, enlace a GitHub y acceso a Discord",
        "Selector de espacio de trabajo movido de la navbar al footer flotante para mejor accesibilidad",
        "Diseño moderno de glassmorphism con desenfoque de fondo y posicionamiento centrado"
      ],
      improved: [
        "Mejor gestión de espacios de trabajo con controles flotantes dedicados",
        "Experiencia de usuario mejorada con cambio de espacio de trabajo siempre accesible"
      ]
    }
  },
  "1.3.2": {
    date: "10 de marzo de 2026",
    changes: {
      added: [
        "La navbar ahora incluye un botón de acceso rápido para unirse al servidor de Discord de la comunidad"
      ],
      fixed: [
        "La gestión de amigos ahora maneja correctamente las solicitudes pendientes y las amistades recíprocas",
        "El flujo de compartir espacios de trabajo es completamente funcional, permitiendo a los amigos acceder a espacios compartidos"
      ],
      improved: [
        "El modal de espacios de trabajo actualiza la selección activa cuando se deja de compartir un espacio"
      ]
    }
  },
  "1.3.1": {
    date: "16 de febrero de 2026",
    changes: {
      added: [
        "Función de exportación ICS para Google Calendar y Apple Calendar",
        "Soporte para tareas recurrentes semanales con generación de RRULE",
        "Exportación de eventos de día completo para tareas sin hora específica",
        "Sistema de recordatorios según dificultad (difícil=1h, media=1d, fácil=1sem)",
        "Arrastrar y soltar mejorado con precisión de 30 minutos en WeekView",
        "Resaltado visual de la zona de destino al arrastrar tareas",
        "Depuración completa para operaciones de arrastrar y soltar"
      ],
      improved: [
        "Formato de zona horaria ICS corregido para usar la notación Z UTC correcta",
        "Manejo de horas de tarea mejorado con prioridad start_at/end_at/deadline",
        "Mejor compatibilidad de eventos de calendario entre plataformas",
        "Feedback visual mejorado en las interacciones del calendario"
      ],
      fixed: [
        "Corregido el problema de doble Z en la zona horaria de la exportación ICS",
        "DTEND de eventos de día completo corregido para seguir el estándar ICS (día siguiente)",
        "Problemas de detección de arrastrar y soltar resueltos en WeekView"
      ]
    }
  },
  "1.3.0": {
    date: "13 de febrero de 2026",
    changes: {
      added: [
        "TaskForm refactorizado con funcionalidad de IA separada para mejor modularidad",
        "Nueva sección de menú desplegable en los elementos de tarea que permite modificar la fecha sin entrar al formulario",
        "Selector de espacio de trabajo en la página de tareas para dispositivos móviles",
        "Cambio de espacio de trabajo en la vista de calendario para soportar múltiples calendarios por espacio",
        "Vista de calendario DayFlow integrada (implementación parcial)",
        "Vista de notas para gestionar notas personales y documentación",
        "Sistema de tipos de tarea (Info, Recordatorio semanal y más próximamente)"
      ],
      improved: [
        "Modelos de base de datos actualizados para soportar nuevas funciones de gestión de tareas",
        "Controles de hora de inicio y fin mejorados con mejor UX",
        "Visualización del calendario en vista móvil corregida para mejor responsividad",
        "Comportamiento de la tecla Enter en TaskForm: envía en los campos de título/asignatura, crea saltos de línea en la descripción",
        "Mejor gestión de espacios de trabajo en distintas vistas y componentes",
        "Diseño de TaskForm actualizado para permitir crecimiento dinámico del campo de descripción"
      ],
      fixed: [
        "Corregido el bug de la tecla Enter en TaskForm que cerraba el modal inesperadamente",
        "Problemas de diseño de la vista móvil del calendario resueltos",
        "Validación del formulario de tarea y flujo de envío mejorados"
      ],
      soon: [
        "Implementación completa de la vista de calendario DayFlow",
        "Tipos y categorías de tarea adicionales",
        "Funciones avanzadas de compartir espacios de trabajo",
        "Integración de programación por bloques de tiempo"
      ]
    }
  },
  "1.2.0": {
    date: "5 de febrero de 2026",
    changes: {
      added: [
        "Tareas recurrentes con opciones de programación semanal",
        "Franjas horarias de tarea con selección de hora de inicio/fin",
        "Nuevo modal de vista de tarea para información detallada",
        "Soporte para eventos recurrentes en las vistas de calendario",
        "Bloques de tareas por hora en las vistas de día y semana",
        "Ajustes de recurrencia de tareas en el formulario"
      ],
      improved: [
        "Formulario de tarea mejorado con controles de selector de hora",
        "Mejor visualización de tareas en el calendario con visualización de duración",
        "Diseño del elemento de tarea y jerarquía de información",
        "Esquema de base de datos para soportar tareas recurrentes"
      ],
      fixed: [
        "Corregido el manejo de horas de tarea y la consistencia de zonas horarias",
        "Validación de formulario mejorada para campos de hora",
        "Corregida la visualización de tareas en la vista de día del calendario"
      ]
    }
  },
  "1.1.7": {
    date: "5 de febrero de 2026",
    changes: {
      improved: [
        "Sistema de columnas fijadas migrado de localStorage a la base de datos de Supabase",
        "Políticas de seguridad a nivel de fila (RLS) añadidas para la protección de datos de columnas fijadas",
        "Persistencia de datos y sincronización entre dispositivos mejoradas para las preferencias de columnas",
        "Navbar totalmente reorganizable con funcionalidad de arrastrar y soltar",
        "Feedback visual añadido con efectos hover para los elementos de la navbar usando pseudo-elementos"
      ],
      added: [
        "Nueva tabla pinned_columns en Supabase para un almacenamiento robusto de preferencias de columnas",
        "Hook dedicado usePinnedColumns para gestionar el fijado de columnas con integración de Supabase",
        "Sistema de arrastrar y soltar para reordenar páginas de la navbar con persistencia en localStorage",
        "Estados de cursor personalizados (grab/grabbing) para mejor feedback de arrastre"
      ],
      fixed: [
        "Las preferencias de columnas fijadas ahora persisten correctamente entre sesiones y dispositivos",
        "El diseño de la navbar ya no se desplaza al aplicar efectos hover"
      ],
      removed: [
        "Tooltips redundantes de los elementos de la navbar para reducir el desorden visual"
      ]
    }
  },
  "1.1.6": {
    date: "19 de enero de 2026",
    changes: {
      added: [
        "Página de widget de Enfoque: modo enfoque a pantalla completa para estudiar sin distracciones con temporizador, estado de sesión y controles de sonido",
        "Componente de vista previa del próximo mes en la página de Hábitos para mejor planificación",
        "Botón de reproducir todo en el generador de ruido para combinaciones de sonido ambiental",
        "Sistema de notificaciones de changelog manual con insignias en lugar de popups automáticos"
      ],
      improved: [
        "Optimización SEO con meta tags, Open Graph y datos estructurados",
        "Documentación README minimalista con configuración esencial y resumen de funciones",
        "Correcciones del componente de calendario y optimizaciones de rendimiento",
        "Componente Sesión de hoy eliminado para una UI más limpia"
      ],
      fixed: [
        "Problemas de renderizado del calendario y de diseño",
        "Redundancia del componente de sesión y conflictos de navegación"
      ]
    }
  },
  "1.1.5": {
    date: "11 de enero de 2026",
    changes: {
      added: [
        "Nueva página de Hábitos inspirada en la metodología bullet journal para el seguimiento de hábitos",
        "Visualización de nombres de día (lun, mar, mié, etc.) en las celdas del calendario",
        "Sistema de tooltips al pasar sobre un día mostrando detalles de tareas, similar a la funcionalidad del calendario"
      ],
      improved: [
        "Diseño del calendario mejorado con nombres de día e indicadores de tareas",
        "Posicionamiento de tooltips optimizado en la página del calendario para mejor visibilidad",
        "Navegación de tareas mejorada con elementos desplegables clicables"
      ]
    }
  },
  "1.1.4": {
    date: "10 de enero de 2026",
    changes: {
      improved: [
        "Nuevas vistas de Semana y Día añadidas al calendario para mejor gestión del tiempo",
        "Funcionalidad de bloques de tiempo implementada para asignar tareas a horas específicas",
        "Diseño de la página de tareas mejorado para mostrar 4 columnas en pantallas grandes (antes 3)",
        "Navegación del calendario e indicadores de tiempo mejorados para mejor usabilidad"
      ]
    }
  },
  "1.1.3": {
    date: "29 de diciembre de 2025",
    changes: {
      improved: [
        "UI de la página de Notas mejorada con diseño moderno y navegación mejorada",
        "Editor WYSIWYG actualizado con variantes específicas por contexto para Notas y Tareas",
        "Funcionalidad del panel lateral mejorada con contenido desplazable y acciones rápidas",
        "Footer mejorado con navegación y acciones de guardar/eliminar",
        "Mejor diseño responsive para dispositivos móviles",
        "Sistema de guardado de notas optimizado con auto-guardado mejorado y atajos de teclado"
      ],
      added: [
        "Placeholders contextuales para las distintas variantes del editor",
        "Botones de creación rápida de asignaturas en el panel lateral",
        "Indicadores visuales de áreas editables en los editores",
        "Visualización de metadatos de nota mejorada con diseño responsive"
      ],
      fixed: [
        "Problemas de guardado de notas con el atajo Ctrl+S corregidos",
        "Conflictos de auto-guardado y problemas de sincronización resueltos",
        "Problemas de altura del panel lateral con el posicionamiento del footer corregidos"
      ]
    }
  },
  "1.1.2": {
    date: "21 de diciembre de 2025",
    changes: {
      fixed: [
        "Problemas de sincronización del temporizador Pomodoro corregidos"
      ],
      improved: [
        "Nuevo modo de cambio de espacio de trabajo con scroll lateral",
        "La función de compartir espacio de trabajo con amigos ahora es completamente funcional",
        "Sistema de estados de tarea para mejor organización"
      ],
      soon: [
        "Página de bloques de tiempo: asigna bloques de tiempo a las tareas",
        "Sistema de clasificación: compite con amigos"
      ]
    }
  },
  "1.1.1": {
    date: "21 de diciembre de 2025",
    changes: {
      added: [
        "¡Hola mundo!",
        "Primer uso del sistema de changelog de UniTracker"
      ],
      improved: [
        "Aquí verás los próximos cambios y mejoras que implementaremos en la aplicación"
      ],
      fixed: [],
      removed: []
    }
  }
};
