import { encode } from 'uqr';

/**
 * The Pix code as a QR code. It stays black on white on night paper too, because bank apps read
 * dark modules on a light ground. The 4-module white border is the quiet zone that QR readers need.
 */
export function PixQr({ code, label }: { code: string; label: string }) {
  const { data, size } = encode(code, { ecc: 'M', border: 4 });
  const squares = data.flatMap((row, y) => row.map((dark, x) => (dark ? `M${x} ${y}h1v1h-1z` : ''))).join('');
  return (
    <svg role="img" aria-label={label} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" className="size-44 shrink-0">
      <rect width={size} height={size} fill="#ffffff" />
      <path d={squares} fill="#000000" />
    </svg>
  );
}
