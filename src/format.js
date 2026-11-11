export function agendamentoIso(data, hora) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data);
  const time = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!match) throw new Error("Informe a data no formato DD/MM/AAAA.");
  const [, dia, mes, ano] = match;
  const value = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (
    value.getFullYear() !== Number(ano) ||
    value.getMonth() !== Number(mes) - 1 ||
    value.getDate() !== Number(dia)
  )
    throw new Error("Informe uma data existente.");
  if (!time || Number(time[1]) > 23 || Number(time[2]) > 59)
    throw new Error("Informe a hora entre 00:00 e 23:59.");
  return ano + "-" + mes + "-" + dia + "T" + hora;
}
