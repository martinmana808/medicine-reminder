export type Lang = "en" | "es";

export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export function isLang(x: unknown): x is Lang {
  return x === "en" || x === "es";
}

/** Luxon locale for date formatting. */
export function localeOf(lang: Lang): string {
  return lang === "es" ? "es" : "en";
}

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "💊 Meds",
  "nav.today": "Today",
  "nav.history": "History",
  "nav.settings": "Settings",

  "today.title": "Today",
  "today.add": "+ Add",
  "today.empty.title": "No medicines yet",
  "today.empty.body": "Add your first medicine, then enable notifications in Settings.",
  "today.empty.cta": "Add a medicine",
  "today.dueNow": "Due now",
  "today.alsoDue": "Also due",
  "today.dosesBehind": "{n} doses behind",
  "today.wasDue": "Was due {date} · {rel}",
  "today.next": "Next {date} · {rel}",
  "today.lastTaken": "Last taken {date}",
  "today.completed": "Completed",
  "today.courseFinished": "course finished",

  "common.edit": "Edit",
  "common.cancel": "Cancel",
  "common.saving": "Saving…",
  "common.and": " and ",
  "common.comma": ", ",

  "action.markTaken": "✓ Mark taken",
  "action.markTakenShort": "Mark taken",
  "action.takenNow": "Taken now",
  "action.atATime": "at a time…",

  "nextTake.label": "Next take",

  "add.title": "Add medicine",
  "edit.title": "Edit medicine",
  "form.name": "Medicine name",
  "form.namePlaceholder": "e.g. Amoxicillin",
  "form.schedule": "Schedule",
  "form.everyXHours": "Every X hours",
  "form.fixedDailyTimes": "Fixed daily times",
  "form.repeatEvery": "Repeat every (hours)",
  "form.times": "Times (comma separated, HH:MM)",
  "form.firstDose": "First dose / start",
  "form.startFrom": "Start from",
  "form.ongoing": "Ongoing (no end date)",
  "form.courseLength": "Course length (days)",
  "form.addMedicine": "Add medicine",
  "form.saveChanges": "Save changes",
  "form.error": "Could not save medicine.",

  "schedule.everyHours": "Every {h}h",
  "schedule.ongoing": "Every {h}h · ongoing",
  "schedule.dailyAt": "Daily at {times}",

  "edit.corrections": "Corrections",
  "edit.correctionsBody": "Tapped \"Taken\" by accident? This reverts your most recent take and recalculates the next dose.",
  "edit.undoLastTake": "Undo last take",
  "edit.undoing": "Undoing…",
  "edit.undone": "✓ Undid your last take — next dose recalculated.",
  "edit.nothingToUndo": "Nothing to undo (no taken doses yet).",
  "edit.dangerZone": "Danger zone",
  "edit.deleteMedicine": "Delete medicine",
  "edit.deleting": "Deleting…",
  "edit.confirmDelete": "Delete this medicine and its history? This cannot be undone.",

  "history.title": "History",
  "history.empty": "No doses recorded yet.",
  "history.scheduled": "Scheduled {date}",
  "history.longPress": "Long-press for options",
  "history.editTime": "Edit time taken",
  "history.markNotTaken": "Mark not taken",
  "history.delete": "Delete",
  "history.saveTime": "Save time",
  "history.confirmDelete": "Delete this {name} dose?",
  "status.taken": "taken",
  "status.due": "due",
  "status.skipped": "skipped",

  "settings.title": "Settings",
  "settings.notifications": "Notifications",
  "settings.notificationsBody": "Install this app to your home screen, then enable notifications so reminders arrive even when the app is closed.",
  "settings.status": "Status",
  "settings.enable": "Enable notifications",
  "settings.sendTest": "Send test notification",
  "settings.permDenied": "Permission denied — enable notifications in your settings.",
  "settings.enabled": "Notifications enabled on this device ✓",
  "settings.failedSave": "Failed to save subscription.",
  "settings.missingKey": "Missing notification key.",
  "settings.couldNotEnable": "Could not enable: {err}",
  "settings.testSent": "Test sent to {n} device(s).",
  "settings.testFailed": "Failed to send test.",
  "settings.timezone": "Timezone",
  "settings.timezoneBody": "Used to interpret daily times like \"08:00\".",
  "settings.useDeviceTz": "Use this device's timezone",
  "settings.saved": "Saved ✓",
  "settings.tzFailed": "Could not save timezone.",
  "settings.language": "Language",
  "settings.languageBody": "Choose the app language.",
  "settings.save": "Save",
  "settings.debug": "Debug",
  "settings.debugBody": "Seed demo cards to preview the due states: one yellow (1 dose due) and one red (2 doses behind). Clear them when done.",
  "settings.createDemo": "Create demo (yellow + red)",
  "settings.clearDemo": "Clear demo",
  "settings.demoCreated": "Created demo cards — see the Today tab.",
  "settings.demoCleared": "Demo data cleared.",
  "settings.demoError": "Something went wrong.",

  "push.timeFor": "Time for {name}",
  "push.tapToMark": "Tap to mark this dose as taken.",
  "push.testTitle": "Test notification 🎉",
  "push.testBody": "Your medicine reminders are working.",
  "push.taken": "✓ Taken",
  "push.snooze": "Snooze 10m",
};

