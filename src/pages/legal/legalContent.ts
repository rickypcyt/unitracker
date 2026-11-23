export type LegalLang = 'en' | 'es';
export type LegalDoc = 'terms' | 'privacy';

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalContent {
  title: string;
  updatedLabel: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED = '2026-11-23';
export const LEGAL_CONTACT_EMAIL = 'rickypcyt@gmail.com';
export const MIN_AGE = 13;

export const LEGAL_CONTENT: Record<LegalDoc, Record<LegalLang, LegalContent>> = {
  terms: {
    en: {
      title: 'Terms of Service',
      updatedLabel: 'Last updated',
      intro:
        'These Terms govern your use of UniTracker (the "Service"), a free, open source study app with a Pomodoro timer, tasks, habits, notes and analytics, operated by Ricky, the individual developer of UniTracker ("we", "us"). By creating an account or using the Service you agree to these Terms.',
      sections: [
        {
          heading: '1. Who can use UniTracker',
          paragraphs: [
            `You must be at least ${MIN_AGE} years old. If you are under the age of majority where you live, you confirm that a parent or guardian allows you to use the Service.`,
          ],
        },
        {
          heading: '2. Your account',
          paragraphs: [
            'You can sign in with Google, GitHub or an email link. You are responsible for activity under your account and for keeping access to your sign-in method secure. Tell us if you suspect unauthorized use.',
          ],
        },
        {
          heading: '3. Acceptable use',
          bullets: [
            'Do not break the law or infringe the rights of others.',
            'Do not attempt to access other users\' data, probe or disrupt the Service, or bypass its limits.',
            'Do not use automated means to create accounts or overload the Service.',
            'Do not use the AI features to generate harmful, illegal or abusive content.',
          ],
        },
        {
          heading: '4. Your content',
          paragraphs: [
            'You keep ownership of the tasks, notes, habits and other content you create. You give us a limited license to store, process and display it solely to operate the Service for you (for example, syncing it between your devices). You are responsible for the content you add.',
          ],
        },
        {
          heading: '5. AI features',
          paragraphs: [
            'Some features (such as creating tasks with AI) send the text you submit to a third-party AI provider to generate a response. AI output can be inaccurate; review it before relying on it. Do not submit sensitive personal information to these features.',
          ],
        },
        {
          heading: '6. Open source',
          paragraphs: [
            'The UniTracker source code is published on GitHub under its own license, which governs your use of the code. These Terms govern your use of the hosted Service at unitracker.me.',
          ],
        },
        {
          heading: '7. Availability and changes',
          paragraphs: [
            'The Service is provided free of charge and may change, be interrupted or be discontinued. We try to give notice of significant changes but do not guarantee uninterrupted availability. You can export your data from the app settings at any time.',
          ],
        },
        {
          heading: '8. Termination',
          paragraphs: [
            'You can stop using the Service and ask us to delete your account at any time (see the Privacy Policy). We may suspend or close accounts that violate these Terms or put the Service at risk.',
          ],
        },
        {
          heading: '9. Disclaimer and liability',
          paragraphs: [
            'The Service is provided "as is" and "as available", without warranties of any kind. To the maximum extent permitted by law, we are not liable for indirect or consequential damages, or for loss of data, grades or deadlines arising from use of the Service. Keep your own backups of important work.',
          ],
        },
        {
          heading: '10. Changes to these Terms',
          paragraphs: [
            'We may update these Terms. If a change is material we will make a reasonable effort to notify you, for example in the app. Continuing to use the Service after a change means you accept the updated Terms.',
          ],
        },
        {
          heading: '11. Contact',
          paragraphs: [`Questions about these Terms: ${LEGAL_CONTACT_EMAIL}.`],
        },
      ],
    },
    es: {
      title: 'Términos de Servicio',
      updatedLabel: 'Última actualización',
      intro:
        'Estos Términos regulan tu uso de UniTracker (el "Servicio"), una app de estudio gratuita y de código abierto con temporizador Pomodoro, tareas, hábitos, notas y analíticas, operada por Ricky, desarrollador individual de UniTracker ("nosotros"). Al crear una cuenta o usar el Servicio aceptas estos Términos.',
      sections: [
        {
          heading: '1. Quién puede usar UniTracker',
          paragraphs: [
            `Debes tener al menos ${MIN_AGE} años. Si eres menor de edad en tu país, confirmas que tu madre, padre o tutor te permite usar el Servicio.`,
          ],
        },
        {
          heading: '2. Tu cuenta',
          paragraphs: [
            'Puedes iniciar sesión con Google, GitHub o un enlace por correo. Eres responsable de la actividad de tu cuenta y de mantener seguro el acceso a tu método de inicio de sesión. Avísanos si sospechas un uso no autorizado.',
          ],
        },
        {
          heading: '3. Uso aceptable',
          bullets: [
            'No infrinjas la ley ni los derechos de otras personas.',
            'No intentes acceder a datos de otros usuarios, sondear o interrumpir el Servicio, ni saltarte sus límites.',
            'No uses medios automatizados para crear cuentas o sobrecargar el Servicio.',
            'No uses las funciones de IA para generar contenido dañino, ilegal o abusivo.',
          ],
        },
        {
          heading: '4. Tu contenido',
          paragraphs: [
            'Conservas la propiedad de las tareas, notas, hábitos y demás contenido que creas. Nos concedes una licencia limitada para almacenarlo, procesarlo y mostrarlo únicamente para operar el Servicio para ti (por ejemplo, sincronizarlo entre tus dispositivos). Eres responsable del contenido que añades.',
          ],
        },
        {
          heading: '5. Funciones de IA',
          paragraphs: [
            'Algunas funciones (como crear tareas con IA) envían el texto que escribes a un proveedor de IA externo para generar una respuesta. La IA puede equivocarse; revisa el resultado antes de fiarte de él. No envíes información personal sensible a estas funciones.',
          ],
        },
        {
          heading: '6. Código abierto',
          paragraphs: [
            'El código fuente de UniTracker está publicado en GitHub bajo su propia licencia, que rige tu uso del código. Estos Términos rigen tu uso del Servicio alojado en unitracker.me.',
          ],
        },
        {
          heading: '7. Disponibilidad y cambios',
          paragraphs: [
            'El Servicio es gratuito y puede cambiar, interrumpirse o dejar de ofrecerse. Intentamos avisar de los cambios importantes, pero no garantizamos disponibilidad ininterrumpida. Puedes exportar tus datos desde los ajustes de la app cuando quieras.',
          ],
        },
        {
          heading: '8. Terminación',
          paragraphs: [
            'Puedes dejar de usar el Servicio y pedirnos que eliminemos tu cuenta en cualquier momento (ver la Política de Privacidad). Podemos suspender o cerrar cuentas que incumplan estos Términos o pongan en riesgo el Servicio.',
          ],
        },
        {
          heading: '9. Exención de garantías y responsabilidad',
          paragraphs: [
            'El Servicio se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo. En la máxima medida permitida por la ley, no somos responsables de daños indirectos o consecuentes, ni de la pérdida de datos, notas o plazos derivada del uso del Servicio. Haz tus propias copias de seguridad de lo importante.',
          ],
        },
        {
          heading: '10. Cambios en estos Términos',
          paragraphs: [
            'Podemos actualizar estos Términos. Si el cambio es importante haremos un esfuerzo razonable por avisarte, por ejemplo dentro de la app. Seguir usando el Servicio tras un cambio supone aceptar los Términos actualizados.',
          ],
        },
        {
          heading: '11. Contacto',
          paragraphs: [`Preguntas sobre estos Términos: ${LEGAL_CONTACT_EMAIL}.`],
        },
      ],
    },
  },

  privacy: {
    en: {
      title: 'Privacy Policy',
      updatedLabel: 'Last updated',
      intro:
        'This policy explains what personal data UniTracker collects, why, and what you can do about it. The data controller is Ricky, the individual developer of UniTracker. Contact: ' +
        LEGAL_CONTACT_EMAIL +
        '.',
      sections: [
        {
          heading: '1. Data we collect',
          bullets: [
            'Account data: email address, username, avatar and the time of your last sign-in, received from Google, GitHub or your email sign-in.',
            'Content you create: tasks, workspaces, notes, habits, study sessions, calendar entries and settings.',
            'Social features: friend relationships and a public leaderboard entry (username, avatar and aggregated study time).',
            'Usage and device data: pages viewed, feature usage, approximate location derived from IP, browser and device type, and error reports.',
            'Referral data: the source (for example a link or UTM parameter) that brought you to UniTracker.',
          ],
        },
        {
          heading: '2. How we use it',
          bullets: [
            'To provide the Service: sign-in, syncing your data across devices, friends and leaderboard.',
            'To send service emails (such as a welcome email) and, occasionally, product announcements.',
            'To understand usage and improve the app, and to keep it secure and prevent abuse.',
          ],
        },
        {
          heading: '3. Service providers',
          paragraphs: ['We share data only with providers that help us run UniTracker:'],
          bullets: [
            'Supabase — authentication and database hosting.',
            'Google and GitHub — sign-in (only if you choose them).',
            'Vercel — hosting, plus Vercel Analytics and Speed Insights.',
            'PostHog — product analytics.',
            'Resend — email delivery.',
            'OpenRouter and the AI models it routes to — only when you use AI features; the text you submit is sent to generate a response.',
          ],
        },
        {
          heading: '4. Legal bases',
          paragraphs: [
            'Where data protection law such as the GDPR applies, we rely on: performance of a contract (providing the Service), legitimate interests (security, analytics and improving the app) and consent where required (for example optional emails).',
          ],
        },
        {
          heading: '5. Public information',
          paragraphs: [
            'Your username, avatar and aggregated study time can be visible to other signed-in users, for example on the leaderboard and in friend lists. Your email address is not shown to other users.',
          ],
        },
        {
          heading: '6. Local storage and cookies',
          paragraphs: [
            'We use browser storage (localStorage and similar) to keep you signed in, remember preferences and let the app work offline. Analytics providers may use cookies or similar technologies to measure usage.',
          ],
        },
        {
          heading: '7. Retention',
          paragraphs: [
            'We keep your data while your account is active. When you ask us to delete your account we remove your profile and content, except where we must keep some data to meet legal obligations or resolve disputes. Backups may take a short time to be overwritten.',
          ],
        },
        {
          heading: '8. Your rights',
          paragraphs: [
            `Depending on where you live, you can ask to access, correct, export or delete your data, object to or restrict certain processing, and withdraw consent. You can export your data from the app settings. For anything else, or to delete your account, email ${LEGAL_CONTACT_EMAIL}. You may also complain to your local data protection authority.`,
          ],
        },
        {
          heading: '9. Children',
          paragraphs: [
            `UniTracker is not intended for children under ${MIN_AGE}. If you believe a child under ${MIN_AGE} has created an account, contact us and we will delete it.`,
          ],
        },
        {
          heading: '10. International transfers',
          paragraphs: [
            'Our providers may process data in countries other than yours, including the United States. Where required, they rely on safeguards such as standard contractual clauses.',
          ],
        },
        {
          heading: '11. Security',
          paragraphs: [
            'We use reasonable technical measures such as encrypted connections and access controls on our database. No system is perfectly secure, so we cannot guarantee absolute security.',
          ],
        },
        {
          heading: '12. Changes',
          paragraphs: [
            'We may update this policy. If a change is material we will make a reasonable effort to let you know, for example in the app. The date at the top shows the latest version.',
          ],
        },
      ],
    },
    es: {
      title: 'Política de Privacidad',
      updatedLabel: 'Última actualización',
      intro:
        'Esta política explica qué datos personales recoge UniTracker, para qué y qué puedes hacer al respecto. El responsable del tratamiento es Ricky, desarrollador individual de UniTracker. Contacto: ' +
        LEGAL_CONTACT_EMAIL +
        '.',
      sections: [
        {
          heading: '1. Datos que recogemos',
          bullets: [
            'Datos de cuenta: correo electrónico, nombre de usuario, avatar y la fecha de tu último inicio de sesión, recibidos de Google, GitHub o tu inicio de sesión por correo.',
            'Contenido que creas: tareas, espacios de trabajo, notas, hábitos, sesiones de estudio, eventos del calendario y ajustes.',
            'Funciones sociales: relaciones de amistad y una entrada pública en el ranking (nombre de usuario, avatar y tiempo de estudio agregado).',
            'Datos de uso y dispositivo: páginas vistas, uso de funciones, ubicación aproximada derivada de la IP, tipo de navegador y dispositivo, e informes de errores.',
            'Datos de referencia: la fuente (por ejemplo un enlace o parámetro UTM) por la que llegaste a UniTracker.',
          ],
        },
        {
          heading: '2. Cómo los usamos',
          bullets: [
            'Para prestar el Servicio: inicio de sesión, sincronización de tus datos entre dispositivos, amigos y ranking.',
            'Para enviar correos del servicio (como el de bienvenida) y, ocasionalmente, novedades del producto.',
            'Para entender el uso y mejorar la app, y para mantenerla segura y evitar abusos.',
          ],
        },
        {
          heading: '3. Proveedores de servicios',
          paragraphs: ['Solo compartimos datos con proveedores que nos ayudan a operar UniTracker:'],
          bullets: [
            'Supabase — autenticación y base de datos.',
            'Google y GitHub — inicio de sesión (solo si los eliges).',
            'Vercel — alojamiento, además de Vercel Analytics y Speed Insights.',
            'PostHog — analítica de producto.',
            'Resend — envío de correos.',
            'OpenRouter y los modelos de IA a los que enruta — solo cuando usas funciones de IA; el texto que envías se manda para generar una respuesta.',
          ],
        },
        {
          heading: '4. Bases legales',
          paragraphs: [
            'Cuando se aplique una ley de protección de datos como el RGPD, nos basamos en: la ejecución de un contrato (prestar el Servicio), el interés legítimo (seguridad, analítica y mejora de la app) y el consentimiento cuando sea necesario (por ejemplo, correos opcionales).',
          ],
        },
        {
          heading: '5. Información pública',
          paragraphs: [
            'Tu nombre de usuario, avatar y tiempo de estudio agregado pueden ser visibles para otros usuarios con sesión iniciada, por ejemplo en el ranking y en las listas de amigos. Tu correo electrónico no se muestra a otros usuarios.',
          ],
        },
        {
          heading: '6. Almacenamiento local y cookies',
          paragraphs: [
            'Usamos el almacenamiento del navegador (localStorage y similares) para mantener tu sesión, recordar preferencias y permitir que la app funcione sin conexión. Los proveedores de analítica pueden usar cookies o tecnologías similares para medir el uso.',
          ],
        },
        {
          heading: '7. Conservación',
          paragraphs: [
            'Conservamos tus datos mientras tu cuenta esté activa. Cuando nos pidas eliminarla borraremos tu perfil y tu contenido, salvo los datos que debamos conservar para cumplir obligaciones legales o resolver disputas. Las copias de seguridad pueden tardar un tiempo en sobrescribirse.',
          ],
        },
        {
          heading: '8. Tus derechos',
          paragraphs: [
            `Según dónde vivas, puedes pedir acceder a tus datos, corregirlos, exportarlos o eliminarlos, oponerte o limitar ciertos tratamientos y retirar tu consentimiento. Puedes exportar tus datos desde los ajustes de la app. Para cualquier otra cosa, o para eliminar tu cuenta, escribe a ${LEGAL_CONTACT_EMAIL}. También puedes reclamar ante tu autoridad local de protección de datos.`,
          ],
        },
        {
          heading: '9. Menores',
          paragraphs: [
            `UniTracker no está dirigido a menores de ${MIN_AGE} años. Si crees que un menor de ${MIN_AGE} ha creado una cuenta, contáctanos y la eliminaremos.`,
          ],
        },
        {
          heading: '10. Transferencias internacionales',
          paragraphs: [
            'Nuestros proveedores pueden tratar datos en países distintos al tuyo, incluido Estados Unidos. Cuando es necesario, se apoyan en garantías como las cláusulas contractuales tipo.',
          ],
        },
        {
          heading: '11. Seguridad',
          paragraphs: [
            'Aplicamos medidas técnicas razonables, como conexiones cifradas y controles de acceso en la base de datos. Ningún sistema es perfectamente seguro, por lo que no podemos garantizar una seguridad absoluta.',
          ],
        },
        {
          heading: '12. Cambios',
          paragraphs: [
            'Podemos actualizar esta política. Si el cambio es importante haremos un esfuerzo razonable por avisarte, por ejemplo dentro de la app. La fecha de arriba indica la última versión.',
          ],
        },
      ],
    },
  },
};
