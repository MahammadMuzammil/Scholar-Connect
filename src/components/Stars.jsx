export default function Stars({ value }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  const stars = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  return <span className="stars" title={`${value} / 5`}>{stars}</span>;
}
