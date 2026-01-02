const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

const getToday = () => formatDate(new Date());

const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return formatDate(d);
};

const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return formatDate(d);
};

const getMonthStart = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export { formatDate, getToday, getDaysAgo, getWeekStart, getMonthStart };
