// utils/colorUtils.js
const colors = ['bg-red-400', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];

export const getColorForUsername = (username) => {
  const index = username.charCodeAt(0) % colors.length;
  return colors[index];
};