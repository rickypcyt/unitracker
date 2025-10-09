export const formatDateForInput = (date?: Date | null): string => {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const parseDateForDB = (dateString?: string | null): string | null => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split('/');
  const date = new Date(`${year}-${month}-${day}`);
  if (isNaN(date.getTime())) return null;
  return `${year}-${month}-${day}`;
};

export const getSelectedDateFromDMY = (dmy: string | undefined | null): Date | null => {
  if (!dmy) return null;
  const parts = dmy.split('/');
  if (parts.length === 3) {
    const date = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
};

export const isValidDateYMD = (dateStr: string): boolean => /^^\d{4}-\d{2}-\d{2}$$/.test(dateStr);

export const normalizeNaturalOrYMDDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const lower = dateStr.toLowerCase().trim();

  const toYmd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  if (lower === 'hoy' || lower === 'today') return toYmd(new Date());
  if (lower === 'mañana' || lower === 'tomorrow') {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return toYmd(t);
  }
  if (lower === 'pasado mañana' || lower === 'day after tomorrow') {
    const t = new Date();
    t.setDate(t.getDate() + 2);
    return toYmd(t);
  }
  if (
    lower === 'próxima semana' ||
    lower === 'la próxima semana' ||
    lower === 'next week' ||
    lower === 'the next week'
  ) {
    const t = new Date();
    t.setDate(t.getDate() + 7);
    return toYmd(t);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  return '';
};

export const ymdToDmy = (dateStr: string): string => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};