const es: Dict = {
  "app.name": "💊 Medicinas",
  "nav.today": "Hoy",
  "nav.history": "Historial",
  "nav.settings": "Ajustes",

  "today.title": "Hoy",
  "today.add": "+ Añadir",
  "today.empty.title": "Aún no hay medicinas",
  "today.empty.body": "Añade tu primera medicina y luego activa las notificaciones en Ajustes.",
  "today.empty.cta": "Añadir una medicina",
  "today.dueNow": "Toca ahora",
  "today.alsoDue": "También pendiente",
  "today.dosesBehind": "{n} dosis atrasadas",
  "today.wasDue": "Tocaba {date} · {rel}",
  "today.next": "Próxima {date} · {rel}",
  "today.lastTaken": "Última toma {date}",
  "today.completed": "Completadas",
  "today.courseFinished": "tratamiento finalizado",

  "common.edit": "Editar",
  "common.cancel": "Cancelar",
  "common.saving": "Guardando…",
  "common.and": " y ",
  "common.comma": ", ",

  "action.markTaken": "✓ Marcar tomada",
  "action.markTakenShort": "Marcar tomada",
  "action.takenNow": "Tomada ahora",
  "action.atATime": "a una hora…",

  "nextTake.label": "Próxima toma",

  "add.title": "Añadir medicina",
  "edit.title": "Editar medicina",
  "form.name": "Nombre de la medicina",
  "form.namePlaceholder": "ej. Amoxicilina",
  "form.schedule": "Frecuencia",
  "form.everyXHours": "Cada X horas",
  "form.fixedDailyTimes": "Horas fijas del día",
  "form.repeatEvery": "Repetir cada (horas)",
  "form.times": "Horas (separadas por comas, HH:MM)",
  "form.firstDose": "Primera dosis / inicio",
  "form.startFrom": "Comenzar desde",
  "form.ongoing": "Continua (sin fecha de fin)",
  "form.courseLength": "Duración del tratamiento (días)",
  "form.addMedicine": "Añadir medicina",
  "form.saveChanges": "Guardar cambios",
  "form.error": "No se pudo guardar la medicina.",

  "schedule.everyHours": "Cada {h}h",
  "schedule.ongoing": "Cada {h}h · continua",
  "schedule.dailyAt": "Diario a las {times}",

  "edit.corrections": "Correcciones",
  "edit.correctionsBody": "¿Tocaste \"Tomada\" sin querer? Esto deshace tu última toma y recalcula la próxima dosis.",
  "edit.undoLastTake": "Deshacer última toma",
  "edit.undoing": "Deshaciendo…",
  "edit.undone": "✓ Se deshizo tu última toma — próxima dosis recalculada.",
  "edit.nothingToUndo": "Nada que deshacer (aún no hay tomas).",
  "edit.dangerZone": "Zona de peligro",
  "edit.deleteMedicine": "Eliminar medicina",
  "edit.deleting": "Eliminando…",
  "edit.confirmDelete": "¿Eliminar esta medicina y su historial? No se puede deshacer.",

  "history.title": "Historial",
  "history.empty": "Aún no hay dosis registradas.",
  "history.scheduled": "Programada {date}",
  "history.longPress": "Mantén pulsado para más opciones",
  "history.editTime": "Editar hora de toma",
  "history.markNotTaken": "Marcar como no tomada",
  "history.delete": "Eliminar",
  "history.saveTime": "Guardar hora",
  "history.confirmDelete": "¿Eliminar esta dosis de {name}?",
  "status.taken": "tomada",
  "status.due": "pendiente",
  "status.skipped": "omitida",

  "settings.title": "Ajustes",
  "settings.notifications": "Notificaciones",
  "settings.notificationsBody": "Instala esta app en tu pantalla de inicio y luego activa las notificaciones para que los recordatorios lleguen aunque la app esté cerrada.",
  "settings.status": "Estado",
  "settings.enable": "Activar notificaciones",
  "settings.sendTest": "Enviar notificación de prueba",
  "settings.permDenied": "Permiso denegado — activa las notificaciones en los ajustes de tu teléfono.",
  "settings.enabled": "Notificaciones activadas en este dispositivo ✓",
  "settings.failedSave": "No se pudo guardar la suscripción.",
  "settings.missingKey": "Falta la clave de notificaciones.",
  "settings.couldNotEnable": "No se pudo activar: {err}",
  "settings.testSent": "Prueba enviada a {n} dispositivo(s).",
  "settings.testFailed": "No se pudo enviar la prueba.",
  "settings.timezone": "Zona horaria",
  "settings.timezoneBody": "Se usa para interpretar las horas diarias como \"08:00\".",
  "settings.useDeviceTz": "Usar la zona horaria de este dispositivo",
  "settings.saved": "Guardado ✓",
  "settings.tzFailed": "No se pudo guardar la zona horaria.",
  "settings.language": "Idioma",
  "settings.languageBody": "Elige el idioma de la app.",
  "settings.save": "Guardar",
  "settings.debug": "Depuración",
  "settings.debugBody": "Crea tarjetas de demostración para ver los estados: una amarilla (1 dosis pendiente) y una roja (2 dosis atrasadas). Bórralas cuando termines.",
  "settings.createDemo": "Crear demo (amarilla + roja)",
  "settings.clearDemo": "Borrar demo",
  "settings.demoCreated": "Tarjetas de demostración creadas — míralas en la pestaña Hoy.",
  "settings.demoCleared": "Datos de demostración borrados.",
  "settings.demoError": "Algo salió mal.",

  "push.timeFor": "Hora de {name}",
  "push.tapToMark": "Toca para marcar esta dosis como tomada.",
  "push.testTitle": "Notificación de prueba 🎉",
  "push.testBody": "Tus recordatorios de medicinas funcionan.",
  "push.taken": "✓ Tomada",
  "push.snooze": "Posponer 10m",
};

const dicts: Record<Lang, Dict> = { en, es };

export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let s = dicts[lang]?.[key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}
